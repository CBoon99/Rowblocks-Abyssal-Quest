import { GameEngine } from './engine/GameEngine.js';
import { Player } from './entities/Player.js';
import { FishManager } from './entities/FishManager.js';
import { BiomeManager } from './world/BiomeManager.js';
import { UIManager } from './ui/UIManager.js';
import { MissionManager } from './missions/MissionManager.js';
import { SoundManager } from './audio/SoundManager.js';
import { ParticleSystem } from './effects/ParticleSystem.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.engine = new GameEngine(this.canvas, this.ctx);
        this.player = null;
        this.fishManager = null;
        this.biomeManager = null;
        this.uiManager = null;
        this.missionManager = null;
        this.soundManager = new SoundManager();
        this.particleSystem = null;
        this.isRunning = false;
        this.lastTime = 0;
        
        this.setupCanvas();
        this.init();
    }
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            // Update biome manager canvas size
            if (this.biomeManager) {
                this.biomeManager.canvasWidth = this.canvas.width;
                this.biomeManager.canvasHeight = this.canvas.height;
            }
            // Update fish manager canvas size
            if (this.fishManager) {
                this.fishManager.canvasWidth = this.canvas.width;
                this.fishManager.canvasHeight = this.canvas.height;
            }
            // Update particle system canvas size
            if (this.particleSystem) {
                this.particleSystem.canvasWidth = this.canvas.width;
                this.particleSystem.canvasHeight = this.canvas.height;
            }
        };
        resize();
        window.addEventListener('resize', resize);
    }
    
    init() {
        this.uiManager = new UIManager(this);
        this.biomeManager = new BiomeManager(this.ctx, this.canvas.width, this.canvas.height);
        this.particleSystem = new ParticleSystem(this.ctx);
        
        // Initialize player at center of screen
        const playerX = this.canvas.width / 2;
        const playerY = this.canvas.height / 2;
        this.player = new Player(playerX, playerY, this.ctx);
        
        this.fishManager = new FishManager(this.ctx, this.canvas.width, this.canvas.height);
        this.missionManager = new MissionManager(this);
        
        this.engine.addEntity(this.player);
        this.engine.addEntity(this.fishManager);
        
        this.setupEventListeners();
        
        // Start continuous render loop (even when paused)
        this.renderLoop();
        
        // Start update loop immediately so player can move
        this.startUpdateLoop();
        
        // Debug: Log initialization
        console.log('Game initialized:', {
            canvas: { width: this.canvas.width, height: this.canvas.height },
            player: { x: this.player.x, y: this.player.y },
            fishCount: this.fishManager.fish.length
        });
    }
    
    renderLoop() {
        this.render();
        requestAnimationFrame(() => this.renderLoop());
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.start();
        });
        
        // Pause/Resume
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isRunning) {
                this.togglePause();
            }
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.stop();
        });
        
        // Marinepedia
        document.getElementById('marinepedia-btn').addEventListener('click', () => {
            this.uiManager.showMarinepedia();
        });
        
        document.getElementById('close-marinepedia').addEventListener('click', () => {
            this.uiManager.hideMarinepedia();
        });
        
        // Ability buttons
        document.getElementById('sonar-btn').addEventListener('click', () => {
            this.player.useSonar();
        });
        
        document.getElementById('echo-btn').addEventListener('click', () => {
            this.player.useEcho();
        });
        
        document.getElementById('nudge-btn').addEventListener('click', () => {
            this.player.useNudge();
        });
        
        document.getElementById('speed-btn').addEventListener('click', () => {
            this.player.useSpeedBurst();
        });
        
        document.getElementById('light-btn').addEventListener('click', () => {
            this.player.toggleBioluminescence();
        });
        
        // Keyboard shortcuts (work even before game starts)
        document.addEventListener('keydown', (e) => {
            // Abilities work anytime
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    if (this.player) this.player.useSonar();
                    break;
                case '1':
                    if (this.player) this.player.useSonar();
                    break;
                case '2':
                    if (this.player) this.player.useEcho();
                    break;
                case '3':
                    if (this.player) this.player.useNudge();
                    break;
                case '4':
                    if (this.player) this.player.useSpeedBurst();
                    break;
                case '5':
                    if (this.player) this.player.toggleBioluminescence();
                    break;
                case 'm':
                    if (this.uiManager) this.uiManager.showMarinepedia();
                    break;
            }
        });
    }
    
    start() {
        this.isRunning = true;
        this.uiManager.hideStartScreen();
        this.soundManager.playAmbient();
        // Reset lastTime when starting to prevent large deltaTime jump
        this.lastTime = performance.now();
    }
    
    // Start update loop immediately so player can move
    startUpdateLoop() {
        const updateLoop = (timestamp) => {
            const deltaTime = this.lastTime ? timestamp - this.lastTime : 16.67;
            this.lastTime = timestamp;
            const clampedDelta = Math.min(deltaTime, 100);
            
            // Always update (animations, movement, etc.) but missions only when running
            if (this.isRunning) {
                this.update(clampedDelta);
            } else {
                // Update everything except missions when paused/not started
                this.biomeManager.update(clampedDelta);
                this.engine.update(clampedDelta);
                this.fishManager.update(clampedDelta, this.player);
                this.particleSystem.update(clampedDelta);
                this.uiManager.update();
                // Skip missionManager.update() when not running
            }
            requestAnimationFrame(updateLoop);
        };
        this.lastTime = performance.now();
        requestAnimationFrame(updateLoop);
    }
    
    stop() {
        this.isRunning = false;
        this.uiManager.showStartScreen();
        this.soundManager.stopAmbient();
    }
    
    togglePause() {
        this.isRunning = !this.isRunning;
        if (this.isRunning) {
            this.uiManager.hidePauseScreen();
        } else {
            this.uiManager.showPauseScreen();
        }
    }
    
    update(deltaTime) {
        this.biomeManager.update(deltaTime);
        this.engine.update(deltaTime);
        this.fishManager.update(deltaTime, this.player);
        this.missionManager.update(deltaTime);
        this.particleSystem.update(deltaTime);
        this.uiManager.update();
    }
    
    render() {
        if (!this.ctx || !this.canvas) return;
        if (!this.biomeManager || !this.player || !this.fishManager) return;
        
        // Clear canvas with biome color
        const biomeColor = this.biomeManager.getCurrentBiome().color;
        this.ctx.fillStyle = biomeColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw biome background (gradient and particles)
        this.biomeManager.render();
        
        // Draw mission objects
        if (this.missionManager && this.missionManager.missionObjects) {
            this.missionManager.missionObjects.forEach(obj => {
                if (obj && obj.render) {
                    obj.render(this.ctx);
                }
            });
        }
        
        // Draw fish first (so they appear behind player)
        if (this.fishManager && this.fishManager.fish && this.fishManager.fish.length > 0) {
            this.fishManager.render();
        }
        
        // Draw player avatar (centered and visible)
        if (this.player && typeof this.player.render === 'function') {
            this.player.render(this.ctx);
        }
        
        // Draw other entities from engine (excluding player which we render separately)
        if (this.engine && this.engine.entities) {
            this.engine.entities.forEach(entity => {
                if (entity !== this.player && entity.render) {
                    entity.render(this.ctx);
                }
            });
        }
        
        // Draw particles (on top of everything)
        if (this.particleSystem) {
            this.particleSystem.render();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

