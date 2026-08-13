// src/modules/fasilitator/api/educationApi.js
//
// Field dikonfirmasi Daniel (bisa berubah lagi setelah dites lewat form
// beneran, sama kayak kasus rank/alamat kemarin):
//   institution      -> nama universitas/lembaga
//   degree           -> jenjang + program studi digabung, ex: "S2 Administrasi Pendidikan"
//   graduationYear   -> tahun lulus (angka)
// Satu fasilitator bisa punya banyak record (banyak riwayat pendidikan).

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message || `Request gagal (${response.status}): ${response.statusText}`)
  }
  return body.data ?? body
}

export async function getEducations(facilitatorId) {
  const data = await request(`/facilitators/${facilitatorId}/educations`)
  return Array.isArray(data) ? data : []
}

export function createEducation(facilitatorId, education) {
  return request(`/facilitators/${facilitatorId}/educations`, {
    method: 'POST',
    body: JSON.stringify(education),
  })
}

export function updateEducation(facilitatorId, educationId, education) {
  return request(`/facilitators/${facilitatorId}/educations/${educationId}`, {
    method: 'PUT',
    body: JSON.stringify(education),
  })
}

export function deleteEducation(facilitatorId, educationId) {
  return request(`/facilitators/${facilitatorId}/educations/${educationId}`, {
    method: 'DELETE',
  })
}