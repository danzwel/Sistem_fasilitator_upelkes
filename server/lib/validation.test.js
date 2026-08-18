import test from 'node:test'
import assert from 'node:assert/strict'
import { validateFacilitator, validateReview, validateTraining } from './validation.js'

test('menolak fasilitator tanpa nama dan email yang tidak valid', () => {
  assert.deepEqual(validateFacilitator({ email: 'bukan-email' }), { name: 'Nama wajib diisi.', email: 'Email tidak valid.' })
})

test('menolak rating di luar rentang satu sampai lima', () => {
  assert.deepEqual(validateReview({ authorName: 'Admin', rating: 6, comment: 'Baik' }), { rating: 'Rating harus bilangan 1 sampai 5.' })
})

test('menerima materi pelatihan sebagai field opsional', () => {
  assert.deepEqual(validateTraining({ name: 'Kader Posyandu', subject: 'Pengelolaan Posyandu', date: '2026' }), {})
})
