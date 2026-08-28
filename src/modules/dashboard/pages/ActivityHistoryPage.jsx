import { useEffect, useMemo, useState } from 'react'
import { getFacilitators } from '../../fasilitator/api/facilitatorApi'
import { createTrainingReview, getTrainings } from '../../training/api/trainingApi'
import { Modal } from '../../../shared/components/Modal'
import { formatFacilitatorName } from '../../../shared/utils/facilitator'

function statusOf(training, today) {
  if ((training.endDate || training.date) < today) return { key: 'finished', label: 'Selesai' }
  if ((training.startDate || training.date) > today) return { key: 'upcoming', label: 'Akan Datang' }
  return { key: 'ongoing', label: 'Sedang Berlangsung' }
}

function formatDate(training) {
  const start = training.startDate || training.date
  const end = training.endDate || start
  if (!start) return '-'
  return start === end ? start : `${start} – ${end}`
}

export function ActivityHistoryPage({ onNavigate }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [reviewActivity, setReviewActivity] = useState(null)
  const [rating, setRating] = useState('5')
  const [reviewError, setReviewError] = useState('')
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  async function load() {
    setLoading(true); setError('')
    try {
      const facilitators = await getFacilitators()
      const records = (await Promise.all(facilitators.map(async (facilitator) => {
        const trainings = await getTrainings(facilitator.id)
        return trainings.map((training) => ({ ...training, facilitator, status: statusOf(training, today) }))
      }))).flat()
      setActivities(records.sort((a, b) => String(b.startDate || b.date || '').localeCompare(String(a.startDate || a.date || ''))))
    } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const visibleActivities = useMemo(() => filter === 'all' ? activities : activities.filter((item) => item.status.key === filter), [activities, filter])
  function openReview(activity) {
    setReviewActivity(activity); setRating('5'); setReviewError('')
  }
  async function submitReview(event) {
    event.preventDefault()
    setSaving(true); setReviewError('')
    try {
      await createTrainingReview(reviewActivity.facilitator.id, reviewActivity.id, { rating: Number(rating) })
      setReviewActivity(null)
      await load()
    } catch (saveError) { setReviewError(saveError.message) } finally { setSaving(false) }
  }

  return <section className="module-page page-enter">
    <div className="module-heading"><p className="eyebrow">AGENDA & KEGIATAN</p><h2>Semua Kegiatan</h2><p>Riwayat kegiatan yang sudah selesai, sedang berlangsung, dan akan datang.</p></div>
    <div className="filter-tabs">{[['all', 'Semua'], ['finished', 'Selesai'], ['ongoing', 'Sedang Berlangsung'], ['upcoming', 'Akan Datang']].map(([key, label]) => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div>
    {loading ? <div className="module-state"><span className="spinner" /><p>Memuat semua kegiatan...</p></div> : error ? <div className="module-state error"><p>Gagal memuat kegiatan.</p><small>{error}</small></div> : visibleActivities.length === 0 ? <div className="module-state"><p>Belum ada kegiatan pada kategori ini.</p></div> : <div className="activity-history-list">{visibleActivities.map((activity) => <article className="activity-history-card" key={`${activity.facilitator.id}-${activity.id}`}><div className="activity-history-date">{formatDate(activity)}</div><div className="activity-history-main"><h3>{activity.name}</h3><p>{formatFacilitatorName(activity.facilitator)}</p><span>{[activity.material, activity.organizer].filter(Boolean).join(' · ') || 'Informasi kegiatan belum lengkap'}</span></div><div className="activity-history-side"><span className={`status-badge ${activity.status.key === 'finished' ? 'lengkap' : 'belum_lengkap'}`}>{activity.status.label}</span>{activity.status.key === 'finished' ? activity.reviewCount ? <span className="reviewed-label">★ Sudah dinilai</span> : <button className="primary-button" onClick={() => openReview(activity)} style={{ marginTop: 8 }}>Beri Rating</button> : <small>Rating tersedia setelah kegiatan selesai</small>}</div></article>)}</div>}
    <button className="text-button" onClick={() => onNavigate('dashboard')} style={{ marginTop: 18 }}>← Kembali ke Dashboard</button>
    <Modal open={Boolean(reviewActivity)} onClose={() => !saving && setReviewActivity(null)} title="Beri Rating Fasilitator">
      {reviewActivity && <form onSubmit={submitReview}><p className="muted" style={{ fontSize: 13 }}>Rating untuk <strong>{formatFacilitatorName(reviewActivity.facilitator)}</strong> pada kegiatan <strong>{reviewActivity.name}</strong>.</p>{reviewError && <div className="form-error" style={{ marginBottom: 10 }}>{reviewError}</div>}<label className="form-field"><span>Rating</span><select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} bintang</option>)}</select></label><div style={{ display: 'flex', gap: 10, marginTop: 14 }}><button className="primary-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Rating'}</button><button type="button" className="outline-button" onClick={() => setReviewActivity(null)} disabled={saving}>Batal</button></div></form>}
    </Modal>
  </section>
}
