# Education & Conservation — Rowblocks: Abyssal Quest

## Design loop: Discover → Care → Protect

| Action | How | Learns |
|--------|-----|--------|
| **Discover** | **E** near fish | Species facts (toast + Marinepedia) |
| **Care** | **M** Marinepedia cards | Ecology role, threats, tips |
| **Protect** | **F** litter / ghost nets | Plastic & ghost-net harm; earns **CP** |

## Content packs (`content/`)

- `species.json` — field-guide species (fun fact, role, threats, tip)
- `missions.json` — curriculum arcs with `learnWhy` + `realWorldHook`
- `ranger_ranks.json` — Tide Explorer → Ocean Guardian by Conservation Points

Loaded via `src/content/ContentLoader.ts`.

## Systems

- `EducationSystem` — discovery resolve + Marinepedia cards
- `ConservationSystem` — CP, cleanups, rescues, ranks
- `ConservationWorld` — 3D litter + ghost nets
- Account / GameStore — persist CP, rank, speciesDiscovered

## Jasmine path

1. Login as **Jasmine** (seeded profile, starter CP)
2. Play → dive → **E** fish → discovery toast + Marinepedia
3. **F** near trash/nets → cleanup/rescue + CP
4. Ranger badge (corner) tracks rank progress
5. Progress auto-saves on her Rowblocks account

## Controls (education)

- **E** — observe/collect fish (learn)
- **F** — clean litter / free nets (protect)
- **M** — Marinepedia field guide
