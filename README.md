# Rowblocks: Abyssal Quest

**3D underwater Ocean Ranger game** — birthday gift for Jasmine.  
Respect the Ocean. Nobody is bad. Trash is the problem.

> **Gift product:** Home Reef, ~10 minutes, iPad Safari first.  
> Full vision (7 biomes / 300 species / online MMO) is **Phase 2** — see the design doc, not this README.  
> Execution plan: [`docs/BIRTHDAY_SHIP_PLAN.md`](docs/BIRTHDAY_SHIP_PLAN.md)

## Play (local)

```bash
cd /Users/carlboon/Documents/Rowblocks-Abyssal-Quest
npm install
npm run dev -- --host 0.0.0.0
```

Open the **3D** entry (not the legacy root shell):

- **http://127.0.0.1:5173/index-3d.html** (Vite default)  
- or **http://127.0.0.1:3000/index-3d.html** if you pass `--port 3000`

iPad (same Wi‑Fi): `http://<MAC-IP>:5173/index-3d.html` · landscape · Settings → Medium if slow.

More launch notes: [`SHIP.md`](SHIP.md)

## Gift loop (what she should do)

1. **Continue as Jasmine**  
2. **Dive Home Reef** (one tap — skips level grid)  
3. Swim **gentle** on the golden path  
4. Meet the **turtle**, **clean glowing trash**, free a net if you see one  
5. Optional: manta, shark space, elder pearl, Puzzle tool (3)  
6. Progress **auto-saves**

## Controls

| Desktop | Touch (iPad) |
|---------|----------------|
| WASD swim | Virtual stick |
| Mouse look (click canvas) | Drag to look |
| Space / Shift up-down | Up / Down buttons |
| E Observe · F Clean | Observe · Clean |
| 1–5 tools | Tool bar |

## Stack

- **TypeScript + Vite + Three.js + Cannon-es + Howler + Zustand**  
- Entry: `index-3d.html` → `src/main.ts`  
- Systems under `src/systems/`, UI under `src/ui/`  
- Legacy 2D canvas code lives in `js/` (not the gift product)

## Build / test

```bash
npm run build          # dist/ with index.html for Netlify
npx tsc --noEmit
node scripts/smoke-1p-2p.mjs   # 1-player + Buddy local (server must be up)
npm test               # unit tests when present
```

## Docs that matter

| Doc | Role |
|-----|------|
| `WORKING.md` | Locked quality bar + status |
| `SHIP.md` | Gift launch + honesty |
| `docs/BONES.md` | Structural map |
| `docs/BIRTHDAY_SHIP_PLAN.md` | P0 checklist |
| `docs/DESIGN_LOCK_BIRTHDAY_V1.md` | Design lock |

## Currency (gift)

**Pearls** only on the HUD. (Legacy “gems” may still exist in save data — not shown.)

## Heart

Nobody is bad. The turtle can choose her.  
Happy Birthday Jasmine — Guardian of the Reef.
