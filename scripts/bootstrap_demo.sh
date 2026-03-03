#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_DIR="$ROOT_DIR/origraph-registry-demo"
VENV_DIR="$DEMO_DIR/.venv"
FRONTEND_DIR="$DEMO_DIR/frontend"

if [[ -f "$VENV_DIR/bin/pytest" ]] && grep -q "/minimax-webui/" "$VENV_DIR/bin/pytest"; then
  echo "Detected relocated virtualenv with stale entrypoints. Recreating .venv..."
  mv "$VENV_DIR" "$VENV_DIR.relocated.$(date +%s)"
fi

if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/python" -m pip install --upgrade pip
(
  cd "$DEMO_DIR"
  "$VENV_DIR/bin/python" -m pip install -r requirements.txt
)

if command -v npm >/dev/null 2>&1; then
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
  echo "WARNING: npm not found. Frontend build was skipped."
fi

if [[ ! -f "$DEMO_DIR/.env" ]]; then
  cp "$DEMO_DIR/.env.example" "$DEMO_DIR/.env"
fi

echo "Bootstrap complete."
echo "Next: DEMO_MODE=fixture ./scripts/run_demo.sh"
