/**
 * Display formatters used across the dashboard.
 */
export const fmtNum = (n, digits = 1) =>
  n === null || n === undefined || Number.isNaN(n) ? '—' : Number(n).toFixed(digits)

export const fmtInt = (n) =>
  n === null || n === undefined || Number.isNaN(n) ? '—' : String(Math.round(n))

export const fmtRelative = (iso) => {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - t)
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export const fmtUtcTime = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )} UTC`
}

export const fmtIstTime = (date = new Date()) => {
  const ist = new Date(date.getTime() + (5.5 - -date.getTimezoneOffset() / 60) * 3600 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(
    ist.getUTCSeconds()
  )} IST`
}

export const riskColor = (level) =>
  ({
    red: '#FF3333',
    yellow: '#FFB800',
    green: '#00FF66',
    info: '#007AFF',
  }[level] || '#8F95A1')

export const riskTextColor = (level) =>
  ({
    red: 'text-[#FF3333]',
    yellow: 'text-[#FFB800]',
    green: 'text-[#00FF66]',
  }[level] || 'text-[#8F95A1]')

export const healthTone = (h) =>
  ({
    online: { color: '#00FF66', label: 'ONLINE' },
    degraded: { color: '#FFB800', label: 'DEGRADED' },
    offline: { color: '#FF3333', label: 'OFFLINE' },
  }[h] || { color: '#8F95A1', label: 'UNKNOWN' })
