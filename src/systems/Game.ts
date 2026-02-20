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
        console.log('🎮 Game constructor started');
        console.log('📦 Container:', container);
        
        // Create renderer
        console.log('🎨 Creating WebGL renderer...');
        try {
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
            
            console.log('✅ Renderer created:', {
                width: window.innerWidth,
                height: window.innerHeight,
                canvas: this.renderer.domElement
            });
        } catch (error) {
            console.error('❌ Failed to create renderer:', error);
            throw error;
        }
        
        // Append renderer to container
        console.log('📺 Appending renderer to container...');
        try {
            container.appendChild(this.renderer.domElement);
            console.log('✅ Renderer appended. Canvas:', this.renderer.domElement);
            
            // Verify canvas is in DOM
            const canvas = container.querySelector('canvas');
            if (canvas) {
                console.log('✅ Canvas verified in DOM:', canvas.width, 'x', canvas.height);
            } else {
                console.error('❌ Canvas not found after append!');
                throw new Error('Canvas not found in DOM after append');
            }
        } catch (error) {
            console.error('❌ Failed to append renderer:', error);
            throw error;
        }
        
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
        // Position camera to see the block grid (blocks are centered around origin)
        // Camera will be controlled by SwimmerController, but set initial position
        this.camera.position.set(0, 8, 5);
        
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
        console.log('🎮 Game.init() started');
        try {
            // Initialize scene
            console.log('🌊 Initializing Scene3D...');
            await this.scene3D.init();
            console.log('✅ Scene3D initialized');
            
            // Initialize audio (with error handling)
            console.log('🔊 Initializing AudioManager...');
            try {
                await this.audioManager.init();
                console.log('✅ AudioManager initialized');
            } catch (error) {
                console.warn('⚠️ Audio initialization failed, continuing without audio:', error);
            }
            
            // Initialize block puzzle system
            console.log('🧩 Initializing BlockPuzzleSystem...');
            await this.blockPuzzleSystem.init();
            console.log('✅ BlockPuzzleSystem initialized');
            
            // Connect systems
            console.log('🔗 Connecting systems...');
            this.blockPuzzleSystem.setAudioManager(this.audioManager);
            this.blockPuzzleSystem.setLevelSystem(this.levelSystem);
            this.blockPuzzleSystem.setUpgradeSystem(this.upgradeSystem);
            console.log('✅ Systems connected');
            
            // Verify renderer is ready
            if (!this.renderer.domElement) {
                throw new Error('Renderer canvas element is missing!');
            }
            
            // Test render to verify WebGL context
            console.log('🎨 Testing WebGL render...');
            this.renderer.render(this.scene, this.camera);
            console.log('✅ WebGL render test successful');
            
            console.log('✅ Game systems initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize game systems:', error);
            console.error('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    
    start(): void {
        if (this._isRunning) {
            console.log('⚠️ Game already running');
            return;
        }
        
        console.log('▶️ Starting game...');
        
        // Start level 1 if no level selected
        const currentLevel = this.levelSystem.getCurrentLevel();
        if (!currentLevel) {
            console.log('📋 No level selected, starting level 1');
            this.levelSystem.startLevel(1);
        }
        
        // Ensure blocks are loaded for the current level
        const level = this.levelSystem.getCurrentLevel();
        if (level) {
            console.log(`🎯 Starting game with level ${level.id}: ${level.name}`);
        } else {
            console.warn('⚠️ No level selected, will create test blocks');
        }
        
        // ALWAYS reload blocks to ensure they're created and added to scene
        console.log('📦 Loading blocks for current level...');
        this.blockPuzzleSystem.loadLevelBlocks();
        const blockCount = (this.blockPuzzleSystem as any).blocks?.length || 0;
        console.log(`✅ Game.start() called. Blocks loaded: ${blockCount}`);
        
        // Verify all blocks are in scene
        const blocksInScene = this.scene.children.filter(child => 
            child instanceof THREE.Mesh && 
            (this.blockPuzzleSystem as any).blocks?.some((b: any) => b.mesh === child)
        ).length;
        console.log(`🔍 Blocks verified in scene: ${blocksInScene} / ${blockCount}`);
        
        // Force camera to look at origin (where blocks are)
        console.log('📷 Setting camera to look at origin (0, 0, 0)...');
        this.camera.lookAt(0, 0, 0);
        console.log(`📷 Camera position: (${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)})`);
        console.log(`📷 Camera rotation: (${this.camera.rotation.x.toFixed(2)}, ${this.camera.rotation.y.toFixed(2)}, ${this.camera.rotation.z.toFixed(2)})`);
        
        // Verify renderer is ready
        if (!this.renderer || !this.renderer.domElement) {
            console.error('❌ Renderer not ready!');
            return;
        }
        
        this._isRunning = true;
        this.lastTime = performance.now();
        
        // Start audio (after user gesture - game.start() is called on user action)
        try {
            this.audioManager.startAudio(); // This will resume context if needed
            this.audioManager.playAmbient();
        } catch (e) {
            console.warn('⚠️ Could not play ambient audio:', e);
        }
        
        // Start animation loop
        console.log('🎬 Starting animation loop...');
        this.animate();
        console.log('✅ Animation loop started');
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
        if (!this._isRunning) {
            return; // Don't log warnings - just stop
        }
        
        try {
            this.animationId = requestAnimationFrame(this.animate);
            
            const currentTime = performance.now();
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;
            
            // Update physics
            this.physicsWorld.update(deltaTime);
            
            // Update systems (with error handling)
            try {
                this.swimmerController.update(deltaTime);
            } catch (e) {
                // Only log once to avoid spam (3000+ errors)
                if (!(this as any)._swimmerErrorLogged) {
                    console.error('❌ SwimmerController update error:', e);
                    (this as any)._swimmerErrorLogged = true;
                }
                // Don't stop the game loop - continue rendering
            }
            
            try {
                this.blockPuzzleSystem.update(deltaTime);
            } catch (e) {
                console.error('BlockPuzzleSystem update error:', e);
            }
            
            try {
                this.scene3D.update(deltaTime);
            } catch (e) {
                console.error('Scene3D update error:', e);
            }
            
            try {
                this.audioManager.update(deltaTime);
            } catch (e) {
                // Audio errors are common, don't spam console
            }
            
            // Update post-processing
            if (this.postProcessing) {
                try {
                    const lightPos = this.scene3D.getLightPosition();
                    this.postProcessing.update(deltaTime, lightPos);
                } catch (e) {
                    console.error('PostProcessing update error:', e);
                }
            }
            
            // Render with post-processing
            try {
                if (this.postProcessing) {
                    this.postProcessing.render();
                } else {
                    this.renderer.render(this.scene, this.camera);
                }
            } catch (e) {
                console.error('Render error:', e);
                // Stop animation loop on render errors
                this.stop();
            }
        } catch (error) {
            console.error('Animation loop error:', error);
            // Stop the loop on critical errors
            this.stop();
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
