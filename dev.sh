#!/usr/bin/env bash
# Resilio-Route — local one-shot dev runner
# Usage:  ./dev.sh
# Stops both processes on Ctrl-C.

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Bootstrap envs if missing
[ -f "$ROOT/backend/.env"  ] || cp "$ROOT/backend/.env.example"  "$ROOT/backend/.env"
[ -f "$ROOT/frontend/.env" ] || cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env"

# Bootstrap Python venv
if [ ! -d "$ROOT/backend/.venv" ]; then
  echo "[setup] creating Python venv…"
  python3 -m venv "$ROOT/backend/.venv"
  "$ROOT/backend/.venv/bin/pip" install --upgrade pip
  "$ROOT/backend/.venv/bin/pip" install -r "$ROOT/backend/requirements.txt"
fi

# Bootstrap node_modules
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "[setup] installing frontend deps with yarn…"
  (cd "$ROOT/frontend" && yarn install)
fi

# Run both
echo "[run] backend  → http://localhost:8001"
echo "[run] frontend → http://localhost:3000"
trap 'kill 0' EXIT

(
  cd "$ROOT/backend"
  "$ROOT/backend/.venv/bin/uvicorn" server:app --host 0.0.0.0 --port 8001 --reload
) &

(
  cd "$ROOT/frontend"
  yarn start
) &

wait
