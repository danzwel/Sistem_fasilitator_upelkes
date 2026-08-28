import { useEffect, useState } from 'react'
import { getFacilitatorById } from '../api/facilitatorApi'
import { getEducations } from '../api/educationApi'
import { getTrainings } from '../../training/api/trainingApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { formatFacilitatorName } from '../../../shared/utils/facilitator'

function formatTrainingDate(training) {
  const start = training.startDate || training.date
  const end = training.endDate || start
  if (!start) return '-'
  return start === end ? start : `${start} – ${end}`
}
import { Modal } from '../../../shared/components/Modal'

function toWhatsAppLink(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}`
}

function toEmailLink(email, name = 'Fasilitator') {
  const subject = `Koordinasi kegiatan UPELKES - ${name}`
  const body = `Yth. ${name},\n\nSaya ingin menghubungi terkait kegiatan UPELKES.\n\nTerima kasih.`
  return `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function FacilitatorDetailModal({ facilitatorId, onClose, onNavigate }) {
  const [facilitator, setFacilitator] = useState(null)
  const [educations, setEducations] = useState([])
  const [relatedTrainings, setRelatedTrainings] = useState([])
  const [teachingExperience, setTeachingExperience] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [section, setSection] = useState(null)

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

  return (
    <Modal open={Boolean(facilitatorId)} onClose={onClose} title="Detail Fasilitator">
      {loading ? (
        <div className="empty-state"><span>◌</span><p>Memuat data...</p></div>
      ) : error ? (
        <div className="empty-state"><span>◌</span><p>Gagal memuat data.</p><small>{error}</small></div>
      ) : facilitator ? (
        <>
          <div className="detail-layout">
            <div className="detail-fields">
              <div className="detail-field">
                <div className="detail-label">Tempat/Tanggal Lahir</div>
                <div className="detail-value">{facilitator.birthInfo || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">NIK</div>
                <div className="detail-value">{facilitator.nik || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">NIP</div>
                <div className="detail-value">{facilitator.nip || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Pangkat/Golongan</div>
                <div className="detail-value">{facilitator.rank || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Jabatan / Unit Kerja</div>
                <div className="detail-value">{facilitator.position || '-'} · {facilitator.unit || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Alamat Kantor</div>
                <div className="detail-value">{facilitator.officeAddress || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Alamat Rumah</div>
                <div className="detail-value">{facilitator.homeAddress || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Riwayat Pendidikan</div>
                <div className="detail-value">{educations.length ? educations.map((education) => `${education.institution}${education.degree ? ` · ${education.degree}` : ''}`).join(', ') : '-'}</div>
              </div>
            </div>

            <div className="detail-facilitator-card">
              {facilitator.photoUrl ? (
                <img src={resolveAssetUrl(facilitator.photoUrl)} alt={facilitator.name} className="detail-facilitator-photo" />
              ) : (
                <div className="detail-facilitator-photo detail-facilitator-photo-placeholder">
                  {(facilitator.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="detail-facilitator-name">{formatFacilitatorName(facilitator)}</div>
              <span className={`status-badge ${facilitator.completeness?.isComplete ? 'lengkap' : 'belum_lengkap'}`} style={{ marginTop: 6 }}>
                {facilitator.completeness?.isComplete ? 'Lengkap' : 'Belum Lengkap'}
              </span>
              <div className="profile-rating">★ {facilitator.rating?.average ?? '—'} <span>({facilitator.rating?.count ?? 0} ulasan)</span></div>

              <div className="detail-facilitator-actions">
                {facilitator.phone && (
                  <a href={toWhatsAppLink(facilitator.phone)} target="_blank" rel="noreferrer" className="detail-contact-button wa">
                    ⌾ WhatsApp
                  </a>
                )}
                {facilitator.email && (
                  <a href={toEmailLink(facilitator.email, formatFacilitatorName(facilitator))} target="_blank" rel="noreferrer" className="detail-contact-button email">
                    ✉ Email
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="detail-summary-row">
            <button type="button" className="detail-summary-chip" onClick={() => setSection('certificates')}>
              <strong>{relatedTrainings.filter((training) => training.certificateUrl).length}</strong>
              <span>Sertifikat</span>
            </button>
            <button type="button" className="detail-summary-chip" onClick={() => setSection('materials')}>
              <strong>{(facilitator.competencies ?? []).length}</strong>
              <span>Materi Diajarkan</span>
            </button>
            <button type="button" className="detail-summary-chip" onClick={() => setSection('trainings')}>
              <strong>{relatedTrainings.length + teachingExperience.length}</strong>
              <span>Riwayat Pelatihan</span>
            </button>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="text-button" onClick={() => onNavigate?.('fasilitator-detail', facilitatorId)}>
              Lihat halaman lengkap →
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="outline-button" onClick={onClose}>← Kembali</button>
              <button type="button" className="primary-button" style={{ marginTop: 0 }} onClick={() => onNavigate?.('fasilitator-edit', facilitatorId, 'fasilitator')}>
                Edit
              </button>
            </div>
          </div>
        </>
      ) : null}
      <Modal open={Boolean(section)} onClose={() => setSection(null)} title={section === 'certificates' ? 'Sertifikat Pelatihan' : section === 'materials' ? 'Materi yang Diajarkan' : 'Riwayat Pelatihan'}>
        {section === 'certificates' && (relatedTrainings.filter((training) => training.certificateUrl).length ? relatedTrainings.filter((training) => training.certificateUrl).map((training) => <div className="training-history-row" key={training.id}><div className="training-history-date" style={{ background: training.color || '#287c6a' }}>{formatTrainingDate(training)}</div><div className="training-history-content"><b>{training.name}</b><p>{training.organizer || '-'}</p></div><a className="text-button" href={resolveAssetUrl(training.certificateUrl)} target="_blank" rel="noreferrer">Lihat sertifikat</a></div>) : <p className="muted">Belum ada sertifikat pelatihan.</p>)}
        {section === 'materials' && ((facilitator.competencies ?? []).length ? facilitator.competencies.map((item) => <div className="activity-row" key={item.name}><b>{item.name}</b></div>) : <p className="muted">Belum ada materi yang diajarkan.</p>)}
        {section === 'trainings' && ([...relatedTrainings, ...teachingExperience].length ? [...relatedTrainings, ...teachingExperience].map((training) => <div className="training-history-row" key={`${training.category}-${training.id}`}><div className="training-history-date" style={{ background: training.color || '#287c6a' }}>{formatTrainingDate(training)}</div><div className="training-history-content"><b>{training.name}</b><p>{[training.material, training.role, training.organizer].filter(Boolean).join(' · ')}</p>{(training.participantCount != null || training.rating != null) && <p>{training.participantCount != null ? `${training.participantCount} peserta` : ''}{training.rating != null ? ` · Rating ${training.rating}/5` : ''}</p>}</div></div>) : <p className="muted">Belum ada riwayat pelatihan.</p>)}
      </Modal>
    </Modal>
  )
}
