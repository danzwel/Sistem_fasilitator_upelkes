import { apiRequest } from '../../../shared/api/client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const getAdminProfile = () => apiRequest(BASE_URL, '/auth/me')
export const updateAdminProfile = (payload) => apiRequest(BASE_URL, '/auth/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const changeAdminPassword = (payload) => apiRequest(BASE_URL, '/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const getSettings = () => apiRequest(BASE_URL, '/settings')
export const updateSettings = (payload) => apiRequest(BASE_URL, '/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
