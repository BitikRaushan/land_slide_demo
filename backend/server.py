"""
Resilio-Route Mock Backend
==========================
Provides realistic mock data simulating an AI-powered Landslide Early Warning
System (LEWS) for NH-715 highway corridor in NE India.

Endpoints (all prefixed with /api):
  GET /api/                  -> Service banner
  GET /api/health            -> System health, uptime, model status
  GET /api/nodes/status      -> Sensor node telemetry (RSSI, battery, sensors)
  GET /api/risk/segment      -> Highway segment risk scoring (RED/YELLOW/GREEN)
  GET /api/risk/route        -> Safest route between origin & destination
  GET /api/alerts            -> Recent landslide alerts feed
  GET /api/analytics/timeseries -> Rainfall/tilt/moisture/pressure timeseries

Note: This is a mock service. Random values are seeded by time so values change
on each poll (8-10s) giving a real-time dashboard feel without a database.
"""
from fastapi import FastAPI, APIRouter, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from pathlib import Path
from datetime import datetime, timezone, timedelta
import os
import logging
import random
import math
import time

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# mongo_url = os.environ['MONGO_URL']
# client = AsyncIOMotorClient(mongo_url)
# db = client[os.environ['DB_NAME']]
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)

db_name = os.getenv("DB_NAME", "resilio_local")
db = client[db_name]

app = FastAPI(title="Resilio-Route LEWS API", version="1.0.0")
api_router = APIRouter(prefix="/api")

SERVICE_START = time.time()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Static topology: NH-715 corridor sensor nodes
# Coordinates approximate the NH-715 highway running through NE India
# (Tezpur, Assam → Bomdila / Tawang area, Arunachal Pradesh — landslide prone
# Himalayan foothills). For demo purposes only.
# ---------------------------------------------------------------------------

NODES = [
    {"id": "NH715-N01", "name": "Tezpur Gateway",        "lat": 26.6528, "lng": 92.7926, "km": 0},
    {"id": "NH715-N02", "name": "Balipara Junction",     "lat": 26.8333, "lng": 92.7833, "km": 22},
    {"id": "NH715-N03", "name": "Bhalukpong Border",     "lat": 27.0114, "lng": 92.6394, "km": 56},
    {"id": "NH715-N04", "name": "Tipi Forest Section",   "lat": 27.0500, "lng": 92.6200, "km": 62},
    {"id": "NH715-N05", "name": "Sessa Slope",           "lat": 27.1167, "lng": 92.5167, "km": 78},
    {"id": "NH715-N06", "name": "Tenga Valley",          "lat": 27.1833, "lng": 92.4667, "km": 96},
    {"id": "NH715-N07", "name": "Rupa Cliff",            "lat": 27.2167, "lng": 92.4000, "km": 108},
    {"id": "NH715-N08", "name": "Bomdila Ridge",         "lat": 27.2645, "lng": 92.4156, "km": 116},
    {"id": "NH715-N09", "name": "Senge Slip Zone",       "lat": 27.3167, "lng": 92.3500, "km": 132},
    {"id": "NH715-N10", "name": "Dirang Pass",           "lat": 27.3597, "lng": 92.2410, "km": 148},
    {"id": "NH715-N11", "name": "Sela Approach",         "lat": 27.4833, "lng": 92.1000, "km": 174},
    {"id": "NH715-N12", "name": "Sela Tunnel North",     "lat": 27.5167, "lng": 92.0500, "km": 184},
    {"id": "NH715-N13", "name": "Jaswant Garh",          "lat": 27.5500, "lng": 91.9667, "km": 198},
    {"id": "NH715-N14", "name": "Jang Junction",         "lat": 27.5667, "lng": 91.9000, "km": 212},
    {"id": "NH715-N15", "name": "Tawang Terminal",       "lat": 27.5860, "lng": 91.8594, "km": 226},
]

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: Literal["operational", "degraded", "down"]
    uptime_seconds: float
    version: str
    ml_model: dict
    services: dict
    timestamp: str

class NodeStatus(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    km: float
    health: Literal["online", "degraded", "offline"]
    rssi_dbm: int
    battery_pct: float
    last_seen: str
    sensors: dict
    risk_level: Literal["green", "yellow", "red"]
    risk_score: float

class RiskSegment(BaseModel):
    segment_id: str
    from_node: str
    to_node: str
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float
    risk_level: Literal["green", "yellow", "red"]
    risk_score: float
    confidence: float
    last_updated: str
    factors: dict

class RouteResponse(BaseModel):
    origin: str
    destination: str
    is_safe: bool
    distance_km: float
    eta_minutes: int
    avg_risk_score: float
    advisory: str
    path: List[dict]
    avoided_segments: List[str]
    summary: dict

class Alert(BaseModel):
    id: str
    severity: Literal["info", "warning", "critical"]
    node_id: str
    segment_id: Optional[str] = None
    title: str
    message: str
    location: str
    issued_at: str
    acknowledged: bool

class TimeseriesPoint(BaseModel):
    t: str
    rainfall_mm: float
    tilt_deg: float
    moisture_pct: float
    pressure_hpa: float

# ---------------------------------------------------------------------------
# Helpers (seeded by time so values appear "live" across polls)
# ---------------------------------------------------------------------------

def _seeded_random(node_id: str, bucket_seconds: int = 8) -> random.Random:
    """Random generator that changes every `bucket_seconds` so polling
    produces slightly-different (but consistent within a bucket) data."""
    bucket = int(time.time() // bucket_seconds)
    rng = random.Random(f"{node_id}:{bucket}")
    return rng

def _classify_risk(score: float) -> str:
    if score >= 70:
        return "red"
    if score >= 40:
        return "yellow"
    return "green"

def _node_payload(node: dict) -> dict:
    rng = _seeded_random(node["id"])
    # Some nodes are biased toward higher risk (in hilly terrain)
    hill_bias = 0
    if node["km"] >= 60:
        hill_bias += 15
    if node["km"] >= 130:
        hill_bias += 20
    risk_score = max(0.0, min(100.0, rng.gauss(35 + hill_bias, 18)))

    # Occasional offline / degraded nodes
    h_roll = rng.random()
    if h_roll < 0.06:
        health = "offline"
    elif h_roll < 0.18:
        health = "degraded"
    else:
        health = "online"

    rssi = -1 * int(rng.uniform(45, 95))
    battery = round(rng.uniform(20.0, 100.0), 1)
    last_seen_offset = rng.uniform(1, 180) if health == "online" else rng.uniform(180, 3600)
    last_seen = (datetime.now(timezone.utc) - timedelta(seconds=last_seen_offset)).isoformat()

    sensors = {
        "rainfall_mm_24h":  round(rng.uniform(0, 180) + hill_bias * 0.6, 2),
        "tilt_deg":         round(rng.uniform(0.1, 6.5) + hill_bias * 0.03, 3),
        "moisture_pct":     round(rng.uniform(15, 95), 1),
        "pressure_hpa":     round(rng.uniform(940, 1015), 1),
        "vibration_rms":    round(rng.uniform(0.01, 1.4), 3),
        "temperature_c":    round(rng.uniform(8, 32), 1),
    }

    return {
        **node,
        "health": health,
        "rssi_dbm": rssi,
        "battery_pct": battery,
        "last_seen": last_seen,
        "sensors": sensors,
        "risk_level": _classify_risk(risk_score),
        "risk_score": round(risk_score, 1),
    }

def _build_segments(nodes_payload: list) -> list:
    segments = []
    for i in range(len(nodes_payload) - 1):
        a = nodes_payload[i]
        b = nodes_payload[i + 1]
        # segment risk = max of two nodes (with small blend)
        score = max(a["risk_score"], b["risk_score"]) * 0.7 + (a["risk_score"] + b["risk_score"]) / 2 * 0.3
        rng = _seeded_random(f"seg:{a['id']}->{b['id']}")
        confidence = round(rng.uniform(0.72, 0.98), 3)
        seg = {
            "segment_id": f"SEG-{a['id'].split('-')[1]}-{b['id'].split('-')[1]}",
            "from_node": a["id"],
            "to_node": b["id"],
            "from_lat": a["lat"],
            "from_lng": a["lng"],
            "to_lat": b["lat"],
            "to_lng": b["lng"],
            "risk_level": _classify_risk(score),
            "risk_score": round(score, 1),
            "confidence": confidence,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "factors": {
                "rainfall_24h_mm":  round((a["sensors"]["rainfall_mm_24h"] + b["sensors"]["rainfall_mm_24h"]) / 2, 1),
                "slope_tilt_deg":   round(max(a["sensors"]["tilt_deg"], b["sensors"]["tilt_deg"]), 2),
                "soil_moisture_pct": round((a["sensors"]["moisture_pct"] + b["sensors"]["moisture_pct"]) / 2, 1),
                "historical_events": rng.randint(0, 8),
            },
        }
        segments.append(seg)
    return segments

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@api_router.get("/")
async def root():
    return {
        "service": "Resilio-Route LEWS API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": [
            "/api/health",
            "/api/nodes/status",
            "/api/risk/segment",
            "/api/risk/route",
            "/api/alerts",
            "/api/analytics/timeseries",
        ],
    }

@api_router.get("/health", response_model=HealthResponse)
async def health():
    uptime = time.time() - SERVICE_START
    nodes_payload = [_node_payload(n) for n in NODES]
    online = sum(1 for n in nodes_payload if n["health"] == "online")
    total = len(nodes_payload)
    ratio = online / total
    status = "operational" if ratio > 0.8 else ("degraded" if ratio > 0.5 else "down")
    return {
        "status": status,
        "uptime_seconds": round(uptime, 1),
        "version": "1.0.0",
        "ml_model": {
            "name": "ResilioNet-LSTM-v3",
            "inference_latency_ms": round(random.uniform(28, 64), 1),
            "accuracy_pct": 94.2,
            "last_trained": "2025-12-08T00:00:00Z",
        },
        "services": {
            "ingest_gateway": "online",
            "ml_pipeline": "online" if ratio > 0.5 else "degraded",
            "alert_engine": "online",
            "node_network": f"{online}/{total}",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@api_router.get("/nodes/status", response_model=List[NodeStatus])
async def nodes_status():
    return [_node_payload(n) for n in NODES]

@api_router.get("/risk/segment", response_model=List[RiskSegment])
async def risk_segments():
    nodes_payload = [_node_payload(n) for n in NODES]
    return _build_segments(nodes_payload)

@api_router.get("/risk/route", response_model=RouteResponse)
async def risk_route(
    origin: str = Query(..., description="Origin node ID or name"),
    destination: str = Query(..., description="Destination node ID or name"),
):
    nodes_payload = [_node_payload(n) for n in NODES]
    segments = _build_segments(nodes_payload)

    def _find(q: str):
        ql = q.strip().lower()
        for n in nodes_payload:
            if n["id"].lower() == ql or n["name"].lower() == ql:
                return n
        # partial match
        for n in nodes_payload:
            if ql in n["name"].lower() or ql in n["id"].lower():
                return n
        return None

    a = _find(origin)
    b = _find(destination)
    if not a or not b or a["id"] == b["id"]:
        # fallback: end-to-end NH-715
        a = nodes_payload[0]
        b = nodes_payload[-1]

    # Order by km
    if a["km"] > b["km"]:
        a, b = b, a

    # Path: all nodes between (NH-715 is essentially linear in this corridor)
    path = [n for n in nodes_payload if a["km"] <= n["km"] <= b["km"]]
    used_segments = [s for s in segments
                     if any(n["id"] == s["from_node"] for n in path)
                     and any(n["id"] == s["to_node"] for n in path)]

    avg_risk = sum(s["risk_score"] for s in used_segments) / max(len(used_segments), 1)
    avoided = [s["segment_id"] for s in used_segments if s["risk_level"] == "red"]
    distance_km = b["km"] - a["km"]
    eta_minutes = int(distance_km / 38 * 60)  # ~38 km/h avg in hill terrain

    is_safe = len(avoided) == 0 and avg_risk < 50
    if is_safe:
        advisory = "Route cleared. No active landslide threats detected along the corridor."
    elif avoided:
        advisory = (
            f"CAUTION: {len(avoided)} high-risk segment(s) detected. "
            "Convoy advised to delay or seek alternate corridor. Local authorities notified."
        )
    else:
        advisory = "Elevated risk on corridor. Monitor for updates; reduce speed in flagged zones."

    return {
        "origin": a["name"],
        "destination": b["name"],
        "is_safe": is_safe,
        "distance_km": round(distance_km, 1),
        "eta_minutes": eta_minutes,
        "avg_risk_score": round(avg_risk, 1),
        "advisory": advisory,
        "path": [
            {"id": n["id"], "name": n["name"], "lat": n["lat"], "lng": n["lng"],
             "risk_level": n["risk_level"], "risk_score": n["risk_score"]}
            for n in path
        ],
        "avoided_segments": avoided,
        "summary": {
            "green_segments": sum(1 for s in used_segments if s["risk_level"] == "green"),
            "yellow_segments": sum(1 for s in used_segments if s["risk_level"] == "yellow"),
            "red_segments": sum(1 for s in used_segments if s["risk_level"] == "red"),
            "total_segments": len(used_segments),
        },
    }

@api_router.get("/alerts", response_model=List[Alert])
async def alerts():
    nodes_payload = [_node_payload(n) for n in NODES]
    out = []
    now = datetime.now(timezone.utc)
    for n in nodes_payload:
        if n["risk_level"] == "red":
            out.append({
                "id": f"ALT-{n['id']}-{int(time.time()) // 60}",
                "severity": "critical",
                "node_id": n["id"],
                "segment_id": None,
                "title": f"CRITICAL LANDSLIDE RISK — {n['name']}",
                "message": (
                    f"ML model predicts imminent slope failure. "
                    f"Rainfall {n['sensors']['rainfall_mm_24h']}mm/24h, "
                    f"tilt {n['sensors']['tilt_deg']}°, "
                    f"moisture {n['sensors']['moisture_pct']}%."
                ),
                "location": f"NH-715 KM {n['km']}",
                "issued_at": (now - timedelta(minutes=random.randint(1, 30))).isoformat(),
                "acknowledged": False,
            })
        elif n["risk_level"] == "yellow":
            out.append({
                "id": f"ALT-{n['id']}-{int(time.time()) // 60}",
                "severity": "warning",
                "node_id": n["id"],
                "segment_id": None,
                "title": f"Elevated risk — {n['name']}",
                "message": (
                    f"Watch advisory. Saturation rising "
                    f"(moisture {n['sensors']['moisture_pct']}%)."
                ),
                "location": f"NH-715 KM {n['km']}",
                "issued_at": (now - timedelta(minutes=random.randint(5, 120))).isoformat(),
                "acknowledged": random.random() > 0.6,
            })
        elif n["health"] == "offline":
            out.append({
                "id": f"ALT-{n['id']}-offline",
                "severity": "warning",
                "node_id": n["id"],
                "segment_id": None,
                "title": f"Node offline — {n['name']}",
                "message": "Gateway lost contact. Field maintenance required.",
                "location": f"NH-715 KM {n['km']}",
                "issued_at": (now - timedelta(minutes=random.randint(2, 240))).isoformat(),
                "acknowledged": False,
            })

    out.sort(key=lambda a: a["issued_at"], reverse=True)
    return out[:30]

@api_router.get("/analytics/timeseries", response_model=List[TimeseriesPoint])
async def analytics_timeseries(
    node_id: Optional[str] = Query(None, description="Optional node id; aggregates over all if omitted"),
    hours: int = Query(24, ge=1, le=168, description="Hours of history"),
):
    now = datetime.now(timezone.utc)
    points = []
    for i in range(hours, -1, -1):
        t = now - timedelta(hours=i)
        # Build a smooth signal with a peak around 8-12 hours ago
        peak = math.exp(-((i - 10) ** 2) / 18)
        seed = int(t.timestamp()) // 3600
        rng = random.Random(f"{node_id or 'all'}:{seed}")
        points.append({
            "t": t.isoformat(),
            "rainfall_mm":  round(max(0.0, peak * 22 + rng.uniform(-2, 6)), 2),
            "tilt_deg":     round(0.8 + peak * 3.6 + rng.uniform(-0.2, 0.4), 3),
            "moisture_pct": round(45 + peak * 38 + rng.uniform(-4, 6), 1),
            "pressure_hpa": round(995 - peak * 16 + rng.uniform(-2, 2), 1),
        })
    return points

# ---------------------------------------------------------------------------
# App wire-up
# ---------------------------------------------------------------------------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
