# 🚀 3D Version Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

This will start Vite dev server at `http://localhost:3000` and open `index-3d.html`

### 3. Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready to deploy to Netlify/Vercel.

## 🎮 How to Play

1. **Click "Dive In"** to start the game
2. **Click anywhere** to enable mouse look (pointer lock)
3. **WASD** to swim around
4. **Mouse** to look around
5. **Space/Shift** to swim up/down
6. **Click on blocks** to select a row/plane
7. **Arrow keys** to slide the selected row

## 🏗️ What's Implemented

✅ **Base 3D Scene**
- Ocean floor with procedural terrain
- Underwater lighting (hemisphere + directional)
- Volumetric fog
- Bioluminescent particles

✅ **First-Person Swimmer**
- WASD movement
- Mouse look (pointer lock)
- Vertical swimming (space/shift)
- Physics-based movement with water resistance
- Flashlight attached to camera

✅ **Block Puzzle System**
- 3D grid of blocks (5x3x5)
- Multiple block types (rock, coral, gem, dark, glow)
- Click to select row/plane
- Arrow keys to slide rows
- Physics-based block movement

✅ **Physics Integration**
- Cannon-es physics world
- Underwater physics (reduced gravity, buoyancy)
- Block collisions and movement

## 🎨 What's Next

### Phase 2: Visual Polish
- [ ] Caustic water shaders (light patterns on floor)
- [ ] God ray post-processing
- [ ] Enhanced particle effects
- [ ] Better block materials and textures

### Phase 3: Audio
- [ ] Spatial 3D audio (Howler.js)
- [ ] Ambient underwater sounds
- [ ] Block slide sound effects
- [ ] Win/lose music

### Phase 4: VR Support
- [ ] WebXR integration
- [ ] VR controller support
- [ ] VR-specific UI

### Phase 5: Game Content
- [ ] Level progression system
- [ ] Puzzle solutions and win conditions
- [ ] Story elements
- [ ] Collectibles and achievements

## 🐛 Troubleshooting

### Game doesn't load
- Check browser console for errors
- Ensure WebGL2 is supported
- Try a different browser (Chrome/Firefox recommended)

### Controls not working
- Click on the game canvas first to enable pointer lock
- Check that keyboard focus is on the page

### Performance issues
- Reduce particle count in `Scene3D.ts`
- Lower block count in `BlockPuzzleSystem.ts`
- Disable shadows if needed

## 📝 Development Notes

- The 3D version uses TypeScript for type safety
- Three.js handles all 3D rendering
- Cannon-es handles physics simulation
- Vite provides fast HMR during development

## 🎯 Next Cursor Prompts

Use these prompts with Cursor to continue development:

1. **"Add caustic water shader effects to the ocean floor"**
2. **"Implement god ray post-processing for sun rays"**
3. **"Create level system with JSON level data"**
4. **"Add spatial 3D audio with Howler.js"**
5. **"Enable WebXR VR mode with controller support"**
