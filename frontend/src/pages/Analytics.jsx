import React, { useState } from 'react'
import { useLiveData } from '@/hooks/useLiveData'
import { getTimeseries } from '@/api/analytics'
import { getNodes } from '@/api/nodes'
import { TelemetryChart } from '@/components/charts/TelemetryChart'
import { PanelHeader } from '@/components/common/PanelHeader'
import { NH715_CORRIDOR } from '@/utils/nhRoute'
import { CloudRain, Compass, Droplets, Gauge } from 'lucide-react'

export default function Analytics() {
  const [hours, setHours] = useState(24)
  const [nodeId, setNodeId] = useState('')

  const fetcher = React.useCallback(
    () => getTimeseries({ hours, node_id: nodeId || undefined }),
    [hours, nodeId]
  )
  const key = `ts:${nodeId || 'all'}:${hours}`
  const { data: series } = useLiveData(key, fetcher, 15000)
  const { data: nodes } = useLiveData('nodes', getNodes, 8000)

  const safeSeries = Array.isArray(series) ? series : []
  const safeNodes = Array.isArray(nodes) ? nodes : []
  const lastValues = safeSeries.length > 0 ? safeSeries[safeSeries.length - 1] : null

  return (
    <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3 auto-rows-min" data-testid="analytics-page">
      <div className="col-span-1 md:col-span-2 xl:col-span-12 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl tracking-tight font-bold text-white">Telemetry Analytics</h1>
          <p className="font-mono-tac text-[11px] uppercase tracking-[0.12em] text-[#8F95A1]">
            TLM-05 · Environmental signals · 1h aggregate
          </p>
        </div>

        <div className="flex gap-2">
          <select
            data-testid="analytics-node-select"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            className="bg-[#050505] border border-[#232733] text-xs font-mono-tac px-2 py-1.5 focus:outline-none focus:border-white"
          >
            <option value="">All nodes (avg)</option>
            {(safeNodes.length ? safeNodes : NH715_CORRIDOR).map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>

          <div className="flex border border-[#232733] divide-x divide-[#232733]" data-testid="analytics-range">
            {[6, 24, 72].map((h) => (
              <button
                key={h}
                data-testid={`range-${h}h`}
                onClick={() => setHours(h)}
                className={`px-2 py-1.5 font-mono-tac text-[10px] uppercase tracking-[0.12em] ${
                  hours === h ? 'bg-white text-black' : 'text-[#8F95A1] hover:text-white'
                }`}
              >
                {h}H
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Last values strip */}
      {lastValues && (
        <div className="col-span-1 md:col-span-2 xl:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="surface-panel p-3 flex items-center justify-between">
            <div>
              <div className="tag-label">Rainfall</div>
              <div className="font-mono-tac text-2xl text-white">{lastValues.rainfall_mm}<span className="text-[#8F95A1] text-xs ml-1">mm/h</span></div>
            </div>
            <CloudRain size={20} className="text-[#007AFF]" />
          </div>
          <div className="surface-panel p-3 flex items-center justify-between">
            <div>
              <div className="tag-label">Tilt</div>
              <div className="font-mono-tac text-2xl text-white">{lastValues.tilt_deg}<span className="text-[#8F95A1] text-xs ml-1">°</span></div>
            </div>
            <Compass size={20} className="text-[#FFB800]" />
          </div>
          <div className="surface-panel p-3 flex items-center justify-between">
            <div>
              <div className="tag-label">Moisture</div>
              <div className="font-mono-tac text-2xl text-white">{lastValues.moisture_pct}<span className="text-[#8F95A1] text-xs ml-1">%</span></div>
            </div>
            <Droplets size={20} className="text-[#00FF66]" />
          </div>
          <div className="surface-panel p-3 flex items-center justify-between">
            <div>
              <div className="tag-label">Pressure</div>
              <div className="font-mono-tac text-2xl text-white">{lastValues.pressure_hpa}<span className="text-[#8F95A1] text-xs ml-1">hPa</span></div>
            </div>
            <Gauge size={20} className="text-[#FF3333]" />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="surface-panel xl:col-span-6 col-span-1 md:col-span-2" data-testid="chart-rainfall">
        <PanelHeader title="Rainfall" subtitle="mm / hour" />
        <div className="p-3">
          <TelemetryChart
            data={safeSeries}
            yUnit=""
            series={[{ key: 'rainfall_mm', color: '#007AFF', label: 'Rainfall (mm)' }]}
          />
        </div>
      </div>

      <div className="surface-panel xl:col-span-6 col-span-1 md:col-span-2" data-testid="chart-tilt">
        <PanelHeader title="Tilt / Inclination" subtitle="degrees" />
        <div className="p-3">
          <TelemetryChart
            data={safeSeries}
            yUnit="°"
            series={[{ key: 'tilt_deg', color: '#FFB800', label: 'Tilt (°)' }]}
          />
        </div>
      </div>

      <div className="surface-panel xl:col-span-6 col-span-1 md:col-span-2" data-testid="chart-moisture">
        <PanelHeader title="Soil Moisture" subtitle="percent" />
        <div className="p-3">
          <TelemetryChart
            data={safeSeries}
            yUnit="%"
            series={[{ key: 'moisture_pct', color: '#00FF66', label: 'Moisture (%)' }]}
          />
        </div>
      </div>

      <div className="surface-panel xl:col-span-6 col-span-1 md:col-span-2" data-testid="chart-pressure">
        <PanelHeader title="Barometric Pressure" subtitle="hPa" />
        <div className="p-3">
          <TelemetryChart
            data={safeSeries}
            yUnit=""
            series={[{ key: 'pressure_hpa', color: '#FF3333', label: 'Pressure (hPa)' }]}
          />
        </div>
      </div>
    </div>
  )
}
