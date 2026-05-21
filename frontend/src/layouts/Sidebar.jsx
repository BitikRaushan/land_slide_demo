import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  Route as RouteIcon,
  Cpu,
  LineChart,
  Siren,
} from 'lucide-react'
import { useAlertStore } from '@/store/useAlertStore'

const items = [
  { to: '/',           label: 'Overview',     code: 'OPS-01', icon: LayoutDashboard, testId: 'nav-dashboard' },
  { to: '/map',        label: 'Risk Map',     code: 'GEO-02', icon: Map,             testId: 'nav-map' },
  { to: '/route',      label: 'Route Plan',   code: 'NAV-03', icon: RouteIcon,       testId: 'nav-route' },
  { to: '/nodes',      label: 'Nodes',        code: 'IOT-04', icon: Cpu,             testId: 'nav-nodes' },
  { to: '/analytics',  label: 'Analytics',    code: 'TLM-05', icon: LineChart,       testId: 'nav-analytics' },
  { to: '/alerts',     label: 'Alert Centre', code: 'ALT-06', icon: Siren,           testId: 'nav-alerts' },
]

export function Sidebar() {
  const alerts = useAlertStore((s) => s.alerts)
  const unack = alerts.filter((a) => !a.acknowledged).length

  return (
    <aside
      className="w-16 md:w-60 border-r border-[#232733] bg-[#050505] flex-shrink-0 flex flex-col"
      data-testid="sidebar"
    >
      <div className="px-4 py-4 border-b border-[#232733] hidden md:block">
        <div className="font-mono-tac text-[10px] uppercase tracking-[0.18em] text-[#8F95A1]">
          Navigation
        </div>
        <div className="font-heading text-sm font-semibold text-white mt-0.5">
          Command Modules
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 py-2">
        {items.map(({ to, label, code, icon: Icon, testId }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            data-testid={testId}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 md:px-4 py-2.5 mx-1 transition-colors ${
                isActive
                  ? 'bg-[#111214] text-white'
                  : 'text-[#8F95A1] hover:text-white hover:bg-[#111214]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-0 bottom-0 w-[2px] transition-colors ${
                    isActive ? 'bg-white' : 'bg-transparent group-hover:bg-[#3E4557]'
                  }`}
                />
                <Icon size={16} />
                <div className="hidden md:flex flex-col leading-tight">
                  <span className="font-heading text-sm">{label}</span>
                  <span className="font-mono-tac text-[10px] tracking-[0.12em] text-[#4B505A]">
                    {code}
                  </span>
                </div>
                {label === 'Alert Centre' && unack > 0 && (
                  <span
                    data-testid="nav-alert-badge"
                    className="ml-auto hidden md:inline-flex font-mono-tac text-[10px] px-1.5 py-0.5 bg-[#FF3333] text-black"
                  >
                    {unack}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-[#232733] hidden md:block">
        <div className="tag-label">Corridor</div>
        <div className="font-mono-tac text-xs text-white mt-1">NH-715</div>
        <div className="font-mono-tac text-[10px] text-[#8F95A1]">Tezpur → Tawang</div>
      </div>
    </aside>
  )
}
