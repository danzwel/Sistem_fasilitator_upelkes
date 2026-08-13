import { useEffect, useState } from 'react'
import { getFacilitatorById } from '../api/facilitatorApi'

function Field({ label, value }) {
  return (
    <div>
      <div className="table-secondary" style={{ marginBottom: 3 }}>{label}</div>
      <div className="table-primary">{value || '-'}</div>
    </div>
  )
}

export function FasilitatorDetailPage({ onNavigate, facilitatorId }) {
  const [facilitator, setFacilitator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!facilitatorId) return
    setLoading(true)
    setError(null)
    getFacilitatorById(facilitatorId)
      .then(setFacilitator)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [facilitatorId])

  if (!facilitatorId) {
    return (
      <section className="page-enter">
        <div className="empty-state">
          <span>◌</span>
          <p>Tidak ada fasilitator yang dipilih.</p>
          <div style={{ marginTop: 12 }}>
            <button className="outline-button" onClick={() => onNavigate?.('fasilitator')}>
              ← Kembali ke Daftar
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page-enter">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MODUL SOFI</p>
          <h2>Detail Fasilitator</h2>
          <p className="muted">Informasi lengkap fasilitator (read-only).</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="outline-button" onClick={() => onNavigate?.('fasilitator')}>
            ← Kembali
          </button>
          <button className="primary-button" onClick={() => onNavigate?.('fasilitator-edit', facilitatorId)}>
            Edit
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><span>◌</span><p>Memuat data...</p></div>
      ) : error ? (
        <div className="empty-state"><span>◌</span><p>Gagal memuat data.</p><small>{error}</small></div>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading">
              <h3>{facilitator.name}</h3>
              <span className={`status-badge ${facilitator.status === 'active' ? 'lengkap' : 'belum_lengkap'}`}>
                {facilitator.status === 'active' ? 'Aktif' : facilitator.status || '-'}
              </span>
            </div>
            <div className="form-grid">
              <Field label="Gelar" value={facilitator.degree} />
              <Field label="Tempat/Tanggal Lahir" value={facilitator.birthInfo} />
              <Field label="NIK" value={facilitator.nik} />
              <Field label="NIP" value={facilitator.nip} />
              <Field label="Jabatan" value={facilitator.position} />
              <Field label="Unit Kerja" value={facilitator.unit} />
              <Field label="Alamat" value={facilitator.address} />
              <Field label="No. HP" value={facilitator.phone} />
              <Field label="Email" value={facilitator.email} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <h3>Foto & TTD</h3>
            </div>
            {facilitator.photoUrl || facilitator.signatureUrl ? (
              <div style={{ display: 'flex', gap: 24 }}>
                {facilitator.photoUrl && (
                  <div>
                    <div className="table-secondary" style={{ marginBottom: 6 }}>Foto</div>
                    <img src={facilitator.photoUrl} alt="Foto fasilitator" style={{ width: 120, borderRadius: 10 }} />
                  </div>
                )}
                {facilitator.signatureUrl && (
                  <div>
                    <div className="table-secondary" style={{ marginBottom: 6 }}>TTD</div>
                    <img src={facilitator.signatureUrl} alt="TTD fasilitator" style={{ width: 120, borderRadius: 10 }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <span>◌</span>
                <p>Belum ada foto/TTD.</p>
                <small>Fitur upload menyusul — masih menunggu konfirmasi cara upload dari Daniel.</small>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}