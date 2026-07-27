# Birthday Ship Plan — Abyssal Quest (Jasmine)

**Purpose:** Address the full external review + deeper codebase audit in one locked plan.  
**Product for gift day:** One stable, touch-first **~10 minute Home Reef loop** on **iPad Safari**.  
**Not the gift:** UE5 / 7 biomes / 300 species / online MMO / paid DLC (archive as Phase 2 vision only).

**Last updated:** 2026-07-25  
**Build baseline:** `npm run build` green · `tsc --noEmit` green · smoke 1p/2p script exists (`scripts/smoke-1p-2p.mjs`)

### Slice A shipped (2026-07-25)

- [x] One-tap **Dive Home Reef** (`main.ts` + `MainMenuUI`)  
- [x] Level select gift filter 1–3 (`GiftMode.ts` + `LevelSelectUI`)  
- [x] Sequential `FirstDiveDirector` + clean/turtle/net hooks  
- [x] Pearls-only HUD currency  
- [x] Buddy UI honesty (local tabs)  
- [x] Win sparkle + README/SHIP truth  
- [x] Smoke multi-port + Abyssal content detect (not BoonMind on :3000)  
- [x] Free-swim win at clean target (`GiftSwimWin` + clean/net/win SFX) — 2026-07-27  
- [ ] **Still open:** real iPad Safari pass (S2), richer audio beds (S3.1 polish), creature GLBs (S4)

---

## 0. Verdict (agree with the audit)

| Audit claim | Verdict | Notes |
|-------------|---------|--------|
| Builds cleanly | **True** | Keep as CI gate |
| Architecture sensible | **True** | Keep systems; reduce `window` glue later |
| Progression loop exists | **True** | Gift only needs Home Reef path of it |
| Mobile-first code present | **Partial** | Code exists; **device QA is the ship gate** |
| Persistence works | **True** | Jasmine profile + localStorage |
| Conservation theme strong | **True** | Lead with this, not puzzle-first |
| Docs >> code (scope risk) | **True — #1 strategic risk** | Lock gift scope below |
| QUALITY_REVIEW 2–3/10 gift-ready | **Was accurate; partially outdated** | Physics/HUD/heroes/litter improved since; **iPad unproven** |
| Not unsupervised-gift-ready yet | **Still true until iPad pass** | |

### Already improved since older reviews (do not re-do blindly)

- Swim feel, soft floor/surface, clean range, soft shark push  
- Memory heroes procedural upgrade (turtle/manta/shark/jelly)  
- Path litter visibility + pulse + collect juice  
- Home reef env punch (path coral, golden markers, god rays)  
- FirstDiveDirector welcome + soft look + clean hint  
- Elder pearl path more reachable  
- Settings quality tier soft-apply (still needs full reload for mesh density)  
- Automated smoke: `scripts/smoke-1p-2p.mjs` (1p + Buddy unit + 2-tab UI)  
- `SHIP.md` launch notes  

### Still true and urgent

- **iPad Safari landscape unproven** (P0 #1)  
- First 60–90s still menu-heavy before ocean  
- Audio thin  
- Dual currency (gems + pearls)  
- Creature bar vs procedural + few school GLBs  
- Stale root `README.md` + legacy `js/`  
- `UIManager` still constructed; globals everywhere  
- No Vitest unit suite  
- Levels 4–30 untrusted  
- Vision doc still looks like the product  

---

## 1. Product lock (gift day)

### In scope — “Jasmine’s first dive”

```
Continue as Jasmine
  → Dive In (skip or one-tap Home Reef)
    → Swim gentle on golden path
      → Friend turtle comes to see you
      → Clean glowing trash (F / Clean)
      → Optional: free ghost net
      → Optional: sky manta / respect shark / lantern jellies
      → Optional: 1 puzzle only if she wants tool 3
      → Optional: elder turtle birthday pearl
    → Clear win celebration (“You did it!”)
    → Auto-save
```

**Target length:** 8–12 minutes unsupervised.  
**Primary device:** iPad Safari landscape. Desktop is secondary.

### Out of scope until after birthday

- UE5 / photoreal water pipeline  
- 7-biome open world as playable content  
- 300 species catalog  
- Online multiplayer / PartyKit  
- Coral cabin / DLC  
- Full 30-level puzzle campaign polish  
- VR game loop  
- Refactor away all `window` globals (nice-to-have only)  

**Doc rule:** Root vision file stays but is labeled **VISION / PHASE 2 — not gift scope**.  
Gift truth lives in: `SHIP.md`, `WORKING.md`, `docs/BONES.md`, **this plan**.

---

## 2. Master backlog (every audit point → action)

### A. Child UX / gift blockers (P0)

| ID | Issue | Action | Primary files |
|----|--------|--------|----------------|
| **P0-1** | iPad playability unproven | Device checklist + fix touch stick/look/up-down/Observe/Clean; no pointer-lock path | `MobileControls.ts`, `SwimmerController.ts`, `QualitySettings.ts`, `index-3d.html` |
| **P0-2** | First 60–90s confusing | One-tap into Home Reef; objective one-at-a-time; first-dive calm HUD | `main.ts`, `MainMenuUI.ts`, `LevelSelectUI.ts`, `FirstDiveDirector.ts`, `GameHUD.ts`, `styles.css` |
| **P0-3** | Puzzle vs free swim unclear | Puzzle tool only after soft prompt; clearer tool label + one coach line | `GameHUD.ts`, `BlockPuzzleSystem.ts`, `FirstDiveDirector.ts` |
| **P0-4** | Audio placeholder | Ambient loop + collect/clean/win SFX (procedural OK if no assets) + Safari unlock on Dive In | `AudioManager.ts`, `main.ts`, `Game.ts` |
| **P0-5** | Win celebration weak | Sparkle/bubbles/sound + kid card “You did it!” | `GameHUD.ts`, `Game.ts`, `styles.css`, `BubblesSystem.ts` |
| **P0-6** | Settings half-dead | Quality apply works + honest “Reload for full quality”; mute works | `GameHUD.ts`, `QualitySettings.ts`, `Game.ts` (expose apply API if needed) |
| **P0-7** | Half-finished features visible | Hide VR; Buddy = “Local tabs only” or Settings-only; limit level select to 1–3 gift levels | `MainMenuUI.ts`, `LevelSelectUI.ts`, `LevelSystem.ts` |
| **P0-8** | Dual currency | **Ship pearls only** in gift UI; map gems→pearls or hide gems chip | `GameStore.ts`, `GameHUD.ts`, `UpgradeSystem.ts`, `LevelSystem.ts`, `AccountSystem.ts` |
| **P0-9** | Creature bar gap | Heroes already upgraded; add 3–5 CC0 hero GLBs if time; **never** barramundi-as-shark | `public/models/creatures/`, `AssetLibrary.ts`, `FishModels.ts` |
| **P0-10** | Gift loop not one perfect path | Lock content: Home Reef only, trash×8 path, 1 net, heroes, 1 puzzle optional | `HomeReefStage.ts`, `ConservationWorld.ts`, `FishSystem.ts` |

### B. Code hygiene from audit (P0.5 — same week, after play works)

| ID | Issue | Action | Files |
|----|--------|--------|--------|
| **H-1** | Root README stale | Rewrite to 3D product + iPad launch | `README.md` |
| **H-2** | Legacy `js/` confuses | Move to `legacy/2d-canvas/` or delete if unused by build | `js/`, `css/`, root `index.html` |
| **H-3** | `UIManager` dead weight | Remove usage from `main.ts`; delete or archive class | `UIManager.ts`, `main.ts` |
| **H-4** | Smoke port mismatch | Auto-detect 5173/3000; document both | `scripts/smoke-1p-2p.mjs`, `SHIP.md` |
| **H-5** | Conservation callbacks duplicated | Single award path in `Game` or one helper | `Game.ts`, `main.ts` |
| **H-6** | Vision doc looks like product | Banner: not birthday scope | design `.txt`, `docs/DESIGN_LOCK_BIRTHDAY_V1.md` |

### C. Engineering debt (P1 — after gift or if time)

| ID | Issue | Action |
|----|--------|--------|
| **P1-1** | `window` globals | Minimal `AppContext` for HUD/audio/account only — **not full rewrite** |
| **P1-2** | No unit tests | Vitest: save/load snapshot, puzzle win, trust threshold, BuddySession host/join |
| **P1-3** | Bundle ~1MB JS | Manual chunks for three/howler; lazy Marinepedia/shop |
| **P1-4** | Emoji vs Rule 7 | Gift decision: **SVG/HudIcons for production chrome**; allow soft emoji only in discovery if time-poor |
| **P1-5** | Levels 4–30 opaque | Gate unlock: only 1–3 for gift; rest “Coming soon” |
| **P1-6** | Procedural creatures vs bar | Post-gift art pack pipeline |

---

## 3. Execution phases

### Phase S0 — Scope freeze (30 min, no code risk)

1. Mark this plan as gift source of truth in `WORKING.md`.  
2. Banner vision doc: “Phase 2 vision — not birthday.”  
3. Agree: **no new features** until P0-1…P0-5 green.

### Phase S1 — One-tap into water (P0-2, P0-7, P0-10)

**Goal:** From cold start → swimming Home Reef in **≤ 3 taps** on iPad.

| Step | Work | Done when |
|------|------|-----------|
| S1.1 | “Continue as Jasmine” auto-selects if only/default | Profile not a wall |
| S1.2 | Main menu primary CTA: **Dive Home Reef** (skip level grid for gift) | One button |
| S1.3 | Level select: show only levels 1–3; rest locked “Soon” | No 30-card overwhelm |
| S1.4 | On dive: objective = path/gentle only; blocks hidden | Matches BONES |
| S1.5 | FirstDiveDirector: sequential objectives (turtle → clean → optional puzzle) | One banner at a time |

### Phase S2 — iPad is the product (P0-1)

**Goal:** Unsupervised swim/look/clean/observe without keyboard.

| Step | Work | Done when |
|------|------|-----------|
| S2.1 | Real device: landscape Safari, same Wi‑Fi, `index-3d.html` or Netlify | Checklist filled |
| S2.2 | Stick: forward/back/strafe feel like water (match desktop lerp) | No ice-skate |
| S2.3 | Look drag: pitch/yaw stable; no accidental scroll | Safe areas OK |
| S2.4 | Up / Down buttons large enough | Fingers hit first try |
| S2.5 | Observe + Clean work; coach dismisses once | `rowblocks_coach_seen_v1` |
| S2.6 | Medium quality default on iPad; no crash at 5 min | Memory OK |
| S2.7 | Portrait banner: “Turn sideways” | Already? verify |

**Device checklist (print for Carl):**  
- [ ] Swim along golden path  
- [ ] Look left, find turtle  
- [ ] Clean 3 trash  
- [ ] Free net (if visible)  
- [ ] Observe one fish  
- [ ] Pause / settings mute  
- [ ] Reload → progress still there  

### Phase S3 — Feel finished (P0-4, P0-5, P0-6, P0-8)

| Step | Work | Done when |
|------|------|-----------|
| S3.1 | Ambient + 3 SFX (collect, clean, win); unlock on first tap | Heard on iPad |
| S3.2 | Win card: stars + bubbles + sound + “You did it, Jasmine!” | Kid-readable |
| S3.3 | Settings: quality + mute + “reload for full graphics” honest | Not a dead button |
| S3.4 | Currency: **Pearls only** on HUD; gems not shown or renamed | One word |
| S3.5 | Hide VR; Buddy menu: “Local only” or under Settings | No false promises |

### Phase S4 — Creatures & world honesty (P0-9, quality bar)

| Step | Work | Done when |
|------|------|-----------|
| S4.1 | Keep upgraded procedural heroes as floor | Silhouette reads at 10m |
| S4.2 | If time: import CC0 turtle/manta/shark/jelly GLBs into `public/models/creatures/{id}.glb` | `AssetLibrary` loads |
| S4.3 | School fish may keep GLB pack; heroes never barramundi fallback | Already coded — retest |
| S4.4 | Do **not** claim “better than Roblox” in ship notes until GLBs land | Honest SHIP.md |

### Phase S5 — Repo truth & safety net (H-*, P1-2)

| Step | Work | Done when |
|------|------|-----------|
| S5.1 | Rewrite `README.md` → 3D, launch, iPad, gift scope | Matches SHIP |
| S5.2 | Archive legacy 2D (`js/`, old `index.html` if unused) | No dual product |
| S5.3 | Remove `UIManager` from live path | Dead code gone |
| S5.4 | Smoke: try ports 3000 then 5173 | Works either way |
| S5.5 | Vitest: `AccountSystem` save roundtrip; simple puzzle win; BuddySession codes | `npm test` green |
| S5.6 | Deduplicate conservation CP awards | One code path |

### Phase S6 — After birthday

- More species + real GLB pack  
- More reefs when Home Reef is loved  
- Onboarding polish  
- Bundle split  
- Optional DI / event bus  
- Phase 2 vision remains a **separate pitch**, not backlog for gift  

---

## 4. Recommended order (next sessions)

Do **not** parallelize everything. Order by “daughter can’t play” risk:

```
1. S0 scope freeze in WORKING.md / vision banner
2. S1 one-tap Home Reef + sequential first-dive objectives
3. S2 iPad device pass (blocking — Carl + Jasmine device)
4. S3 audio + win juice + pearls + settings honesty + hide unfinished
5. S4 creature GLB only if S1–S3 green and time remains
6. S5 README / legacy / UIManager / tests / smoke ports
7. STOP FEATURES → gift night
```

**Parallel OK only for:** S5.1 README + S5.2 archive + smoke port fix (no gameplay risk).

---

## 5. Definition of Done — gift night

Jasmine can, alone on iPad:

1. Open the link  
2. Tap through to water in ≤ 3 taps  
3. Swim, look, clean trash, meet turtle  
4. Hear water + happy sounds  
5. Get a clear “You did it!”  
6. Close and reopen — still Jasmine, progress kept  
7. No dead buttons that confuse her  
8. No multiplayer/VR/30-level noise  

If any of 1–6 fail → **not gift-ready**. Visual “better than Roblox” is aspirational; **playable delight beats feature count**.

---

## 6. Explicit non-goals this mission

- Engine migration  
- React rewrite  
- Full online Buddy  
- Implementing the UE5 design doc  
- All 30 levels fair  
- Removing every `window` global  
- Perfect photoreal water  

---

## 7. How agents should work under this plan

- Prefer **Home Reef + touch + first 10 minutes** over new systems.  
- Before adding content: flag if it expands scope past gift DoD.  
- Always run commands from repo root; prefer `index-3d.html`.  
- After P0 code: re-run `tsc`, `npm run build`, `node scripts/smoke-1p-2p.mjs`.  
- iPad checklist is **human** — agents can’t fully substitute Safari on device.

---

## 8. Immediate next implementation slice (when you say go)

**Slice A (highest ROI, ~half day):**

1. `MainMenuUI` / `main.ts`: **Dive Home Reef** skips level grid (or auto-picks level 1).  
2. `LevelSelectUI` / `LevelSystem`: gift mode levels 1–3 only.  
3. `FirstDiveDirector`: strict one-objective sequence.  
4. Currency: HUD pearls only.  
5. Hide/relabel Buddy + ensure Settings mute.  
6. README + archive legacy 2D pointer.  
7. Smoke multi-port.

**Slice B (device day):** iPad checklist + MobileControls fixes.

**Slice C:** Audio + win celebration.

---

## 9. Audit → plan coverage matrix

| Review point | Plan ID |
|--------------|---------|
| Scope vs UE5 vision | §1, S0, H-6 |
| iPad #1 ship blocker | P0-1, S2 |
| First 60–90s | P0-2, S1 |
| Puzzle mode switch | P0-3, S1.5 |
| Audio | P0-4, S3.1 |
| Win/lose celebration | P0-5, S3.2 |
| window globals | P1-1 |
| No tests | P1-2, S5.5 |
| Bundle size | P1-3 |
| Dual currency | P0-8, S3.4 |
| Settings dead | P0-6, S3.3 |
| Emoji Rule 7 | P1-4 |
| Hide unfinished | P0-7, S3.5 |
| Creature art bar | P0-9, S4 |
| One perfect loop | P0-10, §1 |
| Stale README | H-1, S5.1 |
| Legacy js/ | H-2, S5.2 |
| UIManager dead | H-3, S5.3 |
| Smoke port | H-4, S5.4 |
| Levels 4–30 | P1-5, S1.3 |
| Conservation dup | H-5, S5.6 |

---

**Bottom line:** The review is right. Ship **one perfect, touch-first Home Reef gift** — not the design document. This plan is the cut list.
