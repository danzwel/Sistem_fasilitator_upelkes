import { useEffect, useState } from 'react'
import { Empty, Loading, ApiError } from '../../monitoring/pages/MonitoringPage'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { getFacilitators } from '../../fasilitator/api/facilitatorApi'
import { getTrainings } from '../../training/api/trainingApi'
import { Modal } from '../../../shared/components/Modal'
import { compareRecommendedFacilitators, formatFacilitatorName } from '../../../shared/utils/facilitator'

function toWhatsAppLink(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}`
}

// Disimpen di luar komponen (module-level) supaya nggak ikut hilang pas
// SearchPage di-unmount (misal waktu pindah ke halaman CV lalu balik lagi).
// State React biasa (useState) selalu reset kalau komponennya dicopot dari
// layar — App cuma nampilin 1 halaman aktif dalam satu waktu, jadi pindah
// halaman = unmount total, bukan cuma disembunyiin.
const searchCache = {
  activityQuery: '',
  activityState: { loading: false, error: '', records: null },
}

export function SearchPage({ onSelectFacilitator, onNavigate, facilitatorId: incomingFacilitatorId }) {
  const [activityQuery, setActivityQuery] = useState(searchCache.activityQuery)
  const [activityState, setActivityState] = useState(searchCache.activityState)
  const [detailFacilitatorId, setDetailFacilitatorId] = useState(incomingFacilitatorId ?? null)

  useEffect(() => { searchCache.activityQuery = activityQuery }, [activityQuery])
  useEffect(() => { searchCache.activityState = activityState }, [activityState])

  async function submitActivitySearch(event) {
    event.preventDefault()
    const q = activityQuery.trim().toLowerCase()
    if (!q) return

    setActivityState({ loading: true, error: '', records: null })
    try {
      const facilitators = await getFacilitators()
      const perFacilitator = await Promise.all(
        facilitators.map(async (f) => {
          try {
            const trainings = await getTrainings(f.id)
            const matches = trainings.filter((t) =>
              [t.name, t.material].filter(Boolean).some((field) => field.toLowerCase().includes(q))
            )
            return matches.length > 0 ? { facilitator: f, matches } : null
          } catch {
            return null
          }
        })
      )
      setActivityState({ loading: false, error: '', records: perFacilitator.filter(Boolean).sort((a, b) => compareRecommendedFacilitators(a.facilitator, b.facilitator)) })
    } catch (error) {
      setActivityState({ loading: false, error: error.message, records: [] })
    }
  }

  return <section className="module-page page-enter">
    <div className="search-banner">
      <div className="module-banner-content">
        <p className="eyebrow">PENCARIAN FASILITATOR</p>
        <h2>Cari Berdasarkan Pengalaman Kegiatan</h2>
        <p className="muted">Butuh narasumber untuk acara tertentu? Isi nama kegiatan atau materi, sistem cari fasilitator yang pernah punya pengalaman terkait itu di riwayat pelatihan mereka.</p>
      </div>
    </div>

    <form onSubmit={submitActivitySearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
      <input
        style={{ flex: 1, background: '#282139', border: '1px solid #382e4d', borderRadius: 12, padding: '11px 14px', color: '#f0ecff' }}
        placeholder="Contoh: Komunikasi Efektif, Posyandu, dsb."
        value={activityQuery}
        onChange={(e) => setActivityQuery(e.target.value)}
      />
      <button className="primary-button" style={{ marginTop: 0 }}>Cari</button>
    </form>

    {activityState.loading ? (
      <Loading text="Menelusuri riwayat pelatihan semua fasilitator..." />
    ) : activityState.error ? (
      <ApiError message={activityState.error} />
    ) : activityState.records === null ? (
      <Empty text="Masukkan kata kunci di atas, lalu tekan Cari." />
    ) : activityState.records.length === 0 ? (
      <Empty text={`Tidak ada fasilitator dengan pengalaman terkait "${activityQuery}".`} />
    ) : (
      <div className="facilitator-grid">
        {activityState.records.map(({ facilitator, matches }) => (
          <article className="search-result-card" key={facilitator.id}>
            <div className="search-result-photo-wrap">
              {facilitator.photoUrl ? (
                <img src={resolveAssetUrl(facilitator.photoUrl)} alt={facilitator.name} className="search-result-photo" />
              ) : (
                <div className="search-result-photo search-result-photo-placeholder">
                  {(facilitator.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="search-result-name">{formatFacilitatorName(facilitator)}</h3>
            <div className="search-result-rating">
              ★ {facilitator.rating?.average ?? facilitator.averageRating ?? '—'}
              <span> ({facilitator.rating?.count ?? facilitator.reviewCount ?? 0} ulasan)</span>
            </div>
            <span className={`badge ${facilitator.status === 'active' ? 'complete' : 'missing'}`}>
              {facilitator.status === 'active' ? 'Aktif' : facilitator.status || '-'}
            </span>
            <div className="search-result-matches">
              <div className="search-result-matches-label">Pengalaman terkait</div>
              {matches.map((m, i) => (
                <div key={i} className="search-result-match-item">
                  {m.name}{m.material ? <span className="search-result-match-material"> — {m.material}</span> : ''}
                </div>
              ))}
            </div>
            <button className="outline-button" style={{ width: '100%' }} onClick={() => setDetailFacilitatorId(facilitator.id)}>
              Lihat Profil →
            </button>
            <div className="search-result-contact-actions">
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
          </article>
        ))}
      </div>
    )}

    <TrainingHistoryModal facilitatorId={detailFacilitatorId} onClose={() => setDetailFacilitatorId(null)} onNavigate={onNavigate} />
  </section>
}

function TrainingHistoryModal({ facilitatorId, onClose, onNavigate }) {
  const [facilitator, setFacilitator] = useState(null)
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!facilitatorId) return
    let active = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const facilitators = await getFacilitators()
        const f = facilitators.find((item) => item.id === facilitatorId)
        const allTrainings = await getTrainings(facilitatorId)
        if (!active) return
        setFacilitator(f)
        setTrainings(allTrainings.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? ''))))
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [facilitatorId])

  return (
    <Modal open={Boolean(facilitatorId)} onClose={onClose} title="Riwayat Pelatihan Fasilitator">
      {loading ? (
        <div className="empty-state"><span>◌</span><p>Memuat data...</p></div>
      ) : error ? (
        <div className="empty-state"><span>◌</span><p>Gagal memuat data.</p><small>{error}</small></div>
      ) : facilitator ? (
        <>
          <div className="th-header">
            {facilitator.photoUrl ? (
              <img src={resolveAssetUrl(facilitator.photoUrl)} alt={facilitator.name} className="th-photo" />
            ) : (
              <div className="th-photo th-photo-placeholder">
                {(facilitator.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="th-name">{formatFacilitatorName(facilitator)}</div>
            <div className="th-position">{facilitator.position || '-'}{facilitator.unit ? ` · ${facilitator.unit}` : ''}</div>
            <div className="th-rating">
              ★ {facilitator.rating?.average ?? facilitator.averageRating ?? '—'}
              <span> ({facilitator.rating?.count ?? facilitator.reviewCount ?? 0} ulasan)</span>
            </div>
            <div className="th-contact-actions">
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
              <button type="button" className="th-cv-button" onClick={() => onNavigate?.('fasilitator-cv', facilitatorId, 'pencarian')}>
                📄 Lihat CV
              </button>
            </div>
          </div>

          <div className="th-timeline-title">Riwayat Pelatihan ({trainings.length})</div>
          {trainings.length === 0 ? (
            <p className="muted" style={{ fontSize: 12 }}>Belum ada riwayat pelatihan.</p>
          ) : (
            <div className="th-timeline">
              {trainings.map((t) => (
                <div key={t.id} className="th-timeline-item">
                  <div className="th-timeline-date">{t.date || '-'}</div>
                  <div className="th-timeline-content">
                    <div className="th-timeline-name">{t.name}</div>
                    {t.material && <div className="th-timeline-material">{t.material}</div>}
                    <div className="th-timeline-meta">{[t.role, t.organizer].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      <div className="modal-footer">
        <button type="button" className="outline-button" onClick={onClose}>← Kembali</button>
      </div>
    </Modal>
  )
}

export function Avatar({ person, large = false }) { return <div className={large ? 'large-avatar' : 'person-avatar'}>{person.photoUrl ? <img src={resolveAssetUrl(person.photoUrl)} alt="" /> : person.name?.slice(0, 2)}</div> }
