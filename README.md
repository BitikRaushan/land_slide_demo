# Resilio-Route

AI-powered Landslide Early Warning System (LEWS) — operational dashboard for
the **NH-715 corridor** (Tezpur → Tawang) in Northeast India.

* Frontend: **React 19 + Vite + Tailwind + Shadcn UI + React Leaflet + Recharts + Zustand**
* Backend:  **FastAPI** (mock LEWS service; swap `REACT_APP_BACKEND_URL` to use the real one)

---

## 1. Prerequisites

| Tool     | Version  |
|----------|----------|
| Node.js  | ≥ 18 LTS |
| Yarn     | 1.22+    |
| Python   | ≥ 3.10   |
| pip      | latest   |

> MongoDB is **not required** for the mock backend; the Motor client connects lazily and no endpoint queries the DB.

---

## 2. One-shot local run

```bash
chmod +x dev.sh
./dev.sh
```

Opens:
- Frontend: http://localhost:3000
- Backend:  http://localhost:8001  (try `/api/health`)

---

## 3. Manual setup (if you prefer)

### Backend
```bash
cd backend
cp .env.example .env
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
cp .env.example .env             # edit if backend isn't on :8001
yarn install
yarn start                        # vite --host 0.0.0.0 --port 3000
```

---

## 4. Environment variables

### `frontend/.env`
| Var | Required | Default | Notes |
|---|---|---|---|
| `REACT_APP_BACKEND_URL` | yes | — | e.g. `http://localhost:8001` or your hosted backend |
| `BACKEND_PROXY_URL`     | no  | — | Alternative to the URL above. Sets up a Vite dev-server proxy for `/api`. |

### `backend/.env`
| Var | Required | Default |
|---|---|---|
| `MONGO_URL`     | yes (read at boot) | `mongodb://localhost:27017` |
| `DB_NAME`       | yes | `resilio_local` |
| `CORS_ORIGINS`  | yes | `*` |

---

## 5. API contract

All routes are prefixed with `/api`.

| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{ status, uptime_seconds, ml_model, services, timestamp }` |
| GET | `/api/nodes/status` | `Array<NodeStatus>` (15 NH-715 sensor nodes) |
| GET | `/api/risk/segment` | `Array<RiskSegment>` (14 highway segments) |
| GET | `/api/risk/route?origin=&destination=` | `RouteResponse` (path, advisory, summary) |
| GET | `/api/alerts` | `Array<Alert>` |
| GET | `/api/analytics/timeseries?hours=&node_id=` | `Array<TimeseriesPoint>` |

Pydantic models with full field shapes are at the top of `backend/server.py`.

---

## 6. Project layout

```
resilio-route/
├── backend/
│   ├── server.py              # FastAPI app — endpoints + Pydantic models
│   ├── requirements.txt
│   ├── .env.example
│   └── tests/test_lews_api.py # pytest — 8 tests
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── api/               # Axios client + per-domain modules
│       ├── components/        # common, map, charts, alerts, nodes, ui (shadcn)
│       ├── hooks/             # useLiveData (polling), useSystemClock
│       ├── layouts/           # DashboardLayout, Sidebar, TopBar
│       ├── pages/             # Dashboard, RiskMap, RoutePlanner, Nodes, Analytics, Alerts
│       ├── services/          # polling.js (swap to WebSocket later)
│       ├── store/             # Zustand stores
│       └── utils/             # format helpers, NH-715 geometry
└── dev.sh
```

---

## 7. Run the tests

```bash
cd backend && source .venv/bin/activate
pytest tests/test_lews_api.py -v
```

---

## 8. Plug in a real backend

Edit `frontend/.env`:
```
REACT_APP_BACKEND_URL=https://your-real-backend.com
```
Restart `yarn start`. Nothing else to change as long as the contract in §5 holds. If your real backend wraps responses (e.g. `{ data: [...] }`), `frontend/src/api/client.js → ensureArray()` already unwraps `data`, `items` and `results`.

---

## 9. Production build

### Frontend
```bash
cd frontend
yarn build         # → /frontend/build
yarn preview       # local sanity check
# deploy /frontend/build to Vercel / Netlify / S3+CloudFront / nginx
```

### Backend
```bash
cd backend
source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
# behind nginx / Caddy / Fly.io / Render / Railway / your k8s ingress
```

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `segments.map is not a function` | Backend returned non-array (HTML 404 or `{ data: [...] }`) | Check `frontend/.env`. The new `ensureArray()` already unwraps common shapes. |
| `404` on `/api/...` | `REACT_APP_BACKEND_URL` missing/wrong | Set it; restart `yarn start`. |
| `NaN` warning in metric cards | A field was missing on the health payload | Already guarded with `Number.isFinite()`. Refresh after pulling latest. |
| CORS error in browser | `CORS_ORIGINS` too strict | Set to `*` (dev only). |
| Map renders gray | Leaflet CSS missing | Already loaded via CDN in `index.html`; check adblockers. |
| Vite HMR not updating | Linux file-watcher limit | `sudo sysctl fs.inotify.max_user_watches=524288` |
