import { apiRequest } from '../../../shared/api/client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function getDashboardSummary() {
  return apiRequest(API_BASE_URL, '/dashboard')
}
