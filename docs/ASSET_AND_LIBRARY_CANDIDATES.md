# Asset & Library Candidates

**Phase 3 research only — no bulk integration in this document.**  
Every ADOPT row requires **VERIFY LICENCE** before download.

## Current stack (already in use)

| Item | Status | Note |
|------|--------|------|
| three@0.165 | ADOPT (locked) | Do not migrate engines |
| cannon-es | ADOPT | Physics present |
| howler | ADOPT | Audio |
| zustand | ADOPT | State |
| Vite 5 | ADOPT | Build |
| Poly Haven sand/rock/coral JPG | ADAPT | In `public/textures`; complete register URLs |
| 7 creature GLBs | ADAPT | Verify Quaternius/Khronos provenance |
| Procedural FishModels / JasmineCharacter | ADAPT | Original code; incomplete vs species bar |

## Recommendations

| Name | Source | Licence (typical) | Mobile | Fit | Effort | Rec |
|------|--------|-------------------|--------|-----|--------|-----|
| Lucide SVG | lucide.dev | ISC | High | One icon family for Rule 7 | Med | **ADOPT** (UI only) |
| Poly Haven HDRI + water normals | polyhaven.com | CC0 | Med | Lighting / water | Low–Med | **ADOPT** after verify |
| ambientCG ground packs | ambientcg.com | CC0 | High | Seafloor variants | Low | **ADOPT** |
| Species-true Sketchfab GLBs (turtle, manta, shark, jelly, octopus, seahorse) | sketchfab.com filter CC0/CC-BY | Per asset | Med | **P0 art bar** | High | **ADOPT** per-file only |
| Quaternius full fish pack | quaternius.com | CC0 claimed | High | More stylized GLBs | Med | **ADAPT** if silhouette pass |
| Kenney UI / particles | kenney.nl | CC0 | High | Icons, FX — **not** hero fish | Low | **ADOPT** UI/FX only |
| Kenney Fish Pack as heroes | kenney.nl | CC0 | High | Toy look fails bar | — | **REJECT** as primary creatures |
| Three Mesh UI | npm | MIT | Low–Med | 3D in-world UI rarely needed | High | **REJECT** for birthday |
| Rapier | npm | Apache-2 | Med | No proven gap vs cannon | High | **REJECT** unless blocker |
| React / R3F / Babylon | — | — | — | Migration forbidden | — | **REJECT** |
| Roblox free models / executors | — | — | — | Forbidden | — | **REJECT** |
| martinRenou threejs-caustics | GitHub | Check repo | Med | Technique study | Med | **STUDY ONLY** |
| Freesound (filtered) | freesound.org | Per clip | High | Bubbles, splash | Med | **ADAPT** strict licence |
| Google Fonts (Nunito / Atkinson) | fonts.google.com | OFL | High | Display + UI pair | Low | **ADOPT** |

## Bundle cost notes

- Main JS already ~1MB — avoid large runtime libs without tree-shake.
- Prefer local `public/` assets over runtime CDN raw URLs.
- Prefer instancing over many unique materials.

## Security

- No remote `loadstring` / untrusted raw script URLs.
- Vendor via npm or committed `public/` only.
