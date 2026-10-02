const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

const CSRF_COOKIE_NAME = 'student_hub_csrf'
const LEGACY_ACCESS_TOKEN_KEY = 'student-project-hub-access-token'
let accessToken = ''
let refreshPromise = null

if (typeof window !== 'undefined') {
  try {
    window.sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  } catch {
    // Ignore unavailable storage; access tokens are no longer read from it.
  }
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getAccessToken() {
  return accessToken
}

export function storeAccessToken(token) {
  if (typeof token !== 'string' || !token) {
    throw new ApiError('The login response did not include an access token.')
  }

  accessToken = token
}

export function clearAccessToken() {
  accessToken = ''
  try {
    window.sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  } catch {
    // Ignore unavailable storage; access tokens are no longer read from it.
  }
}

function readCsrfCookie() {
  if (typeof document === 'undefined') return ''

  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${CSRF_COOKIE_NAME}=`))

  return cookie ? decodeURIComponent(cookie.slice(CSRF_COOKIE_NAME.length + 1)) : ''
}

async function readResponse(response) {
  return response.json().catch(() => null)
}

function redirectToLogin() {
  clearAccessToken()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function performRefresh() {
  const csrfToken = readCsrfCookie()
  if (!csrfToken) {
    throw new ApiError('Your refresh session is missing. Please log in again.', 401)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-CSRF-Token': csrfToken,
      },
    })
  } catch {
    throw new ApiError('Unable to refresh your login session.')
  }

  const data = await readResponse(response)
  if (!response.ok || typeof data?.access_token !== 'string') {
    const message = response.status === 401
      ? 'Your login session has expired. Please log in again.'
      : typeof data?.detail === 'string'
        ? data.detail
        : 'Your login session could not be refreshed.'
    throw new ApiError(message, response.status)
  }

  storeAccessToken(data.access_token)
  return accessToken
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function sendRequest(path, { method, body, authenticated }, token = '') {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (authenticated && token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'Unable to connect to the server. Please try again.'
    )
  }

  return response
}

export async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  let token = authenticated ? getAccessToken() : ''
  if (authenticated && !token) {
    try {
      token = await refreshAccessToken()
    } catch (error) {
      redirectToLogin()
      throw error
    }
  }

  let response = await sendRequest(path, { method, body, authenticated }, token)
  if (authenticated && response.status === 401) {
    try {
      clearAccessToken()
      token = await refreshAccessToken()
      response = await sendRequest(path, { method, body, authenticated }, token)
    } catch (error) {
      redirectToLogin()
      throw error
    }
  }

  const data = await readResponse(response)
  if (!response.ok) {
    let message =
      typeof data?.detail === 'string'
        ? data.detail
        : `The request failed with status ${response.status}.`

    if (response.status === 401) {
      redirectToLogin()
      message = 'Your login session has expired or is invalid. Please log in again.'
    } else if (response.status === 422) {
      message = 'Please check the submitted project information and try again.'
    }

    throw new ApiError(message, response.status)
  }

  return data
}

export function loginStudent(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: credentials,
    authenticated: false,
  })
}

export function createProject(project) {
  return request('/api/projects', { method: 'POST', body: project })
}

export function updateProject(projectId, project) {
  return request(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    body: project,
  })
}

export function deleteProject(projectId) {
  return request(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  })
}

export function getStudentProjects() {
  return request('/api/projects')
}

export function getAdminProjects() {
  return request('/api/admin/projects')
}

export function getAdminProject(projectId) {
  return request(`/api/admin/projects/${encodeURIComponent(projectId)}`)
}

export function reviewAdminProject(projectId, action, feedback = '') {
  const normalizedAction = String(action ?? '').trim().toLowerCase()
  const adminActionPaths = {
    approve: 'approve',
    reject: 'reject',
    'request-changes': 'request-changes',
  }

  if (!(normalizedAction in adminActionPaths)) {
    throw new ApiError('Unsupported admin review action.')
  }

  const trimmedFeedback = typeof feedback === 'string' ? feedback.trim() : ''
  if (normalizedAction !== 'approve' && !trimmedFeedback) {
    throw new ApiError('Feedback is required for rejection and change requests.')
  }

  return request(
    `/api/admin/projects/${encodeURIComponent(projectId)}/${adminActionPaths[normalizedAction]}`,
    {
      method: 'POST',
      body: { feedback: trimmedFeedback },
    }
  )
}

export async function logoutStudent() {
  const csrfToken = readCsrfCookie()
  try {
    if (csrfToken) {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      })
      if (!response.ok && response.status !== 401) {
        const data = await readResponse(response)
        throw new ApiError(
          typeof data?.detail === 'string'
            ? data.detail
            : 'The login session could not be revoked.',
          response.status
        )
      }
    }
  } finally {
    clearAccessToken()
  }
}