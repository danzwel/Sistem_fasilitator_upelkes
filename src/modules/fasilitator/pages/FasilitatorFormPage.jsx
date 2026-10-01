import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { getFacilitatorById, getFacilitators, createFacilitator, updateFacilitator } from '../api/facilitatorApi'
import { uploadFacilitatorPhoto, uploadFacilitatorSignature, uploadFacilitatorSupporting } from '../api/facilitatorUploadApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { EducationSection } from '../components/EducationSection'
import { CompetencySection } from '../components/CompetencySection'
import { TrainingSection } from '../components/TrainingSection'
import { getTrainingCatalog, getTrainings } from '../../training/api/trainingApi'
import { Modal } from '../../../shared/components/Modal'

const EMPTY_FORM = {
  nama: '', gelar: '', tempatLahir: '', tanggalLahir: '', nik: '', nip: '',
  pangkatGolongan: '', jabatan: '', unitKerja: '', alamatKantor: '', alamatRumah: '',
  noHp: '', email: '',
}
function combineBirthInfo(tempatLahir, tanggalLahir) {
  return [tempatLahir, tanggalLahir].filter(Boolean).join(', ')
}

const FIELD_GROUPS = [
  { title: 'Identitas', fields: [
    ['nama', 'Nama Lengkap', 'text', true],
    ['gelar', 'Gelar', 'text', false],
    ['tempatLahir', 'Tempat Lahir', 'text', false],
    ['tanggalLahir', 'Tanggal Lahir', 'date', false],
    ['nik', 'NIK', 'text', true],
    ['nip', 'NIP', 'text', false],
  ]},
  { title: 'Kepegawaian', fields: [
    ['pangkatGolongan', 'Pangkat / Golongan', 'text', false],
    ['jabatan', 'Jabatan', 'text', true],
    ['unitKerja', 'Unit Kerja', 'text', true],
  ]},
  { title: 'Kontak & Alamat', fields: [
    ['alamatKantor', 'Alamat Kantor', 'text', false],
    ['alamatRumah', 'Alamat Rumah', 'text', false],
    ['noHp', 'No. HP', 'text', true],
    ['email', 'Email', 'email', true],
  ]},
]

function FileSlot({ label, previewUrl, onSelect }) {
  const inputRef = useRef(null)
  const isPhoto = label === 'Foto'
  return (
    <label className="form-field">
      <span>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {previewUrl && <img src={previewUrl} alt={label} style={{ width: isPhoto ? 45 : 56, height: isPhoto ? 60 : 56, objectFit: isPhoto ? 'contain' : 'cover', background: '#fffaf2', borderRadius: 8 }} />}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)} />
        <button type="button" className="outline-button" onClick={() => inputRef.current?.click()}>
          {previewUrl ? 'Ganti file' : 'Pilih file'}
        </button>
      </div>
    </label>
  )
}

export function FasilitatorFormPage({ onNavigate, facilitatorId, returnTo = 'fasilitator', embedded = false, onSaved }) {
  const isEdit = Boolean(facilitatorId)

  const [form, setForm] = useState(EMPTY_FORM)
  const [competencies, setCompetencies] = useState([])
  const [trainingNames, setTrainingNames] = useState([])
  const [trainingCatalog, setTrainingCatalog] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitStep, setSubmitStep] = useState(null)

  const [photoFile, setPhotoFile] = useState(null)
  const [photoCropFile, setPhotoCropFile] = useState(null)
  const [signatureFile, setSignatureFile] = useState(null)
  const [supportingFile, setSupportingFile] = useState(null)
  const [supportingDocuments, setSupportingDocuments] = useState([])
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [existingSignatureUrl, setExistingSignatureUrl] = useState(null)

  useEffect(() => {
    async function loadTrainingOptions() {
      const catalog = await getTrainingCatalog().catch(() => [])
      const facilitators = await getFacilitators().catch(() => [])
      const activityRows = (await Promise.all(facilitators.map((facilitator) => getTrainings(facilitator.id).catch(() => [])))).flat()
      const merged = [...catalog]
      for (const row of activityRows) {
        const name = row.name?.trim()
        if (!name) continue
        let group = merged.find((item) => item.name.toLowerCase() === name.toLowerCase())
        if (!group) { group = { name, materials: [] }; merged.push(group) }
        const material = row.material?.trim()
        if (material && !group.materials.some((item) => item.toLowerCase() === material.toLowerCase())) group.materials.push(material)
      }
      setTrainingCatalog(merged.sort((a, b) => a.name.localeCompare(b.name)))
    }
    loadTrainingOptions()
      .catch(() => setTrainingCatalog([]))
  }, [facilitatorId])

  useEffect(() => {
    if (!isEdit) return
    getFacilitatorById(facilitatorId)
      .then((f) => {
        setForm({
          nama: f.name ?? '', gelar: f.degree ?? '', tempatLahir: f.birthInfo ?? '', tanggalLahir: '',
          nik: f.nik ?? '', nip: f.nip ?? '', pangkatGolongan: f.rank ?? '', jabatan: f.position ?? '',
          unitKerja: f.unit ?? '', alamatKantor: f.officeAddress ?? '', alamatRumah: f.homeAddress ?? '',
          noHp: f.phone ?? '', email: f.email ?? '',
        })
        setCompetencies(f.competencies ?? [])
        setTrainingNames(f.trainingNames ?? [])
        setExistingPhotoUrl(f.photoUrl ?? null)
        setExistingSignatureUrl(f.signatureUrl ?? null)
        setSupportingDocuments(f.supportingDocuments ?? [])
      })
      .catch((err) => setSubmitError(err.message))
      .finally(() => setLoading(false))
  }, [isEdit, facilitatorId])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    const nextErrors = {}
    for (const group of FIELD_GROUPS) {
      for (const [key, label, , required] of group.fields) {
        if (required && !form[key]?.trim()) nextErrors[key] = `${label} wajib diisi`
      }
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Format email tidak valid'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      ...form,
      birthInfo: combineBirthInfo(form.tempatLahir, form.tanggalLahir),
      competencies,
      trainingNames,
      // Sengaja ikut kirim URL foto/TTD yang lama, supaya kalau backend
      // nganggep field yang nggak dikirim = dihapus, foto/TTD yang udah
      // ada nggak ke-null-in cuma gara-gara kamu edit field lain / cuma
      // ganti salah satu file doang.
      photoUrl: existingPhotoUrl,
      signatureUrl: existingSignatureUrl,
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      let savedId = facilitatorId
      setSubmitStep('Menyimpan biodata...')
      if (isEdit) {
        await updateFacilitator(facilitatorId, payload)
      } else {
        const created = await createFacilitator(payload)
        savedId = created.id
      }

      const uploadWarnings = []
      if (photoFile) {
        setSubmitStep('Mengunggah foto...')
        try { await uploadFacilitatorPhoto(savedId, photoFile) }
        catch (err) { uploadWarnings.push(`Foto gagal diunggah: ${err.message}`) }
      }
      if (signatureFile) {
        setSubmitStep('Mengunggah TTD...')
        try { await uploadFacilitatorSignature(savedId, signatureFile) }
        catch (err) { uploadWarnings.push(`TTD gagal diunggah: ${err.message}`) }
      }
      if (supportingFile) {
        setSubmitStep('Mengunggah dokumen pendukung...')
        try { await uploadFacilitatorSupporting(savedId, supportingFile) }
        catch (err) { uploadWarnings.push(`Dokumen pendukung gagal diunggah: ${err.message}`) }
      }

      if (uploadWarnings.length > 0) {
        setSubmitError(`Biodata tersimpan, tapi ada masalah: ${uploadWarnings.join(' ')} Kamu bisa unggah ulang dari sini.`)
        setSubmitting(false)
        setSubmitStep(null)
        return
      }

      if (onSaved) onSaved(savedId)
      else onNavigate?.(isEdit ? 'fasilitator-detail' : 'fasilitator-edit', savedId)
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
      setSubmitStep(null)
    }
  }

  if (loading) {
    return <section className="page-enter"><div className="empty-state"><span>◌</span><p>Memuat data fasilitator...</p></div></section>
  }

  return (
    <>
    <section className="page-enter">
      {!embedded && <div className="welcome-row">
        <div>
          <h2>{isEdit ? 'Edit Fasilitator' : 'Tambah Fasilitator'}</h2>
          <p className="muted">Isi biodata, foto, TTD, materi, riwayat pendidikan, dan pengalaman mengajar.</p>
        </div>
        <button className="outline-button" onClick={() => onNavigate?.(isEdit ? returnTo : 'fasilitator', facilitatorId)}>
          ← Kembali
        </button>
      </div>}

      {submitError && (
        <div className="panel" style={{ borderColor: '#a84978', marginBottom: 18 }}>
          <strong style={{ color: '#e6a8bd' }}>{submitError.startsWith('Biodata tersimpan') ? 'Perlu perhatian:' : 'Gagal menyimpan:'}</strong>{' '}
          <span className="muted">{submitError}</span>
        </div>
      )}

      <form id="facilitator-form" onSubmit={handleSubmit}>
        {FIELD_GROUPS.map((group) => (
          <div className="panel" key={group.title} style={{ marginBottom: 18 }}>
            <div className="panel-heading"><h3>{group.title}</h3></div>
            <div className="form-grid">
              {group.fields.map(([key, label, type, required]) => (
                <label className="form-field" key={key}>
                  <span>{label}{required && <span className="required-mark"> *</span>}</span>
                  <input type={type} value={form[key] ?? ''} onChange={(e) => updateField(key, e.target.value)} />
                  {errors[key] && <small className="field-error">{errors[key]}</small>}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-heading"><h3>Foto & TTD</h3></div>
          <div className="form-grid">
            <FileSlot label="Foto" previewUrl={photoFile ? URL.createObjectURL(photoFile) : resolveAssetUrl(existingPhotoUrl)} onSelect={setPhotoCropFile} />
            <FileSlot label="TTD" previewUrl={signatureFile ? URL.createObjectURL(signatureFile) : resolveAssetUrl(existingSignatureUrl)} onSelect={setSignatureFile} />
          </div>
        </div>
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-heading"><h3>Dokumen Pendukung</h3></div>
          {supportingDocuments.map((document) => <div key={document.id} className="table-secondary"><a href={resolveAssetUrl(document.url)} target="_blank" rel="noreferrer">{document.name || 'Buka dokumen pendukung'}</a></div>)}
          <label className="form-field"><span>Tambah Dokumen Pendukung</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setSupportingFile(event.target.files?.[0] ?? null)} /><small className="muted">Contoh: SK, KTP, atau dokumen kepegawaian.</small></label>
        </div>
      </form>

      <CompetencySection value={competencies} onChange={setCompetencies} trainingCatalog={trainingCatalog} trainingNames={trainingNames} onTrainingNamesChange={setTrainingNames} />

      {isEdit && (
        <>
          <EducationSection facilitatorId={facilitatorId} />
          <TrainingSection
            facilitatorId={facilitatorId}
            title="Pendidikan/Pelatihan yang Terkait Materi"
            category="related_training"
            showRole={false}
            includeCertificates
          />
          <TrainingSection
            facilitatorId={facilitatorId}
            title="Pengalaman Melatih/Mengajar"
            category="teaching_experience"
            showRole={true}
          />
        </>
      )}

      {!isEdit && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <p className="muted" style={{ fontSize: 12 }}>
            Riwayat Pendidikan dan Pengalaman Mengajar/Pelatihan bisa ditambahkan setelah biodata ini disimpan
            (kamu akan otomatis diarahkan ke halaman Edit-nya).
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          className="primary-button"
          type="button"
          disabled={submitting}
          onClick={() => document.getElementById('facilitator-form')?.requestSubmit()}
          style={{ marginTop: 0 }}
        >
          {submitting ? (submitStep || 'Menyimpan...') : isEdit ? 'Simpan Perubahan' : 'Simpan Fasilitator'}
        </button>
        <button type="button" className="outline-button" onClick={() => onNavigate?.('fasilitator')} disabled={submitting}>
          Batal
        </button>
      </div>
    </section>
    {photoCropFile && <PhotoCropModal file={photoCropFile} onCancel={() => setPhotoCropFile(null)} onSave={(file) => { setPhotoFile(file); setPhotoCropFile(null) }} />}
    </>
  )
}

function PhotoCropModal({ file, onCancel, onSave }) {
  const [source, setSource] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)
  const frame = { width: 240, height: 320 }

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { setSource(url); setImageSize({ width: image.naturalWidth, height: image.naturalHeight }); setZoom(1); setOffset({ x: 0, y: 0 }) }
    image.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const scale = imageSize.width && imageSize.height ? Math.max(frame.width / imageSize.width, frame.height / imageSize.height) : 1
  const rendered = { width: imageSize.width * scale * zoom, height: imageSize.height * scale * zoom }
  const limits = { x: Math.max(0, (rendered.width - frame.width) / 2), y: Math.max(0, (rendered.height - frame.height) / 2) }

  function moveImage(event) {
    if (!dragRef.current) return
    const next = { x: dragRef.current.startX + event.clientX - dragRef.current.clientX, y: dragRef.current.startY + event.clientY - dragRef.current.clientY }
    setOffset({ x: Math.min(limits.x, Math.max(-limits.x, next.x)), y: Math.min(limits.y, Math.max(-limits.y, next.y)) })
  }

  function startDrag(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = { clientX: event.clientX, clientY: event.clientY, startX: offset.x, startY: offset.y }
  }

  function stopDrag() { dragRef.current = null }

  function saveCrop() {
    if (!source || !imageSize.width) return
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 900
      canvas.height = 1200
      const context = canvas.getContext('2d')
      const displayScale = scale * zoom
      const sourceX = Math.max(0, Math.min(imageSize.width - frame.width / displayScale, -offset.x / displayScale))
      const sourceY = Math.max(0, Math.min(imageSize.height - frame.height / displayScale, -offset.y / displayScale))
      context.drawImage(image, sourceX, sourceY, frame.width / displayScale, frame.height / displayScale, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => blob && onSave(new File([blob], file.name.replace(/\.[^.]+$/, '') + '-3x4.jpg', { type: 'image/jpeg' })), 'image/jpeg', .92)
    }
    image.src = source
  }

  return <Modal open title="Atur Foto 3 × 4" onClose={onCancel}>
    <div className="photo-cropper">
      <p className="modal-intro">Geser foto untuk menentukan posisi yang paling sesuai.</p>
      <div className="photo-crop-frame" style={{ width: frame.width, height: frame.height }} onPointerDown={startDrag} onPointerMove={moveImage} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
        {source && <img src={source} alt="Pratinjau foto" draggable="false" style={{ width: rendered.width, height: rendered.height, left: (frame.width - rendered.width) / 2 + offset.x, top: (frame.height - rendered.height) / 2 + offset.y }} />}
      </div>
      <label className="photo-crop-zoom"><span>Perbesar foto</span><input type="range" min="1" max="2.5" step="0.01" value={zoom} onChange={(event) => { setZoom(Number(event.target.value)); setOffset({ x: 0, y: 0 }) }} /></label>
      <div className="modal-footer photo-crop-actions"><button type="button" className="primary-button" onClick={saveCrop} disabled={!source}>Gunakan Foto</button><button type="button" className="outline-button" onClick={onCancel}>Batal</button></div>
    </div>
  </Modal>
}

