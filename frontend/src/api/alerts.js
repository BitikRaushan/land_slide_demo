import { apiClient, ensureArray } from './client'

export const getAlerts = () =>
  apiClient.get('/alerts').then((r) => ensureArray(r.data))
