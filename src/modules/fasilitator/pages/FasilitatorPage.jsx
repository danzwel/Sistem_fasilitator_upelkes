import { useEffect, useMemo, useState } from 'react'
import { getFacilitators, deleteFacilitator } from '../api/facilitatorApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { FacilitatorDetailModal } from '../components/FacilitatorDetailModal'
import { Modal } from '../../../shared/components/Modal'
import { compareRecommendedFacilitators, formatFacilitatorName } from '../../../shared/utils/facilitator'

const completenessLabels = { photo: 'Foto', signature: 'TTD', certificate: 'Sertifikat', material: 'Materi pelatihan', education: 'Riwayat pendidikan', supporting: 'Dokumen pendukung' }

export function FasilitatorPage({ onNavigate }) {
  const [facilitators, setFacilitators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [completenessId, setCompletenessId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => { const timer = setTimeout(() => { setDebouncedQuery(query); setPage(1) }, 250); return () => clearTimeout(timer) }, [query])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const data = await getFacilitators()
      setFacilitators(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(f) {
    const confirmed = window.confirm(`Hapus data fasilitator "${f.name}"? Aksi ini tidak bisa dibatalkan.`)
    if (!confirmed) return
    setDeletingId(f.id)
    try {
      await deleteFacilitator(f.id)
      setFacilitators((prev) => prev.filter((x) => x.id !== f.id))
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    const list = !q ? facilitators : facilitators.filter((f) =>
      [f.name, f.position, f.unit, f.nik, f.nip]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    )
    return [...list].sort(compareRecommendedFacilitators)
  }, [facilitators, debouncedQuery])
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  function exportFacilitators() {
    const header = ['Nama', 'NIP', 'Jabatan', 'Unit Kerja', 'No HP', 'Email', 'Kelengkapan']
    const rows = filtered.map((f) => [formatFacilitatorName(f), f.nip || '', f.position || '', f.unit || '', f.phone || '', f.email || '', f.completeness?.isComplete ? 'Lengkap' : 'Belum Lengkap'])
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'data-fasilitator.csv'; link.click(); URL.revokeObjectURL(url)
  }
  const completenessPerson = completenessId ? facilitators.find((f) => f.id === completenessId) : null
  const missingItems = completenessPerson ? Object.entries(completenessPerson.completeness?.checks || {}).filter(([, value]) => !value).map(([key]) => completenessLabels[key] || key) : []

  return (
    <section className="page-enter">
      <div className="fasilitator-banner">
        <div className="fasilitator-banner-content">
          <h2>Data Fasilitator</h2>
          <p className="muted">Kelola biodata, foto, TTD, dan kelengkapan data fasilitator UPELKES.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="outline-button" onClick={() => onNavigate?.('fasilitator-import')}>
            Import Excel
          </button>
          <button className="primary-button" onClick={() => onNavigate?.('fasilitator-tambah')}>
            + Tambah Fasilitator
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h3>Daftar Fasilitator</h3>
          <button className="outline-button" onClick={exportFacilitators} disabled={!filtered.length}>Export CSV</button>
          <div className="search">
            <span>⌕</span>
            <input
              aria-label="Cari fasilitator"
              placeholder="Cari nama, jabatan, NIK, NIP..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <span>◌</span>
            <p>Memuat data fasilitator...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <span>◌</span>
            <p>Gagal memuat data.</p>
            <small>{error}</small>
            <div style={{ marginTop: 12 }}>
              <button className="outline-button" onClick={loadData}>Coba lagi</button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span>◌</span>
            <p>Belum ada fasilitator yang cocok.</p>
            <small>Coba kata kunci lain atau tambah fasilitator baru.</small>
          </div>
        ) : (
          <>
          <table className="data-table">
            <thead>
              <tr>
                <th aria-label="Foto"></th>
                <th>Nama</th>
                <th>Jabatan / Unit Kerja</th>
                <th>Kontak</th>
                <th>Kelengkapan Data</th>
                <th aria-label="Aksi"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((f) => (
                <tr key={f.id}>
                  <td style={{ width: 48 }}>
                    {f.photoUrl ? (
                      <img
                        src={resolveAssetUrl(f.photoUrl)}
                        alt={f.name}
                        style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1px solid #3e3451' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#c96df8,#7048dc)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 14,
                        }}
                      >
                        {(f.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="table-primary">{formatFacilitatorName(f)}</div>
                    <div className="table-secondary">NIP: {f.nip || '-'}</div>
                  </td>
                  <td>
                    <div className="table-primary">{f.position || '-'}</div>
                    <div className="table-secondary">{f.unit || '-'}</div>
                  </td>
                  <td>
                    <div className="table-secondary">{f.phone || '-'}</div>
                    <div className="table-secondary">{f.email || '-'}</div>
                  </td>
                  <td>
                    <button type="button" className={`status-badge ${f.completeness?.isComplete ? 'lengkap' : 'belum_lengkap'} completeness-button`} onClick={() => !f.completeness?.isComplete && setCompletenessId(f.id)} title={f.completeness?.isComplete ? 'Data sudah lengkap' : 'Klik untuk melihat data yang belum dilengkapi'}>
                      {f.completeness?.isComplete ? 'Lengkap' : 'Belum Lengkap'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button className="text-button" onClick={() => setDetailId(f.id)}>
                        Detail
                      </button>
                      <button className="text-button" onClick={() => onNavigate?.('fasilitator-edit', f.id, 'fasilitator')}>
                        Edit
                      </button>
                      <button
                        className="text-button"
                        style={{ color: '#e6a8bd' }}
                        disabled={deletingId === f.id}
                        onClick={() => handleDelete(f)}
                      >
                        {deletingId === f.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination"><button className="outline-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button><span>Halaman {page} dari {pageCount}</span><button className="outline-button" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Berikutnya</button></div>
          </>
        )}
      </div>

      <FacilitatorDetailModal facilitatorId={detailId} onClose={() => setDetailId(null)} onNavigate={onNavigate} />
      <Modal open={Boolean(completenessPerson)} onClose={() => setCompletenessId(null)} title="Kelengkapan Data Fasilitator">
        {completenessPerson && <div className="completeness-detail">
          <h3>{completenessPerson.name}</h3>
          {missingItems.length > 0 ? <><p>Data berikut belum dilengkapi:</p><ul>{missingItems.map((item) => <li key={item}>{item}</li>)}</ul></> : <p>Semua data sudah lengkap.</p>}
          <button className="outline-button" onClick={() => setCompletenessId(null)}>Tutup</button>
        </div>}
      </Modal>
    </section>
  )
}
