# Origraph Platform

Origraph currently ships as one repository with three logical products:

- `invisible-text-watermark/` — watermark SDK (`invisible_text_watermark` import)
- `origraph-registry-demo/` — provenance registry demo backend + UI
- `extension/` — browser extension for zero-width watermark detection

This repository is now organized for phased migration into:

- `origraph-watermark-sdk`
- `origraph-registry-demo`
- `origraph-browser-extension`

## Quick Start (Demo App)

```bash
./scripts/bootstrap_demo.sh
DEMO_MODE=fixture ./scripts/run_demo.sh
```

Expose to LAN or server environments:

```bash
DEMO_MODE=fixture APP_HOST=0.0.0.0 APP_PORT=5050 ./scripts/run_demo.sh
```

Open:

- `http://127.0.0.1:5050/` (intro landing)
- `http://127.0.0.1:5050/registry/demo/live` (guided flow)

For non-localhost runs, set `BASE_URL` when using smoke checks:

```bash
BASE_URL=http://<machine-ip>:5050 ./scripts/check_demo.sh
```

## Frontend Stack

- React + Vite + TypeScript lives in `origraph-registry-demo/frontend/`
- Built assets are served by FastAPI from `origraph-registry-demo/frontend/dist/`

For frontend-only iteration:

```bash
cd origraph-registry-demo/frontend
npm run dev
```

## Runtime Modes

- `DEMO_MODE=live`:
  - `/api/chat` calls provider APIs (MiniMax / Bedrock).
  - `MINIMAX_API_KEY` is required for MiniMax requests.
- `DEMO_MODE=fixture`:
  - `/api/chat` returns deterministic responses.
  - No external model API dependency.

## Active Test Scope

- SDK tests: `invisible-text-watermark/tests/`
- Demo tests: `origraph-registry-demo/tests/`

Legacy `watermark_llamacpp` tests were moved to:

- `legacy/watermark_llamacpp_tests/`

See `legacy/README.md` for details.

## Key Files

- `PROJECT_MAP.md` — current-to-target repository map
- `docs/DEMO_RUNBOOK.md` — live demo flow + fallback procedures
- `docs/specs/ORIGRAPH_PROOF_BUNDLE_V1.md` — decentralized proof bundle contract
- `docs/specs/origraph-proof-bundle-v1.schema.json` — machine-readable proof schema
- `docs/strategy/ORIGRAPH_APPCHAIN_STRATEGY.md` — longer-term appchain strategy
- `docs/strategy/PRODUCTION_INTEGRATION.md` — production hardening path from demo baseline
