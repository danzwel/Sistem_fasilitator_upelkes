const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function toApiPayload(fasilitator) {
  return {
    name: fasilitator.nama ?? fasilitator.name,
    degree: fasilitator.gelar ?? fasilitator.degree ?? null,
    birthInfo: fasilitator.birthInfo ?? null,
    nik: fasilitator.nik ?? null,
    nip: fasilitator.nip ?? null,
    position: fasilitator.jabatan ?? fasilitator.position ?? null,
    unit: fasilitator.unitKerja ?? fasilitator.unit ?? null,
    address: fasilitator.alamat ?? fasilitator.address ?? null,
    phone: fasilitator.noHp ?? fasilitator.phone ?? null,
    email: fasilitator.email ?? null,
    photoUrl: fasilitator.fotoUrl ?? fasilitator.photoUrl ?? null,
    signatureUrl: fasilitator.ttdUrl ?? fasilitator.signatureUrl ?? null,
    status: fasilitator.status ?? 'active',
    competencies: fasilitator.kompetensi ?? fasilitator.competencies ?? [],
  }
}

async function handleResponse(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message || `Request gagal (${response.status}): ${response.statusText}`)
  }
  return body.data ?? body
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  return handleResponse(response)
}

export function getFacilitators() {
  return request('/facilitators')
}

export function getFacilitatorById(id) {
  return request(`/facilitators/${id}`)
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
