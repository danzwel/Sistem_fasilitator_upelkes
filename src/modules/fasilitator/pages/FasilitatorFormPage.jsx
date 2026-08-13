import { useEffect, useState } from 'react'
import { getFacilitatorById, createFacilitator, updateFacilitator } from '../api/facilitatorApi'

const EMPTY_FORM = {
  nama: '',
  gelar: '',
  tempatLahir: '',
  tanggalLahir: '',
  nik: '',
  nip: '',
  pangkatGolongan: '', // TODO: backend belum punya kolom ini, lihat catatan di handleSubmit
  jabatan: '',
  unitKerja: '',
  alamatKantor: '', // TODO: digabung manual ke satu field `address`, lihat catatan di handleSubmit
  alamatRumah: '',
  noHp: '',
  email: '',
}

// Backend cuma punya 1 field `birthInfo` & 1 field `address`, sedangkan
// form kita (mengikuti Template_CV_Narasumber) butuh masing-masing 2.
// Sambil nunggu Daniel nambah kolom, kita gabung jadi 1 string terformat
// supaya datanya nggak hilang, dan tetap bisa "dipecah lagi" pas nanti
// ditampilkan (lihat splitBirthInfo/splitAddress di bawah).
function combineBirthInfo(tempatLahir, tanggalLahir) {
  return [tempatLahir, tanggalLahir].filter(Boolean).join(', ')
}

function combineAddress(alamatKantor, alamatRumah) {
  const parts = []
  if (alamatKantor) parts.push(`Kantor: ${alamatKantor}`)
  if (alamatRumah) parts.push(`Rumah: ${alamatRumah}`)
  return parts.join(' | ')
}

const FIELD_GROUPS = [
  {
    title: 'Identitas',
    fields: [
      ['nama', 'Nama Lengkap', 'text', true],
      ['gelar', 'Gelar', 'text', false],
      ['tempatLahir', 'Tempat Lahir', 'text', false],
      ['tanggalLahir', 'Tanggal Lahir', 'date', false],
      ['nik', 'NIK', 'text', true],
      ['nip', 'NIP', 'text', false],
    ],
  },
  {
    title: 'Kepegawaian',
    fields: [
      ['pangkatGolongan', 'Pangkat / Golongan', 'text', false],
      ['jabatan', 'Jabatan', 'text', true],
      ['unitKerja', 'Unit Kerja', 'text', true],
    ],
  },
  {
    title: 'Kontak & Alamat',
    fields: [
      ['alamatKantor', 'Alamat Kantor', 'text', false],
      ['alamatRumah', 'Alamat Rumah', 'text', false],
      ['noHp', 'No. HP', 'text', true],
      ['email', 'Email', 'email', true],
    ],
  },
]

export function FasilitatorFormPage({ onNavigate, facilitatorId }) {
  const isEdit = Boolean(facilitatorId)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [pangkatWarningShown, setPangkatWarningShown] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    getFacilitatorById(facilitatorId)
      .then((f) => {
        setForm({
          nama: f.name ?? '',
          gelar: f.degree ?? '',
          tempatLahir: '', // birthInfo backend cuma 1 string, nggak otomatis kepisah balik
          tanggalLahir: '',
          nik: f.nik ?? '',
          nip: f.nip ?? '',
          pangkatGolongan: '',
          jabatan: f.position ?? '',
          unitKerja: f.unit ?? '',
          alamatKantor: '',
          alamatRumah: '',
          noHp: f.phone ?? '',
          email: f.email ?? '',
        })
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
        if (required && !form[key]?.trim()) {
          nextErrors[key] = `${label} wajib diisi`
        }
      }
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Format email tidak valid'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    // TODO(konfirmasi Daniel): pangkatGolongan nggak dikirim sama sekali
    // karena backend belum punya kolomnya. Data ini akan HILANG sampai
    // Daniel nambah field `pangkatGolongan`/`rank` di schema.
    const payload = {
      nama: form.nama,
      gelar: form.gelar,
      birthInfo: combineBirthInfo(form.tempatLahir, form.tanggalLahir),
      nik: form.nik,
      nip: form.nip,
      jabatan: form.jabatan,
      unitKerja: form.unitKerja,
      alamat: combineAddress(form.alamatKantor, form.alamatRumah), // digabung, lihat catatan di atas
      noHp: form.noHp,
      email: form.email,
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      if (isEdit) {
        await updateFacilitator(facilitatorId, payload)
      } else {
        await createFacilitator(payload)
      }
      onNavigate?.('fasilitator')
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="page-enter">
        <div className="empty-state">
          <span>◌</span>
          <p>Memuat data fasilitator...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page-enter">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MODUL SOFI</p>
          <h2>{isEdit ? 'Edit Fasilitator' : 'Tambah Fasilitator'}</h2>
          <p className="muted">
            {isEdit
              ? 'Perbarui biodata fasilitator.'
              : 'Isi biodata inti fasilitator. Riwayat pendidikan, materi, dan pelatihan ditambahkan setelah data ini tersimpan.'}
          </p>
        </div>
        <button className="outline-button" onClick={() => onNavigate?.('fasilitator')}>
          ← Kembali
        </button>
      </div>

      {submitError && (
        <div className="panel" style={{ borderColor: '#a84978', marginBottom: 18 }}>
          <strong style={{ color: '#e6a8bd' }}>Gagal menyimpan:</strong>{' '}
          <span className="muted">{submitError}</span>
        </div>
      )}

      <div className="panel" style={{ borderColor: '#ad6b40', marginBottom: 18 }}>
        <span className="muted">
          ⚠️ Field <strong>Pangkat/Golongan</strong> belum bisa disimpan — backend belum punya kolomnya.
          Field <strong>Alamat Kantor</strong> & <strong>Alamat Rumah</strong> untuk sementara digabung jadi satu
          teks (backend cuma punya 1 kolom alamat). Ini sudah dikonfirmasi ke Daniel.
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {FIELD_GROUPS.map((group) => (
          <div className="panel" key={group.title} style={{ marginBottom: 18 }}>
            <div className="panel-heading">
              <h3>{group.title}</h3>
            </div>
            <div className="form-grid">
              {group.fields.map(([key, label, type, required]) => (
                <label className="form-field" key={key}>
                  <span>
                    {label}
                    {required && <span className="required-mark"> *</span>}
                  </span>
                  <input
                    type={type}
                    value={form[key] ?? ''}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                  {errors[key] && <small className="field-error">{errors[key]}</small>}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Fasilitator'}
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={() => onNavigate?.('fasilitator')}
            disabled={submitting}
          >
            Batal
          </button>
        </div>
      </form>
    </section>
  )
}