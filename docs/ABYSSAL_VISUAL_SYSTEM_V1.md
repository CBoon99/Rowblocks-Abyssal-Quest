# Abyssal Visual System v1 (Draft → lock after P0)

**Status:** LOCKED to mock plate #1 (2026-07-17)  
**Product soul:** Respect the Ocean  
**Targets:** iPad Safari landscape primary; desktop secondary  
**Reference image:** session assets / mock plate #1 (Jasmine third-person, glass HUD, dense reef)

## Mock plate #1 layout (authoritative)

| Zone | Content |
|------|---------|
| Top-left | Jasmine avatar · name · rank · Trust bar · Dive Budget |
| Top-centre | Compass strip |
| Top-right | Coins · Stars · Shells · Objective card |
| Left rail | Marinepedia · Map · Quests · Shop · Settings (SVG) |
| Bottom centre | Observe · Clean · Puzzle · Boost · Lantern |
| Bottom-right | Discovery card · mini compass |
| World | Dense multicolour coral · wreck landmark · litter/nets · god rays |

---

## 1. World atmosphere

| Layer | Spec |
|-------|------|
| Palette | Deep teal `#0a3d4d`, open blue `#0b4f7a`, sand warm `#c4a574`, life coral accents `#ff7a59` / cyan `#00d4ff` |
| Fog | Exp2; denser in open water; lighter on healthy reefs |
| Light | Soft hemi + single key sun; no horror blacks |
| Water | Readable depth tint; restrained bloom on high tier only |
| Landmarks | Named reefs + distinct props (anemone garden, wreck silhouette, kelp walls) |
| Restoration | Dirty → less colour/fish density; clean → brighter coral tint, denser schools, gather moment |

## 2. Creatures

| Rule | Spec |
|------|------|
| Silhouette first | Must read species at 5–8 m without labels |
| Mood | Approach / flee / circle / school tighten — **not** HP bars over heads |
| Trust | Per-dive 0–1; kid language: curious calm wary scared trusting |
| Heroes | Prefer GLB; no wrong-species fallbacks for shark/turtle/manta |
| Jasmine | Signature diver: black/orange suit, yellow mask, green flower, brown hair, green eyes |

## 3. Interface

| Rule | Spec |
|------|------|
| Icon family | **One** SVG set (Lucide recommended) — **no emoji in production chrome** |
| Type | 1 UI sans (system or OFL); 1 optional display |
| Touch | Min 44×44 px; primary actions ≥56 px |
| HUD density | First 5 min: air, trust hint, objective, pause — de-emphasize moves/score until puzzle focus |
| Feedback | Discovery toast queue; soft cards for pearl/gather; no slot-machine FX |
| Currency | Pearls ≠ gems (distinct icons + labels) |

## 4. Motion & safety

| Rule | Spec |
|------|------|
| Hazard | Soft (push, tingle, budget nibble) — never jump-scare red |
| Motion | Prefer reduced overdraw; respect quality tier |
| Flash | No seizure-risk strobing |

## 5. Performance budgets (targets)

| Tier | Fish | Terrain segs | Bloom | Shadows |
|------|------|--------------|-------|---------|
| high | ≤40 | ≤256 | on | 2048 |
| medium (iPad default) | ≤24 | ≤128 | off | 1024 |
| low | ≤14 | ≤64 | off | off |

iPad medium: **≥30 FPS** home reef sustained (measure before accepting art spikes).

## 6. What visual system does *not* change

- Three.js + Vite architecture  
- Respect the Ocean philosophy  
- No combat villains  
- No Roblox runtime  
