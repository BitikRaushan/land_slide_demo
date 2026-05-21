import React from 'react'

/**
 * MetricCard — the workhorse tile of the dashboard.
 * Borders are sharp; numbers use JetBrains Mono.
 */
export function MetricCard({
  label,
  value,
  unit,
  trend,
  accentColor,
  icon: Icon,
  hint,
  testId,
  span = '',
}) {
  return (
    <div
      data-testid={testId}
      className={`surface-panel surface-panel-hover p-3 md:p-4 flex flex-col gap-2 ${span}`}
    >
      <div className="flex items-center justify-between">
        <span className="tag-label">{label}</span>
        {Icon ? <Icon size={14} className="text-[#8F95A1]" /> : null}
      </div>

      <div className="flex items-end gap-2">
        <span
          className="font-mono-tac text-3xl md:text-4xl font-medium tracking-tighter leading-none"
          style={{ color: accentColor || '#ffffff' }}
        >
          {value}
        </span>
        {unit ? (
          <span className="font-mono-tac text-xs text-[#8F95A1] pb-1">{unit}</span>
        ) : null}
      </div>

      {(trend || hint) && (
        <div className="flex items-center justify-between pt-1 border-t border-[#1A1C20]">
          {trend && (
            <span
              className="font-mono-tac text-[10px]"
              style={{ color: trend.startsWith('+') ? '#00FF66' : trend.startsWith('-') ? '#FF3333' : '#8F95A1' }}
            >
              {trend}
            </span>
          )}
          {hint && <span className="tag-label">{hint}</span>}
        </div>
      )}
    </div>
  )
}
