import React, { useState } from 'react'
import { getSafestRoute } from '@/api/risk'
import { getRiskSegments } from '@/api/risk'
import { getNodes } from '@/api/nodes'
import { useLiveData } from '@/hooks/useLiveData'
import { useRouteStore } from '@/store/useRouteStore'
import { HighwayMap } from '@/components/map/HighwayMap'
import { PanelHeader } from '@/components/common/PanelHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { NH715_CORRIDOR } from '@/utils/nhRoute'
import { ArrowRight, Navigation, ShieldCheck, ShieldAlert } from 'lucide-react'

export default function RoutePlanner() {
  const { data: nodes } = useLiveData('nodes', getNodes, 8000)
  const { data: segments } = useLiveData('segments', getRiskSegments, 8000)
  const { origin, destination, result, isPlanning, error,
          setOrigin, setDestination, setResult, setError, setPlanning } = useRouteStore()
  const [submitted, setSubmitted] = useState(false)

  const handlePlan = async (e) => {
    e?.preventDefault?.()
    if (!origin || !destination) {
      setError({ detail: 'Origin and destination are required.' })
      return
    }
    setSubmitted(true)
    setPlanning(true)
    try {
      const data = await getSafestRoute(origin, destination)
      setResult(data)
    } catch (err) {
      setError(err)
    } finally {
      setPlanning(false)
    }
  }

  return (
    <div className="p-3 md:p-4 grid grid-cols-1 xl:grid-cols-12 gap-3 h-full" data-testid="route-planner-page">
      {/* Header */}
      <div className="col-span-1 xl:col-span-12">
        <h1 className="font-heading text-2xl tracking-tight font-bold text-white">
          Route Planner
        </h1>
        <p className="font-mono-tac text-[11px] uppercase tracking-[0.12em] text-[#8F95A1]">
          NAV-03 · Safest corridor between two checkpoints
        </p>
      </div>

      {/* Left: form + result */}
      <div className="xl:col-span-4 flex flex-col gap-3">
        <div className="surface-panel">
          <PanelHeader title="Mission Input" subtitle="Plot logistics convoy" />
          <form onSubmit={handlePlan} className="p-4 flex flex-col gap-3" data-testid="route-form">
            <div className="flex flex-col gap-1">
              <label className="tag-label">Origin</label>
              <select
                data-testid="route-origin-input"
                className="bg-[#050505] border border-[#232733] text-sm px-3 py-2 font-mono-tac focus:outline-none focus:border-white"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              >
                <option value="">— select node —</option>
                {NH715_CORRIDOR.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} · {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="tag-label">Destination</label>
              <select
                data-testid="route-destination-input"
                className="bg-[#050505] border border-[#232733] text-sm px-3 py-2 font-mono-tac focus:outline-none focus:border-white"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">— select node —</option>
                {NH715_CORRIDOR.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} · {n.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isPlanning || !origin || !destination}
              data-testid="route-submit-button"
              className="mt-1 inline-flex items-center justify-center gap-2 bg-white text-black font-mono-tac text-xs uppercase tracking-[0.14em] py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FF3333] hover:text-white transition-colors"
            >
              <Navigation size={14} />
              {isPlanning ? 'Computing…' : 'Compute Safest Route'}
            </button>

            {error && (
              <div className="font-mono-tac text-xs text-[#FF3333] border-l-2 border-[#FF3333] pl-2" data-testid="route-error">
                {error.detail}
              </div>
            )}
          </form>
        </div>

        {result && (
          <div className="surface-panel" data-testid="route-result-panel">
            <PanelHeader
              title="Mission Output"
              subtitle={`${result.origin} → ${result.destination}`}
              right={
                <StatusBadge level={result.is_safe ? 'green' : 'red'} testId="route-safety-badge">
                  {result.is_safe ? 'CLEARED' : 'CAUTION'}
                </StatusBadge>
              }
            />
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-heading">
                {result.is_safe ? (
                  <ShieldCheck size={16} className="text-[#00FF66]" />
                ) : (
                  <ShieldAlert size={16} className="text-[#FF3333]" />
                )}
                <span className="text-white">{result.advisory}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1A1C20]">
                <div>
                  <div className="tag-label">Distance</div>
                  <div className="font-mono-tac text-xl text-white">{result.distance_km}<span className="text-[#8F95A1] text-xs ml-1">km</span></div>
                </div>
                <div>
                  <div className="tag-label">ETA</div>
                  <div className="font-mono-tac text-xl text-white">{result.eta_minutes}<span className="text-[#8F95A1] text-xs ml-1">min</span></div>
                </div>
                <div>
                  <div className="tag-label">Avg risk</div>
                  <div className="font-mono-tac text-xl" style={{ color: result.avg_risk_score >= 70 ? '#FF3333' : result.avg_risk_score >= 40 ? '#FFB800' : '#00FF66' }}>
                    {result.avg_risk_score}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1A1C20]">
                <div className="tag-label mb-1">Segment breakdown</div>
                <div className="grid grid-cols-3 gap-2">
                  <StatusBadge level="red">{result.summary.red_segments} red</StatusBadge>
                  <StatusBadge level="yellow">{result.summary.yellow_segments} amber</StatusBadge>
                  <StatusBadge level="green">{result.summary.green_segments} green</StatusBadge>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1A1C20]">
                <div className="tag-label mb-1">Waypoints</div>
                <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
                  {result.path.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between font-mono-tac text-xs">
                      <span className="text-white">{i + 1}. {p.name}</span>
                      <StatusBadge level={p.risk_level}>{p.risk_score}</StatusBadge>
                    </div>
                  ))}
                </div>
              </div>

              {result.avoided_segments.length > 0 && (
                <div className="pt-2 border-t border-[#1A1C20]">
                  <div className="tag-label mb-1">Flagged Segments</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.avoided_segments.map((s) => (
                      <span key={s} className="font-mono-tac text-[10px] px-2 py-0.5 border border-[#FF3333] text-[#FF3333]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!result && !submitted && (
          <div className="surface-panel p-4 flex items-center gap-2 text-[#8F95A1]">
            <ArrowRight size={14} />
            <span className="font-mono-tac text-xs">
              Select origin and destination, then compute the safest route.
            </span>
          </div>
        )}
      </div>

      {/* Right: map */}
      <div className="xl:col-span-8 surface-panel flex flex-col min-h-[440px]">
        <PanelHeader
          title="Live overlay"
          subtitle="Risk segments + planned route"
          right={result && (
            <StatusBadge level={result.is_safe ? 'green' : 'red'}>
              {result.is_safe ? 'ROUTE OK' : 'ROUTE FLAGGED'}
            </StatusBadge>
          )}
        />
        <div className="flex-1 min-h-0">
          <HighwayMap
            nodes={nodes || []}
            segments={segments || []}
            routePath={result?.path || null}
          />
        </div>
      </div>
    </div>
  )
}
