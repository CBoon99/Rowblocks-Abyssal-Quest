# Art Sources — Rowblocks Abyssal Quest

**Goal:** Wow-tier underwater look. Prefer CC0 / free commercial. Species-true when possible.

## Integrated in repo

| Asset | Path | License | Source |
|-------|------|---------|--------|
| Barramundi fish GLB | `public/models/creatures/barramundi.glb` | **CC0** | [Khronos glTF Sample Assets — BarramundiFish](https://github.com/KhronosGroup/glTF-Sample-Assets) |
| Goldfish / Clownfish GLB | `public/models/creatures/goldfish.glb`, `clownfish.glb` | **CC0** (Quaternius via open demos) | [Quaternius Fish](https://quaternius.com/) / [three-aquarium-challenge](https://github.com/Nihdao/three-aquarium-challenge) |
| Butterfly / Angelfish GLB | `butterfly_fish.glb`, `angelfish.glb` | **CC0** | Quaternius |
| Mandarin / Blue tang GLB | `mandarin_fish.glb`, `blue_tang.glb` | **CC0** | Quaternius |
| Coast sand albedo/normal/rough/disp | `public/textures/sand/*` | **CC0** | [Poly Haven — coast_sand_01](https://polyhaven.com/a/coast_sand_01) + coast_sand_rocks_02 |
| Rock albedo/normal | `public/textures/rock/*` | **CC0** | Poly Haven rock |
| Coral gravel albedo/normal | `public/textures/coral/*` | **CC0** | [Poly Haven — coral_gravel](https://polyhaven.com/a/coral_gravel) |
| Env HDR (reflections only) | `public/textures/env/sky_1k.hdr` | **CC0** | [Poly Haven — kloofendal_43d_clear_puresky](https://polyhaven.com/a/kloofendal_43d_clear_puresky) |

**Drop-in rule:** `public/models/creatures/{speciesId}.glb` is auto-loaded (see `AssetLibrary.ts`).

## Recommended free packs (download & drop in)

| Pack | License | Use | Link |
|------|---------|-----|------|
| **Quaternius Animated Fish Pack** | CC0 | Shark, manta, dolphin, clown-like, whale | [quaternius.com/packs/animatedfish](https://quaternius.com/packs/animatedfish.html) → put GLB/FBX under `public/models/creatures/` |
| **Quaternius Cute Fish Pack** | CC0 | 50+ colorful fish (stylized kids wow) | [quaternius.com/packs/cutefish](https://quaternius.com/packs/cutefish.html) |
| **Kenney Fish Pack** | CC0 | 2D sprites / simple 3D | [kenney.nl/assets/fish-pack](https://kenney.nl/assets/fish-pack) |
| **ambientCG** | CC0 | Extra sand/rock/ground PBR | [ambientcg.com](https://ambientcg.com) |
| **Poly Haven HDRIs** | CC0 | Soft underwater lighting env | [polyhaven.com/hdris](https://polyhaven.com/hdris) |

## Three.js / water tech references

| Project | Notes |
|---------|--------|
| [martinRenou/threejs-caustics](https://github.com/martinRenou/threejs-caustics) | Real-time caustics technique (GPU) |
| [jeantimex/threejs-water](https://github.com/jeantimex/threejs-water) | Reflections/refractions/caustics demo |
| Three.js examples `Water.js` / `Water2` | Surface water (we already use MeshPhysicalMaterial surface) |

## Roblox-adjacent design guidelines (applied)

Top Roblox underwater experiences win on:

1. **Readable silhouettes** at distance (big color blocks, clear species)
2. **Fog + color depth** (near cyan, far deep blue)
3. **Landmark reef identity** (each zone a different palette)
4. **Sparse open water** between dense pockets (we do this)
5. **Juice on collect** (particles, UI, sound)
6. **Performance tiers** for mobile (we do quality tiers)

Not photoreal film — **premium stylized readable wow** that still looks like the real animal.

## Pipeline

1. `AssetLibrary.loadAll()` at Game init  
2. Sand/rock/coral materials pull real PBR maps  
3. Hero fish = Barramundi GLB clones + species tints (fallback = procedural `FishModels`)  
4. Drop more GLBs into `public/models/creatures/{speciesId}.glb` → auto-used when we extend loader  

## Attribution (not required for CC0, appreciated)

- Poly Haven  
- Khronos Group glTF Sample Assets  
- Quaternius (when you add their pack)  
- Kenney (when you add their pack)  
