# Performance Report — Baseline (Phase 0/1)

**Date:** 2026-07-17  
**Commit:** `cb3c091`  
**Measured:** Build size + static cost analysis. **Not measured:** iPad FPS (CANNOT VERIFY).

## Build

| Metric | Value |
|--------|-------|
| `npm run build` | SUCCESS ~0.9s |
| Main JS min | ~1003 kB |
| Main JS gzip | ~268 kB |
| CSS gzip | ~9 kB |
| npm audit (prod) | 0 vulnerabilities |

## Runtime cost centers (estimated)

| Center | Risk | Notes |
|--------|------|-------|
| Terrain 256² high | Very high | QualitySettings lowers on medium/low |
| Water vertex ripple + normals/frame | High | |
| Non-instanced reef props | High | |
| Fish × N multi-mesh + shadows | High | |
| Dual caustics (floor canvas + post) | High | Prefer one path |
| SpotLight caustic shadow map | High | |
| Marine snow points | Medium | Scaled by tier |
| Howler + audio | Low–Med | |

## Quality tier defaults

See `QualitySettings.ts` — touch devices medium/low. **Good skeleton.**

## Targets (not yet proven)

| Device | Tier | Target |
|--------|------|--------|
| iPad Safari | medium | ≥30 FPS home reef 30s |
| Desktop | high | ≥45–60 FPS aspirational |

## After changes

Record FPS before/after any art spike. No visual change accepted without measure (mission Rule 5).

## Next measurements (Verification Lead)

1. Chrome Performance + FPS overlay on desktop high  
2. iPad medium 60s home + 60s open blue  
3. Draw-call sample (Spector.js)  
4. Memory after 5 min dive  
