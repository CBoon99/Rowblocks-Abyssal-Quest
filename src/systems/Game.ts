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
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private scene3D: Scene3D;
    private swimmerController: SwimmerController;
    private blockPuzzleSystem: BlockPuzzleSystem;
    private physicsWorld: PhysicsWorld;
    private audioManager: AudioManager;
    private postProcessing: PostProcessing | null = null;
    private levelSystem: LevelSystem;
    private upgradeSystem: UpgradeSystem;
    private _isRunning: boolean = false;
    private animationId: number | null = null;
    private lastTime: number = 0;
    
    get isRunning(): boolean {
        return this._isRunning;
    }
    
    constructor(private container: HTMLElement) {
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
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
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
    
    async init(): Promise<void> {
        try {
            // Initialize scene
            await this.scene3D.init();
            
            // Initialize audio (with error handling)
            try {
                await this.audioManager.init();
            } catch (error) {
                console.warn('Audio initialization failed, continuing without audio:', error);
            }
            
            // Initialize block puzzle system
            await this.blockPuzzleSystem.init();
            
            // Connect systems
            this.blockPuzzleSystem.setAudioManager(this.audioManager);
            this.blockPuzzleSystem.setLevelSystem(this.levelSystem);
            this.blockPuzzleSystem.setUpgradeSystem(this.upgradeSystem);
            
            console.log('Game systems initialized');
        } catch (error) {
            console.error('Failed to initialize game systems:', error);
            throw error;
        }
    }
    
    start(): void {
        if (this._isRunning) return;
        
        // Start level 1 if no level selected
        if (!this.levelSystem.getCurrentLevel()) {
            this.levelSystem.startLevel(1);
        }
        
        this._isRunning = true;
        this.lastTime = performance.now();
        this.audioManager.playAmbient();
        this.animate();
    }
    
    stop(): void {
        this._isRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.audioManager.stopAmbient();
    }
    
    async enableVR(): Promise<void> {
        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }
        
        const session = await navigator.xr.requestSession('immersive-vr');
        this.renderer.xr.setSession(session);
        this.start();
    }
    
    private animate = (): void => {
        if (!this._isRunning) return;
        
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
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    };
    
    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.postProcessing) {
            this.postProcessing.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
    
    getScene(): THREE.Scene {
        return this.scene;
    }
    
    getLevelSystem(): LevelSystem {
        return this.levelSystem;
    }
    
    getUpgradeSystem(): UpgradeSystem {
        return this.upgradeSystem;
    }
    
    getBlockPuzzleSystem(): BlockPuzzleSystem {
        return this.blockPuzzleSystem;
    }
}
