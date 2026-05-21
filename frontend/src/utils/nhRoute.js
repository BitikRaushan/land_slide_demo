/**
 * NH-715 corridor geometry, mirrored from the backend's static node list so
 * the map can render a baseline polyline even before the first API response.
 * Coordinates approximate the highway through Assam → Arunachal Pradesh
 * (Tezpur → Bhalukpong → Bomdila → Dirang → Sela → Tawang).
 */
export const NH715_CORRIDOR = [
  { id: 'NH715-N01', name: 'Tezpur Gateway',    lat: 26.6528, lng: 92.7926, km: 0 },
  { id: 'NH715-N02', name: 'Balipara Junction', lat: 26.8333, lng: 92.7833, km: 22 },
  { id: 'NH715-N03', name: 'Bhalukpong Border', lat: 27.0114, lng: 92.6394, km: 56 },
  { id: 'NH715-N04', name: 'Tipi Forest Section', lat: 27.05, lng: 92.62, km: 62 },
  { id: 'NH715-N05', name: 'Sessa Slope',       lat: 27.1167, lng: 92.5167, km: 78 },
  { id: 'NH715-N06', name: 'Tenga Valley',      lat: 27.1833, lng: 92.4667, km: 96 },
  { id: 'NH715-N07', name: 'Rupa Cliff',        lat: 27.2167, lng: 92.4, km: 108 },
  { id: 'NH715-N08', name: 'Bomdila Ridge',     lat: 27.2645, lng: 92.4156, km: 116 },
  { id: 'NH715-N09', name: 'Senge Slip Zone',   lat: 27.3167, lng: 92.35, km: 132 },
  { id: 'NH715-N10', name: 'Dirang Pass',       lat: 27.3597, lng: 92.241, km: 148 },
  { id: 'NH715-N11', name: 'Sela Approach',     lat: 27.4833, lng: 92.1, km: 174 },
  { id: 'NH715-N12', name: 'Sela Tunnel North', lat: 27.5167, lng: 92.05, km: 184 },
  { id: 'NH715-N13', name: 'Jaswant Garh',      lat: 27.55, lng: 91.9667, km: 198 },
  { id: 'NH715-N14', name: 'Jang Junction',     lat: 27.5667, lng: 91.9, km: 212 },
  { id: 'NH715-N15', name: 'Tawang Terminal',   lat: 27.586, lng: 91.8594, km: 226 },
]

export const NH715_BOUNDS = [
  [26.55, 91.7],
  [27.7, 93.0],
]

export const NH715_CENTER = [27.15, 92.35]
