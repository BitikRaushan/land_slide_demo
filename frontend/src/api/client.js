/**
 * Axios client preconfigured for the Resilio-Route backend.
 * Uses REACT_APP_BACKEND_URL (Kubernetes-routed external URL) and prefixes
 * every backend route with /api as required by the ingress.
 */
import axios from 'axios'

const BACKEND_URL =
  import.meta.env.REACT_APP_BACKEND_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  ''

export const API_BASE = `${BACKEND_URL}/api`

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // Surface a uniform error shape to callers
    const status = err?.response?.status ?? 0
    const detail = err?.response?.data?.detail ?? err.message
    return Promise.reject({ status, detail, raw: err })
  }
)
