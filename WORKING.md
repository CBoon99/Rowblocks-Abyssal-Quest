# WORKING.md — Rowblocks: Abyssal Quest

**Read this before any change.** Locked decisions override older docs, READMEs, and prior agent notes.

---

## LOCKED — Visual & product quality bar (Carl, 2026-07-17)

User has **explicitly** set the bar. Do not weaken, reinterpret, or “pragmatic-downscope” without flagging first.

### Product
1. This must be a **proper 3D game** — not a tech demo, not a prototype aesthetic.
2. Visual target: **better than any other 3D game on Roblox** (motion, fidelity, readability, juice, environments).
3. Full 3D path only (`index-3d.html` / `src/*`). Legacy 2D is not the product.

### Visual fidelity (non-negotiable)
4. **Realistic water** — caustics, god rays, depth fog, refraction/reflections as far as WebGL allows; not flat blue fog only.
5. **Realistic environments** — biomes that feel like real ocean places (reef, open water, deep, etc.), not empty void with blocks.
6. **Realistic sea floor** — sand, rocks, coral, detail, terrain; not a single flat plane.
7. **100% sea creatures** — every creature must look like the **actual species** (silhouette, colors, patterns, proportions).  
   - **Cone/sphere/shape placeholders are NOT signed off and are rejected.**  
   - Clownfish must read as clownfish; turtle as turtle; manta as manta; etc.
8. No “good enough shapes for now” shipping. Visual quality is **in scope for ship**, not a later polish pass.

### Gameplay pillars (still locked)
9. Education + conservation are **core loops** (Discover → Care → Protect), not optional UI.
10. Jasmine Rowblocks account, progress save, live deploy for surprise gift.
11. Feel: swim, fish behavior, feedback must match top-tier Roblox 3D underwater games.

### Supersedes
- Earlier “no realistic water / no skins / stylized only” notes are **overridden** by this document for water, environment, seafloor, and creatures.
- Character “skin shop” cosmetics remain secondary to creature/environment fidelity.

### Agent rule
If a change would ship placeholder creatures, flat water, or barren floor, **stop and fix visuals first** or call it blocked. Do not mark visual work “P2 / later.”

---

## Current status (update as you go)

| Area | Status | Notes |
|------|--------|--------|
| Account / Jasmine login | Partial | Local profiles + save |
| Puzzle loop | Partial | Grid slides + win/lose |
| Education / CP / Marinepedia | Partial | Content packs + toasts |
| Conservation world (litter/nets) | Partial | Present, stylized |
| **Fish / sea creatures** | **Art wow v2** | Multi-GLB pack: Quaternius goldfish/butterfly/mandarin + Barramundi; auto-load `public/models/creatures/{id}.glb`. Home anemone garden + table coral. |
| **Water / seafloor / env** | **Art wow v2** | Poly Haven sand PBR (+disp/variant), rock+coral maps, evolving caustics shader canvas. See `docs/ART_SOURCES.md`. |
| Live deploy | Pending | Netlify auth |
| **iPad / touch** | **Shipped v1** | Stick + look-drag + Observe/Clean + puzzle pad; coach; quality tiers medium/low on tablet |
| Quality tiers | **Shipped** | high / medium / low via QualitySettings; outline off; iPad defaults medium |
| World pacing | **Shipped v2** | 7 reefs, ~80u hops, 420 seafloor, map + landmarks |
| Dive Budget | **Shipped** | Kid-safe air; surface refill; soft assist (no death) |
| Ranger Alerts | **Shipped** | Solo emergencies (nets/litter/turtle) |
| Buddy Dive | **Skeleton** | Join code via BroadcastChannel; remote buddy avatar; menu entry |

---

## Changelog

- **2026-07-17** — **Phase next (all):** Bigger archipelago (7 reefs, WORLD_MAP_EXTENT 160, seafloor 420). DiveBudget + HUD. RangerAlertSystem + HUD. BuddySession + BuddyDiveUI (create/join code, pose sync skeleton, remote diver mesh). Main menu Buddy Dive. Build green.
- **2026-07-17** — **iPad full pass:** MobileControls (stick, look, Observe, Clean, puzzle D-pad, coach, portrait banner), SwimmerController touch API, BlockPuzzleSystem.slideSelected, QualitySettings tiers applied to Game/Post/Scene/Fish/Bubbles, pause=resume, win celebration + objective banner, viewport-fit=cover. Build green.
- **2026-07-17** — **Creatures:** Replaced cone placeholders with `FishModels.ts` species builders (13+ animals: clownfish w/ ocellaris bands, angelfish disc, blue tang, parrotfish beak, shark, jellyfish+tentacles, seahorse, sea turtle+flippers, octopus, manta, lanternfish photophores, cleaner shrimp, giant squid). `FishSystem` rewired + same-species schooling + respawn. Build green.
- **2026-07-17** — Scene3D + WaterCaustics + OceanEnvironment: realistic seafloor (256 segs, sand texture, reef shelf y≈-2.5), rocks/coral/kelp, god rays, water surface, 2400 marine snow, animated caustics, depth fog. `npm run build` green.
- **2026-07-17** — Locked quality bar: proper game, > Roblox 3D peers, realistic water/env/seafloor, 100% real-looking sea creatures. Explicit user instruction.
