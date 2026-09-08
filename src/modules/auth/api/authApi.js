import { apiRequest } from '../../../shared/api/client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function login(email, password) {
  return apiRequest(API_BASE_URL, '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}
