# Quality Review — Agent Panel (2026-07-17)

Three independent reviews: **Visual**, **iPad/Touch**, **Premium Feel**.  
Bar: top-tier premium 3D, better than Roblox peers, realistic ocean, real species, **iPad-first for Jasmine**.

---

## Consensus scores (ruthless)

| Dimension | Score | Verdict |
|-----------|------:|---------|
| Visual vs locked bar | **3.5/10** | Much better than cones; still not top-tier |
| iPad playability today | **Fail** | Boots; cannot swim/play without keyboard |
| First 60s gift experience | **3.5/10** | Profile → menu → confusion |
| Juice / feedback | **4/10** | Toasts + bubbles; thin win/fail |
| Audio | **2.5/10** | Procedural placeholders |
| Education design | **5.5/10** | Good thesis; not primary loop yet |
| **Gift-ready unsupervised iPad** | **2–3/10** | **Not ready** |

---

## What’s working (keep)

- Species-true *intent* mesh builders (not cones)
- Reef shelf, sand terrain, caustics, kelp/coral/rocks, marine snow
- Discovery toasts, Marinepedia structure, ranger CP
- Ghost-net free VFX (best juice in build)
- Account / Jasmine continue path

---

## P0 — Must fix before Jasmine surprise

### 1. iPad controls (ship blocker)
- No virtual stick, no touch look-drag, no on-screen Observe/Clean
- Pointer lock fails on Safari; WASD/E/F/arrows are desktop-only
- **New:** `MobileControls.ts` + rewire `SwimmerController` + puzzle swipe/buttons
- Skip pointer lock on coarse pointer

### 2. Graphics quality tiers (iPad performance)
- Default mobile: cut OutlinePass + heavy bloom, cap DPR ~1.25, reduce fish/particles/shadows
- Keep species-true silhouettes — reduce **count**, not quality to shapes

### 3. First 90s onboarding
- One objective path: swim → observe fish → fact → clean trash → open puzzle path → big win
- Show level description as kid banner
- Pause = resume (not dump to level select)

### 4. Win celebration + real audio
- Win SFX, star cascade, CP/pearl count-up
- Real underwater bed + 8 stingers (not 60Hz drone)

### 5. Visual next step (top tier)
- GLB pipeline for hero species (not lathe forever)
- Kill default toon OutlinePass
- Sand normal/PBR, fix bubble surface Y, single fog owner

---

## Recommended touch scheme (landscape)

| Control | Action |
|---------|--------|
| Left virtual stick | Swim |
| Right drag | Look |
| Up / Down buttons | Vertical swim |
| **Observe** button | Collect/learn (E) |
| **Clean** button | Litter/nets (F) |
| Tap block + swipe / D-pad | Puzzle |
| Puzzle mode toggle | Free cursor for precise taps |

---

## Visual roadmap (high ROI)

| Window | Work |
|--------|------|
| **Next 4h** | Touch controls + quality tiers + disable outline + bubble fix + win juice |
| **Week 1** | 5 hero GLB species + sand PBR + onboarding mission |
| **Week 2** | Rest of species + coral kit + caustics real receivers |
| **Week 3** | Water god-rays, diver presence, performance polish |
| **Week 4** | Jasmine sign-off checklist + live deploy |

### Asset strategy (agents agree)
- Procedural = LOD/fallback only long-term
- Hero creatures: Sketchfab CC / game-ready packs → `public/models/creatures/{id}.glb`
- Reef kit instanced; AmbientCG/Poly Haven for sand/rock PBR
- Do **not** replace with Kenney toy fish if bar is “actual species”

---

## Sign-off checklist (excerpt)

- [ ] Child can name 8+ species at 5m with no labels
- [ ] Unsupervised iPad 10-min session: swim, observe, clean, win level 1
- [ ] Steady ≥30 fps on Jasmine’s iPad (Medium tier)
- [ ] No “those are still shapes” reaction
- [ ] Win feels like a celebration; audio sells underwater

---

## Product one-liner (feel agent)

**You built the ranger systems; you have not yet built the ranger experience.**  
Wow = swam + learned + saved + ocean cheered.  
Today without keyboard = profile menu + ocean wallpaper.
