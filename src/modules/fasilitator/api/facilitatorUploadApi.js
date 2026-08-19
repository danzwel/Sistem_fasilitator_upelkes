// src/modules/fasilitator/api/facilitatorUploadApi.js
//
// Sengaja dipisah dari facilitatorApi.js (yang dikelola Daniel) supaya
// nggak konflik terus tiap dia update file itu. Endpoint sesuai info
// terbaru: POST /api/facilitators/:id/photo dan /signature, multipart
// form-data dengan field bernama "file".

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function uploadFile(path, file) {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 detik

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // Sengaja TIDAK set Content-Type — browser otomatis set multipart
      // boundary yang benar. Kalau di-set manual malah rusak requestnya.
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Upload terlalu lama (lebih dari 20 detik), kemungkinan koneksi ke server terputus. Coba lagi.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message || `Upload gagal (${response.status}): ${response.statusText}`)
  }
  return body.data ?? body
}

export function uploadFacilitatorPhoto(facilitatorId, file) {
  return uploadFile(`/facilitators/${facilitatorId}/photo`, file)
}

export function uploadFacilitatorSignature(facilitatorId, file) {
  return uploadFile(`/facilitators/${facilitatorId}/signature`, file)
}