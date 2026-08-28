import { useEffect, useMemo, useState } from 'react'
import { getFacilitators } from '../../fasilitator/api/facilitatorApi'
import { getTrainings, getTrainingSubjects, createTrainingSubject, createTraining, updateTraining, deleteTraining } from '../api/trainingApi'
import { Modal } from '../../../shared/components/Modal'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { SearchableInput } from '../../../shared/components/SearchableInput'
import { formatFacilitatorName } from '../../../shared/utils/facilitator'
import { competencyCatalog } from '../../fasilitator/data/competencyCatalog'

const CATEGORY_LABEL = {
  related_training: 'Terkait Materi',
  teaching_experience: 'Pengalaman Mengajar',
}

const EMPTY_FORM = { facilitatorId: '', name: '', material: '', category: 'teaching_experience', organizer: '', date: '', startDate: '', endDate: '', participantCount: '', color: '#9f58cc' }

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatBulanTahun(dateValue) {
  if (!dateValue) return '-'
  const match = String(dateValue).match(/^(\d{4})-(\d{2})/)
  if (!match) return dateValue
  const monthName = MONTH_NAMES[Number(match[2]) - 1]
  return monthName ? `${monthName} ${match[1]}` : dateValue
}

function formatTrainingDate(start, end) {
  const first = start || ''
  const last = end || first
  if (!first) return '-'
  return first === last ? first : `${first} – ${last}`
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

function toEmailLink(email, name = 'Fasilitator') {
  const subject = `Koordinasi kegiatan UPELKES - ${name}`
  const body = `Yth. ${name},\n\nSaya ingin menghubungi terkait kegiatan UPELKES.\n\nTerima kasih.`
  return `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function PelatihanPage({ onNavigate }) {
  const [facilitators, setFacilitators] = useState([])
  const [rows, setRows] = useState([])
  const [globalSubjects, setGlobalSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [detailKey, setDetailKey] = useState(null)
  const [groupDetailName, setGroupDetailName] = useState(null)
  const [editKey, setEditKey] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editError, setEditError] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deletingKey, setDeletingKey] = useState(null)
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [subjectError, setSubjectError] = useState(null)
  const [subjectSaving, setSubjectSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [facilitatorList, subjects] = await Promise.all([getFacilitators(), getTrainingSubjects().catch(() => [])])
      setFacilitators(facilitatorList)
      setGlobalSubjects(subjects)
      const perFacilitator = await Promise.all(
        facilitatorList.map(async (f) => {
          try {
            const trainings = await getTrainings(f.id)
            return trainings.map((t) => ({
              ...t,
              facilitatorId: f.id,
              facilitatorName: formatFacilitatorName(f),
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

  const competencyCards = useMemo(() => {
    const q = query.trim().toLowerCase()
    const cards = new Map([...competencyCatalog, ...globalSubjects].map((name) => [name, { name, facilitators: [], activities: [] }]))
    facilitators.forEach((facilitator) => {
      const competencyNames = (facilitator.competencies || []).map((item) => item.name?.trim()).filter(Boolean)
      const relatedNames = rows
        .filter((row) => row.facilitatorId === facilitator.id && row.material?.trim())
        .map((row) => row.material.trim())
      const names = [...new Map([...competencyNames, ...relatedNames].map((name) => [name.toLowerCase(), name])).values()]
      names.forEach((name) => {
        const activities = rows.filter((row) => row.facilitatorId === facilitator.id && String(row.material || '').trim().toLowerCase() === name.toLowerCase())
        if (categoryFilter !== 'all' && activities.length > 0 && !activities.some((row) => row.category === categoryFilter)) return
        if (q && ![name, facilitator.name].some((value) => String(value || '').toLowerCase().includes(q))) return
        if (!cards.has(name)) cards.set(name, { name, facilitators: [], activities: [] })
        const card = cards.get(name)
        if (!card.facilitators.some((item) => item.id === facilitator.id)) card.facilitators.push(facilitator)
        card.activities.push(...activities)
      })
    })
    return [...cards.values()]
      .filter((card) => !q || card.name.toLowerCase().includes(q) || card.facilitators.some((person) => person.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [facilitators, rows, globalSubjects, query, categoryFilter])

  function openAddForm() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openSubjectModal() {
    setSubjectName('')
    setSubjectError(null)
    setSubjectModalOpen(true)
  }

  async function saveSubject(event) {
    event.preventDefault()
    if (!subjectName.trim()) return setSubjectError('Nama bidang pelatihan wajib diisi.')
    setSubjectSaving(true)
    setSubjectError(null)
    try {
      const saved = await createTrainingSubject(subjectName)
      setGlobalSubjects((current) => [...new Set([...current, saved])])
      setSubjectModalOpen(false)
      setSubjectName('')
    } catch (error) {
      setSubjectError(error.message)
    } finally {
      setSubjectSaving(false)
    }
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
    if (form.category === 'teaching_experience' && !form.startDate) return setFormError('Tanggal mulai wajib diisi.')
    if (form.category === 'teaching_experience' && !form.endDate) return setFormError('Tanggal selesai wajib diisi.')
    if (form.category === 'teaching_experience' && form.endDate < form.startDate) return setFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.')

    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name: form.name.trim(),
        material: form.material.trim(),
        date: form.category === 'teaching_experience' ? form.startDate : (form.date || ''),
        ...(form.category === 'teaching_experience' ? { startDate: form.startDate, endDate: form.endDate, participantCount: form.participantCount === '' ? null : Number(form.participantCount) } : {}),
        organizer: form.organizer.trim(),
        category: 'teaching_experience',
        color: form.color,
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
  function openGroupDetail(name) { setGroupDetailName(name) }

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
      startDate: r.startDate ?? r.date ?? '',
      endDate: r.endDate ?? r.date ?? '',
      participantCount: r.participantCount ?? '',
      color: r.color ?? '#9f58cc',
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
        date: editForm.category === 'teaching_experience' ? editForm.startDate : (editForm.date || ''),
        ...(editForm.category === 'teaching_experience' ? { startDate: editForm.startDate, endDate: editForm.endDate, participantCount: editForm.participantCount === '' ? null : Number(editForm.participantCount) } : {}),
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
          <h2>Bidang Pelatihan</h2>
          <p className="muted">Daftar seluruh bidang materi/pelatihan yang tersedia.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="outline-button" onClick={() => onNavigate?.('pelatihan-import')}>
            Import Excel
          </button>
          {!formOpen && <button className="primary-button" onClick={openAddForm}>+ Kegiatan Pelatihan</button>}
        </div>
      </div>

      <Modal open={formOpen} onClose={() => !saving && closeForm()} title="Tambah Kegiatan Pelatihan">
          <form onSubmit={handleSubmit}>
            {formError && <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{formError}</div>}
            <div className="form-grid">
              <SearchableInput id="training-facilitator" label={<>Fasilitator <span className="required-mark">*</span></>} value={facilitators.find((f) => String(f.id) === String(form.facilitatorId))?.name || ''} options={facilitators.map((f) => f.name)} placeholder="Ketik untuk mencari fasilitator..." required onChange={(value) => setForm((p) => ({ ...p, facilitatorId: facilitators.find((f) => f.name === value)?.id || '' }))} />
              <label className="form-field"><span>Nama Pelatihan/Kegiatan <span className="required-mark">*</span></span><input value={form.name} placeholder="Ketik nama pelatihan..." required onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
              <label className="form-field">
                <span>Materi / Mata Pelatihan</span>
                <input type="text" value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} placeholder="Komunikasi Efektif" />
              </label>
              <label className="form-field">
                <span>Penyelenggara</span>
                <input type="text" value={form.organizer} onChange={(e) => setForm((p) => ({ ...p, organizer: e.target.value }))} />
              </label>
              <label className="form-field"><span>Tanggal Mulai <span className="required-mark">*</span></span><input type="date" value={form.startDate} required onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
              <label className="form-field"><span>Tanggal Selesai <span className="required-mark">*</span></span><input type="date" value={form.endDate} required onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} /></label>
              <label className="form-field"><span>Jumlah Peserta</span><input type="number" min="0" value={form.participantCount} onChange={(e) => setForm((p) => ({ ...p, participantCount: e.target.value }))} /></label>
              <label className="form-field"><span>Warna Agenda</span><input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} /></label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="primary-button" type="submit" disabled={saving} style={{ marginTop: 0 }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" className="outline-button" onClick={closeForm} disabled={saving}>Batal</button>
            </div>
          </form>
      </Modal>

      <Modal open={subjectModalOpen} onClose={() => !subjectSaving && setSubjectModalOpen(false)} title="Tambah Bidang Pelatihan">
        <form onSubmit={saveSubject}>
          {subjectError && <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{subjectError}</div>}
          <label className="form-field">
            <span>Nama bidang pelatihan / keahlian <span className="required-mark">*</span></span>
            <input autoFocus value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="Contoh: Manajemen Puskesmas" required />
          </label>
          <p className="muted" style={{ fontSize: 12 }}>Bidang ini akan menjadi card baru dan tersedia sebagai bubble di semua profil fasilitator.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="primary-button" type="submit" disabled={subjectSaving} style={{ marginTop: 0 }}>{subjectSaving ? 'Menyimpan...' : 'Tambah Bidang'}</button>
            <button type="button" className="outline-button" onClick={() => setSubjectModalOpen(false)} disabled={subjectSaving}>Batal</button>
          </div>
        </form>
      </Modal>

      <div className="panel">
        <div className="panel-heading">
          <h3>Daftar Bidang Pelatihan</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="search">
              <span>⌕</span>
              <input aria-label="Cari bidang pelatihan" placeholder="Cari bidang atau fasilitator..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button className="primary-button" onClick={openSubjectModal} style={{ marginTop: 0, whiteSpace: 'nowrap' }}>+ Bidang Pelatihan</button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><span>◌</span><p>Memuat data pelatihan dari semua fasilitator...</p></div>
        ) : error ? (
          <div className="empty-state"><span>◌</span><p>Gagal memuat data.</p><small>{error}</small>
            <div style={{ marginTop: 12 }}><button className="outline-button" onClick={loadData}>Coba lagi</button></div>
          </div>
        ) : competencyCards.length === 0 ? (
          <div className="empty-state"><span>◌</span><p>Belum ada bidang pelatihan yang cocok.</p><small>Tambahkan bidang pelatihan/keahlian pada profil fasilitator.</small></div>
        ) : (
          <div className="training-card-grid">
            {competencyCards.map((card) => <article className="training-card" key={card.name} role="button" tabIndex={0} onClick={() => openGroupDetail(card.name)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openGroupDetail(card.name) } }}>
                <div className="training-card-main">
                  <span className="eyebrow">BIDANG PELATIHAN</span>
                  <h3>{card.name}</h3>
                  <p>Bidang materi / keahlian fasilitator</p>
                  <strong>{card.facilitators.length ? `${card.facilitators.length} fasilitator terdaftar` : 'Belum ada fasilitator'}</strong>
                </div>
                <div className="training-card-facilitators">{card.facilitators.length ? card.facilitators.map((item) => <span key={item.id}>{formatFacilitatorName(item)}</span>) : <span className="muted">Belum ada fasilitator di bidang ini</span>}</div>
                <div className="training-card-actions"><span className="text-button">Lihat fasilitator →</span></div>
              </article>)}
          </div>
        )}
      </div>

      <Modal open={Boolean(groupDetailName)} onClose={() => setGroupDetailName(null)} title={groupDetailName || 'Fasilitator Pelatihan'}>
        <div className="training-group-modal">
          {competencyCards.find((card) => card.name === groupDetailName)?.facilitators.length ? competencyCards.find((card) => card.name === groupDetailName).facilitators.map((item) => (
            <div className="training-facilitator-row" key={item.id}>
              {item.photoUrl ? <img src={resolveAssetUrl(item.photoUrl)} alt="" className="training-facilitator-photo" /> : <div className="training-facilitator-photo training-facilitator-photo-placeholder">{(item.name || '?').charAt(0).toUpperCase()}</div>}
              <div className="training-facilitator-info">
                <b>{formatFacilitatorName(item)}</b>
                <span className={`status-badge ${item.completeness?.isComplete ? 'lengkap' : 'belum_lengkap'}`}>{item.completeness?.isComplete ? 'Lengkap' : 'Belum Lengkap'}</span>
                <span className="training-facilitator-rating">★ {item.rating?.average ?? '—'} <small>({item.rating?.count ?? 0} ulasan)</small></span>
              </div>
              <div className="training-facilitator-contacts">
                {item.phone && <a href={toWhatsAppLink(item.phone)} target="_blank" rel="noreferrer" className="detail-contact-button wa" aria-label={`WhatsApp ${formatFacilitatorName(item)}`} title="Hubungi lewat WhatsApp">⌾</a>}
                {item.email && <a href={toEmailLink(item.email, formatFacilitatorName(item))} target="_blank" rel="noreferrer" className="detail-contact-button email" aria-label={`Email ${formatFacilitatorName(item)}`} title="Tulis email ke fasilitator">✉</a>}
              </div>
            </div>
          )) : <p className="muted">Belum ada fasilitator yang memiliki bidang ini.</p>}
        </div>
      </Modal>

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
                  <a href={toEmailLink(detailRow.facilitatorEmail, detailRow.facilitatorName)} target="_blank" rel="noreferrer" className="detail-contact-button email">
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
                <div className="th-timeline-date">{formatTrainingDate(detailRow.startDate || detailRow.date, detailRow.endDate)}</div>
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
              <label className="form-field"><span>Nama Pelatihan/Kegiatan <span className="required-mark">*</span></span><input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required /></label>
              <label className="form-field">
                <span>Materi / Mata Pelatihan</span>
                <input type="text" value={editForm.material} onChange={(e) => setEditForm((p) => ({ ...p, material: e.target.value }))} />
              </label>
              {editForm.category === 'teaching_experience' && <label className="form-field"><span>Peran</span><input value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))} /></label>}
              <label className="form-field">
                <span>Penyelenggara</span>
                <input type="text" value={editForm.organizer} onChange={(e) => setEditForm((p) => ({ ...p, organizer: e.target.value }))} />
              </label>
              {editForm.category === 'teaching_experience' ? <>
                <label className="form-field"><span>Tanggal Mulai <span className="required-mark">*</span></span><input type="date" value={editForm.startDate} required onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
                <label className="form-field"><span>Tanggal Selesai <span className="required-mark">*</span></span><input type="date" value={editForm.endDate} required onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))} /></label>
                <label className="form-field"><span>Jumlah Peserta</span><input type="number" min="0" value={editForm.participantCount} onChange={(e) => setEditForm((p) => ({ ...p, participantCount: e.target.value }))} /></label>
              </> : <label className="form-field"><span>Tanggal</span><input type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} /></label>}
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
