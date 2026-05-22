import React, { useMemo } from 'react'
import { useLiveData } from '@/hooks/useLiveData'
import { getNodes } from '@/api/nodes'
import { getRiskSegments } from '@/api/risk'
import { getHealth } from '@/api/health'
import { MetricCard } from '@/components/common/MetricCard'
import { PanelHeader } from '@/components/common/PanelHeader'
import { HighwayMap } from '@/components/map/HighwayMap'
import { AlertPanel } from '@/components/alerts/AlertPanel'
import { useAlertStore } from '@/store/useAlertStore'
import {
  Activity,
  Radio,
  ShieldAlert,
  Gauge,
  Database,
  Cpu,
} from 'lucide-react'
import { PulsingDot } from '@/components/common/PulsingDot'

export default function Dashboard() {
  const { data: nodes } = useLiveData('nodes', getNodes, 8000)
  const { data: segments } = useLiveData('segments', getRiskSegments, 8000)
  const { data: health } = useLiveData('health', getHealth, 10000)
  const alertsRaw = useAlertStore((s) => s.alerts)
  const alerts = Array.isArray(alertsRaw) ? alertsRaw : []

  const counts = useMemo(() => {
    const list = Array.isArray(nodes) ? nodes : []
    return {
      red: list.filter((n) => n.risk_level === 'red').length,
      yellow: list.filter((n) => n.risk_level === 'yellow').length,
      green: list.filter((n) => n.risk_level === 'green').length,
      online: list.filter((n) => n.health === 'online').length,
      offline: list.filter((n) => n.health === 'offline').length,
      total: list.length,
    }
  }, [nodes])

  const segCounts = useMemo(() => {
    const list = Array.isArray(segments) ? segments : []
    return {
      red: list.filter((s) => s.risk_level === 'red').length,
      yellow: list.filter((s) => s.risk_level === 'yellow').length,
      green: list.filter((s) => s.risk_level === 'green').length,
    }
  }, [segments])

  return (
    <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-4 xl:grid-cols-12 gap-3 auto-rows-min" data-testid="dashboard-page">
      {/* Title strip */}
      <div className="col-span-1 md:col-span-4 xl:col-span-12 flex items-center justify-between pb-1">
        <div>
          <h1 className="font-heading text-2xl tracking-tight font-bold text-white">
            Operational Overview
          </h1>
          <p className="font-mono-tac text-[11px] tracking-[0.12em] uppercase text-[#8F95A1]">
            NH-715 Corridor · Real-time Landslide Threat Assessment
          </p>
        </div>
        <PulsingDot color="#00FF66" label="LIVE FEED · 8s" testId="live-indicator" />
      </div>

      {/* Risk cards */}
      <MetricCard
        testId="metric-red"
        label="Critical Nodes"
        value={counts.red}
        unit="/ red"
        accentColor="#FF3333"
        icon={ShieldAlert}
        hint={`${segCounts.red} segments`}
        span="xl:col-span-3"
      />
      <MetricCard
        testId="metric-yellow"
        label="Warning Nodes"
        value={counts.yellow}
        unit="/ amber"
        accentColor="#FFB800"
        icon={Gauge}
        hint={`${segCounts.yellow} segments`}
        span="xl:col-span-3"
      />
      <MetricCard
        testId="metric-green"
        label="Safe Nodes"
        value={counts.green}
        unit="/ green"
        accentColor="#00FF66"
        icon={Activity}
        hint={`${segCounts.green} segments`}
        span="xl:col-span-3"
      />
      <MetricCard
        testId="metric-network"
        label="Node Network"
        value={`${counts.online}/${counts.total}`}
        unit="online"
        accentColor="#FFFFFF"
        icon={Radio}
        hint={`${counts.offline} offline`}
        span="xl:col-span-3"
      />

      {/* Sub-metrics */}
      <MetricCard
        testId="metric-uptime"
        label="System Uptime"
        value={
          Number.isFinite(health?.uptime_seconds)
            ? Math.floor(health.uptime_seconds / 60)
            : '—'
        }
        unit="min"
        icon={Database}
        hint={health?.status?.toUpperCase() || '—'}
        accentColor={health?.status === 'operational' ? '#00FF66' : '#FFB800'}
        span="xl:col-span-3"
      />
      <MetricCard
        testId="metric-ml"
        label="ML Inference"
        value={
          Number.isFinite(health?.ml_model?.inference_latency_ms)
            ? Math.round(health.ml_model.inference_latency_ms)
            : '—'
        }
        unit="ms"
        icon={Cpu}
        hint={health?.ml_model?.name || '—'}
        accentColor="#007AFF"
        span="xl:col-span-3"
      />
      <MetricCard
        testId="metric-accuracy"
        label="Model Accuracy"
        value={health?.ml_model?.accuracy_pct?.toFixed(1) || '—'}
        unit="%"
        icon={Gauge}
        hint="ResilioNet-LSTM-v3"
        accentColor="#00FF66"
        span="xl:col-span-3"
      />
      <MetricCard
        testId="metric-alerts"
        label="Active Alerts"
        value={alerts.length}
        unit="open"
        icon={ShieldAlert}
        hint={`${alerts.filter((a) => !a.acknowledged).length} unack`}
        accentColor={alerts.some((a) => a.severity === 'critical' && !a.acknowledged) ? '#FF3333' : '#FFFFFF'}
        span="xl:col-span-3"
      />

      {/* Map + alerts row */}
      <div className="surface-panel flex flex-col xl:col-span-8 col-span-1 md:col-span-4 h-[440px]" data-testid="dashboard-map">
        <PanelHeader
          title="GEO-02 // Live Highway Risk Map"
          subtitle="NH-715 Tezpur → Tawang"
          right={
            <div className="flex items-center gap-3">
              <PulsingDot color="#FF3333" label={`${counts.red} crit`} />
              <PulsingDot color="#FFB800" label={`${counts.yellow} warn`} />
            </div>
          }
        />
        <div className="flex-1 min-h-0">
          <HighwayMap nodes={nodes || []} segments={segments || []} />
        </div>
      </div>

      <div className="surface-panel flex flex-col xl:col-span-4 col-span-1 md:col-span-4 h-[440px]" data-testid="dashboard-alerts">
        <PanelHeader
          title="ALT-06 // Alert Feed"
          subtitle={`${alerts.length} active`}
        />
        <div className="flex-1 min-h-0 p-2">
          <AlertPanel alerts={alerts} compact />
        </div>
      </div>
    </div>
  )
}
