import React from 'react'

/**
 * PulsingDot — colored live indicator.
 */
export function PulsingDot({ color = '#00FF66', size = 8, label, testId }) {
  return (
    <span className="inline-flex items-center gap-2" data-testid={testId}>
      <span
        className="animate-tac-pulse rounded-full"
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 ${size}px ${color}`,
        }}
      />
      {label ? (
        <span className="tag-label">{label}</span>
      ) : null}
    </span>
  )
}
