import React, { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useLiveData } from '@/hooks/useLiveData'
import { getAlerts } from '@/api/alerts'
import { useAlertStore } from '@/store/useAlertStore'

/**
 * DashboardLayout — App shell. Owns the global poll for /api/alerts and pushes
 * new critical alerts to toast notifications.
 */
export function DashboardLayout() {
  const { data: alerts } = useLiveData('alerts', getAlerts, 10000)
  const setAlerts = useAlertStore((s) => s.setAlerts)
  const seen = useRef(new Set())

  useEffect(() => {
    if (!Array.isArray(alerts)) return
    setAlerts(alerts)

    // Toast newly-arrived critical alerts only
    alerts.forEach((a) => {
      if (a.severity !== 'critical') return
      if (seen.current.has(a.id)) return
      seen.current.add(a.id)
      // Skip first run flood: only toast if we've already seen at least one batch
      if (seen.current.size > alerts.length) {
        toast.error(a.title, {
          description: a.message,
          duration: 8000,
        })
      }
    })

    // Initialise seen set on first batch without toasting
    if (seen.current.size === 0) {
      alerts.forEach((a) => seen.current.add(a.id))
    }
  }, [alerts, setAlerts])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#050505]">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto" data-testid="main-content">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#111214',
            border: '1px solid #FF3333',
            borderRadius: 2,
            color: '#ffffff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
          },
        }}
      />
    </div>
  )
}
