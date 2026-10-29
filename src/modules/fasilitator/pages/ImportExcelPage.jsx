import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { getFacilitators, createFacilitator, updateFacilitator } from '../api/facilitatorApi'
import { createTraining, getTrainings } from '../../training/api/trainingApi'
import { createEducation, getEducations } from '../api/educationApi'

// Alias header kolom Excel (huruf besar/kecil & variasi penulisan bebas)
// dipetakan ke field internal kita. Tambahin alias baru di sini kalau
// Adpen pakai penamaan kolom yang beda.
const HEADER_ALIASES = {
  nama: 'nama', 'nama lengkap': 'nama', 'nama fasilitator': 'nama', 'nama narasumber': 'nama',
  email: 'email', 'alamat email': 'email',
  'no hp': 'noHp', 'nomor hp': 'noHp', 'no. hp': 'noHp', 'no hp/wa': 'noHp', 'nomor whatsapp': 'noHp', hp: 'noHp', telepon: 'noHp', whatsapp: 'noHp',
  nik: 'nik',
  nip: 'nip',
  gelar: 'gelar', 'gelar akademik': 'gelar',
  'tempat lahir': 'tempatLahir', 'kota lahir': 'tempatLahir',
  'tanggal lahir': 'tanggalLahir', 'tgl lahir': 'tanggalLahir', 'tanggal lahir (dd-mm-yyyy)': 'tanggalLahir',
  'pangkat/golongan': 'pangkatGolongan', 'pangkat golongan': 'pangkatGolongan', 'pangkat/gol': 'pangkatGolongan', 'golongan': 'pangkatGolongan',
  jabatan: 'jabatan', 'jabatan terakhir': 'jabatan',
  'unit kerja': 'unitKerja', 'satuan kerja': 'unitKerja', 'instansi': 'unitKerja',
  'alamat kantor': 'alamatKantor', 'alamat instansi': 'alamatKantor',
  'alamat rumah': 'alamatRumah', 'alamat domisili': 'alamatRumah',
  'institusi pendidikan': 'educationInstitution', universitas: 'educationInstitution', institusi: 'educationInstitution',
  'jenjang/program studi': 'educationDegree', 'jenjang / program studi': 'educationDegree', 'program studi': 'educationDegree',
  'pelatihan yang pernah diikuti': 'attendedTrainingName', 'nama pelatihan yang pernah diikuti': 'attendedTrainingName',
  'materi pelatihan yang pernah diikuti': 'attendedTrainingMaterial',
  'penyelenggara pelatihan yang pernah diikuti': 'attendedTrainingOrganizer',
  'tanggal pelatihan yang pernah diikuti': 'attendedTrainingDate',
  pelatihan: 'teachingTrainingName', 'nama pelatihan': 'teachingTrainingName', 'pelatihan dikuasai': 'teachingTrainingName', 'pelatihan yang diajarkan': 'teachingTrainingName', 'nama pelatihan yang diajarkan': 'teachingTrainingName',
  materi: 'teachingMaterial', 'materi pelatihan': 'teachingMaterial', 'materi yang dikuasai': 'teachingMaterial', 'materi yang diajarkan': 'teachingMaterial', 'materi pelatihan yang diajarkan': 'teachingMaterial',
  'pengalaman melatih/mengajar - nama pelatihan/kegiatan': 'teachingTrainingName',
  'pengalaman melatih/mengajar - materi': 'teachingMaterial',
  'pengalaman melatih/mengajar - peran': 'teachingRole',
  'pengalaman melatih/mengajar - penyelenggara': 'teachingOrganizer',
  'pengalaman melatih/mengajar - tanggal mulai': 'teachingStartDate',
  'pengalaman melatih/mengajar - tanggal selesai': 'teachingEndDate',
  'pengalaman melatih/mengajar - jumlah peserta': 'teachingParticipantCount',
}

const REQUIRED_FIELDS = ['nama']

const TEMPLATE_HEADERS = [
  'Nama', 'Email', 'No HP/WA', 'NIK', 'NIP', 'Gelar', 'Tempat Lahir',
  'Tanggal Lahir (DD-MM-YYYY)', 'Pangkat/Golongan', 'Jabatan', 'Unit Kerja',
  'Alamat Kantor', 'Alamat Rumah', 'Institusi Pendidikan', 'Jenjang/Program Studi',
  'Pelatihan yang Pernah Diikuti', 'Materi Pelatihan yang Pernah Diikuti', 'Penyelenggara Pelatihan yang Pernah Diikuti', 'Tanggal Pelatihan yang Pernah Diikuti',
  'Pengalaman Melatih/Mengajar - Nama Pelatihan/Kegiatan', 'Pengalaman Melatih/Mengajar - Materi', 'Pengalaman Melatih/Mengajar - Peran',
  'Pengalaman Melatih/Mengajar - Penyelenggara', 'Pengalaman Melatih/Mengajar - Tanggal Mulai', 'Pengalaman Melatih/Mengajar - Tanggal Selesai', 'Pengalaman Melatih/Mengajar - Jumlah Peserta',
]

const TEMPLATE_INSTRUCTIONS = [
  ['Template Import Data Fasilitator'],
  ['Cara penggunaan'],
  ['1. Isi data pada sheet "Data Fasilitator". Kolom Nama wajib diisi.'],
  ['2. Gunakan format tanggal DD-MM-YYYY, misalnya 17-08-1990. Untuk NIK dan No HP, atur format sel sebagai Text agar angka 0 di awal tidak hilang.'],
  ['3. Riwayat pendidikan diisi melalui Institusi Pendidikan dan Jenjang/Program Studi. Bila lebih dari satu, pisahkan tiap data dengan titik koma (;) secara berurutan.'],
  ['4. Pelatihan yang Pernah Diikuti memerlukan nama, materi, penyelenggara, dan tanggal. Sertifikat tidak perlu diisi lewat Excel dan dapat ditambahkan kemudian.'],
  ['5. Pengalaman Melatih/Mengajar diisi pada kelompok kolomnya sendiri. Gunakan nomor 1., 2. untuk pelatihan dan 1.1, 1.2, 2.1 untuk materinya.'],
  ['6. Contoh pengalaman mengajar: "1. Pelatihan A; 2. Pelatihan B" serta "1.1 Materi A1; 1.2 Materi A2; 2.1 Materi B1".'],
  ['7. Jika ada lebih dari satu pengalaman, isi Peran, Penyelenggara, Tanggal Mulai/Selesai, dan Jumlah Peserta dengan urutan yang sama seperti pelatihannya.'],
  ['8. Jangan ubah nama kolom pada baris pertama. Kolom yang tidak digunakan boleh dikosongkan.'],
]

function normalizeHeader(header) {
  return String(header ?? '').trim().toLowerCase().replace(/[\u00a0]/g, ' ').replace(/\s+/g, ' ')
}

function normalizeDate(value) {
  if (typeof value === 'number' && value > 20000) {
    const date = XLSX.SSF.parse_date_code(value)
    return date ? `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}` : String(value)
  }
  const text = String(value ?? '').trim()
  const match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : text
}

function mapRowToFacilitator(rawRow, headerMap) {
  const result = {}
  for (const [colIndex, field] of Object.entries(headerMap)) {
    const value = rawRow[colIndex]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      result[field] = ['tanggalLahir', 'attendedTrainingDate', 'teachingStartDate', 'teachingEndDate'].includes(field)
        ? splitValues(value).map(normalizeDate).join('; ')
        : field === 'noHp'
          ? normalizePhone(value)
          : String(value).trim()
    }
  }
  return result
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email)
}

function isValidPhone(phone) {
  return /^\+?\d{8,20}$/.test(normalizePhone(phone))
}

function normalizePhone(value) {
  // Nomor dari Excel sering ditulis 0812-3456-7890, 0812.3456.7890,
  // atau diberi pemisah ribuan oleh format sel. Semuanya adalah nomor
  // yang sama untuk kebutuhan validasi dan penyimpanan.
  const valueWithoutSeparator = String(value ?? '').trim().replace(/[()\s.,-]/g, '')
  // Excel dapat menghapus angka 0 pertama bila nomor diketik sebagai angka.
  // Anggap angka lokal Indonesia yang diawali 8 sebagai nomor 08….
  return /^8\d{7,12}$/.test(valueWithoutSeparator) ? `0${valueWithoutSeparator}` : valueWithoutSeparator
}

function splitValues(value) {
  return String(value ?? '').split(/[;\n]/).map((item) => item.trim()).filter(Boolean)
}

function parseNumberedItem(value, type) {
  const text = String(value ?? '').trim()
  const materialMatch = text.match(/^(\d+)\s*[.)]\s*(\d+)\s*[.)]?\s*(.+)$/)
  if (type === 'material' && materialMatch) {
    return { parentNumber: materialMatch[1], itemNumber: materialMatch[2], text: materialMatch[3].trim() }
  }
  const trainingMatch = text.match(/^(\d+)\s*[.)]\s*(.+)$/)
  if (type === 'training' && trainingMatch && !/^\d+\s*[.)]\s*\d+\s*[.)]?\s+/.test(text)) {
    return { parentNumber: trainingMatch[1], text: trainingMatch[2].trim() }
  }
  return { text }
}

function buildTrainingRelations(data) {
  const trainingItems = splitValues(data.trainingName)
    .map((value, index) => ({ ...parseNumberedItem(value, 'training'), index }))
    .filter((item) => item.text)
  const materialItems = splitValues(data.material)
    .map((value, index) => ({ ...parseNumberedItem(value, 'material'), index }))
    .filter((item) => item.text)
  const trainingByNumber = new Map()
  trainingItems.forEach((item, index) => trainingByNumber.set(item.parentNumber || String(index + 1), item.text))

  const errors = []
  const relations = []
  if (!trainingItems.length && materialItems.length) errors.push('Materi diisi, tetapi Pelatihan belum diisi')

  for (const material of materialItems) {
    let trainingName
    let trainingNumber
    if (material.parentNumber) {
      trainingName = trainingByNumber.get(material.parentNumber)
      trainingNumber = material.parentNumber
      if (!trainingName) {
        errors.push(`Materi ${material.parentNumber}.${material.itemNumber} tidak menemukan Pelatihan ${material.parentNumber}`)
        continue
      }
    } else if (trainingItems.length === 1) {
      trainingName = trainingItems[0].text
      trainingNumber = trainingItems[0].parentNumber || '1'
    } else {
      trainingName = trainingItems[material.index]?.text
      trainingNumber = trainingItems[material.index]?.parentNumber || String(material.index + 1)
      if (!trainingName) {
        errors.push(`Materi "${material.text}" belum memiliki nomor pelatihan`)
        continue
      }
    }
    relations.push({ name: trainingName, material: material.text, trainingNumber })
  }

  if (!materialItems.length) trainingItems.forEach((training, index) => relations.push({ name: training.text, material: '', trainingNumber: training.parentNumber || String(index + 1) }))
  const seen = new Set()
  return {
    errors,
    relations: relations.filter((relation) => {
      const key = `${relation.name.toLowerCase()}|${relation.material.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
  }
}

function buildValuesByTrainingNumber(value) {
  return new Map(splitValues(value).map((item, index) => {
    const parsed = parseNumberedItem(item, 'training')
    return [parsed.parentNumber || String(index + 1), parsed.text]
  }))
}

function valueForTraining(values, trainingNumber) {
  return values.get(trainingNumber) || (values.size === 1 ? values.values().next().value : '')
}

function buildTeachingExperiences(data) {
  const relationResult = buildTrainingRelations({ trainingName: data.teachingTrainingName, material: data.teachingMaterial })
  if (!relationResult.relations.length) return relationResult
  const roles = buildValuesByTrainingNumber(data.teachingRole)
  const organizers = buildValuesByTrainingNumber(data.teachingOrganizer)
  const startDates = buildValuesByTrainingNumber(data.teachingStartDate)
  const endDates = buildValuesByTrainingNumber(data.teachingEndDate)
  const participantCounts = buildValuesByTrainingNumber(data.teachingParticipantCount)
  const errors = [...relationResult.errors]
  const items = relationResult.relations.map((relation) => {
    const startDate = valueForTraining(startDates, relation.trainingNumber)
    const endDate = valueForTraining(endDates, relation.trainingNumber)
    const participantCount = valueForTraining(participantCounts, relation.trainingNumber)
    if (!relation.material) errors.push(`Materi wajib diisi untuk pengalaman "${relation.name}"`)
    if (!startDate || !endDate) errors.push(`Tanggal mulai dan selesai wajib diisi untuk pengalaman "${relation.name}"`)
    if (startDate && endDate && endDate < startDate) errors.push(`Tanggal selesai pengalaman "${relation.name}" tidak boleh sebelum tanggal mulai`)
    if (participantCount && (!Number.isInteger(Number(participantCount)) || Number(participantCount) < 0)) errors.push(`Jumlah peserta pengalaman "${relation.name}" harus berupa angka positif`)
    return {
      name: relation.name,
      material: relation.material,
      role: valueForTraining(roles, relation.trainingNumber),
      organizer: valueForTraining(organizers, relation.trainingNumber),
      startDate,
      endDate,
      participantCount: participantCount === '' ? null : Number(participantCount),
    }
  })
  return { errors: [...new Set(errors)], relations: items }
}

function buildCompetencies(relations) {
  return {
    trainingNames: [...new Set(relations.map((relation) => relation.name))],
    competencies: relations
      .filter((relation) => relation.material)
      .map((relation) => ({ name: relation.material, trainingName: relation.name })),
  }
}

function buildEducations(data) {
  const institutions = splitValues(data.educationInstitution)
  const degrees = splitValues(data.educationDegree)
  const errors = []
  if (!institutions.length && degrees.length) errors.push('Jenjang/program studi diisi, tetapi institusi pendidikan belum diisi')
  if (institutions.length && !degrees.length) errors.push('Jenjang/program studi wajib diisi untuk setiap institusi pendidikan')
  if (institutions.length && degrees.length && institutions.length !== degrees.length) errors.push('Jumlah institusi pendidikan dan jenjang/program studi harus sama')
  return {
    errors,
    items: institutions.map((institution, index) => ({ institution, degree: degrees[index] || '' })),
  }
}

function buildAttendedTrainings(data) {
  const names = splitValues(data.attendedTrainingName)
  const materials = splitValues(data.attendedTrainingMaterial)
  const organizers = splitValues(data.attendedTrainingOrganizer)
  const dates = splitValues(data.attendedTrainingDate)
  const errors = []
  const values = [materials, organizers, dates]
  if (!names.length && values.some((list) => list.length)) errors.push('Data pelatihan yang pernah diikuti belum memiliki nama pelatihan')
  if (names.length && values.some((list) => list.length !== names.length)) errors.push('Nama, materi, penyelenggara, dan tanggal pelatihan yang pernah diikuti harus berjumlah sama')
  const items = names.map((name, index) => ({ name, material: materials[index] || '', organizer: organizers[index] || '', date: dates[index] || '' }))
  items.forEach((training) => {
    if (training.date && !/^\d{4}-\d{2}-\d{2}$/.test(training.date)) errors.push(`Tanggal pelatihan "${training.name}" harus berformat DD-MM-YYYY`)
  })
  return { errors: [...new Set(errors)], items }
}

function validateRow(row, existingByKey, seenInFileKeys) {
  const errors = []

  if (!row.nama) errors.push('Nama kosong')
  if (row.email && !isValidEmail(row.email)) errors.push('Format email tidak valid')
  if (row.noHp && !isValidPhone(row.noHp)) errors.push('Format No. HP tidak valid')
  const teachingExperiences = buildTeachingExperiences(row)
  errors.push(...teachingExperiences.errors)
  const educations = buildEducations(row)
  errors.push(...educations.errors)
  const attendedTrainings = buildAttendedTrainings(row)
  errors.push(...attendedTrainings.errors)

  if (errors.length > 0) {
    return { status: 'error', errors }
  }

  const dupeKey = row.email?.toLowerCase() || row.nik
  if (dupeKey) {
    if (seenInFileKeys.has(dupeKey)) {
      return { status: 'error', errors: ['Duplikat dengan baris lain di file ini'] }
    }
    if (existingByKey.has(dupeKey)) {
      return { status: 'duplicate', errors: [], existingId: existingByKey.get(dupeKey) }
    }
    seenInFileKeys.add(dupeKey)
  }

  return { status: 'valid', errors: [], teachingExperiences: teachingExperiences.relations, educations: educations.items, attendedTrainings: attendedTrainings.items }
}

export function ImportExcelPage({ onNavigate }) {
  const fileInputRef = useRef(null)
  const [fileName, setFileName] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [rows, setRows] = useState([]) // { data, status, errors, existingId, action }
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  function downloadTemplate() {
    const dataSheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, Array(TEMPLATE_HEADERS.length).fill('')])
    dataSheet['!cols'] = [26, 28, 16, 20, 20, 18, 18, 25, 20, 24, 26, 34, 34, 32, 30, 32, 32, 32, 28, 36, 32, 28, 32, 24, 24, 20].map((wch) => ({ wch }))
    dataSheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: TEMPLATE_HEADERS.length - 1 } }) }
    dataSheet['!freeze'] = { xSplit: 0, ySplit: 1 }

    const instructionSheet = XLSX.utils.aoa_to_sheet(TEMPLATE_INSTRUCTIONS)
    instructionSheet['!cols'] = [{ wch: 120 }]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data Fasilitator')
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Petunjuk')
    XLSX.writeFile(workbook, 'template-import-fasilitator.xlsx')
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setFileName(file.name)
    setParseError(null)
    setImportResult(null)
    setParsing(true)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      // `raw: false` mempertahankan angka yang diberi format teks di Excel,
      // terutama No. HP dan NIK yang sering diawali angka 0.
      const raw = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false, dateNF: 'dd-mm-yyyy' })

      if (raw.length < 2) {
        setParseError('File kosong atau tidak ada baris data setelah header.')
        setParsing(false)
        return
      }

      const headerRow = raw[0]
      const headerMap = {}
      headerRow.forEach((h, i) => {
        const normalized = normalizeHeader(h)
        const field = HEADER_ALIASES[normalized]
        if (field) headerMap[i] = field
      })

      const missingRequired = REQUIRED_FIELDS.filter((f) => !Object.values(headerMap).includes(f))
      if (missingRequired.length > 0) {
        setParseError(`Kolom wajib tidak ditemukan di file: ${missingRequired.join(', ')}. Pastikan ada kolom "Nama" di baris header.`)
        setParsing(false)
        return
      }

      const existingFacilitators = await getFacilitators()
      const existingByKey = new Map()
      existingFacilitators.forEach((f) => {
        if (f.email) existingByKey.set(f.email, f.id)
        if (f.nik) existingByKey.set(f.nik, f.id)
      })
      const seenInFileKeys = new Set()

      const dataRows = raw.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== ''))
      const processed = dataRows.map((rawRow) => {
        const data = mapRowToFacilitator(rawRow, headerMap)
        const validation = validateRow(data, existingByKey, seenInFileKeys)
        return {
          data,
          action: 'skip',
          teachingExperiences: validation.teachingExperiences || buildTeachingExperiences(data).relations,
          educations: validation.educations || buildEducations(data).items,
          attendedTrainings: validation.attendedTrainings || buildAttendedTrainings(data).items,
          ...validation,
        }
      })

      setRows(processed)
    } catch (err) {
      setParseError(`Gagal membaca file: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }

  function updateRowAction(index, action) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, action } : r)))
  }

  const summary = {
    valid: rows.filter((r) => r.status === 'valid').length,
    duplicate: rows.filter((r) => r.status === 'duplicate').length,
    error: rows.filter((r) => r.status === 'error').length,
  }

  async function handleImport() {
    setImporting(true)
    const result = { created: 0, updated: 0, skipped: 0, educationCreated: 0, attendedTrainingCreated: 0, teachingExperienceCreated: 0, failed: [] }

    for (const row of rows) {
      if (row.status === 'error') {
        result.skipped++
        continue
      }
      if (row.status === 'duplicate' && row.action === 'skip') {
        result.skipped++
        continue
      }
      try {
        const payload = {
          name: row.data.nama,
          degree: row.data.gelar,
          birthInfo: [row.data.tempatLahir, row.data.tanggalLahir].filter(Boolean).join(', ') || undefined,
          nik: row.data.nik,
          nip: row.data.nip,
          rank: row.data.pangkatGolongan,
          position: row.data.jabatan,
          unit: row.data.unitKerja,
          officeAddress: row.data.alamatKantor,
          homeAddress: row.data.alamatRumah,
          phone: row.data.noHp,
          email: row.data.email?.toLowerCase(),
          ...buildCompetencies(row.teachingExperiences),
        }
        let facilitatorId
        if (row.status === 'duplicate' && row.action === 'update') {
          await updateFacilitator(row.existingId, payload)
          facilitatorId = row.existingId
          result.updated++
        } else {
          facilitatorId = (await createFacilitator(payload)).id
          result.created++
        }
        if (row.teachingExperiences.length) {
          const existingRelations = new Set((await getTrainings(facilitatorId)).filter((training) => training.category === 'teaching_experience').map((training) => `${training.name.trim().toLowerCase()}|${(training.material || '').trim().toLowerCase()}`))
          for (const experience of row.teachingExperiences) {
            const key = `${experience.name.toLowerCase()}|${experience.material.toLowerCase()}`
            if (existingRelations.has(key)) continue
            await createTraining(facilitatorId, { ...experience, date: experience.startDate, category: 'teaching_experience', catalogOnly: false })
            result.teachingExperienceCreated++
          }
        }
        if (row.educations.length) {
          const existingEducations = new Set((await getEducations(facilitatorId)).map((education) => `${education.institution.trim().toLowerCase()}|${(education.degree || '').trim().toLowerCase()}`))
          for (const education of row.educations) {
            const key = `${education.institution.toLowerCase()}|${education.degree.toLowerCase()}`
            if (existingEducations.has(key)) continue
            await createEducation(facilitatorId, education)
            result.educationCreated++
          }
        }
        if (row.attendedTrainings.length) {
          const existingAttendances = new Set((await getTrainings(facilitatorId)).filter((training) => training.category === 'related_training').map((training) => `${training.name.trim().toLowerCase()}|${(training.material || '').trim().toLowerCase()}`))
          for (const training of row.attendedTrainings) {
            const key = `${training.name.toLowerCase()}|${training.material.toLowerCase()}`
            if (existingAttendances.has(key)) continue
            await createTraining(facilitatorId, { ...training, category: 'related_training', catalogOnly: true })
            result.attendedTrainingCreated++
          }
        }
      } catch (err) {
        result.failed.push({ nama: row.data.nama, message: err.message })
      }
    }

    setImportResult(result)
    setImporting(false)
  }

  function reset() {
    setFileName(null)
    setRows([])
    setParseError(null)
    setImportResult(null)
  }

  return (
    <section className="page-enter">
      <div className="welcome-row import-hero">
        <div>
          <h2>Import Excel</h2>
          <p className="muted">Upload file, cek dulu hasil validasinya, baru konfirmasi import.</p>
        </div>
        <button className="outline-button" onClick={() => onNavigate?.('fasilitator')}>← Kembali</button>
      </div>

      {!fileName && (
        <div className="panel import-step">
          <div className="panel-heading"><h3><span className="import-step-number">1</span> Upload File Excel</h3></div>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelect} />
          <div className="import-upload-zone">
            <div className="import-upload-icon" aria-hidden="true">↑</div>
            <div className="import-upload-copy">
              <strong>Mulai dari file Excel</strong>
              <p>Pilih file .xlsx atau .xls berisi data fasilitator untuk diproses.</p>
              <small>Kolom wajib: Nama · pendidikan dan pelatihan pernah diikuti bisa diisi dari Excel</small>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="primary-button" onClick={() => fileInputRef.current?.click()}>Pilih File Excel</button>
              <button type="button" className="outline-button" onClick={downloadTemplate}>↓ Unduh Template</button>
            </div>
          </div>
          <p className="import-upload-note">Template mencakup biodata, riwayat pendidikan, pelatihan yang pernah diikuti, dan pengalaman melatih/mengajar sebagai kelompok kolom terpisah. Untuk pengalaman mengajar, gunakan <strong>1. Pelatihan A</strong>, <strong>2. Pelatihan B</strong>, kemudian <strong>1.1 Materi A1</strong>, <strong>1.2 Materi A2</strong>, <strong>2.1 Materi B1</strong>. Foto, TTD, dan sertifikat diunggah kemudian dari halaman Edit.</p>
        </div>
      )}

      {parsing && (
        <div className="panel"><div className="empty-state"><span>◌</span><p>Membaca & memvalidasi file...</p></div></div>
      )}

      {parseError && (
        <div className="panel" style={{ borderColor: '#a84978' }}>
          <strong style={{ color: '#e6a8bd' }}>File tidak bisa diproses:</strong>{' '}
          <span className="muted">{parseError}</span>
          <div style={{ marginTop: 12 }}>
            <button className="outline-button" onClick={reset}>Coba File Lain</button>
          </div>
        </div>
      )}

      {fileName && !parsing && !parseError && rows.length > 0 && !importResult && (
        <>
          <div className="panel import-step">
            <div className="panel-heading"><h3><span className="import-step-number">2</span> Hasil Validasi <small className="import-file-name">{fileName}</small></h3></div>
            <div className="import-summary-grid">
              <div className="import-summary-card valid"><strong>{summary.valid}</strong><span>data valid</span></div>
              <div className="import-summary-card duplicate"><strong>{summary.duplicate}</strong><span>data duplikat</span></div>
              <div className="import-summary-card error"><strong>{summary.error}</strong><span>data error</span></div>
            </div>
          </div>

          <div className="panel import-step">
            <div className="panel-heading"><h3><span className="import-step-number">3</span> Detail per Baris</h3></div>
            <div className="import-table-wrap"><table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Pelatihan / Materi</th>
                  <th>Status</th>
                  <th>Catatan / Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><div className="table-primary">{r.data.nama || '(kosong)'}</div></td>
                    <td><div className="table-secondary">{r.data.email || '-'}</div></td>
                    <td>
                      {r.attendedTrainings.map((training) => <div key={`attended-${training.name}-${training.material}`}><div className="table-primary">{training.name}</div><div className="table-secondary">Pelatihan yang pernah diikuti · {training.material}</div></div>)}
                      {r.teachingExperiences.map((experience) => <div key={`${experience.name}-${experience.material}`}><div className="table-primary">{experience.name}</div><div className="table-secondary">Pengalaman mengajar · {experience.material}</div></div>)}
                      {!r.attendedTrainings.length && !r.teachingExperiences.length && <div className="table-secondary">-</div>}
                    </td>
                    <td>
                      <span className={`status-badge ${r.status === 'valid' ? 'lengkap' : 'belum_lengkap'}`}>
                        {r.status === 'valid' ? 'Valid' : r.status === 'duplicate' ? 'Duplikat' : 'Error'}
                      </span>
                    </td>
                    <td>
                      {r.status === 'error' && <small style={{ color: '#e6a8bd' }}>{r.errors.join(', ')}</small>}
                      {r.status === 'duplicate' && (
                        <select
                          value={r.action}
                          onChange={(e) => updateRowAction(i, e.target.value)}
                          className="import-cell-input"
                        >
                          <option value="skip">Lewati (skip)</option>
                          <option value="update">Update data lama</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>

          <div className="import-actions">
            <button className="primary-button" onClick={handleImport} disabled={importing || (summary.valid === 0 && summary.duplicate === 0)}>
              {importing ? 'Mengimport...' : 'Import Sekarang'}
            </button>
            <button className="outline-button" onClick={reset} disabled={importing}>Batal / Pilih File Lain</button>
          </div>
        </>
      )}

      {importResult && (
        <div className="panel import-result">
          <div className="panel-heading"><h3>Hasil Import</h3></div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div><strong style={{ color: '#6fd6ae' }}>{importResult.created}</strong> <span className="muted">baru ditambahkan</span></div>
            <div><strong style={{ color: '#6fd6ae' }}>{importResult.updated}</strong> <span className="muted">berhasil diupdate</span></div>
            <div><strong style={{ color: '#6fd6ae' }}>{importResult.educationCreated}</strong> <span className="muted">riwayat pendidikan dibuat</span></div>
            <div><strong style={{ color: '#6fd6ae' }}>{importResult.attendedTrainingCreated}</strong> <span className="muted">pelatihan yang pernah diikuti dibuat</span></div>
            <div><strong style={{ color: '#6fd6ae' }}>{importResult.teachingExperienceCreated}</strong> <span className="muted">pengalaman mengajar dibuat</span></div>
            <div><strong style={{ color: '#a49bb6' }}>{importResult.skipped}</strong> <span className="muted">dilewati</span></div>
            <div><strong style={{ color: '#e6a8bd' }}>{importResult.failed.length}</strong> <span className="muted">gagal</span></div>
          </div>
          {importResult.failed.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="table-secondary" style={{ marginBottom: 6 }}>Detail yang gagal:</div>
              {importResult.failed.map((f, i) => (
                <div key={i} className="activity-row">
                  <div><div className="table-primary">{f.nama || '(tanpa nama)'}</div><div className="table-secondary">{f.message}</div></div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="primary-button" onClick={() => onNavigate?.('fasilitator')}>Lihat Daftar Fasilitator</button>
            <button className="outline-button" onClick={reset}>Import File Lain</button>
          </div>
        </div>
      )}
    </section>
  )
}
