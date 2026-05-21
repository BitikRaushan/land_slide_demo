import { apiClient } from './client'

export const getAlerts = () => apiClient.get('/alerts').then((r) => r.data)
