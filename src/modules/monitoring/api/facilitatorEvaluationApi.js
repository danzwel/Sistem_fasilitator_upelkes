import { apiRequest } from '../../../shared/api/client'

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options = {}) {
  return apiRequest(baseUrl, path, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
}

function queryString(params) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)); return query.size ? `?${query}` : '' }

// Hanya membaca master data milik modul Sofi; tidak membuat data fasilitator duplikat.
export const facilitatorEvaluationApi = {
  getMonitoring: (filters = {}) => request(`/facilitators/monitoring${queryString(filters)}`),
  searchFacilitators: (filters = {}) => request(`/facilitators/search${queryString(filters)}`),
  getCompetencyProfile: (id) => request(`/facilitators/${id}/competency-profile`),
  createReview: (id, payload) => request(`/facilitators/${id}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),
}
