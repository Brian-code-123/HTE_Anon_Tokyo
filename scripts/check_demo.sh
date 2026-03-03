#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:5050}"

check_url() {
  local url="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$url")
  if [[ "$code" != "200" ]]; then
    echo "FAIL $url -> $code"
    exit 1
  fi
  echo "OK   $url"
}

check_url "/api/health"
check_url "/api/demo/scenario"
check_url "/"
check_url "/registry"
check_url "/registry/demo"
check_url "/registry/demo/live"
check_url "/registry/demo/company"
check_url "/registry/demo/user"
check_url "/registry/extension"
check_url "/api/registry/chain/status"

echo "Demo smoke checks passed."
