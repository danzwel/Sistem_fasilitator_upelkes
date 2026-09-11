import { useState } from 'react'

// Beda dari Riwayat Pendidikan/Pelatihan, "competencies" itu bagian dari
// payload utama fasilitator (POST/PUT /api/facilitators), BUKAN endpoint
// terpisah. Jadi komponen ini cuma ngedit array di state form induk
// (controlled: value + onChange), baru beneran kesimpen pas tombol
// "Simpan Fasilitator" utama diklik. Pola interaksinya disamain kayak
// EducationSection/TrainingSection: form collapse, buka pas klik "+ Tambah".

export function CompetencySection({ value = [], onChange, trainingCatalog = [] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [trainingSearch, setTrainingSearch] = useState('')
  const [search, setSearch] = useState('')
  const [pickerError, setPickerError] = useState('')

  const selectedItems = value.map((item) => typeof item === 'string' ? { name: item, trainingName: '' } : item).filter((item) => item?.name)
  const selectedKeys = selectedItems.map((item) => `${item.trainingName || ''}::${item.name}`)
  const selectedTrainingNames = selectedItems.map((item) => item.trainingName).filter(Boolean)
  const trainingOptions = [...new Set([...trainingCatalog.map((item) => item.name), ...selectedTrainingNames])]
    .filter(Boolean)
    .filter((name) => name.toLowerCase().includes(trainingSearch.trim().toLowerCase()))
  const activeTraining = trainingCatalog.find((item) => item.name.toLowerCase() === trainingSearch.trim().toLowerCase())
  const trainingMaterials = activeTraining?.materials || []
  const options = [...new Set([...trainingMaterials, ...selectedItems.filter((item) => (item.trainingName || '').toLowerCase() === trainingSearch.trim().toLowerCase()).map((item) => item.name)])]
    .filter((name) => name.toLowerCase().includes(search.trim().toLowerCase()))

  function addMaterial(name = search) {
    const material = name.trim()
    const training = trainingSearch.trim()
    if (!training) return setPickerError('Pilih atau ketik pelatihan terlebih dahulu.')
    if (!material || selectedKeys.includes(`${training}::${material}`)) return
    onChange([...value, { name: material, trainingName: training }])
    setSearch('')
    setPickerError('')
  }

  function toggleItem(name) {
    if (!trainingSearch.trim()) return setPickerError('Pilih pelatihan terlebih dahulu.')
    const key = `${trainingSearch.trim()}::${name}`
    if (selectedKeys.includes(key)) onChange(value.filter((item) => `${item.trainingName || ''}::${item.name}` !== key))
    else addMaterial(name)
    setPickerError('')
  }

  function removeItem(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  function savePicker(event) {
    event.preventDefault()
    const material = search.trim()
    if (material) addMaterial(material)
    setFormOpen(false)
    setTrainingSearch('')
    setSearch('')
    setPickerError('')
  }

  const selectedTrainingGroups = [...new Set(selectedItems.map((item) => item.trainingName || 'Pelatihan belum ditentukan'))]

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div className="panel-heading">
        <h3>Pelatihan dan Materi yang Dikuasai</h3>
        {!formOpen && (
          <button type="button" className="text-button" onClick={() => setFormOpen(true)}>+ Tambah</button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={savePicker}
          className="competency-form"
        >
          <div className="competency-picker">
            <label className="form-field"><span>Pelatihan (cari, pilih, atau tambahkan)</span><input type="search" value={trainingSearch} onChange={(e) => { setTrainingSearch(e.target.value); setSearch(''); setPickerError('') }} placeholder="Cari nama pelatihan..." /></label>
            <div className="competency-option-list">
              {trainingOptions.map((name) => <button type="button" key={name} className={`competency-list-row ${trainingSearch.trim().toLowerCase() === name.toLowerCase() ? 'selected' : ''}`} onClick={() => { setTrainingSearch(name); setSearch(''); setPickerError('') }}><span>{name}</span><strong>{trainingCatalog.find((item) => item.name.toLowerCase() === name.toLowerCase())?.materials?.length || 0} materi</strong></button>)}
              {trainingSearch.trim() && !trainingCatalog.some((item) => item.name.toLowerCase() === trainingSearch.trim().toLowerCase()) && <button type="button" className="competency-list-row add-row" onClick={() => { setSearch(''); setPickerError('') }}><span>＋ Gunakan pelatihan baru: <b>{trainingSearch.trim()}</b></span><strong>Tambah</strong></button>}
              {!trainingOptions.length && !trainingSearch.trim() && <small className="muted">Belum ada daftar pelatihan. Ketik nama pelatihan untuk menambahkannya.</small>}
            </div>
            <label className="form-field"><span>Materi / mata pelatihan {trainingSearch.trim() && `untuk “${trainingSearch.trim()}”`}</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMaterial() } }} placeholder={trainingSearch ? 'Cari atau ketik materi baru, lalu tekan Enter...' : 'Pilih pelatihan terlebih dahulu...'} disabled={!trainingSearch.trim()} /></label>
            <div className="competency-option-list material-list">
              {options.map((name) => <button type="button" key={name} className={`competency-list-row ${selectedKeys.includes(`${trainingSearch.trim()}::${name}`) ? 'selected' : ''}`} onClick={() => toggleItem(name)}><span>{name}</span><strong>{selectedKeys.includes(`${trainingSearch.trim()}::${name}`) ? 'Dipilih' : 'Pilih'}</strong></button>)}
              {trainingSearch.trim() && search.trim() && !options.some((name) => name.toLowerCase() === search.trim().toLowerCase()) && <button type="button" className="competency-list-row add-row" onClick={() => addMaterial()}><span>＋ Gunakan materi baru: <b>{search.trim()}</b></span><strong>Tambah</strong></button>}
              {trainingSearch.trim() && options.length === 0 && !search.trim() && <small className="muted">Belum ada materi untuk pelatihan ini. Ketik materi baru di kolom pencarian.</small>}
            </div>
            {pickerError && <small className="field-error">{pickerError}</small>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="primary-button" type="submit" style={{ marginTop: 0 }}>Simpan</button>
          <button type="button" className="outline-button" onClick={() => { setFormOpen(false); setTrainingSearch(''); setSearch(''); setPickerError('') }}>
              Batal
            </button>
          </div>
        </form>
      )}

      {value.length === 0 ? (
          <p className="muted" style={{ fontSize: 12 }}>Belum ada materi/mata pelatihan yang ditambahkan ke fasilitator ini.</p>
      ) : (
        <div className="selected-material-groups">
          {selectedTrainingGroups.map((trainingName) => (
            <div className="selected-material-group" key={trainingName}>
              <strong>{trainingName}</strong>
              <div className="selected-material-list">
                {selectedItems.map((item, index) => item.trainingName === trainingName || (!item.trainingName && trainingName === 'Pelatihan belum ditentukan') ? (
                  <div className="selected-material-list-row" key={`${trainingName}-${item.name}-${index}`}><span>{item.name}</span><button type="button" className="text-button danger-text" onClick={() => removeItem(index)}>Hapus</button></div>
                ) : null)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
