# Birthday Release Audit — Systems (code + structure only)

**Repo:** `/Users/carlboon/Documents/Rowblocks-Abyssal-Quest`  
**Branch:** `birthday-phase0-baseline`  
**Audit type:** Code path / wiring / UI reachability (no live browser playtest)  
**Date:** 2026-07-17  
**Status vocabulary:** `VERIFIED WORKING` | `PRESENT BUT PARTIAL` | `PRESENT BUT BROKEN` | `CODE EXISTS BUT NOT REACHABLE` | `DOCUMENTED ONLY` | `NOT FOUND` | `CANNOT VERIFY`

> **VERIFIED WORKING** here means a continuous code path exists from user action → `main.ts` / `Game` → system, not that a human playtested iPad/Safari.

---

## Merge-ready systems table

| # | System | Status | Birthday risk | Key files | UI / reach path | Evidence / notes | Required action |
|---|--------|--------|---------------|-----------|-----------------|------------------|-----------------|
| 1 | Profile select / Jasmine seed / AccountSystem save-load | **VERIFIED WORKING** | P0 | `src/systems/AccountSystem.ts`, `src/ui/ProfileSelectUI.ts`, `src/types/Progress.ts`, `src/stores/GameStore.ts`, `src/main.ts` | Boot: `profileSelectUI.show()` first → pick/create → `applyAll` → main menu. Switch Diver from main menu. Auto-save 30s + beforeunload + win/lose. | `ensureDefaultProfiles()` seeds **Jasmine** (50 pearls, 25 gems, 10 CP, L1). `localStorage` key via `ACCOUNT_STORAGE_KEY`. Select + optional PIN. Hydrates LevelSystem, UpgradeSystem, GameStore. | Smoke: fresh profile + reload retains progress. Do not skip Jasmine gate on birthday build. |
| 2 | Main menu / level select / start dive | **VERIFIED WORKING** | P0 | `src/ui/MainMenuUI.ts`, `src/ui/LevelSelectUI.ts`, `src/systems/LevelSystem.ts`, `src/main.ts` (`startLevelFlow`) | Profile ready → MainMenu **Play** → LevelSelect → level card → `startLevelFlow` → `game.start()` + HUD + oceanMap. Legacy `#start-btn` / `#debug-start` also wired. | **Settings** button only `console.log` (dead). Upgrade Shop from menu works. Buddy Dive from menu works. | Confirm Level 1 always unlocked after Jasmine seed. Settings either hide or stub politely for kids. |
| 3 | SwimmerController + JasmineCharacter third-person | **VERIFIED WORKING** | P0 | `src/systems/SwimmerController.ts`, `src/systems/JasmineCharacter.ts`, `src/systems/Game.ts` | Dive after start; WASD/Space/Shift; pointer-lock look; E observe; F clean. Touch via MobileControls host API. | `buildJasmineDiver` spawned; camera orbits body; suit from `store.currentSkin`; fish/wildlife use Jasmine body pos. Procedural avatar (not full Roblox mesh). | Playtest third-person feel on iPad; flag if silhouette fails quality bar. |
| 4 | FishSystem trust / elder turtle pearl / shark respect / jelly tingle | **PRESENT BUT PARTIAL** | P0 | `src/systems/FishSystem.ts`, `src/systems/SpeciesPersonality.ts`, `src/systems/FishModels.ts`, `src/systems/AssetLibrary.ts`, `src/systems/Game.ts` (`processWildlifeEvents`) | In-dive only (no menu). Approach wildlife; gentle observe; thrash near shark/jelly. | Trust moods + events: `shark_respect`, `jelly_tingle`, `birthday_pearl`, `trust_toast`, `remembers_you`, `reef_gathers`. Elder turtle spawned at home reef; pearl at trust ≥0.92 → toast + `showBirthdayPearl` + 50 CP. **7 GLBs** only (`public/models/creatures/*`); rest are `FishModels` procedural builders (quality-bar risk). | P0: species-true art for birthday-visible animals (esp. turtle/shark/jelly). Playtest pearl path with Jasmine. |
| 5 | ReefHealthSystem + OceanMapUI | **VERIFIED WORKING** | P1 | `src/systems/ReefHealthSystem.ts`, `src/systems/WorldMap.ts`, `src/ui/OceanMapUI.ts`, `src/main.ts` | Dive: minimap auto-shown; expand / click / **N** full chart. Health updates from clean/net/observe/thrash via Game + FishSystem. | Map draws reefs + player; discovery on proximity; colors from reef health. Not persisted across sessions (in-memory health). | Optional: persist reef health if multi-session story matters. |
| 6 | ConservationWorld litter/nets + F interact | **VERIFIED WORKING** | P0 | `src/systems/ConservationWorld.ts`, `src/systems/Game.ts` (`tryConservationInteract`), `src/systems/SwimmerController.ts` (KeyF / `triggerConserve`) | In-dive **F** or Mobile **Clean**. Toasts + CP via store `recordCleanup` / `recordRescue`. | Spawns litter + ghost nets on reefs; onCollect/onFree → bubbles, SFX, ranger report, reef health, buddy actions. Stylized props (not photoreal). | Ensure litter near spawn for birthday demo. Visual polish secondary to loop reliability. |
| 7 | DiveBudget + RangerAlertSystem | **VERIFIED WORKING** | P1 | `src/systems/DiveBudget.ts`, `src/systems/RangerAlertSystem.ts`, `src/systems/Game.ts` (`updateDiveAndAlerts`), `src/ui/GameHUD.ts` | Automatic while `game.isRunning`. HUD air + alert card. Soft assist float-up, never death. | Alerts spawn after cooldown; complete via clean/net/observe reports. Soft expire. Buddy nearby slows air drain. | Tune first-alert timing for short birthday session (~25s first). |
| 8 | BlockPuzzleSystem entry/play/win | **VERIFIED WORKING** | P0 | `src/systems/BlockPuzzleSystem.ts`, `src/systems/LevelSystem.ts`, `src/systems/GridMath.ts`, `src/main.ts` win/lose wiring, `src/ui/GameHUD.ts` | Level start loads blocks; click row + arrows / mobile puzzle pad `slideSelected`; win → `setOnWin` → HUD win screen + autoSave. | Grid slides kinematic; gems; undo; lose on max moves. Hint button logs only. | Full Level 1 win path on desktop + iPad. |
| 9 | MarinepediaUI unlocks | **PRESENT BUT PARTIAL** | P1 | `src/ui/MarinepediaUI.ts`, `src/systems/EducationSystem.ts`, `src/content/ContentLoader.ts`, `content/species.json`, `src/main.ts` | **M** key only (no main-menu button). Unlocks when `speciesDiscovered` / `collectedFish` after E Observe. | Renders locked/unlocked cards from content + fallbacks. Keyboard toggle while diving can interrupt play. Heavy emoji UI (Rule 7). | Add kid-visible entry (HUD/menu). Reduce emoji. Confirm unlock after first Observe. |
| 10 | CustomizationShop skins | **PRESENT BUT PARTIAL** | P2 | `src/ui/CustomizationShop.ts`, `src/stores/GameStore.ts` (`buySkin`), `src/systems/SwimmerController.ts` (`applyJasmineSuit`) | **C** key only (not on main menu). Gems buy skins/helmet/net. | Skins map to sleeve accents on Jasmine procedural model. Secondary to creature fidelity per WORKING.md. Emoji-heavy. | Optional for birthday; if demoed, add menu entry or coach hint for C. |
| 11 | BuddySession + BuddyDiveUI | **PRESENT BUT PARTIAL** | P2 | `src/systems/BuddySession.ts`, `src/ui/BuddyDiveUI.ts`, `src/systems/Game.ts` (pose/remote avatar), `src/main.ts` | Main menu **Buddy Dive** → create/join 4-digit code. | **Same browser only** (BroadcastChannel + localStorage). Pose sync, remote Jasmine mesh, action/alert hooks. **Not** internet multiplayer. Copy honestly says tabs/next. | Do not market as online co-op. Two-tab demo only if needed. |
| 12 | VR | **PRESENT BUT PARTIAL** | P2 | `src/systems/Game.ts` (`renderer.xr.enabled`, `enableVR`), `src/main.ts` VR button if `navigator.xr` | `#vr-btn` click when WebXR present. | Session request only; no VR locomotion, UI, or Jasmine controls path. iPad has no WebXR immersive-vr. | Hide VR on birthday iPad build or leave inert. Not a birthday pillar. |
| 13 | AudioManager / Howler Safari unlock | **PRESENT BUT PARTIAL** | P1 | `src/systems/AudioManager.ts`, `src/systems/UnderwaterAudio.ts`, `src/systems/Game.ts` (`start` → `startAudio`/`playAmbient`) | Unlocks after user gesture on level start (`game.start` after Play click). | Howler imported; ambient largely **procedural Web Audio** + placeholder SFX. Soft-fail on init. Safari: resume on gesture is coded; **not** browser-verified here. | Safari iPad audio smoke on real device. Real SFX optional. |
| 14 | QualitySettings | **VERIFIED WORKING** | P1 | `src/systems/QualitySettings.ts`, applied in `Game.ts`, `Scene3D`, `PostProcessing`, `OceanEnvironment`, `FishSystem`, `BubblesSystem` | Auto at boot (`initQuality`); touch → medium/low. No in-menu quality picker (Settings dead). | DPR, shadows, fish count, terrain segs, post, bubbles gated. `localStorage` tier save API exists. | Confirm iPad picks medium and stays smooth. |
| 15 | EducationSystem / QuestSystem | **PRESENT BUT PARTIAL** | P1 | `src/systems/EducationSystem.ts`, `src/systems/QuestSystem.ts`, `src/systems/Game.ts` (`collectFish`, `updateDepthQuest`), `src/ui/DiscoveryToast.ts` | Education: Observe (E) → discover toast + Marinepedia data. Quests: progress on catch/depth; **popup on complete only** — **no quest list UI**. | QuestSystem constructed in Game; store hydrated; rewards via store.completeQuest. Education singleton on window. | Birthday relies on toasts more than quest log. Optionally hide empty quest UX expectations. |
| 16 | GameHUD (emoji / production UI) | **PRESENT BUT PARTIAL** | P1 | `src/ui/GameHUD.ts` | Shown in `startLevelFlow`. Pause/undo/menu; dive budget; ranger alert; win/lose; objective banner; gentleness. | **~10+ emoji/symbols in live HUD** (💎🐟⭐📊⏸️↩️💡 + win ✨🌊🌿 + 🚨 alerts). Hint stub. Rule 7 violation. | Replace HUD icons with non-emoji art/CSS for production UI bar. |
| 17 | MobileControls iPad | **VERIFIED WORKING** | P0 | `src/ui/MobileControls.ts`, `src/main.ts`, touch hooks on SwimmerController / BlockPuzzle | Auto if `shouldUseMobileControls()`; shown on dive. Stick, look-drag, up/down, Observe, Clean, Puzzle pad, coach, orient banner. | Wired to host: move, look, collect, conserve, `slideSelected`, puzzle mode. | Real iPad landscape playtest (P0). |

---

## Per-system detail

### 1. Profile / Jasmine / AccountSystem
- **Path:** `main` → `getAccountSystem().load()` → `ensureDefaultProfiles()` → `ProfileSelectUI.show()` → select Jasmine / create → `applyProfileToUI()` → `accountSystem.applyAll` → MainMenu.
- **Save:** `autoSave` every 30s while running, win/lose, beforeunload, rank-up, conservation collect.
- **Status:** VERIFIED WORKING (code path). Runtime localStorage durability: CANNOT VERIFY without browser.

### 2. Main menu / level select / dive
- **Path:** Play → `levelSelectUI.show()` → card → `startLevelFlow(levelId)` → `levelSystem.startLevel` → `blockPuzzleSystem.loadLevelBlocks` → hide menus → `game.start()` → HUD + oceanMap + optional mobile coach.
- **Dead:** Settings click.
- **Status:** VERIFIED WORKING.

### 3. Swimmer + Jasmine
- Third-person procedural Jasmine; camera follow; store-driven suit/helmet/net range.
- **Status:** VERIFIED WORKING (controls + character). Art bar vs Roblox likeness: separate visual audit.

### 4. FishSystem wildlife
- Full update loop from `Game.animate` with gentleness + body position.
- Event drain → toasts, air sting, shark push handling, birthday pearl card.
- Only partial GLB coverage (7 species files); many species are mesh builders.
- **Status:** PRESENT BUT PARTIAL (loop real; birthday art bar incomplete).

### 5. Reef health + map
- Singleton health; map UI shows health-tinted reefs; player pos rAF loop in main.
- **Status:** VERIFIED WORKING.

### 6. Conservation F
- Continuous path KeyF / Clean → `Game.tryConservationInteract` → ConservationWorld try collect/free.
- **Status:** VERIFIED WORKING (props stylized).

### 7. Dive budget + ranger alerts
- Updated every frame while running; HUD methods present.
- **Status:** VERIFIED WORKING.

### 8. Block puzzle
- Load on level start; slides; win/lose callbacks in main.
- **Status:** VERIFIED WORKING.

### 9. Marinepedia
- Reachable only via **M** (and Escape close). Unlocks from store discoveries.
- **Status:** PRESENT BUT PARTIAL (discoverability).

### 10. Customization shop
- Reachable only via **C**. Skins apply via store → SwimmerController.
- **Status:** PRESENT BUT PARTIAL (discoverability + secondary feature).

### 11. Buddy Dive
- UI + session + remote avatar + pose send. Same-origin tabs only.
- **Status:** PRESENT BUT PARTIAL (skeleton).

### 12. VR
- Minimal WebXR session; not a game mode.
- **Status:** PRESENT BUT PARTIAL.

### 13. Audio
- Gesture-gated start on `game.start`; procedural ambient; soft-fail.
- **Status:** PRESENT BUT PARTIAL (Safari not verified).

### 14. Quality
- Boot-applied tiers consumed by multiple systems.
- **Status:** VERIFIED WORKING.

### 15. Education / quests
- Education wired on Observe; quests progress + popup; no list UI / no main-menu education hub.
- **Status:** PRESENT BUT PARTIAL.

### 16. GameHUD
- Functional core; emoji production UI; hint stub.
- **Status:** PRESENT BUT PARTIAL.

### 17. MobileControls
- Full host wiring when touch primary.
- **Status:** VERIFIED WORKING (code). Device: CANNOT VERIFY.

---

## Rule 7 — Emoji in `src/ui` (production UI)

Rough presentation-emoji / pictograph hits in UI TS (not exhaustive of runtime toasts from `Game.ts`):

| File | Approx emoji uses | Role |
|------|-------------------|------|
| `MarinepediaUI.ts` | **~18** | Worst offender — titles, locks, section headers, species icons |
| `ProfileSelectUI.ts` | **~10** | Gate screen (first thing birthday kids see) |
| `GameHUD.ts` | **~12** (static + win + alert) | **Always-on dive UI** — highest production impact |
| `RangerBadgeUI.ts` | **~8** (ranks are emoji) | Persistent corner badge |
| `MainMenuUI.ts` | **~6** | Primary menu |
| `CustomizationShop.ts` | **~6** | Shop chrome |
| `LevelSelectUI.ts` | **~6** | Level cards |
| `UpgradeShopUI.ts` | **~4** | Shop |
| `MobileControls.ts` | **~3** | Observe/Clean/orient |
| `DiscoveryToast.ts` | default `✨` | Toast icons (also fed emoji from Game) |

**Worst offenders for Rule 7:** `MarinepediaUI.ts`, `GameHUD.ts` (live HUD), `ProfileSelectUI.ts`, `RangerBadgeUI.ts`.

**GameHUD emoji inventory (live dive):** 💎 🐟 ⭐ 📊 ⏸️ ↩️ 💡 (+ ☰ menu glyph); win ✨🌊✨ ⭐ 🌿; ranger 🚨.

---

## P0 birthday checklist (systems only)

1. Profile → Jasmine → Play → Level 1 → dive starts (canvas, HUD, map).
2. Swim third-person Jasmine; Observe (E) fish; Clean (F) litter/net.
3. Puzzle slide → win screen → save.
4. iPad mobile controls path.
5. Elder turtle trust pearl if demoing birthday secret (may need guided calm play).
6. No claim of full online Buddy / VR experience.

---

## Out of scope for this audit

- Visual fidelity vs locked quality bar (water/seafloor/creatures photoreal) — separate art audit.
- Netlify deploy / live URL.
- Automated unit tests of systems (none exercised here).
- Legacy `js/` 2D path — product is `src/*` + `index-3d.html` per WORKING.md.
