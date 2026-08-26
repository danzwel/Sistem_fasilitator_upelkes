import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { getFacilitatorById } from '../../fasilitator/api/facilitatorApi'
import { getEducations } from '../../fasilitator/api/educationApi'
import { getTrainings } from '../../training/api/trainingApi'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatMonthYear(value) {
  if (!value) return null
  const [year, month] = value.split('-')
  const monthName = MONTH_NAMES[Number(month) - 1]
  return monthName ? `${monthName} ${year}` : value
}

function formatDateRange(startDate, endDate) {
  const start = formatMonthYear(startDate)
  const end = formatMonthYear(endDate)
  if (start && end) return `${start} – ${end}`
  return start || end || null
}

export function CvPreviewPage({ onNavigate, facilitatorId, cvReturnTo }) {
  const [facilitator, setFacilitator] = useState(null)
  const [educations, setEducations] = useState([])
  const [relatedTrainings, setRelatedTrainings] = useState([])
  const [teachingExperience, setTeachingExperience] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const cvRef = useRef(null)

  useEffect(() => {
    if (!facilitatorId) return
    setLoading(true)
    setError(null)
    Promise.all([
      getFacilitatorById(facilitatorId),
      getEducations(facilitatorId).catch(() => []),
      getTrainings(facilitatorId, 'related_training').catch(() => []),
      getTrainings(facilitatorId, 'teaching_experience').catch(() => []),
    ])
      .then(([f, edu, related, teaching]) => {
        setFacilitator(f)
        setEducations(edu)
        setRelatedTrainings(related)
        setTeachingExperience(teaching)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [facilitatorId])

  async function handleExportPdf() {
    if (!cvRef.current || exporting) return
    setExporting(true)
    const images = [...cvRef.current.querySelectorAll('img')]
    const originalSources = images.map((image) => image.src)
    const exportSources = [...originalSources]
    try {
      await Promise.all(images.map(async (image) => {
        if (!image.src || image.src.startsWith('data:')) return
        try {
          const response = await fetch(image.src)
          if (!response.ok) return
          const blob = await response.blob()
          const dataUrl = await prepareImageForExport(image, blob)
          const imageIndex = images.indexOf(image)
          exportSources[imageIndex] = dataUrl
          image.src = dataUrl
          await image.decode?.().catch(() => {})
        } catch {
          // html2canvas tetap mencoba memakai src asli; satu gambar gagal
          // tidak boleh menggagalkan seluruh proses export CV.
        }
      }))
      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        logging: false,
      })
      const filename = `CV-${(facilitator.name || 'fasilitator').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.pdf`
      downloadCanvasAsPdf(canvas, filename)
    } catch (exportError) {
      setError(`Gagal mengunduh PDF: ${exportError.message}`)
    } finally {
      images.forEach((image, index) => { image.src = originalSources[index] })
      setExporting(false)
    }
  }

  if (!facilitatorId) {
    return (
      <section className="page-enter">
        <div className="empty-state">
          <span>◌</span>
          <p>Tidak ada fasilitator yang dipilih.</p>
          <div style={{ marginTop: 12 }}>
            <button className="outline-button" onClick={() => onNavigate?.('fasilitator')}>← Kembali</button>
          </div>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="page-enter">
        <div className="empty-state"><span>◌</span><p>Menyiapkan CV...</p></div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page-enter">
        <div className="empty-state"><span>◌</span><p>Gagal memuat data CV.</p><small>{error}</small></div>
      </section>
    )
  }

  return (
    <section className="page-enter">
      <div className="welcome-row no-print">
        <div>
          <p className="eyebrow">MODUL SOFI</p>
          <h2>Preview CV</h2>
          <p className="muted">Cek dulu tampilannya, baru export ke PDF.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="outline-button" onClick={() => onNavigate?.(cvReturnTo || 'fasilitator-detail', facilitatorId)}>
            ← Kembali
          </button>
          <button className="primary-button" onClick={handleExportPdf} disabled={exporting}>
            {exporting ? 'Menyiapkan PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="cv-page" ref={cvRef}>
        <div className="cv-photo-slot">
          {facilitator.photoUrl ? (
            <img src={resolveAssetUrl(facilitator.photoUrl)} alt="Foto" />
          ) : (
            <div className="cv-photo-placeholder">Foto belum diunggah</div>
          )}
        </div>

        <h1 className="cv-name">{facilitator.name}</h1>

        <table className="cv-bio-table">
          <tbody>
            <tr><td>Tempat/Tanggal Lahir</td><td>: {facilitator.birthInfo || '-'}</td></tr>
            <tr><td>NIK</td><td>: {facilitator.nik || '-'}</td></tr>
            <tr><td>NIP</td><td>: {facilitator.nip || '-'}</td></tr>
            <tr><td>Pangkat/Gol.</td><td>: {facilitator.rank || '-'}</td></tr>
            <tr><td>Jabatan</td><td>: {facilitator.position || '-'}</td></tr>
            <tr><td>Unit Kerja</td><td>: {facilitator.unit || '-'}</td></tr>
            <tr><td>Alamat Kantor</td><td>: {facilitator.officeAddress || '-'}</td></tr>
            <tr><td>Alamat Rumah</td><td>: {facilitator.homeAddress || '-'}</td></tr>
            <tr><td>No. Hp</td><td>: {facilitator.phone || '-'}</td></tr>
            <tr><td>Email</td><td>: {facilitator.email || '-'}</td></tr>
          </tbody>
        </table>

        <h2 className="cv-section-title">Riwayat Pendidikan</h2>
        {educations.length === 0 ? (
          <p className="cv-empty">Belum ada data riwayat pendidikan.</p>
        ) : (
          educations.map((edu) => (
            <div className="cv-education-row" key={edu.id}>
              <div className="cv-education-line1">
                <span>{edu.institution}</span>
                <span>{formatDateRange(edu.startDate, edu.endDate) || (edu.graduationYear || '-')}</span>
              </div>
              <div className="cv-education-line2">{edu.degree}</div>
            </div>
          ))
        )}

        <h2 className="cv-section-title">Materi yang Diajarkan</h2>
        {(facilitator.competencies ?? []).length === 0 ? (
          <p className="cv-empty">Belum ada data materi yang diajarkan.</p>
        ) : (
          <table className="cv-list-table">
            <thead><tr><th>No</th><th>Nama Materi</th><th>Tahun</th></tr></thead>
            <tbody>
              {facilitator.competencies.map((c, i) => (
                <tr key={i}><td>{i + 1}</td><td>{c.name}</td><td>{c.startedTeachingYear || '-'}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="cv-section-title">Pendidikan/Pelatihan yang Terkait Materi</h2>
        {relatedTrainings.length === 0 ? (
          <p className="cv-empty">Belum ada data.</p>
        ) : (
          <table className="cv-list-table">
            <thead><tr><th>No</th><th>Nama Pendidikan/Pelatihan</th><th>Penyelenggara</th><th>Tahun</th></tr></thead>
            <tbody>
              {relatedTrainings.map((t, i) => (
                <tr key={t.id ?? i}><td>{i + 1}</td><td>{t.name}</td><td>{t.organizer}</td><td>{t.date}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="cv-section-title">Pengalaman Melatih/Mengajar</h2>
        {teachingExperience.length === 0 ? (
          <p className="cv-empty">Belum ada data.</p>
        ) : (
          <table className="cv-list-table">
            <thead><tr><th>No</th><th>Nama Pelatihan/Kegiatan</th><th>Peran</th><th>Penyelenggara</th><th>Tahun</th></tr></thead>
            <tbody>
              {teachingExperience.map((t, i) => (
                <tr key={t.id ?? i}><td>{i + 1}</td><td>{t.name}</td><td>{t.role}</td><td>{t.organizer}</td><td>{t.date}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="cv-signature-block">
          <p>Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          {facilitator.signatureUrl ? (
            <img src={resolveAssetUrl(facilitator.signatureUrl)} alt="TTD" className="cv-signature-img" />
          ) : (
            <div className="cv-signature-placeholder">(TTD belum diunggah)</div>
          )}
          <p className="cv-signature-name"><strong>{facilitator.name}</strong></p>
        </div>
      </div>
    </section>
  )
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function prepareImageForExport(image, blob) {
  const source = await blobToDataUrl(blob)
  const style = getComputedStyle(image)
  if (style.objectFit !== 'cover') return source

  const loaded = await loadImage(source)
  const rect = image.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width * 2))
  const height = Math.max(1, Math.round(rect.height * 2))
  const targetRatio = width / height
  const sourceRatio = loaded.naturalWidth / loaded.naturalHeight
  let sourceWidth = loaded.naturalWidth
  let sourceHeight = loaded.naturalHeight
  let sourceX = 0
  let sourceY = 0

  if (sourceRatio > targetRatio) {
    sourceWidth = loaded.naturalHeight * targetRatio
    sourceX = (loaded.naturalWidth - sourceWidth) / 2
  } else {
    sourceHeight = loaded.naturalWidth / targetRatio
    sourceY = (loaded.naturalHeight - sourceHeight) / 2
  }

  const cropped = document.createElement('canvas')
  cropped.width = width
  cropped.height = height
  cropped.getContext('2d').drawImage(loaded, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
  return cropped.toDataURL('image/png')
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
}

function downloadCanvasAsPdf(canvas, filename) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const margin = 0
  const pageWidth = 210
  const pageHeight = 297
  const sourcePageHeight = Math.floor(canvas.width * (pageHeight / pageWidth))
  let sourceTop = 0
  let page = 0

  while (sourceTop < canvas.height) {
    const sourceHeight = Math.min(sourcePageHeight, canvas.height - sourceTop)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sourceHeight
    pageCanvas.getContext('2d').drawImage(canvas, 0, sourceTop, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)
    if (page > 0) pdf.addPage()
    pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.98), 'JPEG', margin, margin, pageWidth, pageWidth * sourceHeight / canvas.width)
    sourceTop += sourceHeight
    page += 1
  }
  pdf.save(filename)
}
