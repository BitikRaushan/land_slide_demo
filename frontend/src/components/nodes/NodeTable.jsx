import React from 'react'
import { Battery, BatteryLow, Signal, SignalLow, SignalZero } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { fmtRelative, healthTone } from '@/utils/format'

const batteryIcon = (pct) => (pct < 30 ? BatteryLow : Battery)
const rssiIcon = (rssi) => (rssi <= -85 ? SignalZero : rssi <= -70 ? SignalLow : Signal)
const rssiTone = (rssi) => (rssi <= -85 ? '#FF3333' : rssi <= -70 ? '#FFB800' : '#00FF66')
const batteryTone = (pct) => (pct < 20 ? '#FF3333' : pct < 40 ? '#FFB800' : '#00FF66')

/**
 * NodeTable — dense data grid showing all sensor nodes.
 */
export function NodeTable({ nodes, onSelect }) {
  const list = Array.isArray(nodes) ? nodes : []
  return (
    <div className="overflow-auto h-full" data-testid="node-table">
      <table className="w-full text-xs font-mono-tac">
        <thead>
          <tr className="text-left tag-label border-b border-[#232733] sticky top-0 bg-[#111214] z-10">
            <th className="px-3 py-2">Node ID</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">KM</th>
            <th className="px-3 py-2">Health</th>
            <th className="px-3 py-2">Risk</th>
            <th className="px-3 py-2">RSSI</th>
            <th className="px-3 py-2">Battery</th>
            <th className="px-3 py-2">Rain 24h</th>
            <th className="px-3 py-2">Tilt</th>
            <th className="px-3 py-2">Moisture</th>
            <th className="px-3 py-2">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {list.map((n) => {
            const Bi = batteryIcon(n.battery_pct)
            const Si = rssiIcon(n.rssi_dbm)
            const h = healthTone(n.health)
            return (
              <tr
                key={n.id}
                data-testid={`node-row-${n.id}`}
                onClick={() => onSelect?.(n)}
                className="border-b border-[#1A1C20] hover:bg-[#1A1C20] cursor-pointer transition-colors"
              >
                <td className="px-3 py-2 text-white">{n.id}</td>
                <td className="px-3 py-2 text-[#8F95A1]">{n.name}</td>
                <td className="px-3 py-2">{n.km}</td>
                <td className="px-3 py-2">
                  <span style={{ color: h.color }}>● {h.label}</span>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge level={n.risk_level} testId={`risk-badge-${n.id}`}>
                    {n.risk_level} · {n.risk_score}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5" style={{ color: rssiTone(n.rssi_dbm) }}>
                    <Si size={12} />
                    {n.rssi_dbm} dBm
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5" style={{ color: batteryTone(n.battery_pct) }}>
                    <Bi size={12} />
                    {n.battery_pct}%
                  </span>
                </td>
                <td className="px-3 py-2">{n.sensors?.rainfall_mm_24h ?? '—'} mm</td>
                <td className="px-3 py-2">{n.sensors?.tilt_deg ?? '—'}°</td>
                <td className="px-3 py-2">{n.sensors?.moisture_pct ?? '—'}%</td>
                <td className="px-3 py-2 text-[#8F95A1]">{fmtRelative(n.last_seen)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
