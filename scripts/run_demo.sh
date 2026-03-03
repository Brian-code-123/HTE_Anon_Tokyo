#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_DIR="$ROOT_DIR/origraph-registry-demo"
VENV_PY="$DEMO_DIR/.venv/bin/python"
FRONTEND_DIR="$DEMO_DIR/frontend"
FRONTEND_DIST_INDEX="$FRONTEND_DIR/dist/index.html"
DEMO_MODE="${DEMO_MODE:-fixture}"
UVICORN_RELOAD="${UVICORN_RELOAD:-0}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-5050}"
HEALTHCHECK_HOST="${HEALTHCHECK_HOST:-127.0.0.1}"
BASE_URL="http://$HEALTHCHECK_HOST:$APP_PORT"

if [[ ! -x "$VENV_PY" ]]; then
  echo "Missing virtual environment. Run ./scripts/bootstrap_demo.sh first."
  exit 1
fi

if [[ ! -f "$FRONTEND_DIST_INDEX" ]]; then
  if command -v npm >/dev/null 2>&1; then
    echo "Frontend build missing. Building React app..."
    (
      cd "$FRONTEND_DIR"
      if [[ -f package-lock.json ]]; then
        npm ci
      else
        npm install
      fi
      npm run build
    )
  else
    echo "WARNING: frontend build missing and npm unavailable. UI routes will return build warning pages."
  fi
fi

cd "$DEMO_DIR"

echo "Starting Origraph demo on $BASE_URL (DEMO_MODE=$DEMO_MODE, bind=$APP_HOST:$APP_PORT)..."
DEMO_MODE="$DEMO_MODE" APP_HOST="$APP_HOST" APP_PORT="$APP_PORT" UVICORN_RELOAD="$UVICORN_RELOAD" "$VENV_PY" app.py > /tmp/origraph-demo.log 2>&1 &
APP_PID=$!

cleanup() {
  if kill -0 "$APP_PID" >/dev/null 2>&1; then
    kill "$APP_PID" >/dev/null 2>&1 || true
    wait "$APP_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

for _ in {1..30}; do
  if curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
    echo "Health check passed."
    echo "Guided demo: $BASE_URL/registry/demo/live"
    tail -f /tmp/origraph-demo.log &
    TAIL_PID=$!
    wait "$APP_PID"
    kill "$TAIL_PID" >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 1
done

echo "Server failed health check. Log output:"
cat /tmp/origraph-demo.log
exit 1
