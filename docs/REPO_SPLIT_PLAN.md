# Repo Split Execution Plan

This document captures phase 5 execution after in-repo stabilization.

## Target Repositories

- `origraph-watermark-sdk`
- `origraph-registry-demo`
- `origraph-browser-extension`
- optional: `origraph-platform-meta`

## Suggested Sequence

1. Ensure fixture-mode smoke checks pass from this monorepo.
2. Tag a baseline release in this repository.
3. Use `git filter-repo` or `git subtree split` for each target path:
   - `invisible-text-watermark/`
   - `origraph-registry-demo/`
   - `extension/`
4. Push split histories to new repository remotes.
5. Add migration notices and links in each repo README.
6. Archive this monorepo or keep it as platform-meta/docs-only.

## Notes

- Preserve git history for each extracted path.
- Keep endpoint compatibility guarantees in `origraph-registry-demo` until consumers migrate.
