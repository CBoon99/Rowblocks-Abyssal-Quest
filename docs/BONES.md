# Abyssal Quest — Product Bones

**Purpose:** Map of the structural skeleton. Polish hangs on this.  
**Home Reef is the only fully staged emotional area.** Other reefs exist as map bones only until propagation is approved.

---

## Player spine (must always work)

```
Profile (Jasmine)
  → Main Menu
    → Level Select
      → Dive (Game.start)
        → Swim / Observe / Clean
        → Memory moments (Home Reef)
        → Puzzle (optional tool)
        → Save (auto)
```

| Step | Owner |
|------|--------|
| Profiles + save | `AccountSystem` · `GameStore` · localStorage |
| Menu | `MainMenuUI` |
| Levels / win | `LevelSystem` · `BlockPuzzleSystem` |
| Dive loop | `Game` |
| Swimmer + Jasmine | `SwimmerController` · `JasmineCharacter` |
| Wildlife + memory | `FishSystem` · **`HomeReefStage`** |
| Conservation | `ConservationWorld` · `ReefHealthSystem` |
| HUD shell | `GameHUD` · `HudIcons` |
| Map | `WorldMap` · `OceanMapUI` |
| Quality | `QualitySettings` |
| Content catalog | `content/species.json` · `ContentLoader` |

---

## Home Reef stage bones

**Single source of truth:** `src/systems/HomeReefStage.ts`

| Constant | Meaning |
|----------|---------|
| `SPAWN` | Jasmine start position |
| `PATH` | Golden corridor axis (+Z) |
| `MEMORY_HEROES` | Turtle / manta / shark / jellies stage marks |
| `PATH_RIBBON` | 3 school fish only |
| `FIRST_DIVE_OBJECTIVE` | Kid-facing first goal (not puzzle) |
| `CAMERA_OFFSET` | Chase cam |
| `MANTA_TRIGGER_Z` | When manta glide starts |
| `TURTLE_NOTICE_DIST` | When turtle notices calm Jasmine |

Do not hardcode hero positions in other files — import from `HomeReefStage`.

---

## Dive start contract

On `startLevelFlow` / `Game.start`:

1. Blocks load then **`setBlocksVisible(false)`** until Puzzle tool  
2. Objective = explore / gentle path (not “open the path” puzzle-first)  
3. Camera owned by third-person Jasmine — **no** `lookAt(0,0,0)`  
4. Memory heroes already in scene from `FishSystem.init`

---

## Memory moment contract (existing systems only)

| Moment | Role flag | Once? |
|--------|-----------|-------|
| Turtle comes to see me | `friend_turtle` | Yes (per dive) |
| Manta overhead | `sky_manta` | Yes |
| Shark respect | `respect_shark` | Ongoing patrol |
| Jelly lanterns | `lantern_jelly` | Soft once line |
| Reef thank you | care pulse | On clean |

Events: `memory_moment` → soft toast via `Game.processWildlifeEvents`.

---

## World map bones (not yet staged)

7 reefs in `WorldMap.REEF_ZONES`. Only **home_reef** has Memory + art density.  
Propagation = copy stage pattern, not freestyle.

---

## What is NOT bones (do not expand yet)

- Online multiplayer  
- Full VR  
- New mechanics  
- Inventory  
- Other reefs’ memory scripts  

---

## Verify bones

```bash
npm run build
# Dive: Jasmine → Play → L1
# Expect: golden path, turtle left, no puzzle blocks, soft objective
```
