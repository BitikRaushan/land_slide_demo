"""
Backend tests for Resilio-Route LEWS mock API.
Endpoints: /api/health, /api/nodes/status, /api/risk/segment,
/api/risk/route, /api/alerts, /api/analytics/timeseries
"""
import os
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fall back to frontend .env (preview URL)
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


def _no_mongo_id(obj):
    """Recursively check no `_id` key exists."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"Found _id in dict: {list(obj.keys())}"
        for v in obj.values():
            _no_mongo_id(v)
    elif isinstance(obj, list):
        for v in obj:
            _no_mongo_id(v)


# --- /api/health ---
class TestHealth:
    def test_health_ok(self):
        r = requests.get(f"{API}/health", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] in ("operational", "degraded", "down")
        assert "uptime_seconds" in data and isinstance(data["uptime_seconds"], (int, float))
        assert "ml_model" in data and data["ml_model"]["name"]
        assert "services" in data and "node_network" in data["services"]
        # node_network like "12/15"
        nn = data["services"]["node_network"]
        assert "/" in nn
        total = int(nn.split("/")[1])
        assert total == 15
        _no_mongo_id(data)


# --- /api/nodes/status ---
class TestNodes:
    def test_15_nodes_full_shape(self):
        r = requests.get(f"{API}/nodes/status", timeout=15)
        assert r.status_code == 200, r.text
        nodes = r.json()
        assert isinstance(nodes, list)
        assert len(nodes) == 15
        required = {"id", "name", "lat", "lng", "km", "health",
                    "rssi_dbm", "battery_pct", "last_seen", "sensors",
                    "risk_level", "risk_score"}
        for n in nodes:
            missing = required - set(n.keys())
            assert not missing, f"Node {n.get('id')} missing: {missing}"
            assert n["id"].startswith("NH715-N")
            assert n["risk_level"] in ("green", "yellow", "red")
            assert n["health"] in ("online", "degraded", "offline")
            assert -120 <= n["rssi_dbm"] <= 0
            assert 0 <= n["battery_pct"] <= 100
            assert {"rainfall_mm_24h", "tilt_deg", "moisture_pct",
                    "pressure_hpa"}.issubset(n["sensors"].keys())
        _no_mongo_id(nodes)


# --- /api/risk/segment ---
class TestSegments:
    def test_14_segments(self):
        r = requests.get(f"{API}/risk/segment", timeout=15)
        assert r.status_code == 200, r.text
        segs = r.json()
        assert isinstance(segs, list)
        assert len(segs) == 14  # n_nodes - 1
        for s in segs:
            for k in ("risk_level", "risk_score", "confidence",
                      "from_lat", "from_lng", "to_lat", "to_lng"):
                assert k in s, f"missing {k}"
            assert s["risk_level"] in ("green", "yellow", "red")
            assert 0 <= s["confidence"] <= 1
        _no_mongo_id(segs)


# --- /api/risk/route ---
class TestRoute:
    def test_route_by_id(self):
        r = requests.get(f"{API}/risk/route",
                         params={"origin": "NH715-N01", "destination": "NH715-N15"},
                         timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("is_safe", "distance_km", "eta_minutes", "avg_risk_score",
                  "advisory", "path", "avoided_segments", "summary"):
            assert k in d, f"missing {k}"
        assert isinstance(d["is_safe"], bool)
        assert d["distance_km"] > 0
        assert len(d["path"]) >= 2
        assert {"green_segments", "yellow_segments",
                "red_segments", "total_segments"}.issubset(d["summary"].keys())
        _no_mongo_id(d)

    def test_route_partial_match(self):
        # Tezpur -> Tawang (partial name match)
        r = requests.get(f"{API}/risk/route",
                         params={"origin": "Tezpur", "destination": "Tawang"},
                         timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "Tezpur" in d["origin"]
        assert "Tawang" in d["destination"]
        assert d["distance_km"] > 0


# --- /api/alerts ---
class TestAlerts:
    def test_alerts_sorted_desc(self):
        r = requests.get(f"{API}/alerts", timeout=15)
        assert r.status_code == 200, r.text
        alerts = r.json()
        assert isinstance(alerts, list)
        for a in alerts:
            for k in ("id", "severity", "title", "location", "issued_at"):
                assert k in a
            assert a["severity"] in ("info", "warning", "critical")
        # sorted desc by issued_at
        if len(alerts) >= 2:
            ts = [a["issued_at"] for a in alerts]
            assert ts == sorted(ts, reverse=True)
        _no_mongo_id(alerts)


# --- /api/analytics/timeseries ---
class TestAnalytics:
    def test_ts_24h(self):
        r = requests.get(f"{API}/analytics/timeseries",
                         params={"hours": 24}, timeout=15)
        assert r.status_code == 200, r.text
        pts = r.json()
        # The endpoint generates hours+1 points (range(hours, -1, -1))
        assert 24 <= len(pts) <= 26
        for p in pts:
            for k in ("t", "rainfall_mm", "tilt_deg",
                      "moisture_pct", "pressure_hpa"):
                assert k in p
        _no_mongo_id(pts)

    def test_ts_72h_with_node(self):
        r = requests.get(f"{API}/analytics/timeseries",
                         params={"hours": 72, "node_id": "NH715-N05"},
                         timeout=15)
        assert r.status_code == 200, r.text
        pts = r.json()
        assert 72 <= len(pts) <= 74
