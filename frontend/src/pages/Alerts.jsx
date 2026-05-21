import React, { useMemo, useState } from 'react'
import { useAlertStore } from '@/store/useAlertStore'
import { AlertPanel } from '@/components/alerts/AlertPanel'
import { PanelHeader } from '@/components/common/PanelHeader'
import { MetricCard } from '@/components/common/MetricCard'
import { AlertOctagon, AlertTriangle, Bell, CheckCircle2 } from 'lucide-react'

export default function Alerts() {
  const alerts = useAlertStore((s) => s.alerts)
  const [filter, setFilter] = useState('all')

  const counts = useMemo(() => ({
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
    unack: alerts.filter((a) => !a.acknowledged).length,
  }), [alerts])

  const filtered = useMemo(() => {
    if (filter === 'all') return alerts
    if (filter === 'unack') return alerts.filter((a) => !a.acknowledged)
    return alerts.filter((a) => a.severity === filter)
  }, [alerts, filter])

  return (
    <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-4 xl:grid-cols-12 gap-3 auto-rows-min h-full" data-testid="alerts-page">
      <div className="col-span-1 md:col-span-4 xl:col-span-12">
        <h1 className="font-heading text-2xl tracking-tight font-bold text-white">Alert Centre</h1>
        <p className="font-mono-tac text-[11px] uppercase tracking-[0.12em] text-[#8F95A1]">
          ALT-06 · All active threats & advisories
        </p>
      </div>

      <MetricCard testId="alert-stat-critical" label="Critical" value={counts.critical} accentColor="#FF3333" icon={AlertOctagon} span="xl:col-span-3" />
      <MetricCard testId="alert-stat-warning"  label="Warning"  value={counts.warning}  accentColor="#FFB800" icon={AlertTriangle} span="xl:col-span-3" />
      <MetricCard testId="alert-stat-info"     label="Info"     value={counts.info}     accentColor="#007AFF" icon={Bell} span="xl:col-span-3" />
      <MetricCard testId="alert-stat-unack"    label="Unack."   value={counts.unack}    accentColor={counts.unack ? '#FF3333' : '#00FF66'} icon={CheckCircle2} span="xl:col-span-3" />

      <div className="col-span-1 md:col-span-4 xl:col-span-12 surface-panel flex flex-col min-h-[420px]">
        <PanelHeader
          title="Active alerts"
          subtitle={`${filtered.length} shown`}
          right={
            <div className="flex gap-1" data-testid="alert-filter">
              {[
                ['all', 'ALL'],
                ['critical', 'CRITICAL'],
                ['warning', 'WARNING'],
                ['unack', 'UNACK'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  data-testid={`alert-filter-${k}`}
                  onClick={() => setFilter(k)}
                  className={`font-mono-tac text-[10px] uppercase tracking-[0.12em] px-2 py-1 border transition-colors ${
                    filter === k ? 'bg-white text-black border-white' : 'text-[#8F95A1] border-[#232733] hover:text-white hover:border-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />
        <div className="flex-1 p-3 min-h-0">
          <AlertPanel alerts={filtered} />
        </div>
      </div>
    </div>
  )
}
