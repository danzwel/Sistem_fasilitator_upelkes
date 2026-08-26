import { useEffect, useState } from 'react'
import { getFacilitatorById } from '../api/facilitatorApi'
import { getEducations } from '../api/educationApi'
import { getTrainings } from '../../training/api/trainingApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatMonthYear(value) {
  if (!value) return null
  const [year, month] = value.split('-')
  const monthName = MONTH_NAMES[Number(month) - 1]
  return monthName ? `${monthName} ${year}` : value
}

function formatDateRange(startDate, endDate) {
  const start = formatMonthYear(startDate)
  const end = formatMonthYear(endDate)
  if (start && end) return `${start} – ${end}`
  return start || end || null
}

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
  const [educations, setEducations] = useState([])
  const [relatedTrainings, setRelatedTrainings] = useState([])
  const [teachingExperience, setTeachingExperience] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!facilitatorId) return
    setLoading(true)
    setError(null)
    Promise.all([
      getFacilitatorById(facilitatorId),
      getEducations(facilitatorId).catch(() => []),
      getTrainings(facilitatorId, 'related_training').catch(() => []),
      getTrainings(facilitatorId, 'teaching_experience').catch(() => []),
    ])
      .then(([f, edu, related, teaching]) => {
        setFacilitator(f)
        setEducations(edu)
        setRelatedTrainings(related)
        setTeachingExperience(teaching)
      })
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
            <button className="outline-button" onClick={() => onNavigate?.('fasilitator')}>← Kembali ke Daftar</button>
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
          <button className="outline-button" onClick={() => onNavigate?.('fasilitator')}>← Kembali</button>
          <button className="outline-button" onClick={() => onNavigate?.('fasilitator-cv', facilitatorId)}>Lihat CV</button>
          <button className="primary-button" onClick={() => onNavigate?.('fasilitator-edit', facilitatorId)}>Edit</button>
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
              <span className={`status-badge ${facilitator.completeness?.isComplete ? 'lengkap' : 'belum_lengkap'}`}>
                {facilitator.completeness?.isComplete ? 'Lengkap' : 'Belum Lengkap'}
              </span>
            </div>
            <div className="form-grid">
              <Field label="Gelar" value={facilitator.degree} />
              <Field label="Tempat/Tanggal Lahir" value={facilitator.birthInfo} />
              <Field label="NIK" value={facilitator.nik} />
              <Field label="NIP" value={facilitator.nip} />
              <Field label="Pangkat/Golongan" value={facilitator.rank} />
              <Field label="Jabatan" value={facilitator.position} />
              <Field label="Unit Kerja" value={facilitator.unit} />
              <Field label="Alamat Kantor" value={facilitator.officeAddress} />
              <Field label="Alamat Rumah" value={facilitator.homeAddress} />
              <Field label="No. HP" value={facilitator.phone} />
              <Field label="Email" value={facilitator.email} />
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>Foto & TTD</h3></div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div>
                <div className="table-secondary" style={{ marginBottom: 6 }}>Foto</div>
                {facilitator.photoUrl ? (
                  <img src={resolveAssetUrl(facilitator.photoUrl)} alt="Foto" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 10 }} />
                ) : (
                  <div className="empty-state" style={{ width: 120, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 8 }}>
                    <small>Belum ada</small>
                  </div>
                )}
              </div>
              <div>
                <div className="table-secondary" style={{ marginBottom: 6 }}>TTD</div>
                {facilitator.signatureUrl ? (
                  <img src={resolveAssetUrl(facilitator.signatureUrl)} alt="TTD" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 10 }} />
                ) : (
                  <div className="empty-state" style={{ width: 120, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 8 }}>
                    <small>Belum ada</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>Riwayat Pendidikan</h3></div>
            {educations.length === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>Belum ada data.</p>
            ) : (
              educations.map((edu) => (
                <div key={edu.id} className="activity-row">
                  <div>
                    <div className="table-primary">{edu.institution}</div>
                    <div className="table-secondary">
                      {[edu.degree, formatDateRange(edu.startDate, edu.endDate)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>Materi yang Diajarkan</h3></div>
            {(facilitator.competencies ?? []).length === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>Belum ada data.</p>
            ) : (
              facilitator.competencies.map((c, i) => (
                <div key={i} className="activity-row">
                  <div>
                    <div className="table-primary">{c.name}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>Pendidikan/Pelatihan yang Terkait Materi</h3></div>
            {relatedTrainings.length === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>Belum ada data.</p>
            ) : (
              relatedTrainings.map((t) => (
                <div key={t.id} className="activity-row">
                  <div>
                    <div className="table-primary">{t.name}</div>
                    <div className="table-secondary">{[t.organizer, t.date].filter(Boolean).join(' · ')}</div>
                    {t.certificateUrl && <a className="table-secondary" href={resolveAssetUrl(t.certificateUrl)} target="_blank" rel="noreferrer">Lihat sertifikat</a>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <div className="panel-heading"><h3>Pengalaman Melatih/Mengajar</h3></div>
            {teachingExperience.length === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>Belum ada data.</p>
            ) : (
              teachingExperience.map((t) => (
                <div key={t.id} className="activity-row">
                  <div>
                    <div className="table-primary">{t.name}</div>
                    <div className="table-secondary">{[t.role, t.organizer, t.date].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  )
}
