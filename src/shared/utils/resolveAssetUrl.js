// src/shared/utils/resolveAssetUrl.js
//
// Backend Daniel balikin path relatif untuk file upload (foto/TTD), misal
// "/uploads/photo-xxx.jpg". Kalau ditaruh langsung di <img src>, browser
// buka itu dari server React (localhost:5173) — bukan server backend
// (localhost:8000) — jadi malah dapet halaman index.html kosong, bukan
// gambarnya. Fungsi ini nambahin origin backend yang benar di depannya.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Kalau VITE_API_BASE_URL berupa URL absolut (http://...), ambil origin-nya.
// Kalau cuma '/api' (relatif, lewat proxy Vite), fallback ke localhost:8000
// sesuai dokumentasi project (backend API jalan di situ pas development).
const ASSET_ORIGIN = /^https?:\/\//.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : 'http://localhost:8000'

export function resolveAssetUrl(url) {
  if (!url) return null
  if (/^https?:\/\//.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  return `${ASSET_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}