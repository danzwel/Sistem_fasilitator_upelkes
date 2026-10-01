import { useEffect, useMemo, useState } from 'react'
import { getFacilitators, deleteFacilitator } from '../api/facilitatorApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { FacilitatorDetailModal } from '../components/FacilitatorDetailModal'
import { FasilitatorFormPage } from './FasilitatorFormPage'
import { Modal } from '../../../shared/components/Modal'
import { compareRecommendedFacilitators, formatFacilitatorName } from '../../../shared/utils/facilitator'
import { downloadXlsx } from '../../../shared/utils/csv'

const completenessLabels = { name: 'Nama lengkap', degree: 'Gelar', birthInfo: 'Tempat/tanggal lahir', nik: 'NIK', nip: 'NIP', rank: 'Pangkat/golongan', position: 'Jabatan', unit: 'Unit kerja', officeAddress: 'Alamat kantor', homeAddress: 'Alamat rumah', phone: 'No. HP', email: 'Email', photo: 'Foto', signature: 'TTD', competencies: 'Pelatihan dan materi yang dikuasai', relatedTraining: 'Pendidikan/pelatihan terkait materi', teachingExperience: 'Pengalaman melatih/mengajar', certificate: 'Sertifikat pelatihan', material: 'Materi pelatihan', education: 'Riwayat pendidikan', supporting: 'Dokumen pendukung' }

export function FasilitatorPage({ onNavigate }) {
  const [facilitators, setFacilitators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const refresh = () => loadData()
    window.addEventListener('upelkes:data-changed', refresh)
    return () => window.removeEventListener('upelkes:data-changed', refresh)
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
    const header = ['No', 'Nama Fasilitator', 'NIK', 'NIP', 'Jabatan', 'Unit Kerja', 'No. HP', 'Email', 'Alamat Kantor', 'Alamat Rumah', 'Rating', 'Jumlah Ulasan', 'Status Kelengkapan', 'Data Belum Lengkap']
    const rows = filtered.map((f, index) => [
      index + 1,
      formatFacilitatorName(f),
      f.nik || '',
      f.nip || '',
      f.position || '',
      f.unit || '',
      f.phone || '',
      f.email || '',
      f.officeAddress || '',
      f.homeAddress || '',
      f.rating?.average ?? f.averageRating ?? '',
      f.rating?.count ?? f.reviewCount ?? 0,
      f.completeness?.isComplete ? 'Lengkap' : 'Belum Lengkap',
      getMissingItems(f).join('; '),
    ])
    downloadXlsx('data-fasilitator.xlsx', 'Data Fasilitator', header, rows, [6, 30, 18, 18, 24, 24, 18, 32, 28, 28, 12, 16, 20, 72])
  }
  function getMissingItems(person) {
    return Object.entries(person.completeness?.checks || {}).filter(([, value]) => !value).map(([key]) => completenessLabels[key] || key)
  }

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
          <button className="primary-button" onClick={() => setAddModalOpen(true)}>
            + Tambah Fasilitator
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="fasilitator-table-heading">
          <div><p className="eyebrow">DATA FASILITATOR</p><h3>Daftar Fasilitator</h3></div>
          <div className="fasilitator-table-tools">
          <button className="outline-button export-csv-button" onClick={exportFacilitators} disabled={!filtered.length}><span>⇩</span> Export Excel</button>
          <div className="search fasilitator-search">
            <span>⌕</span>
            <input
              aria-label="Cari fasilitator"
              placeholder="Cari nama, jabatan, NIK, NIP..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
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
          <div className="data-table-scroll" role="region" aria-label="Tabel data fasilitator" tabIndex={0}>
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
                    {f.completeness?.isComplete ? <span className="status-badge lengkap">Lengkap</span> : (
                      <span className="incomplete-status-tooltip">
                        <span className="status-badge belum_lengkap">Belum Lengkap</span>
                        <span className="incomplete-status-popover" role="tooltip">
                          <strong>Belum lengkap:</strong>
                          <span>{getMissingItems(f).map((item) => <span key={item}>• {item}</span>)}</span>
                        </span>
                      </span>
                    )}
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
          </div>
          <div className="pagination"><button className="pagination-button" aria-label="Halaman sebelumnya" title="Halaman sebelumnya" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>‹</button><span>Halaman {page} / {pageCount}</span><button className="pagination-button" aria-label="Halaman berikutnya" title="Halaman berikutnya" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>›</button></div>
          </>
        )}
      </div>

      <FacilitatorDetailModal facilitatorId={detailId} onClose={() => setDetailId(null)} onNavigate={onNavigate} />
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Tambah Fasilitator">
        <FasilitatorFormPage
          embedded
          onNavigate={() => setAddModalOpen(false)}
          onSaved={() => { setAddModalOpen(false); loadData() }}
        />
      </Modal>
    </section>
  )
}
