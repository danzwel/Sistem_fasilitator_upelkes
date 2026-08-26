import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { getFacilitatorById, createFacilitator, updateFacilitator } from '../api/facilitatorApi'
import { uploadFacilitatorPhoto, uploadFacilitatorSignature } from '../api/facilitatorUploadApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'
import { EducationSection } from '../components/EducationSection'
import { CompetencySection } from '../components/CompetencySection'
import { TrainingSection } from '../components/TrainingSection'

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
  return (
    <label className="form-field">
      <span>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {previewUrl && <img src={previewUrl} alt={label} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)} />
        <button type="button" className="outline-button" onClick={() => inputRef.current?.click()}>
          {previewUrl ? 'Ganti file' : 'Pilih file'}
        </button>
      </div>
    </label>
  )
}

export function FasilitatorFormPage({ onNavigate, facilitatorId }) {
  const isEdit = Boolean(facilitatorId)

  const [form, setForm] = useState(EMPTY_FORM)
  const [competencies, setCompetencies] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitStep, setSubmitStep] = useState(null)

  const [photoFile, setPhotoFile] = useState(null)
  const [signatureFile, setSignatureFile] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [existingSignatureUrl, setExistingSignatureUrl] = useState(null)

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
        setExistingPhotoUrl(f.photoUrl ?? null)
        setExistingSignatureUrl(f.signatureUrl ?? null)
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

      if (uploadWarnings.length > 0) {
        setSubmitError(`Biodata tersimpan, tapi ada masalah: ${uploadWarnings.join(' ')} Kamu bisa unggah ulang dari sini.`)
        setSubmitting(false)
        setSubmitStep(null)
        return
      }

      onNavigate?.(isEdit ? 'fasilitator-detail' : 'fasilitator-edit', savedId)
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
    <section className="page-enter">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MODUL SOFI</p>
          <h2>{isEdit ? 'Edit Fasilitator' : 'Tambah Fasilitator'}</h2>
          <p className="muted">Isi biodata, foto, TTD, materi, riwayat pendidikan, dan pengalaman mengajar.</p>
        </div>
        <button className="outline-button" onClick={() => onNavigate?.(isEdit ? 'fasilitator-detail' : 'fasilitator', facilitatorId)}>
          ← Kembali
        </button>
      </div>

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
            <FileSlot label="Foto" previewUrl={photoFile ? URL.createObjectURL(photoFile) : resolveAssetUrl(existingPhotoUrl)} onSelect={setPhotoFile} />
            <FileSlot label="TTD" previewUrl={signatureFile ? URL.createObjectURL(signatureFile) : resolveAssetUrl(existingSignatureUrl)} onSelect={setSignatureFile} />
          </div>
        </div>
      </form>

      <CompetencySection value={competencies} onChange={setCompetencies} />

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
        <button className="primary-button" type="submit" form="facilitator-form" disabled={submitting} style={{ marginTop: 0 }}>
          {submitting ? (submitStep || 'Menyimpan...') : isEdit ? 'Simpan Perubahan' : 'Simpan Fasilitator'}
        </button>
        <button type="button" className="outline-button" onClick={() => onNavigate?.('fasilitator')} disabled={submitting}>
          Batal
        </button>
      </div>
    </section>
  )
}
