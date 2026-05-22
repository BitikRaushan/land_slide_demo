import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { NH715_CENTER, NH715_CORRIDOR } from '@/utils/nhRoute'
import { riskColor } from '@/utils/format'

// Fix default icon paths (we use CircleMarker so this is mostly defensive)
// eslint-disable-next-line no-underscore-dangle
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/**
 * Inner helper that resizes the map after mount — Leaflet needs an
 * invalidateSize() once its container is laid out.
 */
function MapBootstrap() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60)
    return () => clearTimeout(t)
  }, [map])
  return null
}

/**
 * HighwayMap
 * ----------
 * Real-time risk map for the NH-715 corridor.
 *
 * @param {Array} nodes        — live node payload from /api/nodes/status
 * @param {Array} segments     — live segments from /api/risk/segment
 * @param {Array} routePath    — optional safest-route path (highlighted)
 * @param {Function} onNodeClick
 */
export function HighwayMap({ nodes, segments, routePath = null, onNodeClick }) {
  // Hard guards — the polling layer can briefly hand us null or a non-array
  // (e.g. an unexpected backend payload). Never trust callers blindly.
  const safeNodes = Array.isArray(nodes) ? nodes : []
  const safeSegments = Array.isArray(segments) ? segments : []
  const safeRoute = Array.isArray(routePath) ? routePath : null
  const fallback = safeNodes.length > 0 ? safeNodes : NH715_CORRIDOR

  return (
    <div className="relative w-full h-full" data-testid="highway-map">
      <MapContainer
        center={NH715_CENTER}
        zoom={9}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: '#050505' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
        />

        {/* Baseline corridor (dim) */}
        <Polyline
          positions={NH715_CORRIDOR.map((n) => [n.lat, n.lng])}
          pathOptions={{ color: '#3E4557', weight: 2, opacity: 0.5, dashArray: '4 4' }}
        />

        {/* Live risk segments */}
        {safeSegments.map((s) => (
          <Polyline
            key={s.segment_id}
            positions={[[s.from_lat, s.from_lng], [s.to_lat, s.to_lng]]}
            pathOptions={{
              color: riskColor(s.risk_level),
              weight: s.risk_level === 'red' ? 5 : s.risk_level === 'yellow' ? 4 : 3,
              opacity: 0.9,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={1} className="leaflet-tooltip-dark">
              <div className="font-mono-tac text-[10px]">
                <div className="text-white">{s.segment_id}</div>
                <div style={{ color: riskColor(s.risk_level) }}>
                  {s.risk_level.toUpperCase()} · score {s.risk_score}
                </div>
                <div className="text-[#8F95A1]">conf {Math.round(s.confidence * 100)}%</div>
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* Safest route overlay */}
        {routePath && routePath.length > 1 && (
          <Polyline
            positions={routePath.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: '#00FF66',
              weight: 6,
              opacity: 0.55,
              lineCap: 'butt',
            }}
          />
        )}

        {/* Node markers */}
        {fallback.map((n) => {
          const color = riskColor(n.risk_level || 'info')
          const isRed = n.risk_level === 'red'
          return (
            <CircleMarker
              key={n.id}
              center={[n.lat, n.lng]}
              radius={isRed ? 9 : 6}
              pathOptions={{
                color: '#050505',
                weight: 2,
                fillColor: color,
                fillOpacity: 1,
              }}
              eventHandlers={{
                click: () => onNodeClick?.(n),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="font-mono-tac text-[10px]">
                  <div className="text-white">{n.id}</div>
                  <div className="text-[#8F95A1]">{n.name}</div>
                  {n.risk_level && (
                    <div style={{ color }}>
                      {n.risk_level.toUpperCase()} · {n.risk_score}
                    </div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}

        <MapBootstrap />
      </MapContainer>

      {/* Legend overlay */}
      <div
        className="absolute bottom-3 left-3 surface-panel px-3 py-2 z-[400] flex items-center gap-4"
        data-testid="map-legend"
      >
        {['red', 'yellow', 'green'].map((l) => (
          <div key={l} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-1"
              style={{ background: riskColor(l) }}
            />
            <span className="tag-label">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
