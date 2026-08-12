import { useMemo, useState } from 'react'
import { fasilitatorList } from '../data/fasilitatorData'

const STATUS_LABEL = {
  lengkap: 'Lengkap',
  belum_lengkap: 'Belum Lengkap',
}

export function FasilitatorPage({ onNavigate }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return fasilitatorList
    return fasilitatorList.filter((f) =>
      [f.nama, f.jabatan, f.unitKerja, f.nik, f.nip]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    )
  }, [query])

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

        {filtered.length === 0 ? (
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
                    <div className="table-primary">{f.nama || '-'}</div>
                    {f.gelar && <div className="table-secondary">{f.gelar}</div>}
                  </td>
                  <td>
                    <div className="table-primary">{f.jabatan || '-'}</div>
                    <div className="table-secondary">{f.unitKerja || '-'}</div>
                  </td>
                  <td>
                    <div className="table-secondary">{f.noHp || '-'}</div>
                    <div className="table-secondary">{f.email || '-'}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${f.statusKelengkapan}`}>
                      {STATUS_LABEL[f.statusKelengkapan] ?? 'Belum Lengkap'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => onNavigate?.('fasilitator-detail', f.id)}
                    >
                      Detail →
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