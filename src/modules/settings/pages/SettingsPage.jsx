import { useEffect, useState } from 'react'
import { changeAdminPassword, getAdminProfile, getSettings, updateAdminProfile, updateSettings } from '../api/settingsApi'
import { clearAuth, setAuthToken } from '../../../shared/api/client'

export function SettingsPage({ onNavigate }) {
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [settings, setSettings] = useState({ institutionName: 'UPTD UPELKES Jawa Barat', logoUrl: '', cvTemplate: 'default', maxUploadMb: 10, documentCategories: 'Sertifikat, Dokumen Pendukung' })
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmation: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAdminProfile(), getSettings()]).then(([admin, appSettings]) => {
      setProfile({ name: admin.name || '', email: admin.email || '' })
      setSettings((current) => ({ ...current, ...(appSettings || {}) }))
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  async function saveProfile(event) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('')
    try { const updated = await updateAdminProfile(profile); if (updated.token) setAuthToken(updated.token); setMessage('Profil admin berhasil disimpan.') } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function savePassword(event) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('')
    if (password.newPassword.length < 8) { setError('Password baru minimal 8 karakter.'); setSaving(false); return }
    if (password.newPassword !== password.confirmation) { setError('Konfirmasi password tidak sama.'); setSaving(false); return }
    try { await changeAdminPassword({ currentPassword: password.currentPassword, newPassword: password.newPassword }); setPassword({ currentPassword: '', newPassword: '', confirmation: '' }); setMessage('Password berhasil diubah. Silakan login kembali jika diminta.') } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function saveAppSettings(event) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('')
    try { await updateSettings({ ...settings, maxUploadMb: Number(settings.maxUploadMb) }); setMessage('Pengaturan aplikasi berhasil disimpan.') } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  function logout() { clearAuth(); onNavigate?.('dashboard') }

  if (loading) return <section className="page-enter"><div className="empty-state"><span>◌</span><p>Memuat pengaturan...</p></div></section>
  return <section className="page-enter settings-page">
    <div className="welcome-row"><div><p className="eyebrow">KONFIGURASI SISTEM</p><h2>Pengaturan</h2><p className="muted">Kelola profil admin dan pengaturan aplikasi UPELKES.</p></div><button className="outline-button" onClick={() => onNavigate?.('dashboard')}>Kembali</button></div>
    {message && <div className="toast toast-success" role="status">{message}</div>}
    {error && <div className="toast toast-error" role="alert">{error}</div>}
    <div className="settings-grid">
      <form className="panel" onSubmit={saveProfile}><div className="panel-heading"><h3>Profil Admin</h3></div><label className="form-field"><span>Nama</span><input value={profile.name} required onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label><label className="form-field"><span>Email</span><input type="email" value={profile.email} required onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label><button className="primary-button" disabled={saving}>Simpan Profil</button></form>
      <form className="panel" onSubmit={savePassword}><div className="panel-heading"><h3>Ganti Password</h3></div><label className="form-field"><span>Password Saat Ini</span><input type="password" value={password.currentPassword} required onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label><label className="form-field"><span>Password Baru</span><input type="password" minLength="8" value={password.newPassword} required onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></label><label className="form-field"><span>Konfirmasi Password Baru</span><input type="password" minLength="8" value={password.confirmation} required onChange={(e) => setPassword({ ...password, confirmation: e.target.value })} /></label><button className="primary-button" disabled={saving}>Ganti Password</button></form>
      <form className="panel" onSubmit={saveAppSettings}><div className="panel-heading"><h3>Pengaturan Aplikasi</h3></div><label className="form-field"><span>Nama Instansi</span><input value={settings.institutionName} onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })} /></label><label className="form-field"><span>Logo UPELKES (URL)</span><input value={settings.logoUrl} placeholder="https://..." onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })} /></label><label className="form-field"><span>Format CV</span><select value={settings.cvTemplate} onChange={(e) => setSettings({ ...settings, cvTemplate: e.target.value })}><option value="default">Format Standar</option><option value="modern">Format Modern</option></select></label><label className="form-field"><span>Batas Upload (MB)</span><input type="number" min="1" max="100" value={settings.maxUploadMb} onChange={(e) => setSettings({ ...settings, maxUploadMb: e.target.value })} /></label><label className="form-field"><span>Kategori Dokumen</span><input value={settings.documentCategories} onChange={(e) => setSettings({ ...settings, documentCategories: e.target.value })} /></label><button className="primary-button" disabled={saving}>Simpan Pengaturan</button></form>
      <div className="panel"><div className="panel-heading"><h3>Sesi</h3></div><p className="muted">Keluar dari akun admin pada perangkat ini.</p><button type="button" className="outline-button" onClick={logout}>Logout</button></div>
    </div>
  </section>
}
