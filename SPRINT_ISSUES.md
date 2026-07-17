# Sprint Issues Board

Updated continuously. Severity: P0 / P1 / P2. Status: open / in-progress / fixed / deferred.

## Baseline issues (from explore)

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| I01 | P0 | fixed | Win checks honest: BFS path, collectedGems counter, pattern align, clear obstacles |
| I02 | P0 | fixed | Grid-locked kinematic slides (mass 0 KINEMATIC; snap mesh+body to grid) |
| I03 | P0 | fixed | moves >= maxMoves → setOnLose / gameHUD.showLoseScreen fallback |
| I04 | P0 | fixed | No account / login / localStorage — AccountSystem + Progress types + serialize/apply on Level/Upgrade + GameStore hydrate |
| I05 | P0 | fixed | Next Level calls public selectLevel; full Profile→Menu→Play→Win/Lose flow wired |
| I06 | P0 | fixed | window.useGameStore assigned in Game.ts (module + constructor) — LevelSystem awards work |
| I07 | P1 | open | Dual currency pearls vs gems |
| I08 | P1 | fixed | Undo restores serializable {id,x,y,z,type} + collectedGems + move count |
| I09 | P1 | fixed | UpgradeSystem.getGameplayModifiers() + Game/Swimmer apply net range, light, swim speed; extra moves when LevelSystem API exists |
| I10 | P1 | fixed | Levels 4–30 use mulberry32 seeded by level id (deterministic) |
| I11 | P1 | fixed | Space=swim up only; E=collect; click canvas pointer-lock; Alt/Escape release for UI/blocks |
| I12 | P1 | fixed | FishSystem.raycastForFish uses camera look direction cone (no retarget toward fish) |
| I13 | P2 | fixed | tsc errors (AudioManager, PhysicsWorld, Scene3D, WaterCaustics) — Agent E surgical TS fixes |
| I14 | P2 | open | Audio placeholder only |
| I15 | P2 | open | UIManager dead stub |

## Agent claims

### Agent B — Account + Persistence (I04)
- **Status:** fixed
- **Added:**
  - `src/types/Progress.ts` — shared profile/progress types, storage key, default level seed helpers
  - `src/systems/AccountSystem.ts` — multi-profile localStorage (`rowblocks_abyssal_account_v1`)
  - `LevelSystem.serializeProgress()` / `applyProgress()` / `getProgressSnapshot()` alias + bestScores map (re-applied after Agent A rewrite)
  - `UpgradeSystem.serializeProgress()` / `applyProgress()` for pearls + owned upgrades
  - `GameStore` — `ownedSkins`, `getStoreProgressSnapshot()`, `applyStoreProgressSnapshot()`, `mergeQuestProgress()`
- **Default seed:** Jasmine (L1 unlocked, 50 pearls, 25 gems) via `ensureDefaultProfiles()`
- **Verify:** `npm run build` (Agent B env had no shell; orchestrator should confirm)
- **Agent C boot:** see handoff in Agent B return writeup

### Agent E — I13 TypeScript fixes (2026-07-17)

**Ownership:** AudioManager, Game.ts ~521, PhysicsWorld, WaterCaustics (Scene3D material call site fixed via WaterCaustics signature).

**Fixes applied (minimal / type-only):**
1. **AudioManager.ts** — `createProceduralSound` called with 4 args; reduced to 1-arg match. Added missing `generateSoundForType()` dispatcher used by `playSound`.
2. **Game.ts ~521** — `store.addFish` typed as `void`; removed truthiness test on `isNew` (always log Marinepedia note).
3. **PhysicsWorld.ts** — cast `world.solver` to `CANNON.GSSolver` for `.iterations`.
4. **WaterCaustics.ts** — removed unused `THREE.Projector` field (not on THREE namespace in r165). Widened `applyToMaterial` to `MeshStandardMaterial | MeshToonMaterial` for Scene3D ocean floor.

**Verify:** `npx tsc --noEmit` and `npm run build` (Agent E environment had no shell; orchestrator should confirm clean).

### Agent D — Feel + Upgrades (I06, I09, I11, I12)

- **Status:** fixed
- **Owned edits:**
  - `SwimmerController.ts` — Space=up only; E=collect; Alt/Escape release pointer lock; click canvas re-lock; helmet/net/swimSpeed from store + modifiers
  - `FishSystem.ts` — `raycastForFish` uses camera look cone (no overwrite toward fish)
  - `UpgradeSystem.ts` — `purchase()` alias, `getGameplayModifiers()`, `setCurrency()`
  - `Game.ts` — `(window as any).useGameStore = useGameStore`; extra-moves hook if LevelSystem has API; collect uses netRange + bonus; audio soft-fail
- **Note:** LevelSystem now has `addMoves` / `setBonusMoves` (Agent A) — Game.applyUpgradeEffectsToLevel should apply extra_moves.

### Agent A — Puzzle Core (I01, I02, I03, I08, I10)

- **Status:** fixed
- **Owned edits:**
  - `src/systems/GridMath.ts` **(NEW)** — grid keys, BFS path, mulberry32, gridToWorld
  - `src/systems/BlockPuzzleSystem.ts` — kinematic row slides, win/lose callbacks, serializable undo, gem collect
  - `src/systems/LevelSystem.ts` — honest win checks, gem counter, seeded L4–30, bonus moves for upgrades
- **API for Agent C:**
  - `blockPuzzle.setOnWin((result) => hud.showWinScreen(...))`
  - `blockPuzzle.setOnLose(() => hud.showLoseScreen())`
  - `blockPuzzle.getMoves()` / `getMaxMoves()` / `undo()` / `loadLevelBlocks()`
- **API for Agent D:**
  - `levelSystem.addMoves(n)` / `setBonusMoves(n)` / `addBonusMoves(n)` — extra_moves upgrade
  - `levelSystem.getMaxMoves()` includes bonus
- **Gem rule:** after slide, gems face-adjacent to **start** auto-collect; or press **E** on selected row with a gem → `recordGemCollected`
- **Manual L1:** select column x=1 (middle rocks) → Arrow keys slide on Z or Y until path (0,0,0)→(2,0,0) open
- **Verify:** `npm run build`

### Agent C — Flow + UI (I05 + boot flow)

- **Status:** fixed
- **Added / edited:**
  - `src/ui/ProfileSelectUI.ts` **(NEW)** — list profiles, PIN gate, create diver, Continue as Jasmine
  - `src/ui/MainMenuUI.ts` — `setDiverName`, Switch Diver (5th ctor arg `onSwitchProfile?`)
  - `src/ui/LevelSelectUI.ts` — `selectLevel` **public** + `isLevelUnlocked`
  - `src/ui/GameHUD.ts` — win/lose: autoSave, stop game, Next Level via public selectLevel (locked toast), Retry → `onLevelStarted`, prevent multi win-screen
  - `src/ui/UpgradeShopUI.ts` — autoSave after purchase
  - `src/main.ts` — Account load → Profile gate → main menu; setOnWin/setOnLose; level start calls `onLevelStarted`; beforeunload + interval autoSave; fish collect hook
  - `index-3d.html` — `#profile-select-container`; controls text (WASD/E/Alt/M/U/C)
  - `src/ui/styles.css` — kid-friendly ocean profile UI + diver badge
- **Boot flow:** Game.init → Account.load + ensureDefaultProfiles (seeds Jasmine) → ProfileSelectUI → onProfileReady applyAll → MainMenu → Play → LevelSelect → startLevel/loadBlocks/onLevelStarted/game.start/HUD
- **Jasmine login:** First run seeds Jasmine (50 pearls). Profile screen shows **Continue as Jasmine** (no PIN). Select → main menu as Jasmine.
- **Verify:** `npm run build`

(Agents add claims and resolutions below.)

