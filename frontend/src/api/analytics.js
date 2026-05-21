import { apiClient } from './client'

export const getTimeseries = (params = {}) =>
  apiClient.get('/analytics/timeseries', { params }).then((r) => r.data)
