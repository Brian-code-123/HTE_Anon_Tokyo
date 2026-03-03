# Legacy Test Quarantine

`legacy/watermark_llamacpp_tests/` contains tests from a removed package namespace:

- `watermark_llamacpp`

The corresponding source package is not present in the current repository layout, so these tests are excluded from default test runs.

## Why quarantined

- The package namespace changed to `invisible_text_watermark` for the SDK.
- The legacy gateway modules referenced by these tests are not in this repo.

## How to revive

1. Restore or re-import the legacy source package.
2. Update imports/tests to current module paths where needed.
3. Add the revived suite back to CI only after green runs in a clean environment.

## Archived Static Frontend

`legacy/registry-static-html-archive/` keeps the previous raw HTML registry pages that were replaced by the React/Vite frontend in `origraph-registry-demo/frontend/`.

`legacy/frontend-scaffold-archive/` stores unused starter files from the initial Vite scaffold that were not retained in the production frontend.
