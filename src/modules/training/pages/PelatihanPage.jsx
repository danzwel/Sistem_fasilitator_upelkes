import { useEffect, useMemo, useState } from 'react'
import { getFacilitators } from '../../fasilitator/api/facilitatorApi'
import { getTrainings, createTraining, updateTraining, deleteTraining } from '../api/trainingApi'
import { Modal } from '../../../shared/components/Modal'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'

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
              facilitatorPhotoUrl: f.photoUrl,
              facilitatorPhone: f.phone,
              facilitatorEmail: f.email,
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
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MODUL SOFI</p>
          <h2>Pelatihan / Riwayat Kegiatan</h2>
          <p className="muted">Rekap gabungan dari semua fasilitator.</p>
        </div>
        {!formOpen && <button className="primary-button" onClick={openAddForm}>+ Tambah Pelatihan</button>}
      </div>

      {formOpen && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-heading"><h3>Tambah Pelatihan</h3></div>
          <form onSubmit={handleSubmit}>
            {formError && <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{formError}</div>}
            <div className="form-grid">
              <label className="form-field">
                <span>Fasilitator <span className="required-mark">*</span></span>
                <select value={form.facilitatorId} onChange={(e) => setForm((p) => ({ ...p, facilitatorId: e.target.value }))}
                  style={{ background: '#211a30', border: '1px solid #3e3451', borderRadius: 10, padding: '11px 13px', color: '#f0ecff' }}>
                  <option value="">Pilih fasilitator...</option>
                  {facilitators.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Kategori <span className="required-mark">*</span></span>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  style={{ background: '#211a30', border: '1px solid #3e3451', borderRadius: 10, padding: '11px 13px', color: '#f0ecff' }}>
                  <option value="teaching_experience">Pengalaman Melatih/Mengajar</option>
                  <option value="related_training">Pendidikan/Pelatihan Terkait Materi</option>
                </select>
              </label>
              <label className="form-field">
                <span>Nama Pelatihan/Kegiatan <span className="required-mark">*</span></span>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </label>
              <label className="form-field">
                <span>Materi / Mata Pelatihan</span>
                <input type="text" value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} placeholder="Komunikasi Efektif" />
              </label>
              {form.category === 'teaching_experience' && (
                <label className="form-field">
                  <span>Peran</span>
                  <input type="text" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="Narasumber / Fasilitator" />
                </label>
              )}
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Kegiatan</th><th>Materi</th><th>Kategori</th><th>Fasilitator</th><th>Peran</th><th>Penyelenggara</th><th>Bulan/Tahun</th><th aria-label="Aksi"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={rowKey(r)}>
                  <td><div className="table-primary">{r.name}</div></td>
                  <td><div className="table-secondary">{r.material || '-'}</div></td>
                  <td>
                    <span className={`status-badge ${r.category === 'teaching_experience' ? 'lengkap' : 'belum_lengkap'}`}>
                      {CATEGORY_LABEL[r.category] ?? r.category}
                    </span>
                  </td>
                  <td><div className="table-secondary">{r.facilitatorName}</div></td>
                  <td><div className="table-secondary">{r.role || '-'}</div></td>
                  <td><div className="table-secondary">{r.organizer || '-'}</div></td>
                  <td><div className="table-secondary">{formatBulanTahun(r.date)}</div></td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button className="text-button" onClick={() => openDetail(r)}>Detail</button>
                      <button className="text-button" onClick={() => openEdit(r)}>Edit</button>
                      <button className="text-button" style={{ color: '#e6a8bd' }} disabled={deletingKey === rowKey(r)} onClick={() => handleDelete(r)}>
                        {deletingKey === rowKey(r) ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={Boolean(detailRow)} onClose={() => setDetailKey(null)} title="Detail Kegiatan">
        {detailRow && (
          <div className="detail-layout">
            <div className="detail-fields">
              <div className="detail-field">
                <div className="detail-label">Nama Kegiatan</div>
                <div className="detail-value detail-value-lg">{detailRow.name}</div>
              </div>
              {detailRow.material && (
                <div className="detail-field">
                  <div className="detail-label">Materi</div>
                  <div className="detail-value">{detailRow.material}</div>
                </div>
              )}
              <div className="detail-field">
                <div className="detail-label">Kategori</div>
                <span className={`status-badge ${detailRow.category === 'teaching_experience' ? 'lengkap' : 'belum_lengkap'}`}>
                  {CATEGORY_LABEL[detailRow.category] ?? detailRow.category}
                </span>
              </div>
              {detailRow.role && (
                <div className="detail-field">
                  <div className="detail-label">Peran</div>
                  <div className="detail-value">{detailRow.role}</div>
                </div>
              )}
              <div className="detail-field">
                <div className="detail-label">Penyelenggara</div>
                <div className="detail-value">{detailRow.organizer || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Tanggal</div>
                <div className="detail-value">{detailRow.date || '-'}</div>
              </div>
            </div>

            <div className="detail-facilitator-card">
              {detailRow.facilitatorPhotoUrl ? (
                <img src={resolveAssetUrl(detailRow.facilitatorPhotoUrl)} alt={detailRow.facilitatorName} className="detail-facilitator-photo" />
              ) : (
                <div className="detail-facilitator-photo detail-facilitator-photo-placeholder">
                  {(detailRow.facilitatorName || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="detail-facilitator-name">{detailRow.facilitatorName}</div>
              <div className="detail-facilitator-tag">Fasilitator</div>

              <div className="detail-facilitator-actions">
                {detailRow.facilitatorPhone && (
                  <a
                    href={toWhatsAppLink(detailRow.facilitatorPhone)}
                    target="_blank"
                    rel="noreferrer"
                    className="detail-contact-button wa"
                  >
                    ⌾ WhatsApp
                  </a>
                )}
                {detailRow.facilitatorEmail && (
                  <a href={`mailto:${detailRow.facilitatorEmail}`} className="detail-contact-button email">
                    ✉ Email
                  </a>
                )}
              </div>
            </div>
          </div>
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
              <label className="form-field">
                <span>Kategori</span>
                <select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                  style={{ background: '#211a30', border: '1px solid #3e3451', borderRadius: 10, padding: '11px 13px', color: '#f0ecff' }}>
                  <option value="teaching_experience">Pengalaman Melatih/Mengajar</option>
                  <option value="related_training">Pendidikan/Pelatihan Terkait Materi</option>
                </select>
              </label>
              <label className="form-field">
                <span>Nama Pelatihan/Kegiatan <span className="required-mark">*</span></span>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
              </label>
              <label className="form-field">
                <span>Materi / Mata Pelatihan</span>
                <input type="text" value={editForm.material} onChange={(e) => setEditForm((p) => ({ ...p, material: e.target.value }))} />
              </label>
              {editForm.category === 'teaching_experience' && (
                <label className="form-field">
                  <span>Peran</span>
                  <input type="text" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))} />
                </label>
              )}
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