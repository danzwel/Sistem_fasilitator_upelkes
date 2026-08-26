const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function getDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/dashboard`, { headers: { Accept: 'application/json' } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || `Request gagal (${response.status})`)
  return body.data ?? body
}
