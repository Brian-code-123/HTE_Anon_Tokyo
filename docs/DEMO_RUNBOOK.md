# Origraph Demo Runbook

## Goal

Run a reliable provenance demo with minimal setup risk and a deterministic fallback path.

## Prerequisites

- Python 3.10+
- Node.js + npm (for React frontend build)

## One-Time Setup

```bash
./scripts/bootstrap_demo.sh
```

This script:

- creates/updates `origraph-registry-demo/.venv`
- installs `origraph-registry-demo/requirements.txt`
- installs frontend npm dependencies and builds `origraph-registry-demo/frontend/dist`
- installs the local SDK (`invisible-text-watermark`) in editable mode
- writes `origraph-registry-demo/.env` from `.env.example` when missing

## Start Demo

Fixture mode (recommended for live presentations):

```bash
DEMO_MODE=fixture ./scripts/run_demo.sh
```

Live mode:

```bash
DEMO_MODE=live MINIMAX_API_KEY='YOUR_KEY' ./scripts/run_demo.sh
```

Expose on LAN/server (same app, different bind):

```bash
DEMO_MODE=fixture APP_HOST=0.0.0.0 APP_PORT=5050 ./scripts/run_demo.sh
```

Then open `http://<machine-ip>:5050` from other devices.

## Primary URL

- Intro landing: `http://127.0.0.1:5050/`
- Guided flow: `http://127.0.0.1:5050/registry/demo/live`

## Smoke Check

```bash
./scripts/check_demo.sh
```

If running on a different host/port:

```bash
BASE_URL=http://<machine-ip>:5050 ./scripts/check_demo.sh
```

## Reset State

```bash
./scripts/reset_demo_state.sh
```

This clears `origraph-registry-demo/registry/provenance.db` and WAL/SHM sidecars.

## Demo Sequence (3-5 minutes)

1. Open `/registry/demo/live` and confirm health indicators.
2. Click `Open Company View`.
3. Register company credentials.
4. Generate or paste output, then anchor.
5. Open `User View` and verify anchored output.
6. Modify one word and verify again (should fail).
7. Open `Chain Explorer` to show block receipt.
8. Optional: Open `/registry/extension` to demonstrate browser extension integration.

## Reliability Tips

- Use fixture mode unless live provider behavior is required.
- Run reset before each public demo to start from block #1.
- Keep `REGISTRY_ADMIN_SECRET` fixed for rehearsals.

## Useful Endpoints

- `GET /api/health`
- `GET /api/demo/scenario`
- `POST /api/demo/reset`
- `GET /api/registry/chain/status`
- `POST /api/registry/proof/text`
- `GET /api/registry/proof/tx/{tx_hash}`
- `GET /api/registry/proof/spec`
