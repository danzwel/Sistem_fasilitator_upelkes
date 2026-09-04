import { apiRequest } from '../../../shared/api/client'

// src/modules/training/api/trainingApi.js
//
// Satu endpoint dipakai untuk 2 kebutuhan CV yang beda, dibedakan lewat
// field `category`:
//   - 'related_training'    -> tabel "Pendidikan/Pelatihan Terkait Materi"
//   - 'teaching_experience' -> tabel "Pengalaman Melatih/Mengajar"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options = {}) {
  return apiRequest(API_BASE_URL, path, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
}

export async function getTrainings(facilitatorId, category) {
  const data = await request(`/facilitators/${facilitatorId}/trainings`)
  const list = Array.isArray(data) ? data : []
  return category ? list.filter((t) => t.category === category) : list
}

export function createTraining(facilitatorId, training) {
  return request(`/facilitators/${facilitatorId}/trainings`, {
    method: 'POST',
    body: JSON.stringify(training),
  })
}

export function updateTraining(facilitatorId, trainingId, training) {
  return request(`/facilitators/${facilitatorId}/trainings/${trainingId}`, {
    method: 'PUT',
    body: JSON.stringify(training),
  })
}

export function deleteTraining(facilitatorId, trainingId) {
  return request(`/facilitators/${facilitatorId}/trainings/${trainingId}`, {
    method: 'DELETE',
  })
}

export function getTrainingSubjects() {
  return request('/training-subjects')
}

export function createTrainingSubject(name) {
  return request('/training-subjects', { method: 'POST', body: JSON.stringify({ name }) })
}

export function createTrainingReview(facilitatorId, trainingId, payload) {
  return request(`/facilitators/${facilitatorId}/trainings/${trainingId}/rating`, { method: 'POST', body: JSON.stringify(payload) })
}
