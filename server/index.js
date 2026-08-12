import { createServer } from 'node:http'
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'
import './database/database.js'
import { db } from './database/database.js'
import { createToken, verifyToken } from './lib/auth.js'
import { json, readJson, route } from './lib/http.js'
import { validateFacilitator, validateReview } from './lib/validation.js'
import * as facilitators from './repositories/facilitatorRepository.js'

const port = Number(process.env.API_PORT || 8000)
const required = process.env.AUTH_REQUIRED === 'true'
const hash = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
const matches = (password, value) => { const [salt, stored] = value.split(':'); const actual = scryptSync(password, salt, 64).toString('hex'); return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(stored, 'hex')) }
const access = (request) => verifyToken(request.headers.authorization)
const protect = (request, response) => { if (!required) return true; if (access(request)) return true; json(response, 401, { message: 'Autentikasi diperlukan.' }); return false }
const invalid = (response, errors) => json(response, 422, { message: 'Validasi gagal.', errors })

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
    const profileId = route(url, /^\/api\/facilitators\/(\d+)\/competency-profile$/)
    if (request.method === 'GET' && profileId) { const data = facilitators.competencyProfile(Number(profileId[0])); return data ? json(response, 200, data) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    const reviewId = route(url, /^\/api\/facilitators\/(\d+)\/reviews$/)
    if (request.method === 'POST' && reviewId) { if (!protect(request, response)) return; const input = await readJson(request); if (access(request)) input.authorName ||= access(request).name; const errors = validateReview(input); if (Object.keys(errors).length) return invalid(response, errors); const review = facilitators.createReview(Number(reviewId[0]), input); return review ? json(response, 201, { data: review }) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    if (request.method === 'POST' && url.pathname === '/api/facilitators') { if (!protect(request, response)) return; const input = await readJson(request); const errors = validateFacilitator(input); if (Object.keys(errors).length) return invalid(response, errors); return json(response, 201, { data: facilitators.createFacilitator(input) }) }
    const facilitatorId = route(url, /^\/api\/facilitators\/(\d+)$/)
    if (request.method === 'GET' && facilitatorId) { const data = facilitators.getFacilitator(Number(facilitatorId[0])); return data ? json(response, 200, { data }) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    if (request.method === 'PUT' && facilitatorId) { if (!protect(request, response)) return; const input = await readJson(request); const errors = validateFacilitator({ ...input, name: input.name || 'existing' }); if (Object.keys(errors).length) return invalid(response, errors); const data = facilitators.updateFacilitator(Number(facilitatorId[0]), input); return data ? json(response, 200, { data }) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    if (request.method === 'DELETE' && facilitatorId) { if (!protect(request, response)) return; const data = facilitators.deleteFacilitator(Number(facilitatorId[0])); return data ? json(response, 200, { data }) : json(response, 404, { message: 'Fasilitator tidak ditemukan.' }) }
    return json(response, 404, { message: 'Endpoint tidak ditemukan.' })
  } catch (error) { console.error(error); return json(response, error.status || 500, { message: error.message || 'Terjadi kesalahan server.' }) }
})
server.listen(port, () => console.log(`API UPELKES berjalan di http://localhost:${port}`))
