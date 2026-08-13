import { createServer } from 'node:http'
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { extname, join, normalize as normalizePath } from 'node:path'
import './database/database.js'
import { db } from './database/database.js'
import { createToken, verifyToken } from './lib/auth.js'
import { json, readJson, route } from './lib/http.js'
import { validateFacilitator, validateReview, validateTraining, validateEducation } from './lib/validation.js'
import * as facilitators from './repositories/facilitatorRepository.js'

const port = Number(process.env.API_PORT || 8000)
const required = process.env.AUTH_REQUIRED === 'true'
const hash = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
const matches = (password, value) => { const [salt, stored] = value.split(':'); const actual = scryptSync(password, salt, 64).toString('hex'); return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(stored, 'hex')) }
const access = (request) => verifyToken(request.headers.authorization)
const protect = (request, response) => { if (!required) return true; if (access(request)) return true; json(response, 401, { message: 'Autentikasi diperlukan.' }); return false }
const invalid = (response, errors) => json(response, 422, { message: 'Validasi gagal.', errors })
const uploadDirectory = join(process.cwd(), 'storage', 'uploads')
mkdirSync(uploadDirectory, { recursive: true })
async function readMultipart(request) { const chunks = []; for await (const chunk of request) chunks.push(chunk); const body = Buffer.concat(chunks); const boundary = request.headers['content-type']?.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || request.headers['content-type']?.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2]; if (!boundary) throw Object.assign(new Error('Boundary multipart tidak ditemukan.'), { status: 400 }); const marker = Buffer.from(`--${boundary}`); const result = {}; let cursor = body.indexOf(marker); while (cursor >= 0) { const start = cursor + marker.length + 2; const next = body.indexOf(marker, start); if (next < 0) break; const part = body.subarray(start, next - 2); const split = part.indexOf(Buffer.from('\r\n\r\n')); if (split < 0) { cursor = next; continue } const headers = part.subarray(0, split).toString(); const content = part.subarray(split + 4); const name = headers.match(/name="([^"]+)"/)?.[1]; const filename = headers.match(/filename="([^"]*)"/)?.[1]; if (name && filename) result[name] = { filename, content }; else if (name) result[name] = content.toString(); cursor = next } return result }
function saveUpload(file, kind) { if (!file?.content?.length) throw Object.assign(new Error('File upload wajib diisi.'), { status: 422 }); const extension = extname(file.filename).toLowerCase() || (kind === 'photo' ? '.jpg' : '.png'); if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) throw Object.assign(new Error('Format file harus JPG, PNG, atau WEBP.'), { status: 422 }); const filename = `${kind}-${Date.now()}-${randomBytes(6).toString('hex')}${extension}`; writeFileSync(join(uploadDirectory, filename), file.content); return `/uploads/${filename}` }

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, {})
  const url = new URL(request.url, `http://${request.headers.host}`)
  try {
    if (request.method === 'GET' && url.pathname === '/api/health') return json(response, 200, { status: 'ok' })
    if (request.method === 'POST' && url.pathname === '/api/auth/setup') {
      if (db.prepare('SELECT COUNT(*) count FROM users').get().count) return json(response, 409, { message: 'Admin awal sudah pernah dibuat.' })
      const input = await readJson(request); if (!input.name?.trim() || !input.email?.trim() || !input.password || input.password.length < 8) return invalid(response, { setup: 'Nama, email, dan password minimal 8 karakter wajib diisi.' })
      const user = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(input.name.trim(), input.email.trim().toLowerCase(), hash(input.password), 'admin')
      return json(response, 201, { token: createToken({ id: Number(user.lastInsertRowid), name: input.name.trim(), role: 'admin' }) })
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const input = await readJson(request); const user = db.prepare('SELECT * FROM users WHERE email = ?').get(input.email?.trim().toLowerCase()); if (!user || !matches(input.password || '', user.password_hash)) return json(response, 401, { message: 'Email atau password salah.' })
      return json(response, 200, { token: createToken(user), user: { id: user.id, name: user.name, role: user.role } })
    }
    if (request.method === 'GET' && url.pathname === '/api/facilitators/monitoring') return json(response, 200, { data: facilitators.monitoring(url.searchParams.get('filter') || '') })
    if (request.method === 'GET' && url.pathname === '/api/facilitators/search') return json(response, 200, { data: facilitators.search(Object.fromEntries(url.searchParams)) })
    if (request.method === 'GET' && url.pathname === '/api/facilitators') return json(response, 200, { data: facilitators.listFacilitators() })
    const uploadId = route(url, /^\/api\/facilitators\/(\d+)\/(photo|signature)$/)
    if (request.method === 'POST' && uploadId) { if (!protect(request, response)) return; const person = facilitators.getFacilitator(Number(uploadId[0])); if (!person) return json(response, 404, { message: 'Fasilitator tidak ditemukan.' }); const parts = await readMultipart(request); const field = uploadId[1] === 'photo' ? 'photoUrl' : 'signatureUrl'; const value = saveUpload(parts.file, uploadId[1]); const data = facilitators.updateFacilitator(Number(uploadId[0]), { [field]: value }); return json(response, 200, { data }) }
    const profileId = route(url, /^\/api\/facilitators\/(\d+)\/competency-profile$/)
    if (request.method === 'GET' && profileId) { const data = facilitators.competencyProfile(Number(profileId[0])); return data ? json(response, 200, data) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    const reviewId = route(url, /^\/api\/facilitators\/(\d+)\/reviews$/)
    if (request.method === 'POST' && reviewId) { if (!protect(request, response)) return; const input = await readJson(request); if (access(request)) input.authorName ||= access(request).name; const errors = validateReview(input); if (Object.keys(errors).length) return invalid(response, errors); const review = facilitators.createReview(Number(reviewId[0]), input); return review ? json(response, 201, { data: review }) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    const trainingRoute = route(url, /^\/api\/facilitators\/(\d+)\/trainings(?:\/(\d+))?$/)
    if (trainingRoute && request.method === 'GET' && !trainingRoute[1]) return json(response, 200, { data: facilitators.listTrainings(Number(trainingRoute[0])) })
    if (trainingRoute && ['POST', 'PUT'].includes(request.method)) { if (!protect(request, response)) return; const input = await readJson(request); const errors = validateTraining(input); if (Object.keys(errors).length) return invalid(response, errors); const data = request.method === 'POST' ? facilitators.createTraining(Number(trainingRoute[0]), input) : facilitators.updateTraining(Number(trainingRoute[0]), Number(trainingRoute[1]), input); return data ? json(response, request.method === 'POST' ? 201 : 200, { data }) : json(response, 404, { message: 'Fasilitator atau riwayat tidak ditemukan.' }) }
    if (trainingRoute && request.method === 'DELETE' && trainingRoute[1]) { if (!protect(request, response)) return; const data = facilitators.deleteTraining(Number(trainingRoute[0]), Number(trainingRoute[1])); return data ? json(response, 200, { data }) : json(response, 404, { message: 'Riwayat tidak ditemukan.' }) }
    const educationRoute = route(url, /^\/api\/facilitators\/(\d+)\/educations(?:\/(\d+))?$/)
    if (educationRoute && request.method === 'GET' && !educationRoute[1]) return json(response, 200, { data: facilitators.listEducations(Number(educationRoute[0])) })
    if (educationRoute && ['POST', 'PUT'].includes(request.method)) { if (!protect(request, response)) return; const input = await readJson(request); const errors = validateEducation(input); if (Object.keys(errors).length) return invalid(response, errors); const data = request.method === 'POST' ? facilitators.createEducation(Number(educationRoute[0]), input) : facilitators.updateEducation(Number(educationRoute[0]), Number(educationRoute[1]), input); return data ? json(response, request.method === 'POST' ? 201 : 200, { data }) : json(response, 404, { message: 'Fasilitator atau riwayat pendidikan tidak ditemukan.' }) }
    if (educationRoute && request.method === 'DELETE' && educationRoute[1]) { if (!protect(request, response)) return; const data = facilitators.deleteEducation(Number(educationRoute[0]), Number(educationRoute[1])); return data ? json(response, 200, { data }) : json(response, 404, { message: 'Riwayat pendidikan tidak ditemukan.' }) }
    if (request.method === 'POST' && url.pathname === '/api/facilitators') { if (!protect(request, response)) return; const input = await readJson(request); const errors = validateFacilitator(input); if (Object.keys(errors).length) return invalid(response, errors); return json(response, 201, { data: facilitators.createFacilitator(input) }) }
    const facilitatorId = route(url, /^\/api\/facilitators\/(\d+)$/)
    if (request.method === 'GET' && facilitatorId) { const data = facilitators.getFacilitator(Number(facilitatorId[0])); return data ? json(response, 200, { data }) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    if (request.method === 'PUT' && facilitatorId) { if (!protect(request, response)) return; const input = await readJson(request); const errors = validateFacilitator({ ...input, name: input.name || 'existing' }); if (Object.keys(errors).length) return invalid(response, errors); const data = facilitators.updateFacilitator(Number(facilitatorId[0]), input); return data ? json(response, 200, { data }) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    if (request.method === 'DELETE' && facilitatorId) { if (!protect(request, response)) return; const data = facilitators.deleteFacilitator(Number(facilitatorId[0])); return data ? json(response, 200, { data }) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    if (request.method === 'GET' && url.pathname.startsWith('/uploads/')) { const file = normalizePath(join(process.cwd(), url.pathname)); if (!file.startsWith(uploadDirectory) || !existsSync(file)) return json(response, 404, { message: 'File tidak ditemukan.' }); response.writeHead(200); return response.end(readFileSync(file)) }
    return json(response, 404, { message: 'Endpoint tidak ditemukan.' })
  } catch (error) { console.error(error); return json(response, error.status || 500, { message: error.message || 'Terjadi kesalahan server.' }) }
})
server.listen(port, () => console.log(`API UPELKES berjalan di http://localhost:${port}`))
