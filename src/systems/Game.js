import * as THREE from 'three';
import { Scene3D } from './Scene3D';
import { SwimmerController } from './SwimmerController';
import { BlockPuzzleSystem } from './BlockPuzzleSystem';
import { PhysicsWorld } from './PhysicsWorld';
import { AudioManager } from './AudioManager';
import { PostProcessing } from './PostProcessing';
import { LevelSystem } from './LevelSystem';
import { UpgradeSystem } from './UpgradeSystem';
export class Game {
    get isRunning() {
        return this._isRunning;
    }
    constructor(container) {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: container
        });
        Object.defineProperty(this, "renderer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "scene", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "scene3D", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "swimmerController", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "blockPuzzleSystem", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "physicsWorld", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "audioManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "postProcessing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "levelSystem", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "upgradeSystem", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_isRunning", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "animationId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "lastTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "animate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                if (!this._isRunning)
                    return;
                this.animationId = requestAnimationFrame(this.animate);
                const currentTime = performance.now();
                const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
                this.lastTime = currentTime;
                // Update physics
                this.physicsWorld.update(deltaTime);
                // Update systems
                this.swimmerController.update(deltaTime);
                this.blockPuzzleSystem.update(deltaTime);
                this.scene3D.update(deltaTime);
                this.audioManager.update(deltaTime);
                // Update post-processing
                if (this.postProcessing) {
                    const lightPos = this.scene3D.getLightPosition();
                    this.postProcessing.update(deltaTime, lightPos);
                }
                // Render with post-processing
                if (this.postProcessing) {
                    this.postProcessing.render();
                }
                else {
                    this.renderer.render(this.scene, this.camera);
                }
            }
        });
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        // Enable WebXR
        this.renderer.xr.enabled = true;
        container.appendChild(this.renderer.domElement);
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001122);
        this.scene.fog = new THREE.FogExp2(0x001122, 0.015);
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 0);
        // Initialize systems
        this.physicsWorld = new PhysicsWorld();
        this.audioManager = new AudioManager(this.camera);
        this.levelSystem = new LevelSystem();
        this.upgradeSystem = new UpgradeSystem();
        this.scene3D = new Scene3D(this.scene, this.physicsWorld);
        this.swimmerController = new SwimmerController(this.camera, this.physicsWorld);
        this.blockPuzzleSystem = new BlockPuzzleSystem(this.scene, this.physicsWorld);
        // Initialize post-processing (after renderer is ready)
        this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);
        // Connect systems
        this.blockPuzzleSystem.setLevelSystem(this.levelSystem);
        this.blockPuzzleSystem.setUpgradeSystem(this.upgradeSystem);
        // Setup resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }
    async init() {
        // Initialize scene
        await this.scene3D.init();
        // Initialize audio
        await this.audioManager.init();
        // Initialize block puzzle system
        await this.blockPuzzleSystem.init();
        // Connect audio manager to block puzzle system
        this.blockPuzzleSystem.setAudioManager(this.audioManager);
        console.log('Game systems initialized');
    }
    start() {
        if (this._isRunning)
            return;
        // Start level 1 if no level selected
        if (!this.levelSystem.getCurrentLevel()) {
            this.levelSystem.startLevel(1);
        }
        this._isRunning = true;
        this.lastTime = performance.now();
        this.audioManager.playAmbient();
        this.animate();
    }
    stop() {
        this._isRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.audioManager.stopAmbient();
    }
    get isRunning() {
        return this._isRunning;
    }
    async enableVR() {
        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }
        const session = await navigator.xr.requestSession('immersive-vr');
        this.renderer.xr.setSession(session);
        this.start();
    }
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.postProcessing) {
            this.postProcessing.setSize(window.innerWidth, window.innerHeight);
        }
    }
    getCamera() {
        return this.camera;
    }
    getScene() {
        return this.scene;
    }
    getLevelSystem() {
        return this.levelSystem;
    }
    getUpgradeSystem() {
        return this.upgradeSystem;
    }
}
