const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers }, ...options })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Permintaan ke server gagal.')
  return response.status === 204 ? null : response.json()
}

function queryString(params) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)); return query.size ? `?${query}` : '' }

// Hanya membaca master data milik modul Sofi; tidak membuat data fasilitator duplikat.
export const facilitatorEvaluationApi = {
  getMonitoring: (filters = {}) => request(`/facilitators/monitoring${queryString(filters)}`),
  searchFacilitators: (filters = {}) => request(`/facilitators/search${queryString(filters)}`),
  getCompetencyProfile: (id) => request(`/facilitators/${id}/competency-profile`),
  createReview: (id, payload) => request(`/facilitators/${id}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),
}
