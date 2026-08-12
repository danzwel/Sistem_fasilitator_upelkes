const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function validateFacilitator(input) {
  const errors = {}
  if (!input.name?.trim()) errors.name = 'Nama wajib diisi.'
  if (input.email && !emailPattern.test(input.email)) errors.email = 'Email tidak valid.'
  if (input.phone && !/^[+\d][\d\s-]{7,}$/.test(input.phone)) errors.phone = 'Nomor HP tidak valid.'
  if (input.status && !['active', 'inactive'].includes(input.status)) errors.status = 'Status tidak valid.'
  return errors
}
export function validateReview(input) {
  const errors = {}
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) errors.rating = 'Rating harus bilangan 1 sampai 5.'
  if (!input.comment?.trim()) errors.comment = 'Ulasan wajib diisi.'
  if (!input.authorName?.trim()) errors.authorName = 'Nama pemberi ulasan wajib diisi.'
  return errors
}
