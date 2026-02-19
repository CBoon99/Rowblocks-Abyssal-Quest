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
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.ctx);
        this.fishManager = new FishManager(this.ctx, this.canvas.width, this.canvas.height);
        this.missionManager = new MissionManager(this);
        
        this.engine.addEntity(this.player);
        this.engine.addEntity(this.fishManager);
        
        this.setupEventListeners();
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
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.player.useSonar();
                    break;
                case '1':
                    this.player.useSonar();
                    break;
                case '2':
                    this.player.useEcho();
                    break;
                case '3':
                    this.player.useNudge();
                    break;
                case '4':
                    this.player.useSpeedBurst();
                    break;
                case '5':
                    this.player.toggleBioluminescence();
                    break;
                case 'm':
                    this.uiManager.showMarinepedia();
                    break;
            }
        });
    }
    
    start() {
        this.isRunning = true;
        this.uiManager.hideStartScreen();
        this.soundManager.playAmbient();
        this.gameLoop(0);
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
            this.gameLoop(0);
        } else {
            this.uiManager.showPauseScreen();
        }
    }
    
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        const deltaTime = this.lastTime ? timestamp - this.lastTime : 16.67; // Default to ~60fps on first frame
        this.lastTime = timestamp;
        
        // Cap deltaTime to prevent large jumps
        const clampedDelta = Math.min(deltaTime, 100);
        
        // Update
        this.update(clampedDelta);
        
        // Render
        this.render();
        
        requestAnimationFrame((ts) => this.gameLoop(ts));
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
        // Clear canvas
        this.ctx.fillStyle = this.biomeManager.getCurrentBiome().color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw biome background
        this.biomeManager.render();
        
        // Draw mission objects
        this.missionManager.missionObjects.forEach(obj => {
            if (obj.render) {
                obj.render(this.ctx);
            }
        });
        
        // Draw entities
        this.engine.render();
        this.fishManager.render();
        
        // Draw player
        this.player.render(this.ctx);
        
        // Draw particles (on top of everything)
        this.particleSystem.render();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

