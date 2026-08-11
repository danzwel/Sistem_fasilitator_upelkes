const navItems = [
  ['dashboard', '⌂', 'Dashboard'],
  ['fasilitator', '♙', 'Fasilitator'],
  ['pelatihan', '▣', 'Pelatihan'],
  ['monitoring', '◒', 'Monitoring'],
  ['pencarian', '⌕', 'Cari Fasilitator'],
]

export function AppShell({ activePage, onNavigate, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">U</span><span>UPELKES</span></div>
        <nav aria-label="Navigasi utama">
          {navItems.map(([id, icon, label]) => (
            <button key={id} className={`nav-item ${activePage === id ? 'active' : ''}`} onClick={() => onNavigate(id)}>
              <span className="nav-icon">{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><button className="nav-item"><span className="nav-icon">⚙</span><span>Pengaturan</span></button></div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><p className="eyebrow">UPTD UPELKES JAWA BARAT</p><h1>Ruang Kerja Admin</h1></div>
          <div className="topbar-actions"><div className="search"><span>⌕</span><input aria-label="Cari" placeholder="Cari menu..." /></div><button className="icon-button" aria-label="Notifikasi">♧</button><div className="avatar">AD</div></div>
        </header>
        {children}
      </main>
    </div>
  )
}
