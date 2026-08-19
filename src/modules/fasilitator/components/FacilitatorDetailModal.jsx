import { useEffect, useState } from 'react'
import { getFacilitatorById } from '../api/facilitatorApi'
import { getEducations } from '../api/educationApi'
import { getTrainings } from '../../training/api/trainingApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { Modal } from '../../../shared/components/Modal'

function toWhatsAppLink(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}`
}

export function FacilitatorDetailModal({ facilitatorId, onClose, onNavigate }) {
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
                <div className="detail-label">Gelar</div>
                <div className="detail-value">{facilitator.degree || '-'}</div>
              </div>
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
            </div>

            <div className="detail-facilitator-card">
              {facilitator.photoUrl ? (
                <img src={resolveAssetUrl(facilitator.photoUrl)} alt={facilitator.name} className="detail-facilitator-photo" />
              ) : (
                <div className="detail-facilitator-photo detail-facilitator-photo-placeholder">
                  {(facilitator.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="detail-facilitator-name">{facilitator.name}</div>
              <span className={`status-badge ${facilitator.status === 'active' ? 'lengkap' : 'belum_lengkap'}`} style={{ marginTop: 6 }}>
                {facilitator.status === 'active' ? 'Aktif' : facilitator.status || '-'}
              </span>

              <div className="detail-facilitator-actions">
                {facilitator.phone && (
                  <a href={toWhatsAppLink(facilitator.phone)} target="_blank" rel="noreferrer" className="detail-contact-button wa">
                    ⌾ WhatsApp
                  </a>
                )}
                {facilitator.email && (
                  <a href={`mailto:${facilitator.email}`} className="detail-contact-button email">
                    ✉ Email
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="detail-summary-row">
            <div className="detail-summary-chip">
              <strong>{educations.length}</strong>
              <span>Riwayat Pendidikan</span>
            </div>
            <div className="detail-summary-chip">
              <strong>{(facilitator.competencies ?? []).length}</strong>
              <span>Materi Diajarkan</span>
            </div>
            <div className="detail-summary-chip">
              <strong>{relatedTrainings.length + teachingExperience.length}</strong>
              <span>Riwayat Pelatihan</span>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="text-button" onClick={() => onNavigate?.('fasilitator-detail', facilitatorId)}>
              Lihat halaman lengkap →
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="outline-button" onClick={onClose}>← Kembali</button>
              <button type="button" className="primary-button" style={{ marginTop: 0 }} onClick={() => onNavigate?.('fasilitator-edit', facilitatorId)}>
                Edit
              </button>
            </div>
          </div>
        </>
      ) : null}
    </Modal>
  )
}