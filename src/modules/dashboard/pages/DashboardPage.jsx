import { useEffect, useState } from 'react'
import { getFacilitators, createFacilitator } from '../../fasilitator/api/facilitatorApi'
import { uploadFacilitatorPhoto, uploadFacilitatorSignature, uploadFacilitatorSupporting, uploadFacilitatorCertificate } from '../../fasilitator/api/facilitatorUploadApi'
import { createEducation } from '../../fasilitator/api/educationApi'
import { createTraining, createTrainingReview } from '../../training/api/trainingApi'
import { formatFacilitatorName } from '../../../shared/utils/facilitator'
import { SearchableInput } from '../../../shared/components/SearchableInput'
import { Modal } from '../../../shared/components/Modal'
import { getDashboardSummary } from '../api/dashboardApi'

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatAgendaDate(startDate, endDate) {
  if (!startDate) return { day: '-', month: '-' }
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${(endDate || startDate)}T00:00:00`)
  const month = monthNames[start.getMonth()].slice(0, 3)
  if (startDate === (endDate || startDate)) return { day: start.getDate(), month }
  const endMonth = monthNames[end.getMonth()].slice(0, 3)
  return { day: `${start.getDate()}–${end.getDate()}`, month: start.getMonth() === end.getMonth() ? month : `${month}–${endMonth}` }
}

// Map keys to SVG icons for stats
const statIcons = {
  facilitators: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  complete: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  incomplete: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  activities: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  newSubmissions: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  thisMonth: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
}

function DisplayValue({ value }) {
  if (value === null || value === undefined) {
    return <strong className="stat-placeholder">—</strong>
  }
  return <strong>{value}</strong>
}

export function DashboardPage({ data, onNavigate }) {
  const today = new Date()

  // State for calendar navigation
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [facilitators, setFacilitators] = useState([])
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [agendaSaving, setAgendaSaving] = useState(false)
  const [agendaError, setAgendaError] = useState('')
  const [selectedAgenda, setSelectedAgenda] = useState(null)
  const [allAgendaOpen, setAllAgendaOpen] = useState(false)
  const [selectedStat, setSelectedStat] = useState(null)
  const [agendaForm, setAgendaForm] = useState({ date: '', endDate: '', name: '', material: '', organizer: '', participantCount: '', facilitatorId: '', facilitatorName: '', color: '#9f58cc' })

  const agendaTrainingOptions = [...new Set((data?.allActivities || []).map((item) => item.name?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const agendaMaterialOptions = [...new Set((data?.allActivities || []).filter((item) => item.name?.trim().toLowerCase() === agendaForm.name.trim().toLowerCase()).map((item) => item.material?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const agendaFacilitatorOptions = [...new Set((data?.allActivities || []).filter((item) => item.name?.trim().toLowerCase() === agendaForm.name.trim().toLowerCase() && (!agendaForm.material.trim() || item.material?.trim().toLowerCase() === agendaForm.material.trim().toLowerCase())).map((item) => item.facilitator?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))

  useEffect(() => { getFacilitators().then(setFacilitators).catch(() => setFacilitators([])) }, [])
  function openAgenda(day) {
    const date = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setAgendaForm({ date, endDate: date, name: '', material: '', organizer: '', participantCount: '', facilitatorId: '', facilitatorName: '', color: '#9f58cc' }); setAgendaError(''); setAgendaOpen(true)
  }
  async function saveAgenda(event) {
    event.preventDefault(); if (!agendaForm.name.trim() || !agendaForm.material.trim() || !agendaForm.facilitatorName.trim()) return setAgendaError('Pelatihan, materi, dan fasilitator wajib diisi.')
    setAgendaSaving(true); setAgendaError('')
    try { let facilitatorId = agendaForm.facilitatorId; if (!facilitatorId) facilitatorId = (await createFacilitator({ name: agendaForm.facilitatorName.trim() })).id; await createTraining(facilitatorId, { name: agendaForm.name.trim(), material: agendaForm.material.trim(), organizer: agendaForm.organizer, participantCount: agendaForm.participantCount === '' ? null : Number(agendaForm.participantCount), date: agendaForm.date, startDate: agendaForm.date, endDate: agendaForm.endDate, color: agendaForm.color, category: 'teaching_experience', catalogOnly: false }); setAgendaOpen(false); window.location.reload() } catch (error) { setAgendaError(error.message) } finally { setAgendaSaving(false) }
  }
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(y => y - 1)
    } else {
      setCalMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(y => y + 1)
    } else {
      setCalMonth(m => m + 1)
    }
  }

  // Calculate calendar days dynamically
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 7 : day // Sunday is 7, Monday is 1
  }

  const daysInMonth = getDaysInMonth(calMonth, calYear)
  const firstDay = getFirstDayOfMonth(calMonth, calYear)

  const days = []
  // Previous month padding
  for (let i = 1; i < firstDay; i++) {
    days.push({ day: '', current: false })
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true })
  }
  // Next month padding to complete grid (42 cells max)
  const totalCells = Math.ceil(days.length / 7) * 7
  while (days.length < totalCells) {
    days.push({ day: '', current: false })
  }

  const isCurrentMonth = calMonth === today.getMonth() && calYear === today.getFullYear()

  // Format today's date for welcome row
  const formattedToday = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

  return (
    <div className="dashboard page-enter">
      <div className="welcome-row">
        <div>
          <h2>Selamat datang, Admin <span>✦</span></h2>
          <p className="muted">Pantau data fasilitator dan kegiatan UPELKES dalam satu tempat.</p>
        </div>
        <div className="welcome-actions">
          <span className="welcome-date">{formattedToday}</span>
          <button className="outline-button" onClick={() => onNavigate('fasilitator')}>
            Kelola Fasilitator →
          </button>
        </div>
      </div>

      <WelcomeTrainingBanner activities={data.allActivities || data.upcomingActivities} />

      <section className="stats-grid">
        {data.stats.filter((stat) => stat.key !== 'newSubmissions').map(stat => (
          <button type="button" className={`stat-card ${stat.tone}`} key={stat.key} onClick={() => setSelectedStat(stat)}>
            <div className="stat-top">
              <span className="stat-icon">
                {statIcons[stat.key] || <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </span>
              <span className="status-dot">●</span>
            </div>
            <p>{stat.label}</p>
            <DisplayValue value={stat.value} />
          </button>
        ))}
      </section>

      <div className="content-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AGENDA</p>
              <h3>Pengingat kegiatan</h3>
            </div>
            <button className="text-button" onClick={() => setAllAgendaOpen(true)}>
              Lihat semua →
            </button>
          </div>

          {data.upcomingActivities.length > 0 ? (
            <div className="agenda-list">
              {data.upcomingActivities.map(item => (
                <div className="activity-row agenda-row" key={item.id} style={{ '--agenda-color': item.color || '#9f58cc' }} role="button" tabIndex={0} onClick={() => setSelectedAgenda(item)} onKeyDown={(event) => event.key === 'Enter' && setSelectedAgenda(item)}>
                  <div className="date-box agenda-date-box" style={{ '--agenda-color': item.color || '#bf68f5' }}>
                    <b>{formatAgendaDate(item.startDate || item.date, item.endDate).day}</b>
                    <span>{formatAgendaDate(item.startDate || item.date, item.endDate).month}</span>
                  </div>
                  <div className="agenda-content">
                    <b>{item.name}</b>
                    <p>{item.facilitator} · {item.organizer || 'Terjadwal'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Belum ada kegiatan terdekat." />
          )}
        </section>

        <section className="panel calendar-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">JADWAL</p>
              <h3>{monthNames[calMonth]} {calYear}</h3>
            </div>
            <div className="calendar-nav">
              <button onClick={handlePrevMonth} aria-label="Bulan sebelumnya">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={handleNextMonth} aria-label="Bulan berikutnya">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="calendar-grid weekdays">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((item, i) => {
              const isToday = isCurrentMonth && item.day === today.getDate()
              const cellDate = item.current ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}` : ''
              const cellActivities = item.current ? (data.calendarActivities || []).filter((activity) => cellDate >= activity.startDate && cellDate <= activity.endDate) : []
              return (
                <button type="button" onClick={() => item.current && openAgenda(item.day)}
                  className={`${isToday ? 'today' : ''} ${!item.current ? 'outside' : ''}`}
                  key={i}
                >
                  {item.day}
                  {cellActivities.length > 0 && <span className="calendar-event-bars">{cellActivities.map((activity) => <i key={activity.id} style={{ background: activity.color || '#9f58cc' }} title={activity.name} />)}</span>}
                </button>
              )
            })}
          </div>

          <p className="calendar-note">
            {data.calendarActivities.length
              ? `${data.calendarActivities.length} agenda tersimpan bulan ini`
              : 'Agenda kalender akan muncul dari database.'}
          </p>
        </section>
      </div>

      <AllAgendaModal activities={data.allActivities || []} open={allAgendaOpen} onClose={() => setAllAgendaOpen(false)} />
      <StatDetailModal stat={selectedStat} data={data} facilitators={facilitators} onClose={() => setSelectedStat(null)} onNavigate={onNavigate} />

      <Modal open={agendaOpen} onClose={() => setAgendaOpen(false)} title="Tambah Agenda Pelatihan">
        <form onSubmit={saveAgenda}>
          {agendaError && <div className="form-error" style={{ marginBottom: 10 }}>{agendaError}</div>}
          <div className="form-grid">
            <SearchableInput id="dashboard-agenda-training" label={<>Pelatihan <span className="required-mark">*</span></>} value={agendaForm.name} options={agendaTrainingOptions} placeholder="Pilih atau ketik nama pelatihan..." required onChange={(value) => setAgendaForm((form) => ({ ...form, name: value, material: '', facilitatorName: '', facilitatorId: '' }))} />
            <SearchableInput id="dashboard-agenda-material" label={<>Materi / Mata Pelatihan <span className="required-mark">*</span></>} value={agendaForm.material} options={agendaMaterialOptions} placeholder="Pilih atau ketik materi..." required onChange={(value) => setAgendaForm((form) => ({ ...form, material: value, facilitatorName: '', facilitatorId: '' }))} />
            <SearchableInput id="dashboard-agenda-facilitator" label={<>Fasilitator <span className="required-mark">*</span></>} value={agendaForm.facilitatorName} options={agendaFacilitatorOptions.length ? agendaFacilitatorOptions : facilitators.map((f) => f.name)} placeholder="Pilih atau ketik fasilitator..." required onChange={(value) => { const match = facilitators.find((f) => f.name === value); setAgendaForm((form) => ({ ...form, facilitatorName: value, facilitatorId: match?.id || '' })) }} />
            <label className="form-field"><span>Penyelenggara</span><input type="text" value={agendaForm.organizer} onChange={(e) => setAgendaForm((form) => ({ ...form, organizer: e.target.value }))} /></label>
            <label className="form-field"><span>Tanggal Mulai <span className="required-mark">*</span></span><input type="date" value={agendaForm.date} required onChange={(e) => setAgendaForm((form) => ({ ...form, date: e.target.value }))} /></label>
            <label className="form-field"><span>Tanggal Selesai <span className="required-mark">*</span></span><input type="date" value={agendaForm.endDate} required onChange={(e) => setAgendaForm((form) => ({ ...form, endDate: e.target.value }))} /></label>
            <label className="form-field"><span>Jumlah Peserta</span><input type="number" min="0" value={agendaForm.participantCount} onChange={(e) => setAgendaForm((form) => ({ ...form, participantCount: e.target.value }))} /></label>
            <label className="form-field"><span>Warna Agenda</span><input type="color" value={agendaForm.color} onChange={(e) => setAgendaForm((form) => ({ ...form, color: e.target.value }))} /></label>
          </div>
          <div className="agenda-form-actions"><button className="primary-button" type="submit" disabled={agendaSaving}>{agendaSaving ? 'Menyimpan...' : 'Simpan Agenda'}</button><button className="outline-button" type="button" onClick={() => setAgendaOpen(false)}>Batal</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(selectedAgenda)} onClose={() => setSelectedAgenda(null)} title="Detail Agenda">
        {selectedAgenda && <div className="agenda-detail">
          <div className="agenda-detail-color" style={{ background: selectedAgenda.color || '#9f58cc' }} />
          <h3>{selectedAgenda.name}</h3>
          <div className="agenda-detail-grid">
            <span>Fasilitator</span><b>{selectedAgenda.facilitator || '-'}</b>
            <span>Tanggal</span><b>{formatAgendaDate(selectedAgenda.startDate || selectedAgenda.date, selectedAgenda.endDate).day} {formatAgendaDate(selectedAgenda.startDate || selectedAgenda.date, selectedAgenda.endDate).month}</b>
            <span>Materi</span><b>{selectedAgenda.material || '-'}</b>
            <span>Penyelenggara</span><b>{selectedAgenda.organizer || '-'}</b>
          </div>
        </div>}
      </Modal>

      <div className="bottom-grid">
        <section className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AKSES CEPAT</p>
              <h3>Pintas admin</h3>
            </div>
          </div>
          <div className="quick-actions">
            <button onClick={() => onNavigate('fasilitator')}>
              <span className="quick-action-icon">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </span>
              Tambah Fasilitator
            </button>
            <button onClick={() => onNavigate('pelatihan')}>
              <span className="quick-action-icon">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </span>
              Tambah Pelatihan
            </button>
            <button onClick={() => onNavigate('fasilitator')}>
              <span className="quick-action-icon">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </span>
              Import Excel
            </button>
            <button onClick={() => onNavigate('fasilitator')}>
              <span className="quick-action-icon">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </span>
              Generate CV
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function AllAgendaModal({ activities, open, onClose }) {
  const [items, setItems] = useState(activities)
  const [filter, setFilter] = useState('all')
  const [ratingActivity, setRatingActivity] = useState(null)
  const [rating, setRating] = useState('5')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  useEffect(() => { setItems(activities) }, [activities])
  useEffect(() => {
    if (!open) return
    getDashboardSummary().then((summary) => setItems(summary.allActivities || [])).catch(() => setItems(activities))
  }, [open])
  const getStatus = (activity) => {
    if ((activity.endDate || activity.startDate) < today) return ['finished', 'Selesai']
    if ((activity.startDate || '') > today) return ['upcoming', 'Akan Datang']
    return ['ongoing', 'Sedang Berlangsung']
  }
  const visible = items.filter((activity) => filter === 'all' || getStatus(activity)[0] === filter)
  async function saveRating(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      await createTrainingReview(ratingActivity.facilitatorId, ratingActivity.id, { rating: Number(rating) })
      setItems((current) => current.map((activity) => activity.id === ratingActivity.id && activity.facilitatorId === ratingActivity.facilitatorId ? { ...activity, reviewCount: 1 } : activity))
      setRatingActivity(null)
    } catch (saveError) { setError(saveError.message) } finally { setSaving(false) }
  }
  return <Modal open={open} onClose={() => !saving && onClose()} title="Semua Agenda Kegiatan">
    <div className="all-agenda-modal">
      <div className="all-agenda-summary"><span>Seluruh kegiatan fasilitator</span><strong>{visible.length} kegiatan</strong></div>
      <div className="filter-tabs all-agenda-filters">{[['all', 'Semua'], ['finished', 'Selesai'], ['ongoing', 'Berlangsung'], ['upcoming', 'Akan Datang']].map(([key, label]) => <button type="button" key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div>
      {visible.length === 0 ? <div className="empty-state"><p>Belum ada agenda pada status ini.</p></div> : <div className="all-agenda-list">{visible.map((activity) => { const [statusKey, statusLabel] = getStatus(activity); const facilitator = { name: activity.facilitator, degree: activity.facilitatorDegree }; return <article className="all-agenda-item" key={`${activity.facilitatorId}-${activity.id}`}><div className="all-agenda-date">{formatAgendaDate(activity.startDate, activity.endDate).day}<small>{formatAgendaDate(activity.startDate, activity.endDate).month}</small></div><div className="all-agenda-info"><h4>{activity.name}</h4><p>{formatFacilitatorName(facilitator)}</p><small>{[activity.material, activity.organizer].filter(Boolean).join(' · ') || 'Informasi kegiatan belum lengkap'}</small></div><div className="all-agenda-actions"><span className={`status-badge ${statusKey === 'finished' ? 'lengkap' : 'belum_lengkap'}`}>{statusLabel}</span>{statusKey === 'finished' ? activity.reviewCount ? <span className="reviewed-label">★ Sudah dinilai</span> : <button type="button" className="text-button" onClick={() => { setRatingActivity(activity); setRating('5'); setError('') }}>Beri rating</button> : <small>Rating setelah selesai</small>}</div></article> })}</div>}
    </div>
    <Modal open={Boolean(ratingActivity)} onClose={() => !saving && setRatingActivity(null)} title="Beri Rating Fasilitator">{ratingActivity && <form onSubmit={saveRating}><div className="rating-hero"><div className="rating-hero-icon">★</div><div><strong>Bagaimana pengalaman Anda?</strong><span>Berikan penilaian untuk membantu meningkatkan kualitas fasilitator.</span></div></div>{error && <div className="form-error">{error}</div>}<p className="muted">Rating untuk <strong>{formatFacilitatorName({ name: ratingActivity.facilitator, degree: ratingActivity.facilitatorDegree })}</strong>.</p><label className="form-field"><span>Rating</span><select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} bintang</option>)}</select></label><div className="modal-footer"><button className="primary-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Rating'}</button><button type="button" className="outline-button" onClick={() => setRatingActivity(null)} disabled={saving}>Batal</button></div></form>}</Modal>
  </Modal>
}

const completenessLabels = { photo: 'Foto', signature: 'TTD', certificate: 'Sertifikat', material: 'Materi pelatihan', education: 'Riwayat pendidikan', supporting: 'Dokumen pendukung' }

function StatDetailModal({ stat, data, facilitators, onClose, onNavigate }) {
  const [detailPerson, setDetailPerson] = useState(null)
  const [activityDetail, setActivityDetail] = useState(null)
  const [quickAdd, setQuickAdd] = useState(null)
  if (!stat) return null
  const today = new Date()
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`
  const basePeople = data.facilitatorSummary || facilitators || []
  const people = basePeople.map((person) => {
    const details = (facilitators || []).find((item) => item.id === person.id)
    return details ? { ...person, completeness: details.completeness } : person
  })
  const peopleByPriority = [...people].sort((a, b) => {
    const completeDifference = Number(Boolean(b.completeness?.isComplete)) - Number(Boolean(a.completeness?.isComplete))
    if (completeDifference !== 0) return completeDifference
    const ratingDifference = Number(b.averageRating || b.rating?.average || 0) - Number(a.averageRating || a.rating?.average || 0)
    if (ratingDifference !== 0) return ratingDifference
    return String(a.name || '').localeCompare(String(b.name || ''), 'id', { sensitivity: 'base' })
  })
  const activities = data.allActivities || []
  let title = stat.label
  let description = 'Ringkasan data terbaru dari sistem.'
  let items = []
  if (stat.key === 'facilitators') {
    description = 'Seluruh fasilitator yang terdaftar.'
    items = peopleByPriority
  } else if (stat.key === 'complete' || stat.key === 'incomplete') {
    const complete = stat.key === 'complete'
    title = complete ? 'Fasilitator dengan Data Lengkap' : 'Fasilitator dengan Data Belum Lengkap'
    description = complete ? 'Profil telah memenuhi seluruh kelengkapan data.' : 'Profil yang masih membutuhkan pembaruan data.'
    items = people.filter((person) => Boolean(person.completeness?.isComplete) === complete)
  } else if (stat.key === 'activities' || stat.key === 'thisMonth') {
    const thisMonth = stat.key === 'thisMonth'
    title = thisMonth ? 'Kegiatan Bulan Ini' : 'Seluruh Pelatihan / Kegiatan'
    description = thisMonth ? `Kegiatan pada ${monthNames[today.getMonth()]} ${today.getFullYear()}.` : 'Seluruh riwayat kegiatan yang tersimpan.'
    items = thisMonth ? activities.filter((item) => (item.startDate || '') < monthEnd && (item.endDate || item.startDate || '') >= monthStart) : activities
  } else if (stat.key === 'newSubmissions') {
    title = 'Pengajuan Baru'
    description = `Fasilitator yang ditambahkan sejak ${monthNames[today.getMonth()]} ${today.getFullYear()}.`
    items = people.filter((person) => (person.createdAt || person.created_at || '') >= monthStart)
  }
  const missingFields = detailPerson ? Object.entries(detailPerson.completeness?.checks || {}).filter(([, complete]) => !complete).map(([key]) => completenessLabels[key] || key) : []
  const completedFields = Math.max(0, 6 - missingFields.length)
  return <>
    <Modal open onClose={onClose} title={title}>
      <div className="stat-detail-modal">
        <div className="stat-detail-summary"><span>{description}</span><strong>{stat.value} data</strong></div>
        {items.length === 0 ? <EmptyState text="Belum ada data untuk ditampilkan." /> : <div className="stat-detail-list">
          {items.map((item, index) => {
            const isActivity = stat.key === 'activities' || stat.key === 'thisMonth'
            const person = !isActivity && item
            return <article className="stat-detail-item" key={`${item.id || item.name}-${index}`}>
              <div className="stat-detail-index">{String(index + 1).padStart(2, '0')}</div>
              <div><h4>{isActivity ? item.name : formatFacilitatorName(person)}</h4>{isActivity && <p>{`${formatAgendaDate(item.startDate, item.endDate).day} ${formatAgendaDate(item.startDate, item.endDate).month} · ${item.facilitator || 'Fasilitator belum tercatat'}`}</p>}</div>
              {isActivity ? <div className="stat-detail-actions">
                <button type="button" className="text-button" onClick={() => setActivityDetail(item)}>Detail</button>
              </div> : <div className="stat-detail-actions">
                <span className={`status-badge ${person.completeness?.isComplete ? 'lengkap' : 'belum_lengkap'}`}>{person.completeness?.isComplete ? 'Lengkap' : 'Belum lengkap'}</span>
                {!person.completeness?.isComplete && <div className="stat-detail-buttons">
                  <button type="button" className="text-button" onClick={() => setDetailPerson(person)}>Detail</button>
                  <button type="button" className="text-button" onClick={() => { onClose(); onNavigate?.('fasilitator-edit', person.id, 'dashboard') }}>Edit</button>
                </div>}
              </div>}
            </article>
          })}
        </div>}
      </div>
    </Modal>
    <Modal open={Boolean(detailPerson)} onClose={() => setDetailPerson(null)} title="Detail Data Belum Lengkap">
      {detailPerson && <div className="completeness-detail completeness-detail-modal">
        <div className="completeness-hero">
          <div className="completeness-avatar">{(detailPerson.name || '?').charAt(0).toUpperCase()}</div>
          <div><span className="completeness-kicker">PROFIL FASILITATOR</span><h3>{formatFacilitatorName(detailPerson)}</h3><p>Lengkapi data berikut agar profil fasilitator siap digunakan.</p></div>
        </div>
        <div className="completeness-progress">
          <div><span>Kelengkapan profil</span><strong>{completedFields}/6 terisi</strong></div>
          <div className="completeness-progress-track"><span style={{ width: `${(completedFields / 6) * 100}%` }} /></div>
        </div>
        <div className="missing-fields-heading"><span className="missing-fields-icon">!</span><div><strong>{missingFields.length} data perlu dilengkapi</strong><small>Periksa kembali bagian berikut</small></div></div>
                <div className="missing-fields-list">{missingFields.map((item) => <div className="missing-field-card" key={item}><span className="missing-field-check">!</span><span className="missing-field-copy"><strong>{item}</strong><small>Belum tersedia</small></span><button type="button" className="missing-field-add" onClick={() => setQuickAdd({ key: Object.entries(detailPerson.completeness?.checks || {}).find(([key]) => (completenessLabels[key] || key) === item)?.[0], label: item })}>Tambah</button></div>)}</div>
        <div className="modal-footer">
          <button type="button" className="primary-button" onClick={() => { setDetailPerson(null); onClose(); onNavigate?.('fasilitator-edit', detailPerson.id, 'dashboard') }}>Edit Data</button>
          <button type="button" className="outline-button" onClick={() => setDetailPerson(null)}>Tutup</button>
        </div>
      </div>}
    </Modal>
    <Modal open={Boolean(activityDetail)} onClose={() => setActivityDetail(null)} title="Detail Pelatihan">
      {activityDetail && <div className="training-detail-modal">
        <div className="training-detail-hero">
          <span className="training-detail-icon">▣</span>
          <div><span className="completeness-kicker">DETAIL KEGIATAN</span><h3>{activityDetail.name}</h3><p>{activityDetail.facilitator || 'Fasilitator belum tercatat'}</p></div>
        </div>
        <div className="training-detail-grid">
          <div><span>Tanggal</span><strong>{formatAgendaDate(activityDetail.startDate, activityDetail.endDate).day} {formatAgendaDate(activityDetail.startDate, activityDetail.endDate).month}</strong></div>
          <div><span>Materi / Mata Pelatihan</span><strong>{activityDetail.material || 'Belum diisi'}</strong></div>
          <div><span>Penyelenggara</span><strong>{activityDetail.organizer || 'Belum diisi'}</strong></div>
          <div><span>Jumlah Peserta</span><strong>{activityDetail.participantCount ?? 'Belum diisi'}</strong></div>
        </div>
        <div className="modal-footer"><button type="button" className="outline-button" onClick={() => setActivityDetail(null)}>Tutup</button></div>
      </div>}
    </Modal>
    <QuickAddModal person={detailPerson} field={quickAdd} onClose={() => setQuickAdd(null)} onSaved={() => { setQuickAdd(null); setDetailPerson(null); onClose(); window.dispatchEvent(new CustomEvent('upelkes:data-changed')) }} />
  </>
}

function QuickAddModal({ person, field, onClose, onSaved }) {
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ institution: '', degree: '', graduationYear: '', name: '', material: '', date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  if (!person || !field) return null

  async function save(event) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      if (['photo', 'signature', 'certificate', 'supporting'].includes(field.key)) {
        if (!file) throw new Error('Pilih file terlebih dahulu.')
        if (field.key === 'photo') await uploadFacilitatorPhoto(person.id, file)
        if (field.key === 'signature') await uploadFacilitatorSignature(person.id, file)
        if (field.key === 'certificate') await uploadFacilitatorCertificate(person.id, file)
        if (field.key === 'supporting') await uploadFacilitatorSupporting(person.id, file)
      } else if (field.key === 'education') {
        if (!form.institution.trim()) throw new Error('Nama institusi wajib diisi.')
        await createEducation(person.id, { institution: form.institution.trim(), degree: form.degree.trim(), graduationYear: form.graduationYear ? Number(form.graduationYear) : null })
      } else if (field.key === 'material') {
        if (!form.name.trim() || !form.material.trim() || !form.date) throw new Error('Nama kegiatan, materi, dan tanggal wajib diisi.')
        await createTraining(person.id, { name: form.name.trim(), material: form.material.trim(), date: form.date, startDate: form.date, endDate: form.date, category: 'teaching_experience' })
      }
      onSaved()
    } catch (saveError) { setError(saveError.message) } finally { setSaving(false) }
  }

  const uploadField = ['photo', 'signature', 'certificate', 'supporting'].includes(field.key)
  return <Modal open onClose={() => !saving && onClose()} title={`Tambah ${field.label}`}>
    <form className="quick-add-form" onSubmit={save}>
      <div className="quick-add-heading"><span className="quick-add-icon">+</span><div><strong>Lengkapi {field.label}</strong><small>{formatFacilitatorName(person)}</small></div></div>
      {error && <div className="form-error">{error}</div>}
      {uploadField ? <label className="quick-file-field"><span>Pilih file</span><input type="file" accept={field.key === 'certificate' || field.key === 'supporting' ? '.pdf,.jpg,.jpeg,.png,.webp' : '.jpg,.jpeg,.png,.webp'} onChange={(event) => setFile(event.target.files?.[0] || null)} required /><small>{file?.name || 'Belum ada file dipilih'}</small></label> : field.key === 'education' ? <div className="quick-add-fields"><label className="form-field"><span>Institusi / Sekolah</span><input value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} placeholder="Nama universitas atau lembaga" required /></label><label className="form-field"><span>Jenjang / Program Studi</span><input value={form.degree} onChange={(event) => setForm({ ...form, degree: event.target.value })} placeholder="Contoh: S2 Administrasi Publik" /></label><label className="form-field"><span>Tahun Lulus</span><input type="number" min="1900" max="2100" value={form.graduationYear} onChange={(event) => setForm({ ...form, graduationYear: event.target.value })} /></label></div> : <div className="quick-add-fields"><label className="form-field"><span>Nama Pelatihan/Kegiatan</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label className="form-field"><span>Materi / Mata Pelatihan</span><input value={form.material} onChange={(event) => setForm({ ...form, material: event.target.value })} required /></label><label className="form-field"><span>Tanggal</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label></div>}
      <div className="modal-footer"><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Tambah Data'}</button><button type="button" className="outline-button" onClick={onClose} disabled={saving}>Batal</button></div>
    </form>
  </Modal>
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p>{text}</p>
      <small>Data akan tampil setelah terhubung ke database.</small>
    </div>
  )
}

function WelcomeTrainingBanner({ activities }) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayActivities = (activities || []).filter((activity) => {
    const start = activity.startDate || activity.date || activity.tanggal;
    const end = activity.endDate || start;
    if (start) return start <= todayKey && todayKey <= end;
    const isSameDay = activity.day == today.getDate();
    const isSameMonth = activity.month === monthNames[today.getMonth()] || activity.month === monthNames[today.getMonth()].substring(0, 3);
    return isSameDay && isSameMonth;
  });

  if (todayActivities.length === 0) {
    return (
      <div className="training-banner empty-banner">
        <div className="banner-content">
          <h4>Tidak Ada Pelatihan Hari Ini</h4>
          <p>Belum ada kegiatan pelatihan yang dijadwalkan untuk hari ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="training-banner active-banner">
      <div className="banner-left">
        <div className="banner-icon-bg">
          <svg className="banner-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="banner-middle">
        <span className="banner-badge">HARI INI</span>
        <h4>{todayActivities.length > 1 ? `${todayActivities.length} Pelatihan Hari Ini! 🎯` : 'Ada Pelatihan Hari Ini! 🎯'}</h4>
        <p>{todayActivities.length > 1 ? 'Berikut kegiatan yang sedang berlangsung hari ini.' : 'Jangan lewatkan kegiatan penting hari ini.'}</p>
      </div>
      <div className="banner-right">
        <div className="today-training-list">{todayActivities.map((activity) => <div className="today-training-item" key={activity.id || activity.name}><strong>{activity.name}</strong><span>{activity.facilitator || 'Fasilitator belum tercatat'}</span><small>{activity.material || activity.organizer || 'Detail kegiatan tersedia di agenda'}</small></div>)}</div>
      </div>
    </div>
  );
}
