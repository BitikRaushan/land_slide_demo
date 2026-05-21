import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const tooltipStyle = {
  background: '#050505',
  border: '1px solid #232733',
  borderRadius: 2,
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  color: '#ffffff',
}

/**
 * TelemetryChart — Recharts wrapper with the SOC look:
 * thin lines, monospaced ticks, dim grid.
 */
export function TelemetryChart({
  data = [],
  series = [],     // [{ key, color, label }]
  xKey = 't',
  height = 180,
  yUnit = '',
  testId,
}) {
  return (
    <div data-testid={testId} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A1C20" vertical={false} />
          <XAxis
            dataKey={xKey}
            tickFormatter={(v) =>
              new Date(v).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
            }
            stroke="#4B505A"
            tick={{ fill: '#8F95A1', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#232733' }}
            minTickGap={32}
          />
          <YAxis
            stroke="#4B505A"
            tick={{ fill: '#8F95A1', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#232733' }}
            width={44}
            tickFormatter={(v) => `${v}${yUnit}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#8F95A1', fontFamily: 'JetBrains Mono' }}
            labelFormatter={(v) => new Date(v).toLocaleString('en-GB')}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label || s.key}
              stroke={s.color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
