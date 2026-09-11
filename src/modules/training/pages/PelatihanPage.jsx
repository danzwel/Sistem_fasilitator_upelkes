import { useEffect, useMemo, useState } from 'react'
import { getFacilitators, createFacilitator } from '../../fasilitator/api/facilitatorApi'
import { getTrainings, getTrainingSubjects, createTrainingSubject, createTraining, updateTraining, deleteTraining } from '../api/trainingApi'
import { Modal } from '../../../shared/components/Modal'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { SearchableInput } from '../../../shared/components/SearchableInput'
import { formatFacilitatorName } from '../../../shared/utils/facilitator'

const CATEGORY_LABEL = {
  related_training: 'Terkait Materi',
  teaching_experience: 'Pengalaman Mengajar',
}

const EMPTY_ASSIGNMENT = () => ({ name: '', facilitatorIds: [] })
const EMPTY_FORM = { name: '', materialAssignments: [EMPTY_ASSIGNMENT()], category: 'teaching_experience', organizer: '', date: '', startDate: '', endDate: '', participantCount: '', color: '#9f58cc' }
const EMPTY_AGENDA_FORM = { facilitatorId: '', facilitatorName: '', name: '', material: '', organizer: '', startDate: '', endDate: '', participantCount: '', color: '#9f58cc' }

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
  const [agendaFormOpen, setAgendaFormOpen] = useState(false)
  const [agendaForm, setAgendaForm] = useState(EMPTY_AGENDA_FORM)
  const [agendaError, setAgendaError] = useState(null)
  const [agendaSaving, setAgendaSaving] = useState(false)

  const agendaTrainingOptions = [...new Set(rows.map((row) => row.name?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const agendaMaterialOptions = [...new Set(rows.filter((row) => row.name?.trim().toLowerCase() === agendaForm.name.trim().toLowerCase()).map((row) => row.material?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const agendaFacilitatorOptions = [...new Set(rows.filter((row) => row.name?.trim().toLowerCase() === agendaForm.name.trim().toLowerCase() && (!agendaForm.material.trim() || row.material?.trim().toLowerCase() === agendaForm.material.trim().toLowerCase())).map((row) => row.facilitatorName?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))

  const [detailKey, setDetailKey] = useState(null)
  const [groupDetailName, setGroupDetailName] = useState(null)
  const [selectedMaterialName, setSelectedMaterialName] = useState(null)
  const [editKey, setEditKey] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editError, setEditError] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deletingKey, setDeletingKey] = useState(null)
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [subjectError, setSubjectError] = useState(null)
  const [subjectSaving, setSubjectSaving] = useState(false)

  function updateAssignment(index, updater) {
    setForm((current) => ({ ...current, materialAssignments: current.materialAssignments.map((item, itemIndex) => itemIndex === index ? updater(item) : item) }))
  }

  function toggleAssignmentFacilitator(index, facilitatorId) {
    updateAssignment(index, (item) => ({ ...item, facilitatorIds: item.facilitatorIds.includes(facilitatorId) ? item.facilitatorIds.filter((id) => id !== facilitatorId) : [...item.facilitatorIds, facilitatorId] }))
  }

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

  function exportTrainings() {
    const header = ['Nama Kegiatan', 'Fasilitator', 'Materi', 'Tanggal Mulai', 'Tanggal Selesai', 'Penyelenggara', 'Kategori']
    const data = filtered.map((row) => [row.name, row.facilitatorName, row.material || '', row.startDate || row.date || '', row.endDate || row.date || '', row.organizer || '', CATEGORY_LABEL[row.category] || row.category || ''])
    const csv = [header, ...data].map((record) => record.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'data-pelatihan.csv'; link.click(); URL.revokeObjectURL(url)
  }

  const trainingCards = useMemo(() => {
    const q = query.trim().toLowerCase()
    const groups = new Map()
    const competencyRows = facilitators.flatMap((facilitator) => (facilitator.competencies || [])
      .filter((competency) => competency.trainingName?.trim() && competency.name?.trim())
      .map((competency) => ({
        id: `competency-${facilitator.id}-${competency.trainingName}-${competency.name}`,
        facilitatorId: facilitator.id,
        name: competency.trainingName.trim(),
        material: competency.name.trim(),
        category: 'teaching_experience',
        facilitatorName: formatFacilitatorName(facilitator),
        facilitatorPosition: facilitator.position,
        facilitatorUnit: facilitator.unit,
        facilitatorPhotoUrl: facilitator.photoUrl,
        facilitatorPhone: facilitator.phone,
        facilitatorEmail: facilitator.email,
        facilitatorRating: facilitator.rating?.average ?? facilitator.averageRating ?? null,
        facilitatorReviewCount: facilitator.rating?.count ?? facilitator.reviewCount ?? 0,
        isCompetencyRelation: true,
      })))
    const relationRows = [...rows, ...competencyRows]
    relationRows.forEach((row) => {
      if (categoryFilter !== 'all' && row.category !== categoryFilter) return
      const searchable = [row.name, row.material, row.facilitatorName, row.organizer].filter(Boolean).join(' ').toLowerCase()
      if (q && !searchable.includes(q)) return
      const key = row.name.trim().toLowerCase()
      if (!groups.has(key)) groups.set(key, { name: row.name, rows: [], materials: new Map() })
      const group = groups.get(key)
      group.rows.push(row)
      const materialName = row.material?.trim() || 'Materi belum ditentukan'
      if (!group.materials.has(materialName.toLowerCase())) group.materials.set(materialName.toLowerCase(), { name: materialName, rows: [] })
      group.materials.get(materialName.toLowerCase()).rows.push(row)
    })
    return [...groups.values()].map((group) => ({
      ...group,
      materials: [...group.materials.values()].map((material) => ({
        ...material,
        facilitators: [...new Map(material.rows.map((row) => [row.facilitatorId, row])).values()].sort((a, b) => a.facilitatorName.localeCompare(b.facilitatorName)),
      })),
    })).sort((a, b) => a.name.localeCompare(b.name))
  }, [rows, facilitators, query, categoryFilter])

  const selectedGroup = trainingCards.find((card) => card.name === groupDetailName)
  const selectedMaterial = selectedGroup?.materials.find((material) => material.name === selectedMaterialName)

  function openAddForm() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openAgendaForm() {
    setAgendaForm(EMPTY_AGENDA_FORM)
    setAgendaError(null)
    setAgendaFormOpen(true)
  }

  async function handleAgendaSubmit(event) {
    event.preventDefault()
    if (!agendaForm.name.trim()) return setAgendaError('Nama kegiatan wajib diisi.')
    if (!agendaForm.material.trim()) return setAgendaError('Pilih atau ketik materi pelatihan terlebih dahulu.')
    if (!agendaForm.facilitatorName.trim()) return setAgendaError('Pilih atau ketik nama fasilitator terlebih dahulu.')
    if (!agendaForm.startDate || !agendaForm.endDate) return setAgendaError('Tanggal mulai dan selesai wajib diisi.')
    if (agendaForm.endDate < agendaForm.startDate) return setAgendaError('Tanggal selesai tidak boleh sebelum tanggal mulai.')
    setAgendaSaving(true)
    setAgendaError(null)
    try {
      let facilitatorId = agendaForm.facilitatorId
      if (!facilitatorId) {
        const created = await createFacilitator({ name: agendaForm.facilitatorName.trim() })
        facilitatorId = created.id
      }
      await createTraining(facilitatorId, {
        name: agendaForm.name.trim(), material: agendaForm.material.trim(), organizer: agendaForm.organizer.trim(),
        date: agendaForm.startDate, startDate: agendaForm.startDate, endDate: agendaForm.endDate,
        participantCount: agendaForm.participantCount === '' ? null : Number(agendaForm.participantCount),
        color: agendaForm.color, category: 'teaching_experience', catalogOnly: false,
      })
      setAgendaFormOpen(false)
      await loadData()
    } catch (error) {
      setAgendaError(error.message)
    } finally {
      setAgendaSaving(false)
    }
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
    if (!form.name.trim()) return setFormError('Nama kegiatan wajib diisi.')
    const assignments = form.materialAssignments.filter((item) => item.name.trim() && item.facilitatorIds.length)
    if (!assignments.length) return setFormError('Tambahkan minimal satu materi dan pilih fasilitator yang sesuai.')

    setSaving(true)
    setFormError(null)
    try {
      const commonPayload = {
        name: form.name.trim(),
        date: new Date().toISOString().slice(0, 10),
        category: 'teaching_experience',
        catalogOnly: true,
      }
      await Promise.all(assignments.flatMap((assignment) => assignment.facilitatorIds.map((facilitatorId) => createTraining(facilitatorId, { ...commonPayload, material: assignment.name.trim() }))) )
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
  function openGroupDetail(name) { setGroupDetailName(name); setSelectedMaterialName(null) }

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
      catalogOnly: Boolean(r.catalogOnly),
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
        date: editForm.catalogOnly ? (editRow?.date || new Date().toISOString().slice(0, 10)) : (editForm.category === 'teaching_experience' ? editForm.startDate : (editForm.date || '')),
        ...(!editForm.catalogOnly && editForm.category === 'teaching_experience' ? { startDate: editForm.startDate, endDate: editForm.endDate, participantCount: editForm.participantCount === '' ? null : Number(editForm.participantCount) } : {}),
        organizer: editForm.organizer.trim(),
        category: editForm.category,
        catalogOnly: Boolean(editForm.catalogOnly),
        ...(editForm.category === 'teaching_experience' ? { role: editForm.role.trim() } : {}),
      }
      if (String(editForm.facilitatorId) !== String(r.facilitatorId)) {
        await createTraining(editForm.facilitatorId, payload)
        await deleteTraining(r.facilitatorId, r.id)
      } else {
        await updateTraining(r.facilitatorId, r.id, payload)
      }
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
          <p className="muted">Daftar kegiatan, materi, dan fasilitator sesuai keahliannya.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="outline-button" onClick={() => onNavigate?.('pelatihan-import')}>
            Import Excel
          </button>
          {!agendaFormOpen && <button className="primary-button" onClick={openAgendaForm}>+ Kegiatan Pelatihan</button>}
        </div>
      </div>

      <Modal open={agendaFormOpen} onClose={() => !agendaSaving && setAgendaFormOpen(false)} title="Tambah Agenda Kegiatan Pelatihan">
        <form onSubmit={handleAgendaSubmit}>
          {agendaError && <div className="form-error" style={{ marginBottom: 10 }}>{agendaError}</div>}
          <div className="form-grid">
            <SearchableInput id="agenda-training" label={<>Pelatihan <span className="required-mark">*</span></>} value={agendaForm.name} options={agendaTrainingOptions} placeholder="Pilih atau ketik nama pelatihan..." required onChange={(value) => setAgendaForm((current) => ({ ...current, name: value, material: '', facilitatorName: '', facilitatorId: '' }))} />
            <SearchableInput id="agenda-material" label={<>Materi / Mata Pelatihan <span className="required-mark">*</span></>} value={agendaForm.material} options={agendaMaterialOptions} placeholder="Pilih atau ketik materi..." required onChange={(value) => setAgendaForm((current) => ({ ...current, material: value, facilitatorName: '', facilitatorId: '' }))} />
            <SearchableInput id="agenda-facilitator" label={<>Fasilitator <span className="required-mark">*</span></>} value={agendaForm.facilitatorName} options={agendaFacilitatorOptions.length ? agendaFacilitatorOptions : facilitators.map((f) => f.name)} placeholder="Pilih atau ketik fasilitator..." required onChange={(value) => { const match = facilitators.find((f) => f.name === value); setAgendaForm((current) => ({ ...current, facilitatorName: value, facilitatorId: match?.id || '' })) }} />
            <label className="form-field"><span>Penyelenggara</span><input value={agendaForm.organizer} onChange={(event) => setAgendaForm((current) => ({ ...current, organizer: event.target.value }))} /></label>
            <label className="form-field"><span>Tanggal Mulai <span className="required-mark">*</span></span><input type="date" value={agendaForm.startDate} required onChange={(event) => setAgendaForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
            <label className="form-field"><span>Tanggal Selesai <span className="required-mark">*</span></span><input type="date" value={agendaForm.endDate} required onChange={(event) => setAgendaForm((current) => ({ ...current, endDate: event.target.value }))} /></label>
            <label className="form-field"><span>Jumlah Peserta</span><input type="number" min="0" value={agendaForm.participantCount} onChange={(event) => setAgendaForm((current) => ({ ...current, participantCount: event.target.value }))} /></label>
            <label className="form-field"><span>Warna Agenda</span><input type="color" value={agendaForm.color} onChange={(event) => setAgendaForm((current) => ({ ...current, color: event.target.value }))} /></label>
          </div>
          <div className="form-actions-row"><button className="primary-button" type="submit" disabled={agendaSaving}>{agendaSaving ? 'Menyimpan...' : 'Simpan Agenda'}</button><button type="button" className="outline-button" onClick={() => setAgendaFormOpen(false)} disabled={agendaSaving}>Batal</button></div>
        </form>
      </Modal>

      <Modal open={formOpen} onClose={() => !saving && closeForm()} title="Tambah Pelatihan">
          <form onSubmit={handleSubmit}>
            {formError && <div style={{ color: '#e6a8bd', fontSize: 12, marginBottom: 10 }}>{formError}</div>}
            <div className="form-grid">
              <label className="form-field"><span>Nama Pelatihan/Kegiatan <span className="required-mark">*</span></span><input value={form.name} placeholder="Ketik nama pelatihan..." required onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
            </div>
            <div className="training-material-assignment-form">
              <div className="assignment-heading"><strong>Materi dan fasilitator</strong><small> Satu pelatihan dapat memiliki banyak materi. Pilih fasilitator untuk setiap materi.</small></div>
              {form.materialAssignments.map((assignment, index) => (
                <div className="material-assignment-row" key={index}>
                  <label className="form-field"><span>Materi {index + 1} <span className="required-mark">*</span></span><input value={assignment.name} placeholder="Contoh: Komunikasi Efektif" onChange={(e) => updateAssignment(index, (item) => ({ ...item, name: e.target.value }))} /></label>
                  <div className="form-field"><span>Fasilitator materi ini <span className="required-mark">*</span></span><div className="facilitator-check-list">{facilitators.map((facilitator) => <label key={facilitator.id} className="facilitator-check"><input type="checkbox" checked={assignment.facilitatorIds.includes(facilitator.id)} onChange={() => toggleAssignmentFacilitator(index, facilitator.id)} /><span>{formatFacilitatorName(facilitator)}</span></label>)}</div></div>
                  {form.materialAssignments.length > 1 && <button type="button" className="text-button danger-text assignment-remove" onClick={() => setForm((current) => ({ ...current, materialAssignments: current.materialAssignments.filter((_, itemIndex) => itemIndex !== index) }))}>Hapus materi</button>}
                </div>
              ))}
              <button type="button" className="outline-button assignment-add" onClick={() => setForm((current) => ({ ...current, materialAssignments: [...current.materialAssignments, EMPTY_ASSIGNMENT()] }))}>+ Tambah materi</button>
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
        <div className="training-table-heading">
          <div><p className="eyebrow">KATALOG KEGIATAN</p><h3>Daftar Kegiatan Pelatihan</h3></div>
          <div className="training-table-tools">
            <button className="outline-button export-csv-button" onClick={exportTrainings} disabled={!filtered.length}><span>⇩</span> Export CSV</button>
            <div className="search training-search">
              <span>⌕</span>
              <input aria-label="Cari kegiatan, materi, atau fasilitator" placeholder="Cari kegiatan, materi, atau fasilitator..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button className="primary-button" onClick={openAddForm} style={{ marginTop: 0, whiteSpace: 'nowrap' }}>+ Pelatihan</button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><span>◌</span><p>Memuat data pelatihan dari semua fasilitator...</p></div>
        ) : error ? (
          <div className="empty-state"><span>◌</span><p>Gagal memuat data.</p><small>{error}</small>
            <div style={{ marginTop: 12 }}><button className="outline-button" onClick={loadData}>Coba lagi</button></div>
          </div>
        ) : trainingCards.length === 0 ? (
          <div className="empty-state"><span>◌</span><p>Belum ada kegiatan pelatihan yang cocok.</p><small>Tambahkan kegiatan, materi, dan fasilitator melalui form pengisian.</small></div>
        ) : (
          <div className="training-card-grid">
            {trainingCards.map((card) => <article className="training-card" key={card.name} role="button" tabIndex={0} onClick={() => openGroupDetail(card.name)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openGroupDetail(card.name) } }}>
                <div className="training-card-main">
                  <h3>{card.name}</h3>
                </div>
                <div className="training-card-actions"><span className="text-button">Lihat materi →</span></div>
              </article>)}
          </div>
        )}
      </div>

      <Modal open={Boolean(groupDetailName)} onClose={() => { setGroupDetailName(null); setSelectedMaterialName(null) }} title={selectedMaterial ? `${groupDetailName} · ${selectedMaterial.name}` : groupDetailName || 'Materi Pelatihan'}>
        <div className="training-group-modal">
          {!selectedMaterial ? (
            <>
              <p className="modal-intro">Pilih materi untuk melihat fasilitator yang sesuai.</p>
              <div className="material-choice-list">
                {selectedGroup?.materials.map((material) => <button type="button" className="material-choice" key={material.name} onClick={() => setSelectedMaterialName(material.name)}><span><b>{material.name}</b><small>{material.facilitators.length} fasilitator tersedia</small></span><strong>→</strong></button>)}
              </div>
            </>
          ) : (
            <>
              <button type="button" className="text-button material-back" onClick={() => setSelectedMaterialName(null)}>← Kembali ke daftar materi</button>
              <p className="modal-intro">Fasilitator yang sesuai dengan materi ini:</p>
              <div className="training-facilitator-list">
                {selectedMaterial.facilitators.map((item) => <div className="training-facilitator-row" key={item.facilitatorId}>
                  {item.facilitatorPhotoUrl ? <img src={resolveAssetUrl(item.facilitatorPhotoUrl)} alt="" className="training-facilitator-photo" /> : <div className="training-facilitator-photo training-facilitator-photo-placeholder">{(item.facilitatorName || '?').charAt(0).toUpperCase()}</div>}
                  <div className="training-facilitator-info"><b>{item.facilitatorName}</b><span>{item.facilitatorPosition || 'Fasilitator'}{item.facilitatorUnit ? ` · ${item.facilitatorUnit}` : ''}</span></div>
                  <div className="training-facilitator-contacts">{item.facilitatorPhone && <a href={toWhatsAppLink(item.facilitatorPhone)} target="_blank" rel="noreferrer" className="detail-contact-button wa" aria-label={`WhatsApp ${item.facilitatorName}`}><img src="/contact-icons/whatsapp.jpg" alt="" className="contact-logo" /></a>}{item.facilitatorEmail && <a href={toEmailLink(item.facilitatorEmail, item.facilitatorName)} target="_blank" rel="noreferrer" className="detail-contact-button email" aria-label={`Email ${item.facilitatorName}`}><img src="/contact-icons/gmail.jpg" alt="" className="contact-logo" /></a>}</div>
                </div>)}
              </div>
            </>
          )}
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
                    <img src="/contact-icons/whatsapp.jpg" alt="" className="contact-logo" /> WhatsApp
                  </a>
                )}
                {detailRow.facilitatorEmail && (
                  <a href={toEmailLink(detailRow.facilitatorEmail, detailRow.facilitatorName)} target="_blank" rel="noreferrer" className="detail-contact-button email">
                    <img src="/contact-icons/gmail.jpg" alt="" className="contact-logo" /> Email
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
              {!editForm.catalogOnly && <SearchableInput id="edit-training-category" label="Kategori" value={editForm.category === 'teaching_experience' ? 'Pengalaman Melatih/Mengajar' : 'Pendidikan/Pelatihan Terkait Materi'} options={['Pengalaman Melatih/Mengajar', 'Pendidikan/Pelatihan Terkait Materi']} onChange={(value) => setEditForm((p) => ({ ...p, category: value.startsWith('Pendidikan') ? 'related_training' : 'teaching_experience' }))} />}
              <SearchableInput id="edit-training-facilitator" label={<>Fasilitator materi <span className="required-mark">*</span></>} value={facilitators.find((f) => String(f.id) === String(editForm.facilitatorId))?.name || ''} options={facilitators.map((f) => f.name)} placeholder="Ketik untuk mencari fasilitator..." required onChange={(value) => setEditForm((p) => ({ ...p, facilitatorId: facilitators.find((f) => f.name === value)?.id || '' }))} />
              <label className="form-field"><span>Nama Pelatihan/Kegiatan <span className="required-mark">*</span></span><input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required /></label>
              <label className="form-field">
                <span>Materi / Mata Pelatihan</span>
                <input type="text" value={editForm.material} onChange={(e) => setEditForm((p) => ({ ...p, material: e.target.value }))} />
              </label>
              {!editForm.catalogOnly && editForm.category === 'teaching_experience' && <label className="form-field"><span>Peran</span><input value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))} /></label>}
              {!editForm.catalogOnly && <label className="form-field">
                <span>Penyelenggara</span>
                <input type="text" value={editForm.organizer} onChange={(e) => setEditForm((p) => ({ ...p, organizer: e.target.value }))} />
              </label>}
              {!editForm.catalogOnly && editForm.category === 'teaching_experience' ? <>
                <label className="form-field"><span>Tanggal Mulai <span className="required-mark">*</span></span><input type="date" value={editForm.startDate} required onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
                <label className="form-field"><span>Tanggal Selesai <span className="required-mark">*</span></span><input type="date" value={editForm.endDate} required onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))} /></label>
                <label className="form-field"><span>Jumlah Peserta</span><input type="number" min="0" value={editForm.participantCount} onChange={(e) => setEditForm((p) => ({ ...p, participantCount: e.target.value }))} /></label>
              </> : (!editForm.catalogOnly && <label className="form-field"><span>Tanggal</span><input type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} /></label>)}
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
