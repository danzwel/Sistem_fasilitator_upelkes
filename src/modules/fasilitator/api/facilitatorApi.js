import { apiRequest } from '../../../shared/api/client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function toApiPayload(fasilitator) {
  return {
    name: (fasilitator.nama ?? fasilitator.name ?? '').trim(),
    degree: fasilitator.gelar ?? fasilitator.degree ?? null,
    birthInfo: fasilitator.birthInfo ?? null,
    nik: fasilitator.nik ?? null,
    nip: fasilitator.nip ?? null,
    rank: fasilitator.pangkatGolongan ?? fasilitator.rank ?? null,
    position: fasilitator.jabatan ?? fasilitator.position ?? null,
    unit: fasilitator.unitKerja ?? fasilitator.unit ?? null,
    officeAddress: fasilitator.alamatKantor ?? fasilitator.officeAddress ?? null,
    homeAddress: fasilitator.alamatRumah ?? fasilitator.homeAddress ?? null,
    phone: (fasilitator.noHp ?? fasilitator.phone ?? '').trim().replace(/[()]/g, '') || null,
    email: (fasilitator.email ?? '').trim() || null,
    photoUrl: fasilitator.fotoUrl ?? fasilitator.photoUrl ?? null,
    signatureUrl: fasilitator.ttdUrl ?? fasilitator.signatureUrl ?? null,
    status: fasilitator.status ?? 'active',
    competencies: (fasilitator.kompetensi ?? fasilitator.competencies ?? []).map((item) => typeof item === 'string' ? item : { name: item.name, startedTeachingYear: item.startedTeachingYear ?? null, trainingName: item.trainingName ?? null }),
    trainingNames: fasilitator.trainingNames ?? [],
  }
}

async function handleResponse(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const details = body.errors && typeof body.errors === 'object'
      ? Object.values(body.errors).filter(Boolean).join(' ')
      : ''
    throw new Error([body.message || `Request gagal (${response.status}): ${response.statusText}`, details].filter(Boolean).join(' '))
  }
  return body.data ?? body
}

async function request(path, options = {}) {
  return apiRequest(API_BASE_URL, path, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
}

export function normalizeCompleteness(person, trainingRows = []) {
  const existing = person?.completeness?.checks || {}
  const trainings = Array.isArray(trainingRows) ? trainingRows : []
  const hasRelatedTraining = trainings.some((item) => item.category === 'related_training')
  const hasTeachingExperience = trainings.some((item) => item.category === 'teaching_experience')
  const hasCertificate = trainings.some((item) => item.category === 'related_training' && Boolean(item.certificateUrl))
  const hasMaterial = trainings.some((item) => Boolean(item.material?.trim()))
  const checks = {
    name: Boolean(person?.name?.trim()),
    degree: Boolean(person?.degree?.trim()),
    birthInfo: Boolean(person?.birthInfo?.trim()),
    nik: Boolean(person?.nik?.trim()),
    nip: Boolean(person?.nip?.trim()),
    rank: Boolean(person?.rank?.trim()),
    position: Boolean(person?.position?.trim()),
    unit: Boolean(person?.unit?.trim()),
    officeAddress: Boolean(person?.officeAddress?.trim()),
    homeAddress: Boolean(person?.homeAddress?.trim()),
    phone: Boolean(person?.phone?.trim()),
    email: Boolean(person?.email?.trim()),
    photo: existing.photo ?? Boolean(person?.photoUrl),
    signature: existing.signature ?? Boolean(person?.signatureUrl),
    competencies: existing.competencies ?? Boolean(person?.competencies?.length || person?.trainingNames?.length),
    relatedTraining: existing.relatedTraining || hasRelatedTraining,
    teachingExperience: existing.teachingExperience || hasTeachingExperience,
    certificate: existing.certificate || hasCertificate,
    material: existing.material || hasMaterial,
    education: existing.education ?? false,
    supporting: existing.supporting ?? false,
  }
  return { ...person, completeness: { ...person?.completeness, isComplete: Object.values(checks).every(Boolean), checks } }
}

export function getFacilitators() {
  return request('/facilitators').then(async (list) => {
    if (!Array.isArray(list)) return []
    return Promise.all(list.map(async (person) => {
      const trainings = await request(`/facilitators/${person.id}/trainings`).catch(() => [])
      return normalizeCompleteness(person, trainings)
    }))
  })
}

export function getFacilitatorById(id) {
  return request(`/facilitators/${id}`).then(async (person) => {
    const trainings = await request(`/facilitators/${id}/trainings`).catch(() => [])
    return normalizeCompleteness(person, trainings)
  })
}

export function createFacilitator(fasilitator) {
  return request('/facilitators', { method: 'POST', body: JSON.stringify(toApiPayload(fasilitator)) })
}

export function updateFacilitator(id, fasilitator) {
  return request(`/facilitators/${id}`, { method: 'PUT', body: JSON.stringify(toApiPayload(fasilitator)) })
}

export function deleteFacilitator(id) {
  return request(`/facilitators/${id}`, { method: 'DELETE' })
}
