import { useEffect, useState } from 'react'
import { getTrainings, createTraining, updateTraining, deleteTraining } from '../../training/api/trainingApi'
import { uploadTrainingCertificate } from '../api/facilitatorUploadApi'

// title: judul panel
// category: 'related_training' | 'teaching_experience'
// showRole: true untuk "Pengalaman Melatih/Mengajar" (ada kolom Peran)

const emptyForm = { name: '', material: '', date: '', startDate: '', endDate: '', organizer: '', role: '', participantCount: '', certificateUrl: '' }

function formatTrainingDate(start, end) {
  const first = start || ''
  const last = end || first
  if (!first) return ''
  return first === last ? first : `${first} – ${last}`
}

export function TrainingSection({ facilitatorId, title, category, showRole, includeCertificates = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [certificateFile, setCertificateFile] = useState(null)

  useEffect(() => {
    loadData()
  }, [facilitatorId, category])

  function loadData() {
    setLoading(true)
    setError(null)
    return getTrainings(facilitatorId, category)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  function openAddForm() {
    setEditingId(null)
    setForm(emptyForm)
    setCertificateFile(null)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(item) {
    setEditingId(item.id)
    setForm({
      name: item.name ?? '',
      material: item.material ?? '',
      date: item.date ?? '',
      startDate: item.startDate ?? item.date ?? '',
      endDate: item.endDate ?? item.date ?? '',
      organizer: item.organizer ?? '',
      role: item.role ?? '',
      participantCount: item.participantCount ?? '',
      certificateUrl: item.certificateUrl ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Nama wajib diisi.')
      return
    }
    if (category === 'related_training' && !form.material.trim()) return setFormError('Materi wajib diisi.')
    if (category === 'related_training' && !form.organizer.trim()) return setFormError('Penyelenggara wajib diisi.')
    if (category === 'related_training' && !form.date) return setFormError('Tanggal wajib diisi.')
    if (showRole && !form.startDate) return setFormError('Tanggal mulai wajib diisi.')
    if (showRole && !form.endDate) return setFormError('Tanggal selesai wajib diisi.')
    if (showRole && form.endDate < form.startDate) return setFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.')
    if (category === 'related_training' && !form.certificateUrl && !certificateFile) return setFormError('Sertifikat pelatihan wajib diunggah.')
    const payload = {
      name: form.name.trim(),
      material: form.material.trim(),
      date: (showRole ? form.startDate : form.date).trim(),
      ...(showRole ? {
        startDate: form.startDate,
        endDate: form.endDate,
        participantCount: form.participantCount === '' ? null : Number(form.participantCount),
      } : {}),
      organizer: form.organizer.trim(),
      category,
      ...(showRole ? { role: form.role.trim() } : {}),
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editingId) {
        const saved = await updateTraining(facilitatorId, editingId, payload)
        if (certificateFile) await uploadTrainingCertificate(facilitatorId, saved.id, certificateFile)
      } else {
        const saved = await createTraining(facilitatorId, payload)
        if (certificateFile) await uploadTrainingCertificate(facilitatorId, saved.id, certificateFile)
      }
      closeForm()
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Hapus "${item.name}"?`)
    if (!confirmed) return
    setDeletingId(item.id)
    try {
      await deleteTraining(facilitatorId, item.id)
      await loadData()
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div className="panel-heading">
        <h3>{title}</h3>
        {!formOpen && <button type="button" className="text-button" onClick={openAddForm}>+ Tambah</button>}
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          style={{ background: '#211a30', border: '1px solid #3e3451', borderRadius: 12, padding: 16, marginBottom: 16 }}
        >
          {formError && <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{formError}</div>}
          <div className="form-grid">
            <label className="form-field"><span>Nama {showRole ? 'Pelatihan/Kegiatan' : 'Pendidikan/Pelatihan'} <span className="required-mark">*</span></span><input value={form.name} placeholder="Ketik nama pelatihan..." required onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
            <label className="form-field">
              <span>Materi / Mata Pelatihan</span>
              <input type="text" value={form.material} required={category === 'related_training'} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} placeholder="Komunikasi Efektif" />
            </label>
            {showRole && <label className="form-field"><span>Peran</span><input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="Narasumber / Fasilitator" /></label>}
            <label className="form-field">
              <span>Penyelenggara</span>
              <input type="text" value={form.organizer} required={category === 'related_training'} onChange={(e) => setForm((p) => ({ ...p, organizer: e.target.value }))} />
            </label>
            {showRole ? <>
              <label className="form-field"><span>Tanggal Mulai <span className="required-mark">*</span></span><input type="date" value={form.startDate} required onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
              <label className="form-field"><span>Tanggal Selesai <span className="required-mark">*</span></span><input type="date" value={form.endDate} required onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} /></label>
              <label className="form-field"><span>Jumlah Peserta</span><input type="number" min="0" value={form.participantCount} onChange={(e) => setForm((p) => ({ ...p, participantCount: e.target.value }))} /></label>
            </> : <label className="form-field"><span>Tanggal</span><input type="date" value={form.date} required={category === 'related_training'} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></label>}
            {includeCertificates && <label className="form-field"><span>Sertifikat Pelatihan <span className="required-mark">*</span></span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required={!form.certificateUrl} onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} />{form.certificateUrl && <a href={form.certificateUrl} target="_blank" rel="noreferrer">Sertifikat tersimpan — buka file</a>}<small className="muted">Wajib untuk pelatihan terkait materi.</small></label>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="primary-button" type="submit" disabled={saving} style={{ marginTop: 0 }}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" className="outline-button" onClick={closeForm} disabled={saving}>Batal</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="empty-state"><span>◌</span><p>Memuat...</p></div>
      ) : error ? (
        <div className="empty-state"><span>◌</span><p>Gagal memuat data.</p><small>{error}</small></div>
      ) : items.length === 0 ? (
        <p className="muted" style={{ fontSize: 12 }}>Belum ada data.</p>
      ) : (
        <div style={{ display: 'grid', gap: 2 }}>
          {items.map((item) => (
            <div key={item.id} className="activity-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="table-primary">{item.name}</div>
                {item.material && <div className="table-secondary" style={{ fontStyle: 'italic' }}>{item.material}</div>}
                <div className="table-secondary">
                {[showRole ? item.role : null, item.organizer, formatTrainingDate(showRole ? item.startDate : item.date, showRole ? item.endDate : item.date)].filter(Boolean).join(' · ')}
                {showRole && item.participantCount != null && <div>{item.participantCount} peserta</div>}
                {item.certificateUrl && <div><a href={item.certificateUrl} target="_blank" rel="noreferrer">Buka sertifikat</a></div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="text-button" onClick={() => openEditForm(item)}>Edit</button>
                <button
                  type="button"
                  className="text-button"
                  style={{ color: '#e6a8bd' }}
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item)}
                >
                  {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
