# Resilio-Route — PRD

## Original Problem Statement
Build the complete frontend operational dashboard system for **Resilio-Route**, an
AI-powered Landslide Early Warning System (LEWS) for Northeast India highways.
Behaves like disaster management software / highway command centre / logistics
monitoring dashboard — not a startup landing page. Stack: React + Vite,
Tailwind, React Router, Axios, Zustand, React Leaflet, Recharts, Lucide.

## User Choices (from initial intake)
- **Stack**: Migrate the template to **Vite** (away from CRA).
- **Backend**: Build a **mock FastAPI backend** in `/app/backend` with the 4
  contracted endpoints + helper endpoints (alerts, analytics).
- **Map data**: Focus on **NH-715** corridor (Tezpur → Tawang, NE India).
- **Real-time**: Polling now; WebSocket-ready hook shape (no WS server).
- **Design vibe**: Dark theme, **NASA mission control / SOC** style.

## Architecture
```
frontend/  (Vite + React 19 + Tailwind + Shadcn)
├── index.html, vite.config.js
└── src/
    ├── api/         (client.js, health.js, nodes.js, risk.js, alerts.js, analytics.js)
    ├── components/  (common/, map/, charts/, alerts/, nodes/)
    ├── hooks/       (useLiveData, useSystemClock)
    ├── layouts/     (DashboardLayout, Sidebar, TopBar)
    ├── pages/       (Dashboard, RiskMap, RoutePlanner, NodeMonitoring, Analytics, Alerts)
    ├── services/    (polling — pluggable bus, future WS swap)
    ├── store/       (Zustand: alert, system, route)
    └── utils/       (format helpers, NH-715 geometry)

backend/server.py  (FastAPI mock LEWS — 6 endpoints)
```

## Implemented (2026-05-21)
- [x] Vite migration (supervisor `yarn start` → `vite --host 0.0.0.0 --port 3000`)
- [x] CartoDB Dark Matter Leaflet base layer + corridor polyline
- [x] Mock FastAPI backend: `/api/health`, `/api/nodes/status`, `/api/risk/segment`,
      `/api/risk/route`, `/api/alerts`, `/api/analytics/timeseries`
- [x] Dashboard with 8 metric cards, live risk map, alert feed
- [x] Risk Map page with CartoDB tiles + risk-coded segments
- [x] Route Planner (form → safest route, waypoint risk breakdown, map overlay)
- [x] Node Monitoring (table, filters: ALL/RED/OFFLINE/LOW BAT)
- [x] Analytics (rainfall / tilt / moisture / pressure Recharts; 6H/24H/72H ranges, per-node)
- [x] Alert Centre (severity filters, acknowledge via Zustand, toast on new critical)
- [x] All telemetry uses JetBrains Mono; sharp edges, dense grid
- [x] Backend tests (8/8 passing) at `/app/backend/tests/test_lews_api.py`

## Test Coverage
- Backend: pytest 8 tests — health shape, 15 nodes shape, 14 segments, route by id +
  partial match, alerts ordering, timeseries 24h and 72h with node_id.
- Frontend: live UI verification across all 5 pages + 22 data-testid hooks confirmed.

## Backlog (P1)
- WebSocket stream from teammate's backend → swap `services/polling.js` impl
- Map zoom-to-segment on alert click
- Per-node telemetry drill-down modal
- Convoy time-window planning (depart-at slider)
- Export incident report (PDF/CSV)

## Backlog (P2)
- Multi-corridor mode (add NH-13, NH-27, etc.)
- User auth + role-based views (ops vs viewer)
- Historical replay / time-scrubber

## Next Action Items
1. Plug teammate's real backend URL (drop in `frontend/.env`'s `REACT_APP_BACKEND_URL`).
2. Promote polling → WebSocket once backend exposes a stream.
3. Add zoom-to-alert UX and per-node drill-down modal.
