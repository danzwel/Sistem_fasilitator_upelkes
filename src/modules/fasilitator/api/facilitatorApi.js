// src/modules/fasilitator/api/facilitatorApi.js
//
// Lapisan pemanggilan API ke backend Daniel. Base URL & endpoint yang
// SUDAH DIKONFIRMASI di docs/DANIEL_API_CONTRACT.md: POST /api/facilitators
// dan PUT /api/facilitators/:id.
//
// TODO(konfirmasi Daniel): body/response shape endpoint ini belum
// didetailkan di kontrak. Field di bawah pakai nama yang sudah kita
// sepakati di fasilitatorData.js. Kalau Daniel balas dengan nama field
// yang beda (mis. snake_case seperti "photo" di requirements[]
// monitoring), cukup ubah `toApiPayload` di bawah — komponen form TIDAK
// perlu diubah.

const API_BASE_URL = 'http://localhost:8000'

function toApiPayload(fasilitator) {
  // Mapping field internal (Indonesia) -> field yang diharapkan backend
  // Daniel (Inggris). Ditemukan satu-satu dari pesan error validasi 422,
  // karena kontraknya belum didokumentasikan lengkap. Tambahkan mapping
  // baru di sini setiap kali ada error "X wajib diisi" untuk field yang
  // belum ada di bawah.
  return {
    // TODO: field lain (gelar, nik, nip, dst) masih dikirim pakai nama
    // Indonesia apa adanya — backend belum pernah komplain soal field
    // ini, tapi belum tentu artinya sudah benar/tersimpan. Konfirmasi
    // ke Daniel field mana aja yang dia baca, lalu tambahkan mapping-nya
    // di sini kalau ternyata beda (seperti "name" di bawah).
    ...fasilitator,
    name: fasilitator.nama,
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `Request gagal (${response.status}): ${body || response.statusText}`
    )
  }
  return response.json()
}

export async function createFacilitator(fasilitator) {
  const response = await fetch(`${API_BASE_URL}/api/facilitators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPayload(fasilitator)),
  })
  return handleResponse(response)
}

export async function updateFacilitator(id, fasilitator) {
  const response = await fetch(`${API_BASE_URL}/api/facilitators/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPayload(fasilitator)),
  })
  return handleResponse(response)
}

// TODO(minta ke Daniel): belum ada endpoint GET list/detail/DELETE.
// Begitu tersedia, tambahkan fungsi getFacilitators() dan
// getFacilitatorById(id) di sini, lalu ganti pemakaian `fasilitatorList`
// dummy di FasilitatorPage.jsx & FasilitatorFormPage.jsx dengan
// pemanggilan fungsi ini.