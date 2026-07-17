# Birthday Release Audit — Abyssal Quest

**Date:** 2026-07-17  
**Branch / commit:** `birthday-phase0-baseline` @ `cb3c091`  
**Method:** Live code wiring + structure (3 parallel audit agents). Full iPad Safari FPS / every interaction: **CANNOT VERIFY** without device run — marked honestly.  
**Phase 0:** `docs/PHASE0_BASELINE.md`  
**Partials:** systems agent, UI agent, assets agent (merged here).

Status vocabulary (mission Rule 1):

| Status | Meaning |
|--------|---------|
| VERIFIED WORKING | Continuous code path user → system |
| PRESENT BUT PARTIAL | Exists; incomplete or unproven on device |
| PRESENT BUT BROKEN | Exists but fails intended job |
| CODE EXISTS BUT NOT REACHABLE | Dead / unwired |
| DOCUMENTED ONLY | Docs, no implementation |
| NOT FOUND | Absent |
| CANNOT VERIFY | Needs live device/browser proof |

---

## Master table

| Area | Status | Evidence | Visual issue | Functional issue | Birthday risk | Required action |
|------|--------|----------|--------------|------------------|---------------|-----------------|
| Phase 0 checkpoint | VERIFIED WORKING | `docs/PHASE0_BASELINE.md`, git `cb3c091` | — | — | — | Keep rollback point |
| Production build | VERIFIED WORKING | `npm run build` OK; ~1MB JS chunk | Large bundle | Load time iPad | P1 | Code-split later |
| Profile / Jasmine seed | VERIFIED WORKING | `AccountSystem`, `ProfileSelectUI`, `main.ts` | Emoji-heavy first screen | — | **P0** | Keep Jasmine CTA; SVG icons later |
| Progress save/load | VERIFIED WORKING | Account auto-save paths | — | Needs reload smoke | **P0** | Manual: play → reload → still Jasmine |
| Main menu | PRESENT BUT PARTIAL | `MainMenuUI.ts` | Prototype cyan shell | **Settings = no-op** | **P0** | Hide Settings or wire quality/audio |
| Level select → dive | VERIFIED WORKING | `startLevelFlow` | Keyboard-centric hints | — | **P0** | Touch-first copy |
| First spawn / ocean | PRESENT BUT PARTIAL | `Scene3D`, `OceanEnvironment` | Water/coral partial vs bar | — | **P0** | Landmark + water polish plan |
| Jasmine character | PRESENT BUT PARTIAL | `JasmineCharacter.ts` third-person | Roblox-matched, not photoreal | — | P1 | Ship as signature avatar |
| HUD | PRESENT BUT PARTIAL | `GameHUD.ts` | Puzzle stats + **emoji** | Clutter vs free swim | **P0** | Simple first-dive HUD mode |
| MobileControls iPad | VERIFIED WORKING (code) / CANNOT VERIFY (device) | `MobileControls.ts` | Overlaps BL meters | Device untested | **P0** | Landscape iPad playtest |
| Trust / gentleness bar | PRESENT BUT PARTIAL | HUD + Swimmer gentleness | Rule 6 tension | Label vs animal-as-UI | **P0** | Prefer behaviour; HUD optional reinforce |
| Wildlife moods | PRESENT BUT PARTIAL | `FishSystem` + personalities | Scale pulse weak | Needs playtest | **P0** | Behaviour-first readability |
| Hero creature art | PRESENT BUT BROKEN vs bar | 7 GLBs only; rest procedural | Shark may be wrong silhouette | Education mismatch | **P0** | GLB heroes: turtle, manta, shark, jelly, octopus, seahorse |
| Elder birthday pearl | PRESENT BUT PARTIAL | Elder turtle + pearl card | Emoji in card | Late path | **P0** | End-to-end QA |
| Reef gather climax | PRESENT BUT PARTIAL | `tryReefGather` | Soft card | Easy to miss | P1 | QA + optional audio |
| Shark respect zone | VERIFIED WORKING (code) | Events + soft push + toast | Toast emoji | Device untested | **P0** | Playtest |
| Jelly tingle | VERIFIED WORKING (code) | soft push budget + bubbles | — | Device untested | P1 | Playtest |
| Conservation litter/nets | VERIFIED WORKING | `ConservationWorld` + F / Clean | Stylized props | Spawn near start? | **P0** | Guarantee visible litter Home Reef |
| Reef health + map | VERIFIED WORKING | `ReefHealthSystem`, `OceanMapUI` | Mini expand hit small | Health not persisted | P1 | Persist optional; 44px expand |
| Dive Budget | VERIFIED WORKING | no drown death | Label “Budget” | BL clutter | P1 | Kid label “Air” |
| Ranger alerts | VERIFIED WORKING | timed missions | 🚨 emoji | Banner stack | P1 | Soften first 5 min |
| Puzzle play/win | VERIFIED WORKING | BlockPuzzle + LevelSystem | Generic blocks | Hint stub | **P0** | L1 full win smoke |
| Marinepedia | PRESENT BUT PARTIAL | M key only; emoji cards | No 3D thumbs | Discoverability | P1 | Soft open after first Observe |
| Cosmetics shop | PRESENT BUT PARTIAL | C key; sleeve recolors | — | — | P2 | Optional |
| Upgrades shop | PRESENT BUT PARTIAL | U / menu | Currency 💎 confusion | pearls vs gems | P1 | Distinct pearl icon |
| Buddy Dive | PRESENT BUT PARTIAL | BroadcastChannel tabs | — | Not online | P2 | Badge “Local only” or hide |
| VR | PRESENT BUT PARTIAL | `enableVR` session only | Button hidden usually | No VR game loop | P2 | Hide for birthday |
| Audio | PRESENT BUT PARTIAL | Howler + procedural | — | Safari unlock untested | P1 | Gesture unlock path + device test |
| Quality tiers | VERIFIED WORKING | auto high/medium/low | Settings can’t change | — | P1 | Wire quality in Settings |
| Education / quests | PRESENT BUT PARTIAL | Observe + quest progress | No quest list UI | — | P1 | Soft objectives only for birthday |
| Emoji production UI | PRESENT BUT BROKEN (Rule 7) | HUD, menus, ranks | Incoherent chrome | — | **P0** | One SVG icon family |
| Dead shaders | CODE EXISTS BUT NOT REACHABLE | `src/shaders/*` unused | — | — | P2 | Wire or delete |
| Automated tests | NOT FOUND | vitest script empty suite | — | No CI safety net | P1 | Add save/trust/puzzle tests |
| iPad Safari full pass | CANNOT VERIFY | — | — | — | **P0** | Physical device checklist |
| ABZU-level restoration wow | PRESENT BUT PARTIAL | reef health + gather | Coral doesn’t fully bloom | — | P1 | Visible clean→bright path |

---

## First-ten-minutes scorecard

| Moment | Ready? | Notes |
|--------|--------|-------|
| Boot → Jasmine profile | Yes | Seed + CTA |
| Menu → Play → L1 | Yes | Hide dead Settings |
| Dive + coach (touch) | Yes (code) | iPad verify |
| See Jasmine body | Yes | Third-person |
| Wildlife reacts to thrash/still | Partial | Code yes; feel TBD |
| First Observe toast | Yes | |
| First Clean + CP | Yes if litter in view | Guarantee spawn |
| Birthday pearl | Later intentional | Must work once trusted |

---

## Authority for conflicts (locked)

1. Child safety  
2. Functional correctness  
3. iPad usability  
4. Performance  
5. Visual coherence  
6. Feature richness  

---

## Next gates

1. ~~Phase 0~~ done  
2. Research docs (Phases 2–3)  
3. Visual system + design lock docs  
4. **Only then** P0 implementation on a work branch  
