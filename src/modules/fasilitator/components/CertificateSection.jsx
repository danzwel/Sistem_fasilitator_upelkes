import { useEffect, useRef, useState } from 'react'
import {
  deleteFacilitatorCertificate,
  getFacilitatorCertificates,
  uploadFacilitatorCertificate,
} from '../api/facilitatorUploadApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'

export function CertificateSection({ facilitatorId }) {
  const fileRef = useRef(null)
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  function loadData() {
    setLoading(true)
    return getFacilitatorCertificates(facilitatorId)
      .then(setCertificates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [facilitatorId])

  function closeForm() {
    setFormOpen(false)
    setFile(null)
    setName('')
    setNotes('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!file) return setError('Pilih file sertifikat terlebih dahulu.')
    setSaving(true)
    setError(null)
    try {
      await uploadFacilitatorCertificate(facilitatorId, file, { name, notes })
      closeForm()
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(certificate) {
    if (!window.confirm(`Hapus sertifikat "${certificate.name}"?`)) return
    setDeletingId(certificate.id)
    try {
      await deleteFacilitatorCertificate(facilitatorId, certificate.id)
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="panel" style={{ marginTop: 18, marginBottom: 18 }}>
      <div className="panel-heading">
        <h3>Sertifikat</h3>
        {!formOpen && <button className="text-button" onClick={() => { setError(null); setFormOpen(true) }}>+ Tambah</button>}
      </div>

      {error && <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{error}</div>}

      {formOpen && (
        <form onSubmit={handleSubmit} style={{ background: '#211a30', border: '1px solid #3e3451', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div className="form-grid">
            <label className="form-field">
              <span>Nama Sertifikat</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Sertifikat TOT Fasilitator" />
            </label>
            <label className="form-field">
              <span>Keterangan</span>
              <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Penyelenggara atau tahun" />
            </label>
          </div>
          <label className="form-field" style={{ marginTop: 12 }}>
            <span>File Sertifikat <span className="required-mark">*</span></span>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="primary-button" type="submit" disabled={saving} style={{ marginTop: 0 }}>{saving ? 'Mengunggah...' : 'Unggah Sertifikat'}</button>
            <button type="button" className="outline-button" onClick={closeForm} disabled={saving}>Batal</button>
          </div>
        </form>
      )}

      {loading ? <div className="empty-state"><span>◌</span><p>Memuat sertifikat...</p></div> : certificates.length === 0 ? (
        <div className="empty-state"><span>◌</span><p>Belum ada sertifikat.</p><small>Klik "+ Tambah" untuk mengunggah.</small></div>
      ) : (
        <div style={{ display: 'grid', gap: 2 }}>
          {certificates.map((certificate) => (
            <div key={certificate.id} className="activity-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <a className="table-primary" href={resolveAssetUrl(certificate.url)} target="_blank" rel="noreferrer">{certificate.name}</a>
                {certificate.notes && <div className="table-secondary">{certificate.notes}</div>}
              </div>
              <button className="text-button" style={{ color: '#e6a8bd' }} disabled={deletingId === certificate.id} onClick={() => handleDelete(certificate)}>
                {deletingId === certificate.id ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
