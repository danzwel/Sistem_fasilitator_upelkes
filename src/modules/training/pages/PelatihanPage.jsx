import { useEffect, useMemo, useState } from 'react'
import { getFacilitators } from '../../fasilitator/api/facilitatorApi'
import { getTrainings, createTraining, updateTraining, deleteTraining } from '../api/trainingApi'
import { Modal } from '../../../shared/components/Modal'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { SearchableInput } from '../../../shared/components/SearchableInput'
import { trainingCatalog, roleCatalog } from '../data/trainingCatalog'

const CATEGORY_LABEL = {
  related_training: 'Terkait Materi',
  teaching_experience: 'Pengalaman Mengajar',
}

const EMPTY_FORM = { facilitatorId: '', name: '', material: '', category: 'teaching_experience', role: '', organizer: '', date: '' }

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatBulanTahun(dateValue) {
  if (!dateValue) return '-'
  const match = String(dateValue).match(/^(\d{4})-(\d{2})/)
  if (!match) return dateValue
  const monthName = MONTH_NAMES[Number(match[2]) - 1]
  return monthName ? `${monthName} ${match[1]}` : dateValue
}

function rowKey(r) {
  return `${r.facilitatorId}:${r.id}`
}

function toWhatsAppLink(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}`
}

export function PelatihanPage({ onNavigate }) {
  const [facilitators, setFacilitators] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [detailKey, setDetailKey] = useState(null)
  const [editKey, setEditKey] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editError, setEditError] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deletingKey, setDeletingKey] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const facilitatorList = await getFacilitators()
      setFacilitators(facilitatorList)
      const perFacilitator = await Promise.all(
        facilitatorList.map(async (f) => {
          try {
            const trainings = await getTrainings(f.id)
            return trainings.map((t) => ({
              ...t,
              facilitatorId: f.id,
              facilitatorName: f.name,
              facilitatorPosition: f.position,
              facilitatorUnit: f.unit,
              facilitatorPhotoUrl: f.photoUrl,
              facilitatorPhone: f.phone,
              facilitatorEmail: f.email,
              facilitatorRating: f.rating?.average ?? f.averageRating ?? null,
              facilitatorReviewCount: f.rating?.count ?? f.reviewCount ?? 0,
            }))
          } catch {
            return []
          }
        })
      )
      setRows(perFacilitator.flat())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = rows
    if (categoryFilter !== 'all') list = list.filter((r) => r.category === categoryFilter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((r) =>
        [r.name, r.facilitatorName, r.organizer, r.role].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
  }, [rows, query, categoryFilter])

  function openAddForm() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.facilitatorId) return setFormError('Pilih fasilitator dulu.')
    if (!form.name.trim()) return setFormError('Nama kegiatan wajib diisi.')
    if (!trainingCatalog.includes(form.name.trim())) return setFormError('Pilih nama pelatihan dari daftar yang tersedia.')
    if (form.category === 'teaching_experience' && form.role && !roleCatalog.includes(form.role.trim())) return setFormError('Pilih peran dari daftar yang tersedia.')

    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name: form.name.trim(),
        material: form.material.trim(),
        date: form.date || '',
        organizer: form.organizer.trim(),
        category: form.category,
        ...(form.category === 'teaching_experience' ? { role: form.role.trim() } : {}),
      }
      await createTraining(form.facilitatorId, payload)
      closeForm()
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function openDetail(r) {
    setDetailKey(rowKey(r))
  }

  function openEdit(r) {
    setEditKey(rowKey(r))
    setEditForm({
      facilitatorId: r.facilitatorId,
      name: r.name ?? '',
      material: r.material ?? '',
      category: r.category ?? 'teaching_experience',
      role: r.role ?? '',
      organizer: r.organizer ?? '',
      date: r.date ?? '',
    })
    setEditError(null)
  }

  function closeEdit() {
    setEditKey(null)
    setEditForm(EMPTY_FORM)
    setEditError(null)
  }

  async function handleEditSubmit(e, r) {
    e.preventDefault()
    if (!editForm.name.trim()) return setEditError('Nama kegiatan wajib diisi.')
    if (!trainingCatalog.includes(editForm.name.trim()) && editForm.name.trim() !== editRow?.name) return setEditError('Pilih nama pelatihan dari daftar yang tersedia.')
    if (editForm.category === 'teaching_experience' && editForm.role && !roleCatalog.includes(editForm.role.trim())) return setEditError('Pilih peran dari daftar yang tersedia.')

    setEditSaving(true)
    setEditError(null)
    try {
      const payload = {
        name: editForm.name.trim(),
        material: editForm.material.trim(),
        date: editForm.date || '',
        organizer: editForm.organizer.trim(),
        category: editForm.category,
        ...(editForm.category === 'teaching_experience' ? { role: editForm.role.trim() } : {}),
      }
      await updateTraining(r.facilitatorId, r.id, payload)
      closeEdit()
      await loadData()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(r) {
    const confirmed = window.confirm(`Hapus "${r.name}" milik ${r.facilitatorName}?`)
    if (!confirmed) return
    setDeletingKey(rowKey(r))
    try {
      await deleteTraining(r.facilitatorId, r.id)
      await loadData()
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`)
    } finally {
      setDeletingKey(null)
    }
  }

  const detailRow = detailKey ? rows.find((r) => rowKey(r) === detailKey) : null
  const editRow = editKey ? rows.find((r) => rowKey(r) === editKey) : null

  return (
    <section className="page-enter">
      <div className="pelatihan-banner">
        <div className="pelatihan-banner-decor">✦</div>
        <div className="pelatihan-banner-content">
          <p className="eyebrow">MODUL SOFI</p>
          <h2>Pelatihan / Riwayat Kegiatan</h2>
          <p className="muted">Rekap gabungan dari semua fasilitator.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="outline-button" onClick={() => onNavigate?.('pelatihan-import')}>
            Import Excel
          </button>
          {!formOpen && <button className="primary-button" onClick={openAddForm}>+ Tambah Pelatihan</button>}
        </div>
      </div>

      {formOpen && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-heading"><h3>Tambah Pelatihan</h3></div>
          <form onSubmit={handleSubmit}>
            {formError && <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{formError}</div>}
            <div className="form-grid">
              <SearchableInput id="training-facilitator" label={<>Fasilitator <span className="required-mark">*</span></>} value={facilitators.find((f) => String(f.id) === String(form.facilitatorId))?.name || ''} options={facilitators.map((f) => f.name)} placeholder="Ketik untuk mencari fasilitator..." required onChange={(value) => setForm((p) => ({ ...p, facilitatorId: facilitators.find((f) => f.name === value)?.id || '' }))} />
              <SearchableInput id="training-category" label={<>Kategori <span className="required-mark">*</span></>} value={form.category === 'teaching_experience' ? 'Pengalaman Melatih/Mengajar' : 'Pendidikan/Pelatihan Terkait Materi'} options={['Pengalaman Melatih/Mengajar', 'Pendidikan/Pelatihan Terkait Materi']} required onChange={(value) => setForm((p) => ({ ...p, category: value.startsWith('Pendidikan') ? 'related_training' : 'teaching_experience' }))} />
              <SearchableInput id="training-name" label={<>Nama Pelatihan/Kegiatan <span className="required-mark">*</span></>} value={form.name} options={trainingCatalog} placeholder="Ketik untuk mencari nama pelatihan..." required onChange={(value) => setForm((p) => ({ ...p, name: value }))} />
              <label className="form-field">
                <span>Materi / Mata Pelatihan</span>
                <input type="text" value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} placeholder="Komunikasi Efektif" />
              </label>
              {form.category === 'teaching_experience' && <SearchableInput id="training-role" label="Peran" value={form.role} options={roleCatalog} placeholder="Ketik untuk mencari peran..." onChange={(value) => setForm((p) => ({ ...p, role: value }))} />}
              <label className="form-field">
                <span>Penyelenggara</span>
                <input type="text" value={form.organizer} onChange={(e) => setForm((p) => ({ ...p, organizer: e.target.value }))} />
              </label>
              <label className="form-field">
                <span>Tanggal</span>
                <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="primary-button" type="submit" disabled={saving} style={{ marginTop: 0 }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" className="outline-button" onClick={closeForm} disabled={saving}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-heading">
          <h3>Daftar Kegiatan</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ background: '#282139', border: '1px solid #382e4d', borderRadius: 12, padding: '9px 12px', color: '#f0ecff', fontSize: 13 }}>
              <option value="all">Semua Kategori</option>
              <option value="related_training">Terkait Materi</option>
              <option value="teaching_experience">Pengalaman Mengajar</option>
            </select>
            <div className="search">
              <span>⌕</span>
              <input aria-label="Cari pelatihan" placeholder="Cari nama, fasilitator, penyelenggara..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><span>◌</span><p>Memuat data pelatihan dari semua fasilitator...</p></div>
        ) : error ? (
          <div className="empty-state"><span>◌</span><p>Gagal memuat data.</p><small>{error}</small>
            <div style={{ marginTop: 12 }}><button className="outline-button" onClick={loadData}>Coba lagi</button></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><span>◌</span><p>Belum ada data pelatihan yang cocok.</p></div>
        ) : (
          <div className="training-card-grid">
            {[...new Map(filtered.map((row) => [row.name, filtered.filter((item) => item.name === row.name)])).values()].map((group) => {
              const first = group[0]
              return <article className="training-card" key={first.name}>
                <button className="training-card-main" onClick={() => openDetail(first)}>
                  <span className="eyebrow">{CATEGORY_LABEL[first.category] ?? first.category}</span>
                  <h3>{first.name}</h3>
                  <p>{first.material || 'Materi belum diisi'}</p>
                  <strong>{group.length} fasilitator terdaftar</strong>
                </button>
                <div className="training-card-facilitators">{group.map((item) => <span key={rowKey(item)}>{item.facilitatorName}</span>)}</div>
                <div className="training-card-actions"><button className="text-button" onClick={() => openDetail(first)}>Lihat fasilitator →</button><button className="text-button" onClick={() => openEdit(first)}>Edit</button></div>
              </article>
            })}
          </div>
        )}
      </div>

      <Modal open={Boolean(detailRow)} onClose={() => setDetailKey(null)} title="Detail Kegiatan">
        {detailRow && (
          <>
            <div className="th-header">
              {detailRow.facilitatorPhotoUrl ? (
                <img src={resolveAssetUrl(detailRow.facilitatorPhotoUrl)} alt={detailRow.facilitatorName} className="th-photo" />
              ) : (
                <div className="th-photo th-photo-placeholder">
                  {(detailRow.facilitatorName || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="th-name">{detailRow.facilitatorName}</div>
              <div className="th-position">
                {detailRow.facilitatorPosition || '-'}{detailRow.facilitatorUnit ? ` · ${detailRow.facilitatorUnit}` : ''}
              </div>
              <div className="th-rating">
                ★ {detailRow.facilitatorRating ?? '—'}
                <span> ({detailRow.facilitatorReviewCount ?? 0} ulasan)</span>
              </div>
              <div className="th-contact-actions">
                {detailRow.facilitatorPhone && (
                  <a href={toWhatsAppLink(detailRow.facilitatorPhone)} target="_blank" rel="noreferrer" className="detail-contact-button wa">
                    ⌾ WhatsApp
                  </a>
                )}
                {detailRow.facilitatorEmail && (
                  <a href={`mailto:${detailRow.facilitatorEmail}`} className="detail-contact-button email">
                    ✉ Email
                  </a>
                )}
                <button type="button" className="th-cv-button" onClick={() => onNavigate?.('fasilitator-cv', detailRow.facilitatorId, 'pelatihan')}>
                  📄 Lihat CV
                </button>
              </div>
            </div>

            <div className="th-timeline-title">Detail Kegiatan</div>
            <div className="th-timeline">
              <div className="th-timeline-item">
                <div className="th-timeline-date">{detailRow.date || '-'}</div>
                <div className="th-timeline-content">
                  <div className="th-timeline-name">{detailRow.name}</div>
                  {detailRow.material && <div className="th-timeline-material">{detailRow.material}</div>}
                  <div className="th-timeline-meta">
                    {[
                      CATEGORY_LABEL[detailRow.category] ?? detailRow.category,
                      detailRow.role,
                      detailRow.organizer,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="modal-footer">
          <button type="button" className="outline-button" onClick={() => setDetailKey(null)}>← Kembali</button>
        </div>
      </Modal>

      <Modal open={Boolean(editRow)} onClose={closeEdit} title="Edit Kegiatan">
        {editRow && (
          <form onSubmit={(e) => handleEditSubmit(e, editRow)}>
            {editError && <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{editError}</div>}
            <div className="form-grid">
              <SearchableInput id="edit-training-category" label="Kategori" value={editForm.category === 'teaching_experience' ? 'Pengalaman Melatih/Mengajar' : 'Pendidikan/Pelatihan Terkait Materi'} options={['Pengalaman Melatih/Mengajar', 'Pendidikan/Pelatihan Terkait Materi']} onChange={(value) => setEditForm((p) => ({ ...p, category: value.startsWith('Pendidikan') ? 'related_training' : 'teaching_experience' }))} />
              <SearchableInput id="edit-training-name" label={<>Nama Pelatihan/Kegiatan <span className="required-mark">*</span></>} value={editForm.name} options={trainingCatalog} placeholder="Ketik untuk mencari nama pelatihan..." required onChange={(value) => setEditForm((p) => ({ ...p, name: value }))} />
              <label className="form-field">
                <span>Materi / Mata Pelatihan</span>
                <input type="text" value={editForm.material} onChange={(e) => setEditForm((p) => ({ ...p, material: e.target.value }))} />
              </label>
              {editForm.category === 'teaching_experience' && <SearchableInput id="edit-training-role" label="Peran" value={editForm.role} options={roleCatalog} placeholder="Ketik untuk mencari peran..." onChange={(value) => setEditForm((p) => ({ ...p, role: value }))} />}
              <label className="form-field">
                <span>Penyelenggara</span>
                <input type="text" value={editForm.organizer} onChange={(e) => setEditForm((p) => ({ ...p, organizer: e.target.value }))} />
              </label>
              <label className="form-field">
                <span>Tanggal</span>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="primary-button" type="submit" disabled={editSaving} style={{ marginTop: 0 }}>{editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              <button type="button" className="outline-button" onClick={closeEdit} disabled={editSaving}>← Kembali</button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  )
}
