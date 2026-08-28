import { useEffect, useState } from 'react'
import { getFacilitators } from '../../fasilitator/api/facilitatorApi'
import { createTraining, createTrainingReview } from '../../training/api/trainingApi'
import { trainingCatalog } from '../../training/data/trainingCatalog'
import { compareRecommendedFacilitators, formatFacilitatorName } from '../../../shared/utils/facilitator'
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
  const [agendaForm, setAgendaForm] = useState({ date: '', endDate: '', name: '', material: '', organizer: '', participantCount: '', facilitatorId: '', color: '#9f58cc' })

  useEffect(() => { getFacilitators().then(setFacilitators).catch(() => setFacilitators([])) }, [])
  function openAgenda(day) {
    const date = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setAgendaForm({ date, endDate: date, name: '', material: '', organizer: '', participantCount: '', facilitatorId: '', color: '#9f58cc' }); setAgendaError(''); setAgendaOpen(true)
  }
  async function saveAgenda(event) {
    event.preventDefault(); if (!agendaForm.name || !agendaForm.facilitatorId) return setAgendaError('Nama pelatihan dan fasilitator wajib dipilih.')
    setAgendaSaving(true); setAgendaError('')
    try { await createTraining(agendaForm.facilitatorId, { name: agendaForm.name, material: agendaForm.material, organizer: agendaForm.organizer, participantCount: agendaForm.participantCount === '' ? null : Number(agendaForm.participantCount), date: agendaForm.date, startDate: agendaForm.date, endDate: agendaForm.endDate, color: agendaForm.color, category: 'teaching_experience' }); setAgendaOpen(false); window.location.reload() } catch (error) { setAgendaError(error.message) } finally { setAgendaSaving(false) }
  }
  function recommendedFacilitators() {
    const words = agendaForm.name.toLowerCase().split(/\W+/).filter((word) => word.length > 3)
    return [...facilitators].sort((a, b) => compareRecommendedFacilitators(a, b)
      || words.filter((word) => (b.competencies || []).some((item) => item.name.toLowerCase().includes(word))).length
      - words.filter((word) => (a.competencies || []).some((item) => item.name.toLowerCase().includes(word))).length)
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
        {data.stats.map(stat => (
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
                <div className="activity-row agenda-row" key={item.id} role="button" tabIndex={0} onClick={() => setSelectedAgenda(item)} onKeyDown={(event) => event.key === 'Enter' && setSelectedAgenda(item)}>
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
      <StatDetailModal stat={selectedStat} data={data} facilitators={facilitators} onClose={() => setSelectedStat(null)} />

      <Modal open={agendaOpen} onClose={() => setAgendaOpen(false)} title="Tambah Agenda Pelatihan">
        <form onSubmit={saveAgenda}>
          {agendaError && <div className="form-error" style={{ marginBottom: 10 }}>{agendaError}</div>}
          <div className="form-grid">
            <SearchableInput id="agenda-name" label="Nama Pelatihan" value={agendaForm.name} options={trainingCatalog} placeholder="Ketik untuk mencari..." required onChange={(value) => setAgendaForm((form) => ({ ...form, name: value }))} />
            <SearchableInput id="agenda-facilitator" label="Fasilitator (rekomendasi berdasarkan kompetensi & kelengkapan)" value={facilitators.find((f) => String(f.id) === String(agendaForm.facilitatorId))?.name || ''} options={recommendedFacilitators().map((f) => f.name)} placeholder="Ketik untuk mencari..." required onChange={(value) => setAgendaForm((form) => ({ ...form, facilitatorId: facilitators.find((f) => f.name === value)?.id || '' }))} />
            <label className="form-field"><span>Materi / Mata Pelatihan</span><input value={agendaForm.material} onChange={(e) => setAgendaForm((form) => ({ ...form, material: e.target.value }))} placeholder="Komunikasi Efektif" /></label>
            <label className="form-field"><span>Penyelenggara</span><input value={agendaForm.organizer} onChange={(e) => setAgendaForm((form) => ({ ...form, organizer: e.target.value }))} /></label>
            <label className="form-field"><span>Tanggal Mulai</span><input type="date" value={agendaForm.date} onChange={(e) => setAgendaForm((form) => ({ ...form, date: e.target.value }))} required /></label>
            <label className="form-field"><span>Tanggal Selesai</span><input type="date" value={agendaForm.endDate} onChange={(e) => setAgendaForm((form) => ({ ...form, endDate: e.target.value }))} required /></label>
            <label className="form-field"><span>Jumlah Peserta</span><input type="number" min="0" value={agendaForm.participantCount} onChange={(e) => setAgendaForm((form) => ({ ...form, participantCount: e.target.value }))} /></label>
            <label className="form-field"><span>Warna Agenda</span><input type="color" value={agendaForm.color} onChange={(e) => setAgendaForm((form) => ({ ...form, color: e.target.value }))} /></label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}><button className="primary-button" type="submit" disabled={agendaSaving}>{agendaSaving ? 'Menyimpan...' : 'Simpan Agenda'}</button><button className="outline-button" type="button" onClick={() => setAgendaOpen(false)}>Batal</button></div>
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
    <Modal open={Boolean(ratingActivity)} onClose={() => !saving && setRatingActivity(null)} title="Beri Rating Fasilitator">{ratingActivity && <form onSubmit={saveRating}>{error && <div className="form-error">{error}</div>}<p className="muted">Beri rating untuk <strong>{formatFacilitatorName({ name: ratingActivity.facilitator, degree: ratingActivity.facilitatorDegree })}</strong>.</p><label className="form-field"><span>Rating</span><select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} bintang</option>)}</select></label><div className="modal-footer"><button className="primary-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Rating'}</button><button type="button" className="outline-button" onClick={() => setRatingActivity(null)} disabled={saving}>Batal</button></div></form>}</Modal>
  </Modal>
}

function StatDetailModal({ stat, data, facilitators, onClose }) {
  if (!stat) return null
  const today = new Date()
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`
  const people = data.facilitatorSummary || facilitators || []
  const activities = data.allActivities || []
  let title = stat.label
  let description = 'Ringkasan data terbaru dari sistem.'
  let items = []
  if (stat.key === 'facilitators') {
    description = 'Seluruh fasilitator yang terdaftar.'
    items = people
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
  return <Modal open onClose={onClose} title={title}>
    <div className="stat-detail-modal">
      <div className="stat-detail-summary"><span>{description}</span><strong>{stat.value} data</strong></div>
      {items.length === 0 ? <EmptyState text="Belum ada data untuk ditampilkan." /> : <div className="stat-detail-list">
        {items.map((item, index) => {
          const isActivity = stat.key === 'activities' || stat.key === 'thisMonth'
          const person = !isActivity && item
          return <article className="stat-detail-item" key={`${item.id || item.name}-${index}`}>
            <div className="stat-detail-index">{String(index + 1).padStart(2, '0')}</div>
            <div><h4>{isActivity ? item.name : formatFacilitatorName(person)}</h4><p>{isActivity ? `${formatAgendaDate(item.startDate, item.endDate).day} ${formatAgendaDate(item.startDate, item.endDate).month} · ${item.facilitator || 'Fasilitator belum tercatat'}` : (person.position || 'Fasilitator')}</p></div>
            {!isActivity && <span className={`status-badge ${person.completeness?.isComplete ? 'lengkap' : 'belum_lengkap'}`}>{person.completeness?.isComplete ? 'Lengkap' : 'Belum lengkap'}</span>}
          </article>
        })}
      </div>}
    </div>
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
