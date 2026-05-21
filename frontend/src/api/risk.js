import { apiClient } from './client'

export const getRiskSegments = () =>
  apiClient.get('/risk/segment').then((r) => r.data)

export const getSafestRoute = (origin, destination) =>
  apiClient
    .get('/risk/route', { params: { origin, destination } })
    .then((r) => r.data)
