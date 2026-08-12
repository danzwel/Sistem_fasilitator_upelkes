import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateCompleteness, monitoringStatus } from './completeness.js'

test('menghitung persentase dari requirement API', () => {
  assert.deepEqual(calculateCompleteness([{ isComplete: true }, { isComplete: true }, { isComplete: false }, { isComplete: true }]), { total: 4, completed: 3, percentage: 75 })
})
test('menentukan status berdasarkan data yang belum lengkap', () => {
  assert.deepEqual(monitoringStatus([{ label: 'Foto', isComplete: false }]), { label: 'Perlu Foto', tone: 'missing' })
})
