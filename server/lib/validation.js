const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function validateFacilitator(input) {
  const errors = {}
  if (!input.name?.trim()) errors.name = 'Nama wajib diisi.'
  if (input.email && !emailPattern.test(input.email)) errors.email = 'Email tidak valid.'
  if (input.phone && !/^[+\d][\d\s-]{7,}$/.test(input.phone)) errors.phone = 'Nomor HP tidak valid.'
  if (input.status && !['active', 'inactive'].includes(input.status)) errors.status = 'Status tidak valid.'
  if (input.competencies && (!Array.isArray(input.competencies) || input.competencies.some((item) => (typeof item !== 'string' && !item?.name?.trim()) || (item?.startedTeachingYear != null && (!Number.isInteger(item.startedTeachingYear) || item.startedTeachingYear < 1900 || item.startedTeachingYear > new Date().getFullYear()))))) errors.competencies = 'Kompetensi harus berupa array nama atau objek { name, startedTeachingYear }.'
  return errors
}
export function validateTraining(input) {
  const errors = {}
  if (!input.name?.trim()) errors.name = 'Nama pelatihan/kegiatan wajib diisi.'
  const startDate = input.startDate || input.date
  const endDate = input.endDate || startDate
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) errors.date = 'Tanggal mulai wajib berformat YYYY-MM-DD.'
  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) errors.endDate = 'Tanggal selesai wajib berformat YYYY-MM-DD.'
  if (!errors.date && !errors.endDate && endDate < startDate) errors.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
  if (input.material != null && typeof input.material !== 'string') errors.material = 'Materi harus berupa teks.'
  if (input.subject != null && typeof input.subject !== 'string') errors.subject = 'Subject harus berupa teks.'
  if (input.category && !['related_training', 'teaching_experience'].includes(input.category)) errors.category = 'Kategori riwayat tidak valid.'
  return errors
}
export function validateEducation(input) {
  const errors = {}
  if (!input.institution?.trim()) errors.institution = 'Institusi wajib diisi.'
  if (input.graduationYear != null && (!Number.isInteger(input.graduationYear) || input.graduationYear < 1900 || input.graduationYear > new Date().getFullYear() + 10)) errors.graduationYear = 'Tahun lulus tidak valid.'
  if (input.startDate != null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(input.startDate)) errors.startDate = 'Tanggal mulai pendidikan harus berformat YYYY-MM.'
  if (input.endDate != null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(input.endDate)) errors.endDate = 'Tanggal selesai pendidikan harus berformat YYYY-MM.'
  if (!errors.startDate && !errors.endDate && input.startDate && input.endDate && input.startDate > input.endDate) errors.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
  return errors
}
export function validateReview(input) {
  const errors = {}
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) errors.rating = 'Rating harus bilangan 1 sampai 5.'
  if (!input.comment?.trim()) errors.comment = 'Ulasan wajib diisi.'
  if (!input.authorName?.trim()) errors.authorName = 'Nama pemberi ulasan wajib diisi.'
  return errors
}
