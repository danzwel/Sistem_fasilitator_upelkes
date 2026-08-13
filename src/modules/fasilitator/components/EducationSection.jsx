import { useEffect, useState } from 'react'
import {
  getEducations,
  createEducation,
  updateEducation,
  deleteEducation,
} from '../api/educationApi'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatMonthYear(value) {
  if (!value) return null
  const [year, month] = value.split('-')
  const monthName = MONTH_NAMES[Number(month) - 1]
  return monthName ? `${monthName} ${year}` : value
}

function formatDateRange(startDate, endDate) {
  const start = formatMonthYear(startDate)
  const end = formatMonthYear(endDate)
  if (start && end) return `${start} – ${end}`
  return start || end || null
}

const EMPTY_FORM = { institution: '', degree: '', startDate: '', endDate: '' }

export function EducationSection({ facilitatorId }) {
  const [educations, setEducations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadData()
  }, [facilitatorId])

  function loadData() {
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
      startDate: edu.startDate ?? '',
      endDate: edu.endDate ?? '',
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
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editingId) {
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
          style={{ background: '#211a30', border: '1px solid #3e3451', borderRadius: 12, padding: 16, marginBottom: 16 }}
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
            <label className="form-field">
              <span>Bulan/Tahun Masuk</span>
              <input
                type="month"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </label>
            <label className="form-field">
              <span>Bulan/Tahun Lulus</span>
              <input
                type="month"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
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
      ) : educations.length === 0 ? (
        <div className="empty-state">
          <span>◌</span>
          <p>Belum ada riwayat pendidikan.</p>
          <small>Klik "+ Tambah" untuk menambahkan.</small>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 2 }}>
          {educations.map((edu) => (
            <div key={edu.id} className="activity-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="table-primary">{edu.institution}</div>
                <div className="table-secondary">
                  {[edu.degree, formatDateRange(edu.startDate, edu.endDate)].filter(Boolean).join(' · ')}
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