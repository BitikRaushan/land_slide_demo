import { apiClient, ensureArray } from './client'

export const getNodes = () =>
  apiClient.get('/nodes/status').then((r) => ensureArray(r.data))
