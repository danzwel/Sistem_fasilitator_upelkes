import { useState } from 'react'

// Beda dari Riwayat Pendidikan/Pelatihan, "competencies" itu bagian dari
// payload utama fasilitator (POST/PUT /api/facilitators), BUKAN endpoint
// terpisah. Jadi komponen ini cuma ngedit array di state form induk
// (controlled: value + onChange), baru beneran kesimpen pas tombol
// "Simpan Fasilitator" utama diklik. Pola interaksinya disamain kayak
// EducationSection/TrainingSection: form collapse, buka pas klik "+ Tambah".

export function CompetencySection({ value = [], onChange }) {
  const [formOpen, setFormOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftYear, setDraftYear] = useState('')

  function addItem(e) {
    e.preventDefault()
    if (!draftName.trim()) return
    onChange([
      ...value,
      { name: draftName.trim(), startedTeachingYear: draftYear ? Number(draftYear) : null },
    ])
    setDraftName('')
    setDraftYear('')
    setFormOpen(false)
  }

  function removeItem(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div className="panel-heading">
        <h3>Materi yang Diajarkan</h3>
        {!formOpen && (
          <button type="button" className="text-button" onClick={() => setFormOpen(true)}>+ Tambah</button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={addItem}
          style={{ background: '#211a30', border: '1px solid #3e3451', borderRadius: 12, padding: 16, marginBottom: 16 }}
        >
          <div className="form-grid">
            <label className="form-field">
              <span>Nama Materi <span className="required-mark">*</span></span>
              <input type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Manajemen Pelatihan" />
            </label>
            <label className="form-field">
              <span>Tahun Mulai Mengajar</span>
              <input type="number" value={draftYear} onChange={(e) => setDraftYear(e.target.value)} placeholder="2018" />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="primary-button" type="submit" style={{ marginTop: 0 }}>Simpan</button>
            <button type="button" className="outline-button" onClick={() => { setFormOpen(false); setDraftName(''); setDraftYear('') }}>
              Batal
            </button>
          </div>
        </form>
      )}

      {value.length === 0 ? (
        <p className="muted" style={{ fontSize: 12 }}>Belum ada materi ditambahkan.</p>
      ) : (
        <div style={{ display: 'grid', gap: 2 }}>
          {value.map((item, i) => (
            <div key={i} className="activity-row">
              <div style={{ flex: 1 }}>
                <div className="table-primary">{item.name}</div>
                {item.startedTeachingYear && <div className="table-secondary">sejak {item.startedTeachingYear}</div>}
              </div>
              <button type="button" className="text-button" style={{ color: '#e6a8bd' }} onClick={() => removeItem(i)}>
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}