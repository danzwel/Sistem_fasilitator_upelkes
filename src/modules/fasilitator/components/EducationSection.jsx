import { useEffect, useState } from 'react'
import {
  getEducations,
  createEducation,
  updateEducation,
  deleteEducation,
} from '../api/educationApi'

const EMPTY_FORM = { institution: '', degree: '' }

export function EducationSection({ facilitatorId, draftItems = [], onDraftItemsChange }) {
  const isDraft = !facilitatorId && typeof onDraftItemsChange === 'function'
  const [educations, setEducations] = useState([])
  const [loading, setLoading] = useState(!isDraft)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (isDraft) return
    loadData()
  }, [facilitatorId, isDraft])

  function loadData() {
    if (isDraft) return Promise.resolve()
    setLoading(true)
    setError(null)
    return getEducations(facilitatorId)
      .then(setEducations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  function openAddForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(edu) {
    setEditingId(edu.id)
    setForm({
      institution: edu.institution ?? '',
      degree: edu.degree ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.institution.trim() || !form.degree.trim()) {
      setFormError('Nama institusi dan jenjang/program studi wajib diisi.')
      return
    }

    const payload = {
      institution: form.institution.trim(),
      degree: form.degree.trim(),
    }

    setSaving(true)
    setFormError(null)
    try {
      if (isDraft) {
        const nextItem = { id: editingId || `draft-education-${Date.now()}`, ...payload }
        onDraftItemsChange(editingId
          ? draftItems.map((item) => item.id === editingId ? nextItem : item)
          : [...draftItems, nextItem])
      } else if (editingId) {
        await updateEducation(facilitatorId, editingId, payload)
      } else {
        await createEducation(facilitatorId, payload)
      }
      closeForm()
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(edu) {
    if (isDraft) {
      onDraftItemsChange(draftItems.filter((item) => item.id !== edu.id))
      return
    }
    const confirmed = window.confirm(`Hapus riwayat pendidikan "${edu.institution}"?`)
    if (!confirmed) return
    setDeletingId(edu.id)
    try {
      await deleteEducation(facilitatorId, edu.id)
      await loadData()
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="panel" style={{ marginTop: 18, marginBottom: 18 }}>
      <div className="panel-heading">
        <h3>Riwayat Pendidikan</h3>
        {!formOpen && (
          <button className="text-button" onClick={openAddForm}>+ Tambah</button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="inline-form-panel"
        >
          {formError && (
            <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{formError}</div>
          )}
          <div className="form-grid">
            <label className="form-field">
              <span>Institusi / Universitas <span className="required-mark">*</span></span>
              <input
                type="text"
                value={form.institution}
                onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
                placeholder="Universitas Pendidikan Indonesia"
              />
            </label>
            <label className="form-field">
              <span>Jenjang / Program Studi <span className="required-mark">*</span></span>
              <input
                type="text"
                value={form.degree}
                onChange={(e) => setForm((prev) => ({ ...prev, degree: e.target.value }))}
                placeholder="S2 Administrasi Pendidikan"
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="primary-button" type="submit" disabled={saving} style={{ marginTop: 0 }}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" className="outline-button" onClick={closeForm} disabled={saving}>
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="empty-state"><span>◌</span><p>Memuat riwayat pendidikan...</p></div>
      ) : error ? (
        <div className="empty-state"><span>◌</span><p>Gagal memuat data.</p><small>{error}</small></div>
      ) : (isDraft ? draftItems : educations).length === 0 ? (
        <div className="empty-state">
          <span>◌</span>
          <p>Belum ada riwayat pendidikan.</p>
          <small>Klik "+ Tambah" untuk menambahkan.</small>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 2 }}>
          {(isDraft ? draftItems : educations).map((edu) => (
            <div key={edu.id} className="activity-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="table-primary">{edu.institution}</div>
                <div className="table-secondary">
                  {edu.degree}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="text-button" onClick={() => openEditForm(edu)}>Edit</button>
                <button
                  className="text-button"
                  style={{ color: '#e6a8bd' }}
                  disabled={deletingId === edu.id}
                  onClick={() => handleDelete(edu)}
                >
                  {deletingId === edu.id ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
