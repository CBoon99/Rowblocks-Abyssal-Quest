# Rowblocks: Abyssal Quest - Phase 1 MVP: Complete Basics Checklist

**Goal:** Rock-solid foundation that's instantly fun and usable. First 5 minutes = "wow, this is cool!"

**Success Metric:** Load → swim freely → slide blocks → win level → depth meter reacts → repeat. Smooth, colorful, intuitive.

---

## 🎮 Category 1: Loading & Initialization

| Feature | Details (Must Work Perfectly) | Why Essential | How to Verify |
|---------|-------------------------------|--------------|---------------|
| **Fast Load** | - No "Loading..." stall (>3s)<br>- Auto-start Level 1 on load<br>- Clean console (only ✅ logs, no errors)<br>- Hide all overlays on success<br>- Error popup + reload button on fail | Instant play — no frustration | Console: "✅ Game started"<br>Screenshot: No loading text visible |
| **Responsive Canvas** | - Fullscreen canvas (resize handles window changes)<br>- Mobile/touch fallback (virtual joystick overlay)<br>- 60 FPS minimum (mid-range PC/phone)<br>- No black bars on resize | Plays anywhere — family tablet OK | FPS counter (temp), resize window → no black bars |
| **Auto-Start** | - Level 1 loads automatically<br>- No manual "Start Game" click required<br>- Blocks visible immediately<br>- Camera positioned to see blocks | Zero friction entry | Page loads → blocks visible → can move immediately |

---

## 🎮 Category 2: Controls (Movement & Interaction)

| Feature | Details (Must Work Perfectly) | Why Essential | How to Verify |
|---------|-------------------------------|--------------|---------------|
| **First-Person Swim** | - **WASD**: Forward/back/strafe (smooth dampening, water resistance feel)<br>- **Mouse**: Look around (PointerLock on canvas click — "Click to swim!")<br>- **Space**: Swim up (buoyancy feel)<br>- **Shift**: Swim down<br>- **Esc**: Release lock/pause menu<br>- Smooth acceleration (no instant speed changes) | Freedom to explore — "I'm diving!" wow moment | Click canvas → WASD moves fluidly, mouse turns view smoothly |
| **Surface/Air Mechanics** | - **Y > 0**: HUD warning "Low oxygen!" (swim down)<br>- Gentle bounce back if too high<br>- Visual indicator (red tint?)<br>- Auto-recover O2 when diving | Adds risk/reward to depth dives | Swim up past surface → warning appears → forced down |
| **Basic Interaction** | - **Raycast select**: Mouse hover/click highlights row/plane (glow outline)<br>- **Drag/Arrow Keys**: Slide selected row (X/Y/Z axes — wrap/push blocks)<br>- **R**: Reset level<br>- **Undo**: 5 steps max (basic, no upgrades yet)<br>- **F**: Toggle flashlight | Core Rowblocks fun: Slide → "Aha!" moments | Hover block row → glows → drag → slides with physics tumble |
| **Mobile Controls** | - Touch joystick (virtual WASD on screen)<br>- Touch look (drag to rotate camera)<br>- Button overlays (Space/Shift for up/down)<br>- Responsive sizing | Play on phone/tablet | Touch screen → on-screen controls appear |

---

## 🎨 Category 3: Visuals - World

| Feature | Details (Must Work Perfectly) | Why Essential | How to Verify |
|---------|-------------------------------|--------------|---------------|
| **Sea Floor** | - Cartoon sand (yellow/orange ToonMaterial, rounded dunes via noise displacement)<br>- Size: 50x50m visible<br>- Shell/rock props (5-10 scattered billboards)<br>- Caustics (animated projector lights dancing on floor) | "Real" abyss — not void. Grounded exploration | Swim low → see textured sand dunes, lights shimmer |
| **Blocks/Puzzle** | - 5x5 grid start (Level 1: Simple align to exit)<br>- Cartoon blocks: Rounded boxes, 5 colors (red/blue/yellow/green/purple), emissive glow<br>- Win: Path clears → gem pops + fanfare sound<br>- Blocks tumble realistically on slide | Heart of game — colorful, satisfying slides | See grid on floor, slide row → blocks move/tumble realistically |
| **Atmosphere** | - Gradient skybox (surface light → deep blue-black)<br>- Depth fog (denser/deeper, color shifts)<br>- Particles: 50 subtle plankton glows<br>- God rays from surface (if performance allows) | Immersive "underwater" feel — depth changes mood | Swim down → darker/foggier; up → brighter |
| **Swimmer Avatar** | - Visible arms/helmet (first-person, subtle on gun)<br>- Flashlight (spotlight from head, toggle F)<br>- Customizable later (Phase 2) | "I'm the diver!" embodiment | Arms visible on swing, light beam ahead |

---

## 🎨 Category 4: Visuals - UI/HUD

| Feature | Details (Must Work Perfectly) | Why Essential | How to Verify |
|---------|-------------------------------|--------------|---------------|
| **Depth Meter** | - **Top-left**: "Depth: XXm" bubbly gauge (green shallow → red abyssal)<br>- Needle dial + bar fill<br>- Wobble animation on depth change<br>- Color shift: Green (0-20m) → Yellow (20-40m) → Orange (40-60m) → Red (60m+) | Core immersion — "How deep?!" tension/reward | Swim down → gauge fills red, updates real-time (-camera.y) |
| **Core HUD** | - **Top-right**: 💎 Gems (0), ⭐ Stars (0), Moves (X/∞)<br>- **Bottom**: Pause ⏸️, Reset ↩️, Hint 💡, Menu ☰<br>- **Centered**: Level name ("First Dive"), win popup<br>- All counters update in real-time | Always know status — no squint | Moves count on slide, gems +1 on win |
| **Menus** | - **Esc/Pause**: Resume/Quit/Levels (3 previews)<br>- **Levels**: Click to load (1-5 basics)<br>- Smooth fade in/out<br>- No blocking errors | Quick access — short sessions fun | Pause → overlay fades in, levels grid thumbnails |

---

## 🔊 Category 5: Audio

| Feature | Details (Must Work Perfectly) | Why Essential | How to Verify |
|---------|-------------------------------|--------------|---------------|
| **Ambient/SFX** | - Deep drone + bubbles loop (spatial 3D audio)<br>- Slide: Whoosh + clunk (block sounds)<br>- Win: Cheerful jingle<br>- Resume on gesture (no browser warnings)<br>- Mute toggle, volume slider in menu | Sensory immersion — "feels real" | Mute toggle works, volume slider adjusts |
| **Spatial Audio** | - Audio position relative to camera<br>- Distance attenuation (far = quiet)<br>- Underwater filtering (muffled sounds) | 3D immersion | Move away from sound source → gets quieter |

---

## 🎯 Category 6: Mechanics - Gameplay Loop

| Feature | Details (Must Work Perfectly) | Why Essential | How to Verify |
|---------|-------------------------------|--------------|---------------|
| **Puzzle Win** | - Align blocks → gem collects automatically<br>- Next level unlocks<br>- Basic hint: Glow solvable row (if hint button pressed)<br>- Win screen: Stars (0-3), score, "Next Level" button | Quick wins (30s/level) → addiction | Slide → path opens → gem flies to HUD + sound |
| **Physics/Feel** | - Cannon-es: Blocks tumble on slide, buoyancy (float up slowly)<br>- Currents: Gentle push (not frustrating)<br>- Water resistance on swimmer (dampening) | Satisfying "physics toys" | Blocks bounce realistically, swimmer drifts |
| **Move Counter** | - Tracks moves per level<br>- Color warning: Green → Yellow → Red (approaching max)<br>- Updates on every slide | Challenge awareness | Slide → moves increment, color changes |
| **Gem Collection** | - Gems pop from blocks on win<br>- Fly to HUD counter<br>- Sound effect<br>- Persist across levels (localStorage) | Reward feedback | Win level → gem animates to counter |

---

## 💾 Category 7: Saves & Performance

| Feature | Details (Must Work Perfectly) | Why Essential | How to Verify |
|---------|-------------------------------|--------------|---------------|
| **Local Save** | - Progress (levels completed, gems) via localStorage<br>- Auto-save on win<br>- Load on game start | Return anytime — ongoing adventure | Refresh → resumes Level X, gems persist |
| **Performance** | - 60 FPS minimum (mid-range PC)<br>- No stutters on block slides<br>- Fish/bubbles don't tank FPS<br>- Mobile: 30 FPS acceptable | Smooth experience | FPS counter shows stable 60, no frame drops |
| **Error Handling** | - No crashes on invalid input<br>- Graceful fallbacks (e.g., no level → test blocks)<br>- Console errors caught and logged | Robust experience | Try weird inputs → no crashes |

---

## 🐛 Category 8: Edge Cases & Polish

| Feature | Details (Must Work Perfectly) | Why Essential | How to Verify |
|---------|-------------------------------|--------------|---------------|
| **Boundary Checks** | - Can't swim too far from puzzle area<br>- Blocks wrap on slide (don't disappear)<br>- Fish stay in bounds | No getting lost | Swim far → gentle push back |
| **Win State** | - Win screen shows immediately<br>- Can't move blocks after win<br>- "Next Level" button works<br>- Auto-save triggers | Clear completion | Win → screen appears, next level loads |
| **Reset** | - R key resets level<br>- Blocks return to start positions<br>- Moves reset<br>- No state corruption | Quick retry | Press R → level resets cleanly |
| **Debug Cleanup** | - No red wireframe cubes visible<br>- No test blocks (unless fallback)<br>- Clean console (only essential logs) | Professional look | No debug visuals, clean console |

---

## ✅ Phase 1 Success Checklist

Before moving to Phase 2, verify ALL of these:

- [ ] **Loads in <3 seconds** — No loading stall
- [ ] **Auto-starts Level 1** — Blocks visible immediately
- [ ] **WASD + Mouse works** — Smooth movement, no jank
- [ ] **Depth meter updates** — Real-time, color changes
- [ ] **Can slide blocks** — Row selection + drag works
- [ ] **Win condition works** — Path opens → gem collects
- [ ] **Surface warning** — Y > 0 shows "Low oxygen!"
- [ ] **60 FPS stable** — No frame drops
- [ ] **Audio plays** — Ambient + SFX work
- [ ] **Saves progress** — Refresh → resumes level
- [ ] **Mobile responsive** — Touch controls work
- [ ] **No crashes** — Robust error handling
- [ ] **Clean visuals** — No debug cubes, cartoon style

---

## 🚀 Phase 1 → Phase 2 Transition

Once Phase 1 is rock-solid, Phase 2 adds:
- Fish collecting/Marinepedia
- Quests/shop/customization
- More levels (6-30)
- Endless mode

**But Phase 1 must be FUN first!** If movement feels janky or blocks don't slide smoothly, fix that before adding features.

---

## 📝 Implementation Priority

**Must-Have (Blockers):**
1. Movement (WASD + mouse)
2. Block sliding (row select + drag)
3. Win condition (path opens)
4. Depth meter (updates)

**Should-Have (Polish):**
5. Surface warning
6. Audio (ambient + SFX)
7. Save/load
8. Mobile controls

**Nice-to-Have (Extra):**
9. God rays
10. Hint system
11. Particle effects
12. Customization (Phase 2)

---

**Last Updated:** Based on current codebase review  
**Status:** Ready for implementation verification
