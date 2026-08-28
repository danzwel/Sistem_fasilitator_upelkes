import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { getFacilitators, createFacilitator, updateFacilitator } from '../api/facilitatorApi'

// Alias header kolom Excel (huruf besar/kecil & variasi penulisan bebas)
// dipetakan ke field internal kita. Tambahin alias baru di sini kalau
// Adpen pakai penamaan kolom yang beda.
const HEADER_ALIASES = {
  nama: 'nama', 'nama lengkap': 'nama',
  email: 'email',
  'no hp': 'noHp', 'nomor hp': 'noHp', 'no. hp': 'noHp', hp: 'noHp', telepon: 'noHp',
  nik: 'nik',
  nip: 'nip',
  gelar: 'gelar',
  'tempat lahir': 'tempatLahir',
  'tanggal lahir': 'tanggalLahir',
  'pangkat/golongan': 'pangkatGolongan', 'pangkat golongan': 'pangkatGolongan', 'pangkat/gol': 'pangkatGolongan',
  jabatan: 'jabatan',
  'unit kerja': 'unitKerja',
  'alamat kantor': 'alamatKantor',
  'alamat rumah': 'alamatRumah',
}

const REQUIRED_FIELDS = ['nama']

function normalizeHeader(header) {
  return String(header ?? '').trim().toLowerCase()
}

function mapRowToFacilitator(rawRow, headerMap) {
  const result = {}
  for (const [colIndex, field] of Object.entries(headerMap)) {
    const value = rawRow[colIndex]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      result[field] = String(value).trim()
    }
  }
  return result
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email)
}

function isValidPhone(phone) {
  return /^[\d+\-\s()]{8,15}$/.test(phone)
}

function validateRow(row, existingByKey, seenInFileKeys) {
  const errors = []

  if (!row.nama) errors.push('Nama kosong')
  if (row.email && !isValidEmail(row.email)) errors.push('Format email tidak valid')
  if (row.noHp && !isValidPhone(row.noHp)) errors.push('Format No. HP tidak valid')

  if (errors.length > 0) {
    return { status: 'error', errors }
  }

  const dupeKey = row.email || row.nik
  if (dupeKey) {
    if (seenInFileKeys.has(dupeKey)) {
      return { status: 'error', errors: ['Duplikat dengan baris lain di file ini'] }
    }
    if (existingByKey.has(dupeKey)) {
      return { status: 'duplicate', errors: [], existingId: existingByKey.get(dupeKey) }
    }
    seenInFileKeys.add(dupeKey)
  }

  return { status: 'valid', errors: [] }
}

export function ImportExcelPage({ onNavigate }) {
  const fileInputRef = useRef(null)
  const [fileName, setFileName] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [rows, setRows] = useState([]) // { data, status, errors, existingId, action }
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setFileName(file.name)
    setParseError(null)
    setImportResult(null)
    setParsing(true)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })

      if (raw.length < 2) {
        setParseError('File kosong atau tidak ada baris data setelah header.')
        setParsing(false)
        return
      }

      const headerRow = raw[0]
      const headerMap = {}
      headerRow.forEach((h, i) => {
        const normalized = normalizeHeader(h)
        const field = HEADER_ALIASES[normalized]
        if (field) headerMap[i] = field
      })

      const missingRequired = REQUIRED_FIELDS.filter((f) => !Object.values(headerMap).includes(f))
      if (missingRequired.length > 0) {
        setParseError(`Kolom wajib tidak ditemukan di file: ${missingRequired.join(', ')}. Pastikan ada kolom "Nama" di baris header.`)
        setParsing(false)
        return
      }

      const existingFacilitators = await getFacilitators()
      const existingByKey = new Map()
      existingFacilitators.forEach((f) => {
        if (f.email) existingByKey.set(f.email, f.id)
        if (f.nik) existingByKey.set(f.nik, f.id)
      })
      const seenInFileKeys = new Set()

      const dataRows = raw.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== ''))
      const processed = dataRows.map((rawRow) => {
        const data = mapRowToFacilitator(rawRow, headerMap)
        const validation = validateRow(data, existingByKey, seenInFileKeys)
        return { data, action: 'skip', ...validation }
      })

      setRows(processed)
    } catch (err) {
      setParseError(`Gagal membaca file: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }

  function updateRowAction(index, action) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, action } : r)))
  }

  const summary = {
    valid: rows.filter((r) => r.status === 'valid').length,
    duplicate: rows.filter((r) => r.status === 'duplicate').length,
    error: rows.filter((r) => r.status === 'error').length,
  }

  async function handleImport() {
    setImporting(true)
    const result = { created: 0, updated: 0, skipped: 0, failed: [] }

    for (const row of rows) {
      if (row.status === 'error') {
        result.skipped++
        continue
      }
      if (row.status === 'duplicate' && row.action === 'skip') {
        result.skipped++
        continue
      }
      try {
        if (row.status === 'duplicate' && row.action === 'update') {
          await updateFacilitator(row.existingId, row.data)
          result.updated++
        } else {
          await createFacilitator(row.data)
          result.created++
        }
      } catch (err) {
        result.failed.push({ nama: row.data.nama, message: err.message })
      }
    }

    setImportResult(result)
    setImporting(false)
  }

  function reset() {
    setFileName(null)
    setRows([])
    setParseError(null)
    setImportResult(null)
  }

  return (
    <section className="page-enter">
      <div className="welcome-row">
        <div>
          <h2>Import Excel</h2>
          <p className="muted">Upload file, cek dulu hasil validasinya, baru konfirmasi import.</p>
        </div>
        <button className="outline-button" onClick={() => onNavigate?.('fasilitator')}>← Kembali</button>
      </div>

      {!fileName && (
        <div className="panel">
          <div className="panel-heading"><h3>1. Upload File Excel</h3></div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Kolom yang dikenali: Nama (wajib), Email, No HP, NIK, NIP, Gelar, Tempat Lahir, Tanggal Lahir,
            Pangkat/Golongan, Jabatan, Unit Kerja, Alamat Kantor, Alamat Rumah.
          </p>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelect} />
          <button className="primary-button" onClick={() => fileInputRef.current?.click()}>Pilih File Excel</button>
        </div>
      )}

      {parsing && (
        <div className="panel"><div className="empty-state"><span>◌</span><p>Membaca & memvalidasi file...</p></div></div>
      )}

      {parseError && (
        <div className="panel" style={{ borderColor: '#a84978' }}>
          <strong style={{ color: '#e6a8bd' }}>File tidak bisa diproses:</strong>{' '}
          <span className="muted">{parseError}</span>
          <div style={{ marginTop: 12 }}>
            <button className="outline-button" onClick={reset}>Coba File Lain</button>
          </div>
        </div>
      )}

      {fileName && !parsing && !parseError && rows.length > 0 && !importResult && (
        <>
          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>2. Hasil Validasi — {fileName}</h3></div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
              <div><strong style={{ color: '#6fd6ae' }}>{summary.valid}</strong> <span className="muted">data valid</span></div>
              <div><strong style={{ color: '#e6a866' }}>{summary.duplicate}</strong> <span className="muted">data duplikat</span></div>
              <div><strong style={{ color: '#e6a8bd' }}>{summary.error}</strong> <span className="muted">data error</span></div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>3. Detail per Baris</h3></div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Catatan / Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><div className="table-primary">{r.data.nama || '(kosong)'}</div></td>
                    <td><div className="table-secondary">{r.data.email || '-'}</div></td>
                    <td>
                      <span className={`status-badge ${r.status === 'valid' ? 'lengkap' : 'belum_lengkap'}`}>
                        {r.status === 'valid' ? 'Valid' : r.status === 'duplicate' ? 'Duplikat' : 'Error'}
                      </span>
                    </td>
                    <td>
                      {r.status === 'error' && <small style={{ color: '#e6a8bd' }}>{r.errors.join(', ')}</small>}
                      {r.status === 'duplicate' && (
                        <select
                          value={r.action}
                          onChange={(e) => updateRowAction(i, e.target.value)}
                          style={{ background: '#282139', border: '1px solid #382e4d', borderRadius: 8, padding: '5px 8px', color: '#f0ecff', fontSize: 12 }}
                        >
                          <option value="skip">Lewati (skip)</option>
                          <option value="update">Update data lama</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="primary-button" onClick={handleImport} disabled={importing || (summary.valid === 0 && summary.duplicate === 0)}>
              {importing ? 'Mengimport...' : 'Import Sekarang'}
            </button>
            <button className="outline-button" onClick={reset} disabled={importing}>Batal / Pilih File Lain</button>
          </div>
        </>
      )}

      {importResult && (
        <div className="panel">
          <div className="panel-heading"><h3>Hasil Import</h3></div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div><strong style={{ color: '#6fd6ae' }}>{importResult.created}</strong> <span className="muted">baru ditambahkan</span></div>
            <div><strong style={{ color: '#6fd6ae' }}>{importResult.updated}</strong> <span className="muted">berhasil diupdate</span></div>
            <div><strong style={{ color: '#a49bb6' }}>{importResult.skipped}</strong> <span className="muted">dilewati</span></div>
            <div><strong style={{ color: '#e6a8bd' }}>{importResult.failed.length}</strong> <span className="muted">gagal</span></div>
          </div>
          {importResult.failed.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="table-secondary" style={{ marginBottom: 6 }}>Detail yang gagal:</div>
              {importResult.failed.map((f, i) => (
                <div key={i} className="activity-row">
                  <div><div className="table-primary">{f.nama || '(tanpa nama)'}</div><div className="table-secondary">{f.message}</div></div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="primary-button" onClick={() => onNavigate?.('fasilitator')}>Lihat Daftar Fasilitator</button>
            <button className="outline-button" onClick={reset}>Import File Lain</button>
          </div>
        </div>
      )}
    </section>
  )
}
