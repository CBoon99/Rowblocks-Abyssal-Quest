# Phase 0 — Repository & Safety Checkpoint

**Mission:** Visual Convergence, Design Lock and Birthday Release  
**Date:** 2026-07-17  
**Status:** COMPLETE

---

## Repository identity

| Field | Value |
|-------|--------|
| Absolute path | `/Users/carlboon/Documents/Rowblocks-Abyssal-Quest` |
| Confirmed product | **Rowblocks Abyssal Quest 3D** (`rowblocks-abyssal-quest-3d`) |
| Checkpoint branch | `birthday-phase0-baseline` |
| Checkpoint commit | `cb3c091c46edb936490439b5dc014766544b476a` |
| Previous main tip | `e81d51ede6bd68153fc469204c266f0305015136` (Fix Netlify build) |
| Node | v26.5.0 |
| npm | 11.17.0 |
| Package manager | npm (`package-lock.json` present) |
| Module type | ESM (`"type": "module"`) |
| Stack | TypeScript, Three.js 0.165, Vite 5.4, cannon-es, howler, zustand |

## Working tree at checkpoint

- **Intentionally committed** full WIP (Trust, Jasmine character, reefs, multiplayer skeleton, public models/textures, docs).
- Working tree after commit: clean on `birthday-phase0-baseline`.
- Many systems were previously untracked; now frozen in this commit.

### Rollback

```bash
cd /Users/carlboon/Documents/Rowblocks-Abyssal-Quest
git checkout birthday-phase0-baseline
git reset --hard cb3c091c46edb936490439b5dc014766544b476a
```

To return to old main tip without WIP: `git checkout main` at `e81d51e`.

## Secrets / credentials

- Scan found **no API keys / tokens / cloud secrets** in source.
- Hits were: HTML `type="password"` on optional PIN field, narrative “secret” (birthday turtle), npm `js-tokens` package name.
- **Verdict:** safe for local birthday build reports.

## Dependencies / vulnerabilities

```
npm audit --omit=dev → found 0 vulnerabilities
```

No blind upgrades performed (per mission rules).

## Production build (baseline)

```
npm run build  → SUCCESS (≈886ms)
dist/index-3d.html → renamed to dist/index.html (Netlify hook)
JS bundle: ~1003 kB minified / ~268 kB gzip  ⚠ exceeds 500 kB warning
CSS: ~42 kB
```

**Known build note:** main chunk large — performance risk for iPad; not fixed in Phase 0.

## Automated tests

| Item | Status |
|------|--------|
| `npm test` / vitest script | Present in package.json |
| Meaningful test files | **NOT FOUND** in repo (no `*.test.ts` suite for save/trust/puzzle) |
| Standalone verification script | Not fully audited in Phase 0 — deferred to Verification Lead |

## Baseline performance reading

| Metric | Baseline |
|--------|----------|
| Production JS gzip | ~268 kB main |
| Chunk warning | Yes (>500 kB raw) |
| Quality tiers | Code present (`QualitySettings.ts`) — **runtime FPS not measured this phase** |
| iPad Safari FPS | **CANNOT VERIFY** in Phase 0 (device not instrumented here) |

## Baseline known-issues (pre-audit, honest)

1. **Emoji in production UI** — widespread (`GameHUD`, upgrades, toasts) — conflicts with mission Rule 7.
2. **Trust HUD bar** may conflict with Rule 6 (“animal is the interface”).
3. **Buddy Dive** — BroadcastChannel MVP only; not full online multiplayer.
4. **VR** — claim status unknown; likely documented or stub only.
5. **tsc** — pre-existing error in `src/main.ts` ConservationCollectEvent typing (does not block Vite build).
6. **Asset mix** — procedural creatures + some GLBs + CC0 textures; coherence TBD.
7. **Jasmine character** — procedural Roblox-inspired look; no photo-real GLB.
8. **No automated regression suite**.

## Phase 0 gate — GO / NO-GO for Phase 1

| Gate | Result |
|------|--------|
| Repo is Abyssal Quest | GO |
| Checkpoint commit exists | GO |
| Production build succeeds | GO |
| Secrets absent from reports | GO |
| Baseline issues listed | GO |
| Broad visual changes started | **NO** (blocked until audit + design lock docs) |

**Decision:** Proceed to **Phase 1 — complete visual and functional audit** only. No broad visual implementation until `BIRTHDAY_RELEASE_AUDIT.md` and related research docs exist.

## Launch (baseline)

```bash
cd /Users/carlboon/Documents/Rowblocks-Abyssal-Quest
npm run dev -- --host 0.0.0.0 --port 3000
# Mac:  http://127.0.0.1:3000/index-3d.html
# iPad: http://<LAN-IP>:3000/index-3d.html
```

Production preview:

```bash
npm run build && npm run preview -- --host 0.0.0.0 --port 4173
```
