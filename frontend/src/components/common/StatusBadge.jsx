import React from 'react'
import { riskColor } from '@/utils/format'

/**
 * Square tactical badge for risk / status indicators.
 */
export function StatusBadge({ level, children, className = '', testId }) {
  const color = riskColor(level)
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono-tac text-[10px] uppercase tracking-[0.12em] ${className}`}
      style={{
        color,
        borderLeft: `2px solid ${color}`,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, background: color }}
      />
      {children}
    </span>
  )
}
