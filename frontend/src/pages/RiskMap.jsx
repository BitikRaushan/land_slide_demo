import React from 'react'
import { useLiveData } from '@/hooks/useLiveData'
import { getNodes } from '@/api/nodes'
import { getRiskSegments } from '@/api/risk'
import { HighwayMap } from '@/components/map/HighwayMap'
import { PanelHeader } from '@/components/common/PanelHeader'
import { StatusBadge } from '@/components/common/StatusBadge'

export default function RiskMap() {
  const { data: nodes } = useLiveData('nodes', getNodes, 8000)
  const { data: segments } = useLiveData('segments', getRiskSegments, 8000)

  return (
    <div className="p-3 md:p-4 flex flex-col gap-3 h-full" data-testid="risk-map-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl tracking-tight font-bold text-white">
            Live Highway Risk Map
          </h1>
          <p className="font-mono-tac text-[11px] uppercase tracking-[0.12em] text-[#8F95A1]">
            GEO-02 · NH-715 corridor · sensor + segment overlay
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <StatusBadge level="red">CRITICAL</StatusBadge>
          <StatusBadge level="yellow">WARNING</StatusBadge>
          <StatusBadge level="green">SAFE</StatusBadge>
        </div>
      </div>

      <div className="surface-panel flex-1 flex flex-col min-h-0">
        <PanelHeader title="Tile · CartoDB Dark Matter" subtitle="OpenStreetMap data" />
        <div className="flex-1 min-h-0">
          <HighwayMap nodes={nodes || []} segments={segments || []} />
        </div>
      </div>
    </div>
  )
}
