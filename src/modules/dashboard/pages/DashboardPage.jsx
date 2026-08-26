import { useState } from 'react'

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

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
          <p className="eyebrow">RINGKASAN ADMINISTRASI</p>
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

      <WelcomeTrainingBanner activities={data.upcomingActivities} />

      <section className="stats-grid">
        {data.stats.map(stat => (
          <article className={`stat-card ${stat.tone}`} key={stat.key}>
            <div className="stat-top">
              <span className="stat-icon">
                {statIcons[stat.key] || <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </span>
              <span className="status-dot">●</span>
            </div>
            <p>{stat.label}</p>
            <DisplayValue value={stat.value} />
          </article>
        ))}
      </section>

      <div className="content-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AGENDA</p>
              <h3>Pengingat kegiatan</h3>
            </div>
            <button className="text-button" onClick={() => onNavigate('pelatihan')}>
              Lihat semua →
            </button>
          </div>

          {data.upcomingActivities.length > 0 ? (
            data.upcomingActivities.map(item => (
              <div className="activity-row" key={item.id}>
                <div className="date-box">
                  <b>{item.day ?? (item.date ? new Date(`${item.date}T00:00:00`).getDate() : '-')}</b>
                  <span>{item.month ?? (item.date ? monthNames[new Date(`${item.date}T00:00:00`).getMonth()].slice(0, 3) : '-')}</span>
                </div>
                <div>
                  <b>{item.name}</b>
                  <p>{item.facilitator} · {item.organizer || 'Terjadwal'}</p>
                </div>
              </div>
            ))
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
              return (
                <span
                  className={`${isToday ? 'today' : ''} ${!item.current ? 'outside' : ''}`}
                  key={i}
                >
                  {item.day}
                </span>
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

      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MONITORING RINGKAS</p>
              <h3>Kelengkapan data</h3>
            </div>
            <button className="text-button" onClick={() => onNavigate('monitoring')}>
              Detail monitoring →
            </button>
          </div>

          <div className="monitor-list">
            {data.monitoring.map(item => (
              <div className="monitor-row" key={item.key}>
                <span className="monitor-bullet">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </span>
                <span>{item.label}</span>
                <DisplayValue value={item.value} />
              </div>
            ))}
          </div>
        </section>

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
            <button onClick={() => onNavigate('pencarian')}>
              <span className="quick-action-icon">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              Cari Fasilitator
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
  
  // Try to find today's training.
  const todayActivity = activities?.find(activity => {
    if (activity.tanggal || activity.date) {
      const activityDate = new Date(`${activity.tanggal || activity.date}T00:00:00`);
      return activityDate.getDate() === today.getDate() &&
             activityDate.getMonth() === today.getMonth() &&
             activityDate.getFullYear() === today.getFullYear();
    }
    // Fallback if using old dummy format
    const isSameDay = activity.day == today.getDate();
    const isSameMonth = activity.month === monthNames[today.getMonth()] || activity.month === monthNames[today.getMonth()].substring(0, 3);
    return isSameDay && isSameMonth;
  });

  if (!todayActivity) {
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
        <h4>Ada Pelatihan Hari Ini! 🎯</h4>
        <p>Jangan lewatkan kegiatan penting hari ini.</p>
      </div>
      <div className="banner-right">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">📋</span>
            <div>
              <span className="info-label">Materi</span>
              <span className="info-value">{todayActivity.materi || todayActivity.name || '-'}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🧑‍🏫</span>
            <div>
              <span className="info-label">MOT</span>
              <span className="info-value">{todayActivity.mot || todayActivity.facilitator || '-'}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🧑‍💻</span>
            <div>
              <span className="info-label">Admin</span>
              <span className="info-value">{todayActivity.admin || '-'}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🚪</span>
            <div>
              <span className="info-label">Ruangan</span>
              <span className="info-value">{todayActivity.ruangan || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
