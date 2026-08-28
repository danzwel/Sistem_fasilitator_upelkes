import { useState } from 'react'
import { competencyCatalog } from '../data/competencyCatalog'

// Beda dari Riwayat Pendidikan/Pelatihan, "competencies" itu bagian dari
// payload utama fasilitator (POST/PUT /api/facilitators), BUKAN endpoint
// terpisah. Jadi komponen ini cuma ngedit array di state form induk
// (controlled: value + onChange), baru beneran kesimpen pas tombol
// "Simpan Fasilitator" utama diklik. Pola interaksinya disamain kayak
// EducationSection/TrainingSection: form collapse, buka pas klik "+ Tambah".

export function CompetencySection({ value = [], onChange, catalog = [] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [search, setSearch] = useState('')

  const selectedNames = value.map((item) => typeof item === 'string' ? item : item.name).filter(Boolean)
  const options = [...new Set([...competencyCatalog, ...catalog, ...selectedNames])]
    .filter((name) => name.toLowerCase().includes(search.trim().toLowerCase()))

  function toggleItem(name) {
    if (selectedNames.includes(name)) onChange(value.filter((item) => (typeof item === 'string' ? item : item.name) !== name))
    else onChange([...value, { name }])
  }

  function addCustomName() {
    const name = draftName.trim()
    if (!name || selectedNames.includes(name)) return
    onChange([...value, { name }])
    setDraftName('')
  }

  function removeItem(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div className="panel-heading">
        <h3>Bidang Pelatihan / Keahlian</h3>
        {!formOpen && (
          <button type="button" className="text-button" onClick={() => setFormOpen(true)}>+ Tambah</button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={(e) => { e.preventDefault(); setFormOpen(false); setSearch(''); setDraftName('') }}
          style={{ background: '#211a30', border: '1px solid #3e3451', borderRadius: 12, padding: 16, marginBottom: 16 }}
        >
          <div className="competency-picker">
            <label className="form-field"><span>Bidang pelatihan/keahlian (klik untuk memilih)</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari bidang pelatihan/keahlian..." /></label>
            <div className="competency-chips">
              {options.map((name) => <button type="button" key={name} className={`competency-chip ${selectedNames.includes(name) ? 'selected' : ''}`} onClick={() => toggleItem(name)}>{name}</button>)}
              {options.length === 0 && <small className="muted">Tidak ada bidang yang cocok.</small>}
            </div>
            <div className="form-field">
              <span>Tambah bidang baru</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <input style={{ flex: 1 }} type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomName() } }} placeholder="Ketik nama bidang baru" />
                <button type="button" className="outline-button" onClick={addCustomName} disabled={!draftName.trim()} style={{ marginTop: 0, whiteSpace: 'nowrap' }}>＋ Tambah bidang</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="primary-button" type="submit" style={{ marginTop: 0 }}>Simpan</button>
            <button type="button" className="outline-button" onClick={() => { setFormOpen(false); setDraftName(''); setSearch('') }}>
              Batal
            </button>
          </div>
        </form>
      )}

      {value.length === 0 ? (
          <p className="muted" style={{ fontSize: 12 }}>Belum ada bidang pelatihan/keahlian ditambahkan.</p>
      ) : (
        <div style={{ display: 'grid', gap: 2 }}>
          {value.map((item, i) => (
            <div key={i} className="activity-row">
              <div style={{ flex: 1 }}>
                <div className="table-primary">{item.name}</div>
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
