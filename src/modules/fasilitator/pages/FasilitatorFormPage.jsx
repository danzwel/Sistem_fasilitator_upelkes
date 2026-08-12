import { useState } from 'react'
import { fasilitatorList, getFasilitatorById } from '../data/fasilitatorData'
import { createFacilitator, updateFacilitator } from '../api/facilitatorApi'

const EMPTY_FORM = {
  nama: '',
  gelar: '',
  tempatLahir: '',
  tanggalLahir: '',
  nik: '',
  nip: '',
  pangkatGolongan: '',
  jabatan: '',
  unitKerja: '',
  alamatKantor: '',
  alamatRumah: '',
  noHp: '',
  email: '',
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
  const existing = isEdit ? getFasilitatorById(facilitatorId) : null

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...(existing ?? {}) }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

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

    setSubmitting(true)
    setSubmitError(null)
    try {
      if (isEdit) {
        await updateFacilitator(facilitatorId, form)
        const idx = fasilitatorList.findIndex((f) => f.id === facilitatorId)
        if (idx !== -1) fasilitatorList[idx] = { ...fasilitatorList[idx], ...form }
      } else {
        await createFacilitator(form)
        fasilitatorList.unshift({
          ...form,
          id: `fas-${Date.now()}`,
          statusKelengkapan: 'belum_lengkap',
        })
      }
      onNavigate?.('fasilitator')
    } catch (err) {
      // Backend Daniel mungkin belum siap / endpoint belum sesuai kontrak.
      // Tampilkan errornya apa adanya, jangan sok tahu alasannya.
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
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