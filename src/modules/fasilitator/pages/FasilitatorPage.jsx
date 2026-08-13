import { useEffect, useMemo, useState } from 'react'
import { getFacilitators, deleteFacilitator } from '../api/facilitatorApi'

export function FasilitatorPage({ onNavigate }) {
  const [facilitators, setFacilitators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

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
    const q = query.trim().toLowerCase()
    if (!q) return facilitators
    return facilitators.filter((f) =>
      [f.name, f.position, f.unit, f.nik, f.nip]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    )
  }, [facilitators, query])

  return (
    <section className="page-enter">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MODUL SOFI</p>
          <h2>Data Fasilitator</h2>
          <p className="muted">Kelola biodata, foto, TTD, dan kelengkapan data fasilitator UPELKES.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate?.('fasilitator-tambah')}>
          + Tambah Fasilitator
        </button>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h3>Daftar Fasilitator</h3>
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Jabatan / Unit Kerja</th>
                <th>Kontak</th>
                <th>Status</th>
                <th aria-label="Aksi"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div className="table-primary">{f.name || '-'}</div>
                    {f.degree && <div className="table-secondary">{f.degree}</div>}
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
                    <span className={`status-badge ${f.status === 'active' ? 'lengkap' : 'belum_lengkap'}`}>
                      {f.status === 'active' ? 'Aktif' : f.status || '-'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button className="text-button" onClick={() => onNavigate?.('fasilitator-detail', f.id)}>
                        Detail
                      </button>
                      <button className="text-button" onClick={() => onNavigate?.('fasilitator-edit', f.id)}>
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
        )}
      </div>
    </section>
  )
}