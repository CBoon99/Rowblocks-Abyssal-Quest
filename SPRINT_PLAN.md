# Rowblocks Abyssal Quest — 3H Ship Sprint

**Mission:** Full 3D game playable + live URL. Jasmine logs into her Rowblocks account and plays.  
**Deadline:** ~3 hours from GO.  
**Entry:** `index-3d.html` → `src/main.ts` (NOT the 2D `index.html` / `js/*`).  
**Deploy target:** Netlify (`npm run build` → `dist/`, `netlify.toml` already set).

## LOCKED QUALITY BAR (see WORKING.md — do not dilute)

User-explicit, permanent for this project:

1. **Proper game** — not a demo aesthetic.
2. **Better than any other 3D game on Roblox** (visuals + feel).
3. **Realistic water**, **environments**, and **sea floor**.
4. **100% sea creatures** that look like the **actual species** — shape/cone placeholders are **rejected / not signed off**.
5. Education + conservation remain core gameplay.

Any plan that “ships shapes first” is wrong. Visual creature + world fidelity is ship-critical.

---

## Baseline (verified T0)

| Check | Result |
|-------|--------|
| `npm install` | ✅ |
| `npm run build` | ✅ (Vite, renames index-3d → index.html) |
| `tsc --noEmit` | ❌ 6 TS errors (non-blocking for Vite; still fix) |
| Account / login | ❌ missing |
| localStorage save | ❌ missing |
| Real win conditions | ❌ stubs |
| Lose / maxMoves | ❌ never called |
| Dual currency | ⚠️ gems vs pearls disconnected |

---

## Definition of Done

1. **Login / account** — create profile + select “Jasmine” (local multi-profile, PIN optional).
2. **Full 3D loop** — menu → login → level select → swim + puzzle → win/lose → unlock → save.
3. **Honest puzzles** — grid-locked slides; real path/collect/align win; maxMoves → lose.
4. **Progress persists** — levels, stars, currency, upgrades, Marinepedia across reload.
5. **Single economy** — pearls = primary currency (upgrades + rewards); gems alias or unified.
6. **Production build green** + **live URL**.
7. **Jasmine account seeded** on first run if none exist.

---

## Architecture (canonical)

```
index-3d.html
  └─ src/main.ts
       ├─ AccountSystem (NEW) — profiles + localStorage
       ├─ Game — systems orchestrator
       │    Scene3D, Swimmer, Blocks, Physics, Fish, Levels, Upgrades, Audio, Post
       └─ UI — Profile → MainMenu → LevelSelect → HUD → Shops → Marinepedia
```

---

## Parallel Agent Tracks

### Track ownership (strict — avoid merge wars)

| Agent | Owns files | Does NOT touch |
|-------|------------|----------------|
| **A Puzzle Core** | `BlockPuzzleSystem.ts`, `LevelSystem.ts` | main.ts UI shells, AccountSystem |
| **B Account + Persist** | `AccountSystem.ts` (new), `GameStore.ts`, hydrate APIs on Level/Upgrade | slide physics internals |
| **C Flow + UI** | `main.ts`, `GameHUD.ts`, `LevelSelectUI.ts`, `MainMenuUI.ts`, `ProfileSelectUI.ts` (new), `index-3d.html` | win-condition math |
| **D Feel + Upgrades** | `SwimmerController.ts`, `FishSystem.ts`, `UpgradeSystem.ts` (apply effects), Game.ts hooks only | level data generation |
| **E Build + Deploy + QA** | `vite.config`, TS fixes, `verify-build.js`, deploy, smoke checklist | feature design |

**Shared contract file:** `src/types/Progress.ts` (Agent B creates first if missing).

### Sync protocol

1. Agents work in **shared workspace** with file ownership above.
2. After each major unit: `npm run build` must still pass.
3. Orchestrator merges logic conflicts; agents do not rewrite outside ownership.
4. Issues logged in `SPRINT_ISSUES.md` with severity P0/P1/P2.
5. **Vote rule:** P0 = must fix before deploy; P1 = fix if time; P2 = backlog.

---

## Agent Instructions

### AGENT A — Puzzle Core (P0, critical path)

**Goal:** Level 1–3 are honestly solvable; win/lose are truthful; slides are grid-locked.

**Tasks:**
1. Replace free-body impulse slides with **grid-locked kinematic moves** (snap blocks to grid indices; update mesh + body position together).
2. Implement real `checkPath` (BFS/A* on grid adjacency for start→exit free path or connected start-exit via empty/walkable).
3. Implement real `checkGemsCollected` (track collected required gems when player interacts OR when gem blocks reach “collected” state — pick one clear rule and document in code comment).
4. Implement real `checkPattern` / `checkCleared` (no `return true` stubs).
5. After `recordMove`, if `moves >= maxMoves` and not won → signal lose (callback or event GameHUD can use).
6. Fix undo to restore grid positions correctly (serializable block state: x,y,z,type only).
7. Seed levels 4–30 with **deterministic** layout (seeded PRNG from level id) so reloads match.

**Done when:** Manual play L1 can win by correct slides only; wrong slides don’t auto-win; out of moves loses.

**Test:** `npm run build`; document manual steps in `SPRINT_ISSUES.md`.

---

### AGENT B — Account + Persistence (P0)

**Goal:** Multi-profile Rowblocks accounts with full progress save.

**Storage key:** `rowblocks_abyssal_account_v1`

**Model:**
```ts
interface RowblocksProfile {
  id: string;
  displayName: string;
  pin?: string; // optional 4-digit
  createdAt: number;
  lastPlayedAt: number;
  pearls: number;
  gems: number;
  levels: { id: number; unlocked: boolean; stars: number; bestScore: number }[];
  collectedFish: CollectedFish[];
  quests: { id: string; current: number; completed: boolean }[];
  currentSkin: string;
  ownedSkins: string[];
  helmetUpgrade: number;
  netRange: number;
  upgrades: Record<string, number>;
}
interface AccountState {
  version: 1;
  activeProfileId: string | null;
  profiles: RowblocksProfile[];
}
```

**API:**
- `load()`, `save()`, `createProfile(name, pin?)`, `selectProfile(id)`, `deleteProfile(id)`
- `getActiveProfile()`, `listProfiles()`
- `applyToSystems({ levelSystem, upgradeSystem, gameStore })`
- `snapshotFromSystems(...)` + `autoSave()`
- On first load if no profiles: create **Jasmine** profile (unlocked L1, 50 starter pearls).

**Hydrate:** Level unlocks/stars, UpgradeSystem currency+owned, GameStore fish/gems/quests/skins.

**Done when:** Create Jasmine → play → reload → still Jasmine with progress.

---

### AGENT C — Flow + UI (P0)

**Goal:** Login → menu → play → win/lose UI → next level works.

**Tasks:**
1. Add `ProfileSelectUI` (create / select / optional PIN).
2. Boot order: Account load → profile gate → main menu.
3. Main menu shows active diver name + stats.
4. Make `LevelSelectUI.selectLevel` **public** (or export startLevel callback).
5. Fix GameHUD Next Level / Retry / Level Select buttons.
6. Wire lose screen from Agent A signal.
7. On win/lose/purchase/catch: call AccountSystem.snapshot + save.
8. Clean dual Dive In / Play buttons — one clear path.
9. Expose `(window as any).useGameStore = useGameStore` interim if needed OR fix all imports.

**Done when:** Cold boot → Jasmine login → L1 → win UI → L2 unlocked → next works.

---

### AGENT D — Feel + Upgrades (P1, parallel)

**Tasks:**
1. Pointer lock vs block click: hold **Alt** or **Tab** to free cursor for block select; click canvas to re-lock look.
2. Fish collect on **E** only; Space = swim up only.
3. Fix raycast to use camera look direction.
4. Apply upgrades: extra moves on level start, undo count, net range from store, helmet light intensity.
5. Unify award on win: pearls to UpgradeSystem + gems to store (both on profile).
6. Soft-fail audio only — never block boot.

**Done when:** Controls feel intentional; at least 3 upgrades affect play.

---

### AGENT E — Build, TS, Deploy, QA (continuous)

**Tasks:**
1. Fix tsc errors where cheap (AudioManager, PhysicsWorld iterations cast, Scene3D material types, WaterCaustics Projector).
2. Keep `npm run build` green after merges.
3. Smoke checklist script or markdown.
4. When orchestrator says deploy: Netlify CLI or instruct with live URL.
5. Seed QA profile Jasmine and verify live.

---

## Critical path timeline

| Window | Focus |
|--------|-------|
| T0–15m | Plan + baseline (done) |
| T15–75m | A puzzle + B account in parallel |
| T45–90m | C flow wiring on top of A/B APIs |
| T60–100m | D feel + upgrades |
| T90–120m | Integration fix pass |
| T120–150m | Polish + build green |
| T150–180m | Deploy + Jasmine live playtest |

---

## Issue severity

- **P0:** Cannot boot, cannot win honestly, cannot save/login, cannot deploy
- **P1:** Controls awkward, upgrades cosmetic-only, dual currency display
- **P2:** VR, perfect audio assets, procedural level quality, Visual skins mesh

---

## Do not touch

- Legacy 2D `js/*` except if mistaken import
- Full multiplayer / cloud auth backends (local profiles only this sprint)
- Rewriting Three scene from scratch

---

## Orchestrator notes

User authorized: full power, parallel agents, live deploy for daughter surprise.  
Agent standards: green gate before claim done; deploy is **explicitly requested** this session.
