import React from 'react'
import { useSystemClock } from '@/hooks/useSystemClock'
import { useLiveData } from '@/hooks/useLiveData'
import { getHealth } from '@/api/health'
import { PulsingDot } from '@/components/common/PulsingDot'
import { useAlertStore } from '@/store/useAlertStore'
import { fmtIstTime, fmtUtcTime } from '@/utils/format'
import { Activity, AlertTriangle, Satellite } from 'lucide-react'

const STATUS_TONES = {
  operational: '#00FF66',
  degraded: '#FFB800',
  down: '#FF3333',
}

export function TopBar() {
  const now = useSystemClock()
  const { data: health } = useLiveData('health', getHealth, 10000)
  const alertsRaw = useAlertStore((s) => s.alerts)
  const alerts = Array.isArray(alertsRaw) ? alertsRaw : []
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length

  const apiStatus = health?.status || 'down'
  const tone = STATUS_TONES[apiStatus] || '#8F95A1'

  return (
    <header
      className="h-12 border-b border-[#232733] bg-[#111214] flex items-center justify-between px-3 md:px-4 flex-shrink-0"
      data-testid="top-bar"
    >
      {/* Brand + corridor */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Satellite size={16} className="text-white" />
          <div className="leading-tight">
            <div className="font-heading text-sm font-bold tracking-wide text-white">
              RESILIO<span className="text-[#FF3333]">·</span>ROUTE
            </div>
            <div className="font-mono-tac text-[9px] uppercase tracking-[0.18em] text-[#8F95A1]">
              LEWS COMMAND // NE-IN
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-[#232733]">
          <span className="tag-label">Corridor</span>
          <span className="font-mono-tac text-xs text-white">NH-715</span>
          <span className="tag-label">Mode</span>
          <span className="font-mono-tac text-xs text-white">LIVE</span>
        </div>
      </div>

      {/* Status cluster */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center gap-2" data-testid="api-health-indicator">
          <PulsingDot color={tone} />
          <div className="leading-tight">
            <div className="tag-label">API</div>
            <div className="font-mono-tac text-xs" style={{ color: tone }}>
              {apiStatus.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Activity size={14} className="text-[#8F95A1]" />
          <div className="leading-tight">
            <div className="tag-label">Nodes</div>
            <div className="font-mono-tac text-xs text-white">
              {health?.services?.node_network || '—'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" data-testid="alert-counter">
          <AlertTriangle
            size={14}
            style={{ color: criticalCount > 0 ? '#FF3333' : '#8F95A1' }}
          />
          <div className="leading-tight">
            <div className="tag-label">Critical</div>
            <div
              className="font-mono-tac text-xs"
              style={{ color: criticalCount > 0 ? '#FF3333' : '#ffffff' }}
            >
              {criticalCount}
            </div>
          </div>
        </div>

        <div className="leading-tight border-l border-[#232733] pl-3 md:pl-4" data-testid="system-clock">
          <div className="font-mono-tac text-xs text-white">{fmtUtcTime(now)}</div>
          <div className="font-mono-tac text-[10px] text-[#8F95A1]">{fmtIstTime(now)}</div>
        </div>
      </div>
    </header>
  )
}
