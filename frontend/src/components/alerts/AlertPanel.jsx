import React from 'react'
import { Bell, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react'
import { fmtRelative } from '@/utils/format'
import { useAlertStore } from '@/store/useAlertStore'

const SEVERITY = {
  critical: { color: '#FF3333', icon: AlertOctagon, label: 'CRITICAL' },
  warning:  { color: '#FFB800', icon: AlertTriangle, label: 'WARNING' },
  info:     { color: '#007AFF', icon: Bell,          label: 'INFO' },
}

/**
 * AlertPanel — scrollable alert feed.
 * Critical (RED) alerts get a tracing-beam border to demand attention.
 */
export function AlertPanel({ alerts, compact = false, onItemClick }) {
  const acknowledge = useAlertStore((s) => s.acknowledge)
  const list = Array.isArray(alerts) ? alerts : []

  if (!list.length) {
    return (
      <div
        className="surface-panel p-6 flex flex-col items-center justify-center gap-2 h-full"
        data-testid="alert-panel-empty"
      >
        <CheckCircle2 size={18} className="text-[#00FF66]" />
        <div className="font-heading text-sm text-white">All clear</div>
        <div className="tag-label">No active alerts on NH-715</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto h-full pr-1" data-testid="alert-panel">
      {list.map((a) => {
        const sev = SEVERITY[a.severity] || SEVERITY.info
        const Icon = sev.icon
        const isCritical = a.severity === 'critical' && !a.acknowledged
        return (
          <div
            key={a.id}
            data-testid={`alert-item-${a.id}`}
            onClick={() => onItemClick?.(a)}
            className={`relative surface-panel p-3 flex flex-col gap-1.5 cursor-pointer transition-colors hover:border-[#3E4557] ${
              isCritical ? 'critical-beam' : ''
            }`}
            style={{ borderLeft: `2px solid ${sev.color}` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color: sev.color }} />
                <span
                  className="font-mono-tac text-[10px] uppercase tracking-[0.12em]"
                  style={{ color: sev.color }}
                >
                  {sev.label}
                </span>
                {a.acknowledged && (
                  <span className="font-mono-tac text-[10px] text-[#8F95A1]">· ACK</span>
                )}
              </div>
              <span className="font-mono-tac text-[10px] text-[#8F95A1]">
                {fmtRelative(a.issued_at)}
              </span>
            </div>

            <div className="font-heading text-sm text-white leading-tight">
              {a.title}
            </div>

            {!compact && (
              <div className="font-mono-tac text-xs text-[#8F95A1] leading-relaxed">
                {a.message}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#1A1C20]">
              <span className="tag-label">{a.location}</span>
              {!a.acknowledged && (
                <button
                  data-testid={`alert-ack-${a.id}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    acknowledge(a.id)
                  }}
                  className="font-mono-tac text-[10px] uppercase tracking-[0.12em] text-white border border-[#232733] hover:border-white px-2 py-0.5 transition-colors"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
