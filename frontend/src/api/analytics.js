import { apiClient, ensureArray } from './client'

export const getTimeseries = (params = {}) =>
  apiClient
    .get('/analytics/timeseries', { params })
    .then((r) => ensureArray(r.data))
