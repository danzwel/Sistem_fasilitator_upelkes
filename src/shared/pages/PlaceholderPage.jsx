export function PlaceholderPage({ title, owner, onNavigate }) {
  return <section className="placeholder page-enter"><div className="placeholder-icon">◌</div><p className="eyebrow">MODUL {owner?.toUpperCase()}</p><h2>{title}</h2><p>Area ini disiapkan untuk implementasi {title.toLowerCase()} oleh {owner}. Fondasi navigasi dan layout sudah tersedia.</p><button className="primary-button" onClick={() => onNavigate('dashboard')}>Kembali ke Dashboard</button></section>
}
