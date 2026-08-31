import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { getFacilitators } from '../../fasilitator/api/facilitatorApi'
import { createTraining } from '../api/trainingApi'

const HEADER_ALIASES = {
  tahun: 'tahun', 'tahun pelaksanaan': 'tahun',
  bulan: 'bulan', 'bulan pelaksanaan': 'bulan',
  tanggal: 'date', 'tanggal kegiatan': 'date', 'tanggal mulai': 'startDate', 'tanggal selesai': 'endDate',
  'nama pelatihan': 'namaPelatihan', 'nama pelatihan/kegiatan': 'namaPelatihan', 'nama kegiatan': 'namaPelatihan', 'judul kegiatan': 'namaPelatihan',
  'mata pelatihan': 'material', materi: 'material', 'materi pelatihan': 'material', 'materi yang diajarkan': 'material', 'mata pelatihan/materi': 'material',
  'nama fasilitator': 'facilitatorName', fasilitator: 'facilitatorName', 'fasilitator/narasumber': 'facilitatorName', narasumber: 'facilitatorName',
  penyelenggara: 'organizer', 'instansi penyelenggara': 'organizer', 'organisasi penyelenggara': 'organizer',
  peran: 'role', 'peran fasilitator': 'role',
  kategori: 'category', 'jenis pelatihan': 'category',
}

const MONTH_MAP = {
  januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
  juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
}

const REQUIRED_FIELDS = ['namaPelatihan', 'facilitatorName']

function normalizeHeader(header) {
  return String(header ?? '').trim().toLowerCase().replace(/[\u00a0]/g, ' ').replace(/\s+/g, ' ')
}

function normalizeName(value) {
  return String(value ?? '').toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeDate(value) {
  if (typeof value === 'number' && value > 20000) {
    const date = XLSX.SSF.parse_date_code(value)
    return date ? `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}` : ''
  }
  const text = String(value ?? '').trim()
  const dmy = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  return dmy ? `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}` : text
}

function mapRow(rawRow, headerMap) {
  const result = {}
  for (const [colIndex, field] of Object.entries(headerMap)) {
    const value = rawRow[colIndex]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      result[field] = ['date', 'startDate', 'endDate'].includes(field) ? normalizeDate(value) : String(value).trim()
    }
  }
  return result
}

function buildDate(tahun, bulan) {
  if (!tahun) return ''
  const monthNum = MONTH_MAP[String(bulan ?? '').toLowerCase()] ?? '01'
  return `${tahun}-${monthNum}-01`
}

function resolveCategory(raw) {
  const normalized = String(raw ?? '').toLowerCase()
  if (normalized.includes('terkait')) return 'related_training'
  return 'teaching_experience' // default paling umum
}

function validateRow(row, facilitatorByName) {
  const errors = []
  if (!row.namaPelatihan) errors.push('Nama Pelatihan kosong')
  if (!row.facilitatorName) errors.push('Nama Fasilitator kosong')

  let facilitatorId = null
  if (row.facilitatorName) {
    const match = facilitatorByName.get(normalizeName(row.facilitatorName))
    if (!match) {
      errors.push(`Fasilitator "${row.facilitatorName}" tidak ditemukan di database`)
    } else {
      facilitatorId = match
    }
  }

  if (errors.length > 0) return { status: 'error', errors, facilitatorId: null }
  return { status: 'valid', errors: [], facilitatorId }
}

export function ImportPelatihanExcelPage({ onNavigate }) {
  const fileInputRef = useRef(null)
  const [fileName, setFileName] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [rows, setRows] = useState([])
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
        const field = HEADER_ALIASES[normalizeHeader(h)]
        if (field) headerMap[i] = field
      })

      const missingRequired = REQUIRED_FIELDS.filter((f) => !Object.values(headerMap).includes(f))
      if (missingRequired.length > 0) {
        setParseError(`Kolom wajib tidak ditemukan: pastikan ada kolom "Nama Pelatihan" dan "Nama Fasilitator" di header.`)
        setParsing(false)
        return
      }

      const facilitators = await getFacilitators()
      const facilitatorByName = new Map(facilitators.map((f) => [normalizeName(f.name), f.id]))

      const dataRows = raw.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== ''))
      const processed = dataRows.map((rawRow) => {
        const data = mapRow(rawRow, headerMap)
        const validation = validateRow(data, facilitatorByName)
        return { data, ...validation }
      })

      setRows(processed)
    } catch (err) {
      setParseError(`Gagal membaca file: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }

  const summary = {
    valid: rows.filter((r) => r.status === 'valid').length,
    error: rows.filter((r) => r.status === 'error').length,
  }

  async function handleImport() {
    setImporting(true)
    const result = { created: 0, failed: [] }

    for (const row of rows) {
      if (row.status !== 'valid') continue
      try {
        const payload = {
          name: row.data.namaPelatihan,
          material: row.data.material ?? '',
          date: row.data.date || row.data.startDate || buildDate(row.data.tahun, row.data.bulan),
          startDate: row.data.startDate || row.data.date || buildDate(row.data.tahun, row.data.bulan),
          endDate: row.data.endDate || row.data.startDate || row.data.date || buildDate(row.data.tahun, row.data.bulan),
          organizer: row.data.organizer ?? '',
          category: resolveCategory(row.data.category),
          ...(row.data.role ? { role: row.data.role } : {}),
        }
        await createTraining(row.facilitatorId, payload)
        result.created++
      } catch (err) {
        result.failed.push({ nama: row.data.namaPelatihan, message: err.message })
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
          <h2>Import Excel — Pelatihan</h2>
          <p className="muted">Upload file, cek dulu hasil validasinya, baru konfirmasi import.</p>
        </div>
        <button className="outline-button" onClick={() => onNavigate?.('pelatihan')}>← Kembali</button>
      </div>

      {!fileName && (
        <div className="panel">
          <div className="panel-heading"><h3>1. Upload File Excel</h3></div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Kolom yang dikenali: Tahun/Bulan atau Tanggal/Tanggal Mulai/Tanggal Selesai, Nama Pelatihan/Kegiatan (wajib),
            Mata Pelatihan/Materi, Nama Fasilitator/Narasumber (wajib), Penyelenggara, Peran, Kategori/Jenis Pelatihan.
          </p>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelect} />
          <button className="primary-button" onClick={() => fileInputRef.current?.click()}>Pilih File Excel</button>
        </div>
      )}

      {parsing && <div className="panel"><div className="empty-state"><span>◌</span><p>Membaca & memvalidasi file...</p></div></div>}

      {parseError && (
        <div className="panel" style={{ borderColor: '#a84978' }}>
          <strong style={{ color: '#e6a8bd' }}>File tidak bisa diproses:</strong>{' '}
          <span className="muted">{parseError}</span>
          <div style={{ marginTop: 12 }}><button className="outline-button" onClick={reset}>Coba File Lain</button></div>
        </div>
      )}

      {fileName && !parsing && !parseError && rows.length > 0 && !importResult && (
        <>
          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>2. Hasil Validasi — {fileName}</h3></div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div><strong style={{ color: '#6fd6ae' }}>{summary.valid}</strong> <span className="muted">data valid</span></div>
              <div><strong style={{ color: '#e6a8bd' }}>{summary.error}</strong> <span className="muted">data error</span></div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>3. Detail per Baris</h3></div>
            <table className="data-table">
              <thead>
                <tr><th>Nama Pelatihan</th><th>Fasilitator</th><th>Status</th><th>Catatan</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><div className="table-primary">{r.data.namaPelatihan || '(kosong)'}</div></td>
                    <td><div className="table-secondary">{r.data.facilitatorName || '-'}</div></td>
                    <td>
                      <span className={`status-badge ${r.status === 'valid' ? 'lengkap' : 'belum_lengkap'}`}>
                        {r.status === 'valid' ? 'Valid' : 'Error'}
                      </span>
                    </td>
                    <td>{r.status === 'error' && <small style={{ color: '#e6a8bd' }}>{r.errors.join(', ')}</small>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="primary-button" onClick={handleImport} disabled={importing || summary.valid === 0}>
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
            <div><strong style={{ color: '#6fd6ae' }}>{importResult.created}</strong> <span className="muted">berhasil ditambahkan</span></div>
            <div><strong style={{ color: '#e6a8bd' }}>{importResult.failed.length}</strong> <span className="muted">gagal</span></div>
          </div>
          {importResult.failed.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="table-secondary" style={{ marginBottom: 6 }}>Detail yang gagal:</div>
              {importResult.failed.map((f, i) => (
                <div key={i} className="activity-row">
                  <div><div className="table-primary">{f.nama}</div><div className="table-secondary">{f.message}</div></div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="primary-button" onClick={() => onNavigate?.('pelatihan')}>Lihat Daftar Pelatihan</button>
            <button className="outline-button" onClick={reset}>Import File Lain</button>
          </div>
        </div>
      )}
    </section>
  )
}
