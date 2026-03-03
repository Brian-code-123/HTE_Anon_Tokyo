# PROJECT_MAP

This map defines current folders and their target multi-repo homes.

## Current -> Target

- `invisible-text-watermark/` -> `origraph-watermark-sdk`
- `origraph-registry-demo/` -> `origraph-registry-demo`
- `extension/` -> `origraph-browser-extension`
- `docs/` -> `origraph-platform-meta` (optional documentation hub)

## Legacy Path Map

- `minimax-webui/` -> `origraph-registry-demo/`

## Naming Rules

- Umbrella name: `Origraph`
- Keep Python SDK import stable: `invisible_text_watermark`
- Avoid legacy internal name `watermark_llamacpp` in new code paths

## Migration Notes

1. Stabilize current monorepo layout and scripts first.
2. Split repositories only after passing smoke checks in fixture mode.
3. Preserve endpoint and route compatibility during the transition window.
