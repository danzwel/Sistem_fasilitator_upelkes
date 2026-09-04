const TOKEN_KEY = 'upelkes:auth-token'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new CustomEvent('upelkes:auth-changed'))
}

export function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function clearAuth() { setAuthToken('') }

export function decodeAuthToken(token = getAuthToken()) {
  try {
    const payload = token.split('.')[0]
    return JSON.parse(decodeURIComponent(escape(atob(payload))))
  } catch {
    return null
  }
}

export async function apiRequest(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...authHeaders(), ...options.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('upelkes:auth-expired'))
  }
  if (!response.ok) throw new Error(body.message || `Request gagal (${response.status})`)
  return body.data ?? body
}
