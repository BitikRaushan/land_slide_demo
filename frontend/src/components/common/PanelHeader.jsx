import React from 'react'

/**
 * PanelHeader — Renders a consistent header strip for dashboard widgets.
 */
export function PanelHeader({ title, subtitle, right, testId }) {
  return (
    <div
      data-testid={testId}
      className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-[#232733]"
    >
      <div className="flex flex-col">
        <span className="font-mono-tac text-[10px] uppercase tracking-[0.18em] text-[#8F95A1]">
          {title}
        </span>
        {subtitle ? (
          <span className="font-heading text-sm text-white">{subtitle}</span>
        ) : null}
      </div>
      {right}
    </div>
  )
}
