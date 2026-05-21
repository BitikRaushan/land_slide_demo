import React, { useMemo, useState } from 'react'
import { useLiveData } from '@/hooks/useLiveData'
import { getNodes } from '@/api/nodes'
import { NodeTable } from '@/components/nodes/NodeTable'
import { PanelHeader } from '@/components/common/PanelHeader'
import { MetricCard } from '@/components/common/MetricCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Radio, Battery, Activity, AlertOctagon } from 'lucide-react'

export default function NodeMonitoring() {
  const { data: nodes } = useLiveData('nodes', getNodes, 8000)
  const [filter, setFilter] = useState('all')

  const stats = useMemo(() => {
    if (!nodes) return { online: 0, degraded: 0, offline: 0, lowBat: 0, weakLink: 0 }
    return {
      online: nodes.filter((n) => n.health === 'online').length,
      degraded: nodes.filter((n) => n.health === 'degraded').length,
      offline: nodes.filter((n) => n.health === 'offline').length,
      lowBat: nodes.filter((n) => n.battery_pct < 30).length,
      weakLink: nodes.filter((n) => n.rssi_dbm <= -85).length,
    }
  }, [nodes])

  const filtered = useMemo(() => {
    if (!nodes) return []
    if (filter === 'all') return nodes
    if (filter === 'red') return nodes.filter((n) => n.risk_level === 'red')
    if (filter === 'offline') return nodes.filter((n) => n.health !== 'online')
    if (filter === 'lowbat') return nodes.filter((n) => n.battery_pct < 30)
    return nodes
  }, [nodes, filter])

  return (
    <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-4 xl:grid-cols-12 gap-3 auto-rows-min" data-testid="nodes-page">
      <div className="col-span-1 md:col-span-4 xl:col-span-12">
        <h1 className="font-heading text-2xl tracking-tight font-bold text-white">Node Monitoring</h1>
        <p className="font-mono-tac text-[11px] uppercase tracking-[0.12em] text-[#8F95A1]">
          IOT-04 · Health, RSSI, battery, last-seen
        </p>
      </div>

      <MetricCard testId="node-stat-online" label="Online" value={stats.online} accentColor="#00FF66" icon={Activity} span="xl:col-span-3" />
      <MetricCard testId="node-stat-degraded" label="Degraded" value={stats.degraded} accentColor="#FFB800" icon={Radio} span="xl:col-span-3" />
      <MetricCard testId="node-stat-offline" label="Offline" value={stats.offline} accentColor="#FF3333" icon={AlertOctagon} span="xl:col-span-3" />
      <MetricCard testId="node-stat-battery" label="Low Battery" value={stats.lowBat} accentColor="#FFB800" icon={Battery} hint={`${stats.weakLink} weak link`} span="xl:col-span-3" />

      <div className="col-span-1 md:col-span-4 xl:col-span-12 surface-panel flex flex-col min-h-[420px]" data-testid="nodes-table-panel">
        <PanelHeader
          title="Sensor Fleet"
          subtitle={`${filtered.length} of ${nodes?.length || 0} nodes`}
          right={
            <div className="flex items-center gap-2" data-testid="node-filter">
              {[
                ['all', 'ALL'],
                ['red', 'RED'],
                ['offline', 'OFFLINE'],
                ['lowbat', 'LOW BAT'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  data-testid={`filter-${k}`}
                  onClick={() => setFilter(k)}
                  className={`font-mono-tac text-[10px] uppercase tracking-[0.12em] px-2 py-1 border transition-colors ${
                    filter === k ? 'bg-white text-black border-white' : 'text-[#8F95A1] border-[#232733] hover:border-white hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />
        <div className="flex-1 min-h-0">
          <NodeTable nodes={filtered} />
        </div>
      </div>

      <div className="col-span-1 md:col-span-4 xl:col-span-12 flex gap-2 text-xs">
        <StatusBadge level="green">{stats.online} ONLINE</StatusBadge>
        <StatusBadge level="yellow">{stats.degraded} DEGRADED</StatusBadge>
        <StatusBadge level="red">{stats.offline} OFFLINE</StatusBadge>
      </div>
    </div>
  )
}
