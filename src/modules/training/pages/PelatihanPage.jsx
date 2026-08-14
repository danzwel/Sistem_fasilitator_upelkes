import { useEffect, useMemo, useState } from 'react'
import { getFacilitators } from '../../fasilitator/api/facilitatorApi'
import { getTrainings } from '../api/trainingApi'

const CATEGORY_LABEL = {
  related_training: 'Terkait Materi',
  teaching_experience: 'Pengalaman Mengajar',
}

export function PelatihanPage({ onNavigate }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const facilitators = await getFacilitators()
      const perFacilitator = await Promise.all(
        facilitators.map(async (f) => {
          try {
            const trainings = await getTrainings(f.id)
            return trainings.map((t) => ({ ...t, facilitatorId: f.id, facilitatorName: f.name }))
          } catch {
            return []
          }
        })
      )
      setRows(perFacilitator.flat())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = rows
    if (categoryFilter !== 'all') {
      list = list.filter((r) => r.category === categoryFilter)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((r) =>
        [r.name, r.facilitatorName, r.organizer, r.role]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
  }, [rows, query, categoryFilter])

  return (
    <section className="page-enter">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MODUL SOFI</p>
          <h2>Pelatihan / Riwayat Kegiatan</h2>
          <p className="muted">
            Rekap gabungan dari semua fasilitator. Untuk tambah/edit/hapus, buka halaman Edit fasilitator terkait.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h3>Daftar Kegiatan</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ background: '#282139', border: '1px solid #382e4d', borderRadius: 12, padding: '9px 12px', color: '#f0ecff', fontSize: 13 }}
            >
              <option value="all">Semua Kategori</option>
              <option value="related_training">Terkait Materi</option>
              <option value="teaching_experience">Pengalaman Mengajar</option>
            </select>
            <div className="search">
              <span>⌕</span>
              <input
                aria-label="Cari pelatihan"
                placeholder="Cari nama, fasilitator, penyelenggara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><span>◌</span><p>Memuat data pelatihan dari semua fasilitator...</p></div>
        ) : error ? (
          <div className="empty-state">
            <span>◌</span><p>Gagal memuat data.</p><small>{error}</small>
            <div style={{ marginTop: 12 }}><button className="outline-button" onClick={loadData}>Coba lagi</button></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span>◌</span>
            <p>Belum ada data pelatihan yang cocok.</p>
            <small>Tambahkan lewat halaman Edit fasilitator masing-masing.</small>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Kegiatan</th>
                <th>Kategori</th>
                <th>Fasilitator</th>
                <th>Peran</th>
                <th>Penyelenggara</th>
                <th>Tahun</th>
                <th aria-label="Aksi"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td><div className="table-primary">{r.name}</div></td>
                  <td>
                    <span className={`status-badge ${r.category === 'teaching_experience' ? 'lengkap' : 'belum_lengkap'}`}>
                      {CATEGORY_LABEL[r.category] ?? r.category}
                    </span>
                  </td>
                  <td><div className="table-secondary">{r.facilitatorName}</div></td>
                  <td><div className="table-secondary">{r.role || '-'}</div></td>
                  <td><div className="table-secondary">{r.organizer || '-'}</div></td>
                  <td><div className="table-secondary">{r.date || '-'}</div></td>
                  <td>
                    <button className="text-button" onClick={() => onNavigate?.('fasilitator-edit', r.facilitatorId)}>
                      Kelola →
                    </button>
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