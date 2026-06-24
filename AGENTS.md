# Codex working memory (LOCAL — gitignored, never published)

## How to answer EC (workflow rules)
- ALWAYS specify the folder where each command should be run before giving the copy/paste
  block. Do not require the full absolute path inside the command block unless it is
  genuinely needed; a plain note like "run this from `web/`" is enough.
- EC's shell is **zsh on macOS**. Make every command block cleanly pasteable:
  - NO inline `#` comments (interactive zsh executes them, it does not treat `#` as a comment).
  - NO apostrophes inside the block (a stray `'`, e.g. "you're", triggers a `quote>` hang).
  - Put all explanation in prose OUTSIDE the code block.
- This Cowork sandbox has no outbound network and cannot delete `.git/index.lock` (EPERM).
  Git, network, and any `rm` of lock files must be run by EC locally — give exact commands.
- LOCK CAUSE: running `git` (even `git status`) against the repo from this Cowork session
  leaves a stale `.git/index.lock` (the sandbox can't unlink it), which then blocks EC's
  next commit. Editor background-git (Cursor) can do the same. So PREFER reading `.git/HEAD`
  and `.git/config` with `cat` over running git here. To clear: `rm -f .git/index.lock`.

## Repo layout
- **PUBLIC app repo: `~/RADvisor`** (i.e. `/Users/echalicki/RADvisor`) → github.com/edwardthe3rd/RADvisor,
  working branch **`Testing`**. All application code lives here. (Moved here 2026-06-23 from the
  old `~/Documents/Business/RADvisor/GitHub 2/RADvisor` nesting.)
- **PRIVATE instructions** now live INSIDE the public repo at **`~/RADvisor/instructions/`** as a
  **nested git repo of their own** (branch `main`, private remote
  github.com/edwardthe3rd/RADvisor-Instructions). Real files (no symlinks), incl. the sensitive
  **`00_vision.md`**. `instructions/` is **gitignored** by the public repo, so it is NEVER published.
  Edit these freely in-place; commit/push them within `~/RADvisor/instructions` (separate from the app repo).
- The old separate `~/Documents/Business/RADvisor/RADvisor-Instructions-ARCHIVE/` is a read-only
  HISTORICAL archive only — do NOT edit it; the live source of truth is `~/RADvisor/instructions/`.

## Pass A operator-discovery sweep
- Lives in `supabase/seed/quadtree_sweep*.mjs` — v2 **adaptive-quadtree** sweep
  (rectangle `locationRestriction` + DISTANCE ranking; cap-hit tiles subdivide).
- Config + search terms + AOI geometry: `quadtree_sweep_queries.mjs`
  (`QUERIES`, `AOI_RECTS`, `AOI_EXCLUDE`, `GRID_CONFIG`, `seedTiles/splitTile/tileKm`).
- Runner: `quadtree_sweep.mjs`. Coverage preview (tiles-only geojson): `quadtree_sweep_coverage.mjs`.
- Legacy circle `ANCHORS` are retained only for `run_gate_ladder.mjs`, not the sweep.
- Google Places key in `supabase/seed/.env` (`GOOGLE_PLACES_API_KEY`).
