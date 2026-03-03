#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_BASE="$ROOT_DIR/origraph-registry-demo/registry/provenance.db"

rm -f "$DB_BASE" "$DB_BASE-wal" "$DB_BASE-shm"
echo "Removed local demo DB files."

if curl -fsS -X POST http://127.0.0.1:5050/api/demo/reset >/dev/null 2>&1; then
  echo "Server reset endpoint invoked successfully."
else
  echo "Server not running (or reset endpoint unavailable); local files were still reset."
fi
