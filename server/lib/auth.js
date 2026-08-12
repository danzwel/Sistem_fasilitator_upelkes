import { createHmac, timingSafeEqual } from 'node:crypto'

const secret = () => process.env.AUTH_SECRET || 'development-only-change-this-secret'
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const sign = (value) => createHmac('sha256', secret()).update(value).digest('base64url')
export function createToken(user) { const payload = encode({ id: user.id, name: user.name, role: user.role, exp: Date.now() + 8 * 60 * 60 * 1000 }); return `${payload}.${sign(payload)}` }
export function verifyToken(header = '') { const token = header.replace(/^Bearer\s+/i, ''); const [payload, signature] = token.split('.'); if (!payload || !signature || !timingSafeEqual(Buffer.from(sign(payload)), Buffer.from(signature))) return null; try { const user = JSON.parse(Buffer.from(payload, 'base64url')); return user.exp > Date.now() ? user : null } catch { return null } }
