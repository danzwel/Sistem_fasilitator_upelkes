import { useState } from 'react'
import { login } from '../api/authApi'
import { setAuthToken } from '../../../shared/api/client'

export function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login(form.email.trim(), form.password)
      setAuthToken(result.token)
      onLogin(result.user)
    } catch (requestError) {
      setError(requestError.message || 'Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-stars login-stars-one" /><div className="login-stars login-stars-two" /><div className="login-nebula login-nebula-one" /><div className="login-nebula login-nebula-two" />
      <section className="login-layout">
        <div className="login-visual">
          <div className="login-visual-copy"><div className="login-brand"><img className="login-logo" src="/logo-upelkes.png" alt="UPELKES" /></div><span className="login-visual-kicker">RUANG KERJA DIGITAL</span><h1>Kelola data.<br /><em>Gerakkan perubahan.</em></h1><p>Satu ruang terintegrasi untuk menjaga setiap fasilitator dan kegiatan UPELKES tetap terarah.</p></div>
          <div className="login-visual-footer"><span>UPTD UPELKES JAWA BARAT</span><span>✦</span><span>ADMIN PORTAL</span></div>
        </div>
        <section className="login-card">
          <div className="login-card-heading"><div><span className="login-heading-kicker">ADMIN PORTAL</span><h2>Selamat datang kembali</h2><span className="login-heading-rule" /><p>Masuk untuk melanjutkan pekerjaanmu hari ini.</p></div></div>
          <form onSubmit={submit} className="login-form">
            {error && <div className="login-error" role="alert">{error}</div>}
            <label className="form-field"><span>Email</span><input type="email" autoComplete="email" placeholder="admin@upelkes.local" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
            <label className="form-field"><span>Password</span><input type="password" autoComplete="current-password" placeholder="Masukkan password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
            <button className="primary-button login-submit" type="submit" disabled={loading}>{loading ? 'Memeriksa...' : <>Masuk ke Sistem <span>→</span></>}</button>
          </form>
          <p className="login-note"><span>♢</span> Akses ini hanya untuk admin dan pengguna yang berwenang.</p>
        </section>
      </section>
    </main>
  )
}
