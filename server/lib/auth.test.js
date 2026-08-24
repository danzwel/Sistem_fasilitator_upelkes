import test from 'node:test'
import assert from 'node:assert/strict'
import { createToken, verifyToken } from './auth.js'

test('menolak token dengan signature yang rusak tanpa melempar error', () => {
  const token = createToken({ id: 1, name: 'Admin', role: 'admin' })
  const [payload] = token.split('.')
  assert.equal(verifyToken(`Bearer ${payload}.rusak`), null)
  assert.equal(verifyToken('Bearer token-tidak-valid'), null)
})
