/**
 * Axios client for the Resilio-Route backend.
 *
 * Order of precedence for backend URL:
 *   1. REACT_APP_BACKEND_URL  (kept for parity with the hosted environment)
 *   2. VITE_BACKEND_URL       (preferred for new Vite projects)
 *   3. ""  (relative — only valid when Vite proxy is configured via BACKEND_PROXY_URL)
 *
 * If neither URL nor proxy is set, every request will hit the dev server
 * itself (port 3000), which returns the SPA HTML and breaks JSON parsing.
 * We detect that here and surface a clear, single error in the console.
 */
import axios from 'axios'

const RAW_URL =
  import.meta.env.REACT_APP_BACKEND_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  ''

// Trim any accidental trailing slash so `${URL}/api` is always clean.
const BACKEND_URL = RAW_URL.replace(/\/+$/, '')
export const API_BASE = `${BACKEND_URL}/api`

if (!BACKEND_URL && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[resilio] REACT_APP_BACKEND_URL is not set. Calls will hit the Vite ' +
      'dev server and return HTML. Set it in frontend/.env or enable the ' +
      'BACKEND_PROXY_URL proxy in vite.config.js.'
  )
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
  // Reject if the dev server returns HTML (means the URL is wrong)
  transformResponse: [
    (data, headers) => {
      if (typeof data !== 'string') return data
      const ct = headers?.['content-type'] || ''
      if (ct.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      // HTML / text response — backend URL is misconfigured.
      throw new Error(
        'Non-JSON response received. Verify REACT_APP_BACKEND_URL points to the FastAPI backend.'
      )
    },
  ],
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status ?? 0
    const detail = err?.response?.data?.detail ?? err.message
    return Promise.reject({ status, detail, raw: err })
  }
)

/**
 * Helper used by API modules: guarantees the caller always gets an Array,
 * even if a future backend wraps responses like `{ data: [...] }`.
 */
export const ensureArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.results)) return payload.results
  return []
}
