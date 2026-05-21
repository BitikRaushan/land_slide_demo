import { apiClient } from './client'

export const getNodes = () => apiClient.get('/nodes/status').then((r) => r.data)
