# Rowblocks: Abyssal Quest - 3D Immersive Version

## 🎮 Overview

This is the 3D transformation of Rowblocks: Abyssal Quest - an immersive first-person underwater block puzzle adventure built with Three.js, TypeScript, and modern web technologies.

## ✨ Features

- **3D Immersive World**: First-person underwater exploration with stunning visuals
- **Block Puzzle Mechanics**: Slide rows/planes of blocks in 3D space to solve puzzles
- **Physics-Based Movement**: Realistic swimming controls with physics simulation
- **Visual Effects**: Caustics, god rays, bioluminescent particles, volumetric fog
- **VR Support**: WebXR ready for VR headsets (Meta Quest, etc.)
- **Spatial Audio**: 3D positional sound for immersive experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Modern browser with WebGL2 support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Controls

- **WASD / Arrows** - Swim forward/back/strafe
- **Mouse** - Look around (click to enable pointer lock on desktop)
- **Space** - Swim up
- **Shift** - Swim down
- **E** - Observe nearby fish
- **F** - Clean trash / free ghost nets
- **Click** - Select block row/plane (puzzle mode)
- **Arrow Keys** - Slide selected row
- **1–5** - Tool buttons (Observe, Clean, Puzzle, Boost, Lantern)
- **ESC** - Pause
- **Touch (iPad)** - Virtual stick, drag-to-look, Observe/Clean buttons

## 🏗️ Project Structure

```
src/
├── main.ts                 # Entry point
├── systems/
│   ├── Game.ts            # Main game controller
│   ├── Scene3D.ts         # 3D scene setup (ocean floor, lighting, particles)
│   ├── SwimmerController.ts # Third-person Jasmine swimmer controls
│   ├── BlockPuzzleSystem.ts # Block grid and sliding mechanics
│   ├── PhysicsWorld.ts    # Cannon-es physics integration
│   └── AudioManager.ts    # Howler.js audio system
└── ui/
    ├── GameHUD.ts         # In-game HUD overlay
    ├── MainMenuUI.ts      # Main menu screen
    ├── MobileControls.ts # Touch / iPad controls
    └── MarinepediaUI.ts   # Fish collection encyclopedia
```

## 🎨 Technical Stack

- **Three.js** - 3D rendering engine
- **Cannon-es** - Physics simulation
- **Howler.js** - Spatial audio
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server

## 📝 Development Roadmap

- [x] Base 3D scene with ocean floor, caustics, and lighting
- [x] Third-person swimmer controller (Jasmine)
- [x] Block puzzle system with row sliding and honest win conditions
- [x] Physics integration
- [x] Level system and progression (30 levels, localStorage persistence)
- [x] UI polish and menus (main menu, HUD, Marinepedia)
- [x] Mobile touch controls (iPad stick + look + actions)
- [x] Visual effects (caustics, particles, fog)
- [ ] Audio system with real underwater soundscape
- [ ] VR/WebXR full game loop
- [ ] Performance optimization (iPad FPS verification)

## 🌊 Next Steps

1. Add caustic water shaders
2. Implement god ray post-processing
3. Create level progression system
4. Add more block types and puzzle mechanics
5. Implement VR mode fully
6. Add collectibles and story elements

## 📄 License

MIT License - Feel free to use and modify!
