# CLAUDE.md

Local 2-player Rummy variant (Cirque Rummy) — React + TypeScript + Vite. UI is in **French**; keep new user-facing strings French.

## Commands

This project uses **pnpm only** (pinned via `packageManager` in package.json). Don't use npm or bun — they'll create stray lockfiles.

```bash
pnpm install
pnpm dev             # Vite dev server on http://localhost:8080
pnpm build           # production build (uses /cirque-rummy/ base for GitHub Pages)
pnpm lint
pnpm test            # vitest run (one-shot)
pnpm test:watch      # vitest watch
pnpm exec tsc --noEmit  # type-check
```

## Architecture

- `src/components/` — UI. `GameBoard.tsx` is the main board; shadcn/ui components in `components/ui/`.
- `src/hooks/useGameState.ts` — single source of truth for game state, persists to localStorage.
- `src/utils/cardUtils.ts` — combination validation (groups/runs/jokers).
- `src/utils/aiPlayer.ts` — AI opponent logic (1.5s thinking delay).
- `src/data/missions.ts` — the 30 mission definitions.
- `src/types/game.ts` — shared TS types.
- `src/pages/Index.tsx` — single route; no router despite README claim.
- Path alias: `@/` → `src/` (vite + vitest).

## Testing

- **Real test suite:** `src/tests/*.test.ts` (vitest + jsdom). This is what `npm test` runs.
- **Ignore the root-level `test-*.cjs` / `test-*.js` files** — they are ad-hoc one-off scripts, not part of the suite. Don't add new tests there.

## Gotchas

- **pnpm-only.** `pnpm-workspace.yaml` exists but only carries `allowBuilds` settings (for `@swc/core` and `esbuild`); this is a single-package repo, not a multi-package workspace. If you ever see a `package-lock.json` or `bun.lockb` reappear, delete it — someone ran the wrong tool.
- **Vite base path** switches to `/cirque-rummy/` only when `NODE_ENV=production`. Asset paths in `index.html` and `public/` must stay relative-friendly.
- Game rules and post-mission restrictions are spelled out in README.md (French). When changing combination/validation logic, cross-check against those rules.
- commit messages are in English and follow the [Angular convention](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md) format (so *chore* is NOT a commit type).