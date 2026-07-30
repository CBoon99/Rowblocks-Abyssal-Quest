import * as THREE from 'three';
import { Scene3D } from './Scene3D';
import { SwimmerController } from './SwimmerController';
import { BlockPuzzleSystem } from './BlockPuzzleSystem';
import { PhysicsWorld } from './PhysicsWorld';
import { AudioManager } from './AudioManager';
import { PostProcessing } from './PostProcessing';
import { LevelSystem } from './LevelSystem';
import { UpgradeSystem } from './UpgradeSystem';
import { FishSystem } from './FishSystem';
import { BubblesSystem } from './BubblesSystem';
import { QuestSystem } from './QuestSystem';
import { ConservationWorld } from './ConservationWorld';
import { useGameStore } from '../stores/GameStore';
import { initQuality, type QualityConfig } from './QualitySettings';
import { DiveBudget } from './DiveBudget';
import { RangerAlertSystem } from './RangerAlertSystem';
import { getBuddySession, type BuddyPose } from './BuddySession';
import { AssetLibrary } from './AssetLibrary';
import { getReefHealthSystem } from './ReefHealthSystem';
import {
    animateJasmine,
    buildJasmineDiver,
    type JasmineBuild,
} from './JasmineCharacter';
import { getFirstDiveDirector } from './FirstDiveDirector';

// Expose store for LevelSystem win awards and other systems that read window.useGameStore
(window as any).useGameStore = useGameStore;

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
    private fishSystem: FishSystem;
    private bubblesSystem: BubblesSystem;
    private questSystem: QuestSystem;
    private conservationWorld: ConservationWorld | null = null;
    private qualityConfig: QualityConfig;
    private diveBudget = new DiveBudget();
    private rangerAlerts = new RangerAlertSystem();
    private remoteBuddy: THREE.Group | null = null;
    private remoteBuddyBuild: JasmineBuild | null = null;
    private remoteBuddyAnimT = 0;
    private currentForce: THREE.Vector3 = new THREE.Vector3();
    private currentTimer: number = 0;
    private _isRunning: boolean = false;
    private animationId: number | null = null;
    private lastTime: number = 0;
    /** Track which level id already received extra-move bonus this session */
    private lastExtraMovesLevelId: number | null = null;
    private surfaceY = 14.5;
    
    get isRunning(): boolean {
        return this._isRunning;
    }
    
    constructor(private container: HTMLElement) {
        console.log('🎮 Game constructor started');
        console.log('📦 Container:', container);

        // Quality tier first so all systems can read window.qualityConfig
        this.qualityConfig = initQuality();
        (window as any).qualityConfig = this.qualityConfig;
        console.log(
            `🎛️ Quality tier: ${this.qualityConfig.tier} (DPR max ${this.qualityConfig.pixelRatioMax}, fish ${this.qualityConfig.fishCount})`
        );

        // Ensure store is on window early (LevelSystem awards, Swimmer helmet/net)
        (window as any).useGameStore = useGameStore;
        
        // Create renderer
        console.log('🎨 Creating WebGL renderer...');
        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: this.qualityConfig.antialias,
                alpha: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(
                Math.min(window.devicePixelRatio, this.qualityConfig.pixelRatioMax)
            );
            this.renderer.shadowMap.enabled = this.qualityConfig.shadows;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;
            
            // Enable WebXR
            this.renderer.xr.enabled = true;
            
            console.log('✅ Renderer created:', {
                width: window.innerWidth,
                height: window.innerHeight,
                canvas: this.renderer.domElement,
                pixelRatio: this.renderer.getPixelRatio(),
                antialias: this.qualityConfig.antialias,
                shadows: this.qualityConfig.shadows
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
        // Depth-based fog will be updated dynamically based on camera depth
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
        this.swimmerController = new SwimmerController(
            this.camera,
            this.physicsWorld,
            this.scene
        );
        this.blockPuzzleSystem = new BlockPuzzleSystem(this.scene, this.physicsWorld);
        this.fishSystem = new FishSystem(this.scene, this.physicsWorld);
        this.bubblesSystem = new BubblesSystem(this.scene);
        this.questSystem = new QuestSystem();
        // Dive Budget + Ranger Alerts hooks
        this.diveBudget.onWarn = (msg) => {
            (window as any).gameHUD?.showObjectiveBanner?.(msg, 4000);
            (window as any).DiscoveryToast?.show?.(msg, {
                icon: '💨',
                subtitle: 'Surface for a full air refill',
                durationMs: 3500,
            });
        };
        this.diveBudget.onAssist = () => {
            (window as any).DiscoveryToast?.show?.('Easy does it — floating up for air', {
                icon: '🫧',
                subtitle: 'Rangers always surface safely',
                durationMs: 3000,
            });
        };
        this.diveBudget.onRefill = () => {
            (window as any).DiscoveryToast?.show?.('Air refilled!', {
                icon: '✅',
                subtitle: 'Ready for another dive',
                durationMs: 2200,
            });
        };
        this.rangerAlerts.onAlertStart = (a) => {
            (window as any).gameHUD?.showRangerAlert?.(a);
            (window as any).DiscoveryToast?.show?.(a.title, {
                icon: '🚨',
                subtitle: a.body,
                durationMs: 4500,
            });
            getBuddySession().sendAlert(a.title, a.body);
        };
        this.rangerAlerts.onAlertComplete = (a) => {
            useGameStore.getState().addConservationPoints?.(15, 'ranger_alert');
            (window as any).DiscoveryToast?.show?.('Alert complete — great teamwork!', {
                icon: '⭐',
                subtitle: a.title,
                durationMs: 3500,
            });
            (window as any).gameHUD?.hideRangerAlert?.();
        };
        this.rangerAlerts.onAlertExpire = () => {
            (window as any).gameHUD?.hideRangerAlert?.();
            (window as any).DiscoveryToast?.show?.('Alert faded — try the next one later', {
                icon: '🌊',
                durationMs: 2500,
            });
        };

        // Buddy remote avatar
        const buddy = getBuddySession();
        buddy.onRemotePose = (pose) => this.applyRemoteBuddyPose(pose);
        buddy.onRemoteAction = (action) => {
            if (action === 'boost') this.diveBudget.shareBoost(0.3);
            if (action === 'clean' || action === 'net') {
                this.rangerAlerts.report(action === 'net' ? 'net_free' : 'litter');
            }
            if (action === 'collect') this.rangerAlerts.report('observe');
        };

        // Soft-wire conservation props (litter + ghost nets) for Education/CP
        try {
            this.conservationWorld = new ConservationWorld(this.scene, this.physicsWorld);
        } catch (e) {
            console.warn('⚠️ ConservationWorld create failed:', e);
            this.conservationWorld = null;
        }
        
        // Initialize post-processing (after renderer is ready)
        this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);
        if (typeof (this.postProcessing as any).applyQuality === 'function') {
            this.postProcessing.applyQuality(this.qualityConfig);
        }
        
        // Connect systems
        this.blockPuzzleSystem.setLevelSystem(this.levelSystem);
        this.blockPuzzleSystem.setUpgradeSystem(this.upgradeSystem);
        
        // Setup resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }

    getQualityConfig(): QualityConfig {
        return this.qualityConfig;
    }

    getSwimmerController(): SwimmerController {
        return this.swimmerController;
    }
    
    async init(): Promise<void> {
        console.log('🎮 Game.init() started');
        try {
            // Art pack first (PBR sand, hero fish GLB)
            console.log('🎨 Loading art assets (CC0 packs)…');
            await AssetLibrary.get().loadAll();
            console.log('✅ Art assets ready');

            // Initialize scene
            console.log('🌊 Initializing Scene3D...');
            await this.scene3D.init();
            console.log('✅ Scene3D initialized');
            
            // Initialize audio — soft-fail only; never block boot
            console.log('🔊 Initializing AudioManager...');
            try {
                await this.audioManager.init();
                console.log('✅ AudioManager initialized');
            } catch (error) {
                console.warn('⚠️ Audio initialization failed, continuing without audio:', error);
            }
            
            // Initialize fish system
            console.log('🐟 Initializing FishSystem...');
            try {
                await this.fishSystem.init();
                console.log('✅ FishSystem initialized');
            } catch (error) {
                console.warn('⚠️ FishSystem initialization failed:', error);
            }

            // Initialize conservation world (litter + ghost nets)
            console.log('♻️ Initializing ConservationWorld...');
            try {
                if (this.conservationWorld) {
                    await this.conservationWorld.init();
                    // Bubble SFX + store CP (ConservationSystem can mirror via serialize later)
                    this.conservationWorld.onCollect = (event) => {
                        try {
                            this.bubblesSystem?.emitBubbles?.(event.position, 3);
                        } catch {
                            /* optional particles */
                        }
                        try {
                            this.audioManager?.playSound?.('clean');
                        } catch {
                            /* soft */
                        }
                        try {
                            const count = event.ids?.length ?? 1;
                            for (let i = 0; i < count; i++) {
                                useGameStore.getState().recordCleanup?.(5);
                                this.rangerAlerts.report('litter');
                            }
                            getBuddySession().sendAction('clean');
                            const pos = this.camera.position;
                            getReefHealthSystem().reportCare(pos.x, pos.z, 'litter');
                        } catch {
                            /* store optional until hydrate */
                        }
                        console.log(
                            `🗑️ Litter collected: ${event.ids.length} (remaining ${this.conservationWorld?.getLitterRemaining?.() ?? '?'})`
                        );
                    };
                    this.conservationWorld.onFree = (event) => {
                        try {
                            this.bubblesSystem?.emitBubbles?.(event.position, 4);
                        } catch {
                            /* optional particles */
                        }
                        try {
                            this.audioManager?.playSound?.('net');
                        } catch {
                            /* soft */
                        }
                        try {
                            useGameStore.getState().recordRescue?.(10);
                            this.rangerAlerts.report('net_free');
                            getBuddySession().sendAction('net');
                            const pos = this.camera.position;
                            getReefHealthSystem().reportCare(pos.x, pos.z, 'net');
                        } catch {
                            /* store optional until hydrate */
                        }
                        console.log(
                            `🕸️ Ghost net freed: ${event.id} (remaining ${this.conservationWorld?.getNetsRemaining?.() ?? '?'})`
                        );
                    };
                    console.log('✅ ConservationWorld initialized');
                }
            } catch (error) {
                console.warn('⚠️ ConservationWorld initialization failed:', error);
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
        this.diveBudget.reset();
        this.rangerAlerts.clear();
        // Profile may have been selected after Game construct — refresh Jasmine nameplate
        this.swimmerController.refreshDiverIdentity?.();
        // First 30s calm director (look bias toward turtle / soft HUD)
        getFirstDiveDirector().reset();
        
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

        // Apply upgrade effects (extra moves, etc.) if LevelSystem exposes an API
        this.applyUpgradeEffectsToLevel();
        
        // ALWAYS reload blocks — hidden until Puzzle tool (memory stage)
        console.log('📦 Loading blocks for current level...');
        this.blockPuzzleSystem.loadLevelBlocks();
        this.blockPuzzleSystem.setBlocksVisible?.(false);
        const blockCount = (this.blockPuzzleSystem as any).blocks?.length || 0;
        console.log(`✅ Game.start() blocks=${blockCount} (hidden until Puzzle)`);
        // Do NOT force lookAt origin — third-person Jasmine owns the camera
        
        // Verify renderer is ready
        if (!this.renderer || !this.renderer.domElement) {
            console.error('❌ Renderer not ready!');
            return;
        }
        
        this._isRunning = true;
        this.lastTime = performance.now();
        
        // Start audio (soft-fail only — after user gesture)
        try {
            this.audioManager.startAudio();
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
                this.scene3D.update(deltaTime, this.camera.position);
            } catch (e) {
                console.error('Scene3D update error:', e);
            }
            
            // Update currents (random forces, stronger deeper)
            this.updateCurrents(deltaTime);
            
            // Update fish system — Respect mood + boids (Jasmine body position)
            try {
                const gentleness = this.swimmerController.getGentleness?.() ?? 0.7;
                const jasminePos = this.swimmerController.getPosition();
                this.fishSystem.update(
                    deltaTime,
                    jasminePos,
                    this.currentForce,
                    gentleness
                );
                this.processWildlifeEvents();
                (window as any).gameHUD?.updateGentleness?.(gentleness);
                getFirstDiveDirector().update(deltaTime, this.swimmerController, () =>
                    this.swimmerController.getPosition()
                );
            } catch (e) {
                console.warn('⚠️ FishSystem update error:', e);
            }
            
            // Update bubbles system
            try {
                this.bubblesSystem.update(
                    deltaTime,
                    this.swimmerController.getPosition()
                );
            } catch (e) {
                console.warn('⚠️ BubblesSystem update error:', e);
            }

            // Update conservation props (litter bob, net dissolve, freed fish)
            try {
                this.conservationWorld?.update?.(deltaTime);
            } catch (e) {
                console.warn('⚠️ ConservationWorld update error:', e);
            }

            // Dive Budget + Ranger Alerts + Buddy poses
            try {
                this.updateDiveAndAlerts(deltaTime);
            } catch (e) {
                console.warn('Dive/Alert update soft-fail', e);
            }
            
            // Apply current forces to blocks and swimmer
            this.applyCurrentForces(deltaTime);
            
            // Update depth-based fog (density increases with depth)
            this.updateDepthFog();
            
            // Update depth quest
            this.updateDepthQuest();
            
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

    getAudioManager(): AudioManager {
        return this.audioManager;
    }
    
    getBlockPuzzleSystem(): BlockPuzzleSystem {
        return this.blockPuzzleSystem;
    }
    
    getFishSystem(): FishSystem {
        return this.fishSystem;
    }
    
    /**
     * Update fog density based on camera depth (deeper = denser fog)
     */
    private updateDepthFog(): void {
        // Scene3D owns fog with reef/open-ocean blend when update(dt, camera) runs.
        // Light fallback only if Scene3D fog update unavailable.
        if (
            this.scene.fog instanceof THREE.FogExp2 &&
            !(this.scene3D as any)?.oceanEnv
        ) {
            const depth = Math.max(0, -this.camera.position.y);
            this.scene.fog.density = 0.012 + depth * 0.0003;
        }
    }
    
    /**
     * Get current depth in meters (negative Y = deeper)
     */
    getCurrentDepth(): number {
        // Depth below surface plane (~15) — use Jasmine body, not chase camera
        const y = this.swimmerController.getPosition().y;
        return Math.max(0, this.surfaceY - y);
    }

    getDiveBudget(): DiveBudget {
        return this.diveBudget;
    }

    getRangerAlerts(): RangerAlertSystem {
        return this.rangerAlerts;
    }

    private lastSharkToast = 0;
    private lastStingToast = 0;

    private processWildlifeEvents(): void {
        const events = this.fishSystem.drainEvents?.() || [];
        const now = performance.now();
        for (const ev of events) {
            if (ev.type === 'shark_respect') {
                this.swimmerController.applySoftPush?.(ev.dir, ev.strength);
                if (now - this.lastSharkToast > 7000) {
                    this.lastSharkToast = now;
                    (window as any).DiscoveryToast?.show?.(ev.line || 'Too close. Back up.', {
                        icon: '🦈',
                        subtitle: 'She’s confident — not angry. Give space.',
                        durationMs: 3400,
                    });
                }
            } else if (ev.type === 'jelly_tingle' || (ev as any).type === 'jelly_sting') {
                const amount = (ev as any).amount ?? 0.04;
                this.diveBudget.applySting?.(amount);
                if (now - this.lastStingToast > 2800) {
                    this.lastStingToast = now;
                    (window as any).DiscoveryToast?.show?.('Soft tingle — tentacles', {
                        icon: '🎐',
                        subtitle: 'They don’t attack. They simply exist. Swim around.',
                        durationMs: 3000,
                    });
                }
                try {
                    this.bubblesSystem?.emitBubbles?.(this.camera.position.clone(), 8);
                } catch {
                    /* optional */
                }
            } else if (ev.type === 'comic_boop') {
                (window as any).DiscoveryToast?.show?.('Boop!', {
                    icon: '🐠',
                    subtitle: 'A friend said hello — that’s trust.',
                    durationMs: 2000,
                });
            } else if (ev.type === 'ink_puff') {
                (window as any).DiscoveryToast?.show?.('Ink cloud!', {
                    icon: '🐙',
                    subtitle: 'Startled — not mean. Give it a moment.',
                    durationMs: 2600,
                });
                try {
                    this.bubblesSystem?.emitBubbles?.(
                        new THREE.Vector3(ev.x, ev.y, ev.z),
                        16
                    );
                } catch {
                    /* optional */
                }
            } else if (ev.type === 'thrash_local') {
                // Throttled reef stress — not every frame
                if (now - (this as any)._lastThrashFx > 800) {
                    (this as any)._lastThrashFx = now;
                    getReefHealthSystem().reportThrash(ev.x, ev.z);
                    this.diveBudget.applyThrashDrain?.(0.05, 0.4);
                }
            } else if (ev.type === 'trust_toast') {
                (window as any).DiscoveryToast?.show?.(ev.line, {
                    icon: ev.icon || '💙',
                    durationMs: 2800,
                });
            } else if (ev.type === 'remembers_you') {
                (window as any).DiscoveryToast?.show?.(ev.line, {
                    icon: ev.icon === 'manta' ? '🐋' : ev.icon || '💙',
                    subtitle: 'Dive memory — she never forgot.',
                    durationMs: 4200,
                });
            } else if (ev.type === 'reef_gathers') {
                // Emotional high point — no XP explosion, no chest
                (window as any).DiscoveryToast?.show?.('The reef accepts you', {
                    icon: '🌊',
                    subtitle: `${ev.reefName} — they all came.`,
                    durationMs: 7000,
                });
                this.showReefGathers(ev.reefName);
            } else if (ev.type === 'memory_moment') {
                // Sparse lines — optional pitch nudge for manta "look up"
                const soft =
                    ev.id === 'manta_sky' ||
                    ev.id === 'turtle_circle' ||
                    ev.id === 'turtle_come';
                (window as any).DiscoveryToast?.show?.(ev.line, {
                    icon: '·',
                    subtitle: '',
                    durationMs: soft ? 4200 : 2800,
                });
                if (
                    ev.id === 'turtle_come' ||
                    ev.id === 'turtle_circle' ||
                    ev.id === 'turtle_notice'
                ) {
                    try {
                        getFirstDiveDirector().notifyTurtleMoment();
                    } catch {
                        /* soft */
                    }
                }
                if (ev.id === 'manta_sky') {
                    // Gentle camera tip upward so kids look up
                    try {
                        const sc = this.swimmerController as any;
                        if (sc?.pitchObject) {
                            const p = sc.pitchObject.rotation.x;
                            sc.pitchObject.rotation.x = Math.min(0.45, p + 0.28);
                        }
                    } catch {
                        /* soft */
                    }
                }
            } else if (ev.type === 'birthday_pearl') {
                (window as any).DiscoveryToast?.show?.(ev.message, {
                    icon: '✨',
                    subtitle: 'An old turtle remembered you…',
                    durationMs: 8000,
                });
                // Proper birthday card
                this.showBirthdayPearl(ev.message);
                useGameStore.getState().addConservationPoints?.(50, 'birthday_pearl');
            }
        }
    }

    /** Soft silent moment — whole reef swims around Jasmine */
    private showReefGathers(reefName: string): void {
        if (document.getElementById('reef-gathers')) return;
        const el = document.createElement('div');
        el.id = 'reef-gathers';
        el.className = 'reef-gathers';
        el.innerHTML = `
          <div class="reef-gathers-card">
            <div class="rg-soft">🐟 🐢 🐋 🐠</div>
            <h2>The reef accepts you</h2>
            <p>${reefName.replace(/</g, '')}</p>
            <p class="rg-whisper">No chest. No XP. Just belonging.</p>
          </div>
        `;
        document.body.appendChild(el);
        setTimeout(() => el.classList.add('visible'), 40);
        setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 800);
        }, 6500);
    }

    private showBirthdayPearl(message: string): void {
        if (document.getElementById('birthday-pearl')) return;
        const el = document.createElement('div');
        el.id = 'birthday-pearl';
        el.className = 'birthday-pearl';
        el.innerHTML = `
          <div class="birthday-pearl-card">
            <div class="bp-glow" aria-hidden="true">
              <span class="bp-orb"></span>
            </div>
            <div class="bp-tag">SECRET PEARL</div>
            <h2>${message.replace(/</g, '')}</h2>
            <p>An elder turtle trusted you. No map pin. No quest. Just belonging.</p>
            <p class="bp-whisper">Happy Birthday, Guardian of the Reef.</p>
            <button type="button" id="bp-close">Keep diving</button>
          </div>
        `;
        document.body.appendChild(el);
        el.querySelector('#bp-close')?.addEventListener('click', () => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 400);
        });
        setTimeout(() => el.classList.add('visible'), 50);
        // Soft bubble burst celebration
        try {
            const pos = this.swimmerController?.getPosition?.() ?? this.camera.position;
            this.bubblesSystem?.emitBubbles?.(pos.clone(), 28);
        } catch {
            /* soft */
        }
    }

    private updateDiveAndAlerts(dt: number): void {
        const depth = this.getCurrentDepth();
        const bodyPos = this.swimmerController.getPosition();
        const isSurfaced = bodyPos.y >= this.surfaceY - 1.2;
        const buddy = getBuddySession();
        let buddyNear = false;
        if (buddy.remote) {
            const dx = buddy.remote.x - bodyPos.x;
            const dy = buddy.remote.y - bodyPos.y;
            const dz = buddy.remote.z - bodyPos.z;
            buddyNear = Math.hypot(dx, dy, dz) < 8;
        }

        const assist = this.diveBudget.update(dt, depth, isSurfaced, buddyNear);
        if (assist) {
            // Soft float up — never drowning (must reach surfaceY so air refills)
            try {
                const body = (this.swimmerController as any).physicsBody;
                if (body?.position) {
                    body.position.y = Math.min(
                        this.surfaceY - 0.35,
                        body.position.y + dt * 4.2
                    );
                    if (body.velocity) body.velocity.y = Math.max(body.velocity.y, 2.5);
                }
            } catch {
                /* soft */
            }
        }

        const st = this.diveBudget.getState(depth, isSurfaced);
        (window as any).gameHUD?.updateDiveBudget?.(st);

        this.rangerAlerts.update(dt, bodyPos.x, bodyPos.z);
        const alert = this.rangerAlerts.getActive();
        if (alert) (window as any).gameHUD?.updateRangerAlert?.(alert);

        // Broadcast pose to buddy (body + look; mesh face is lookYaw+π)
        if (buddy.isActive()) {
            const pos = this.swimmerController.getPosition();
            const sc = this.swimmerController as any;
            buddy.sendPose({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                yaw: sc.getLookYaw?.() ?? 0,
                pitch: sc.getLookPitch?.() ?? 0,
                air: this.diveBudget.getAir(),
            });
        }
    }

    private ensureRemoteBuddy(): THREE.Group {
        if (this.remoteBuddy) return this.remoteBuddy;
        this.remoteBuddyBuild = buildJasmineDiver({
            suitId: 'buddy',
            displayName: 'Buddy Ranger',
            showName: false,
        });
        this.remoteBuddy = this.remoteBuddyBuild.group;
        this.remoteBuddy.name = 'RemoteBuddy';
        this.scene.add(this.remoteBuddy);
        return this.remoteBuddy;
    }

    private applyRemoteBuddyPose(pose: BuddyPose): void {
        const g = this.ensureRemoteBuddy();
        g.visible = true;
        g.position.set(pose.x, pose.y, pose.z);
        g.rotation.order = 'YXZ';
        // Same +π as local Jasmine — mesh faces +Z, look forward is −Z
        g.rotation.y = pose.yaw + Math.PI;
        g.rotation.x = -pose.pitch * 0.35;
        if (this.remoteBuddyBuild) {
            this.remoteBuddyAnimT += 0.016;
            animateJasmine(this.remoteBuddyBuild, this.remoteBuddyAnimT, 0.6, 0.7);
        }
    }
    
    /**
     * Update ocean currents (random forces, stronger at depth)
     */
    private updateCurrents(deltaTime: number): void {
        this.currentTimer += deltaTime;
        
        // Change current direction every 3-5 seconds
        if (this.currentTimer > 3 + Math.random() * 2) {
            const depth = this.getCurrentDepth();
            const strength = 0.1 + (depth / 100) * 0.2; // Stronger deeper
            
            // Random direction
            this.currentForce.set(
                (Math.random() - 0.5) * strength,
                (Math.random() - 0.5) * strength * 0.3, // Less vertical
                (Math.random() - 0.5) * strength
            );
            
            this.currentTimer = 0;
            console.log(`🌊 Current force applied: strength=${strength.toFixed(2)}, depth=${depth.toFixed(1)}m`);
        }
    }
    
    /**
     * Apply current forces to physics bodies (blocks, swimmer)
     */
    private applyCurrentForces(deltaTime: number): void {
        const world = this.physicsWorld.getWorld();
        
        // Apply to all bodies (blocks, swimmer)
        world.bodies.forEach((body) => {
            if (body.mass > 0) { // Only dynamic bodies
                const force = this.currentForce.clone();
                force.multiplyScalar(body.mass * 0.5); // Scale by mass
                body.applyForce(force as any);
            }
        });
    }
    
    /**
     * Apply owned upgrade effects to the current level when possible.
     * Uses LevelSystem addMoves/setBonusMoves if present; otherwise soft skip.
     */
    private applyUpgradeEffectsToLevel(): void {
        try {
            const mods = this.upgradeSystem.getGameplayModifiers();
            const level = this.levelSystem.getCurrentLevel();
            if (!level || mods.extraMoves <= 0) return;

            // Avoid double-applying bonus for the same level session
            if (this.lastExtraMovesLevelId === level.id) return;

            const ls = this.levelSystem as any;
            if (typeof ls.addMoves === 'function') {
                ls.addMoves(mods.extraMoves);
                this.lastExtraMovesLevelId = level.id;
                console.log(`➕ Extra moves applied via addMoves: +${mods.extraMoves}`);
            } else if (typeof ls.setBonusMoves === 'function') {
                ls.setBonusMoves(mods.extraMoves);
                this.lastExtraMovesLevelId = level.id;
                console.log(`➕ Extra moves applied via setBonusMoves: +${mods.extraMoves}`);
            } else {
                // No LevelSystem API — skip without breaking (Agent A may add later)
                console.log(
                    `ℹ️ extra_moves owned (+${mods.extraMoves}) but LevelSystem has no addMoves/setBonusMoves API — skipped`
                );
            }
        } catch (e) {
            console.warn('applyUpgradeEffectsToLevel soft-fail:', e);
        }
    }

    /**
     * Call after external levelSystem.startLevel(...) so upgrade bonuses re-apply.
     */
    onLevelStarted(): void {
        this.lastExtraMovesLevelId = null;
        this.applyUpgradeEffectsToLevel();
    }

    /**
     * Collect fish along camera look direction (E key).
     * Range = store.netRange + upgrade netRangeBonus.
     * Fires education discovery toasts + conservation CP on new species.
     */
    collectFish(): boolean {
        const store = useGameStore.getState();
        const mods = this.upgradeSystem.getGameplayModifiers();
        const netRange = (store.netRange ?? 5) + (mods.netRangeBonus ?? 0);

        // Ray from camera center using actual look direction
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const fish = this.fishSystem.raycastForFish(raycaster, netRange);
        if (fish) {
            const depth = Math.max(0, -this.camera.position.y);
            const speciesId = (fish as any).speciesId || fish.type;

            // Education: resolve species card + toast before mutating store
            let discovery: {
                isNew: boolean;
                toastText: string;
                card: { name: string; emoji: string; funFact: string } | null;
            } | null = null;
            try {
                // Dynamic import path avoided — use singleton getters if present
                const eduMod = (window as any).educationSystem;
                if (eduMod && typeof eduMod.discoverSpecies === 'function') {
                    discovery = eduMod.discoverSpecies(speciesId, depth);
                }
            } catch (e) {
                console.warn('Education discover soft-fail:', e);
            }

            const displayName =
                discovery?.card?.name ||
                fish.type.charAt(0).toUpperCase() + fish.type.slice(1);
            const funFact = discovery?.card?.funFact || '';

            const isNewType = store.addFish({
                type: speciesId,
                name: displayName,
                depth: depth,
                timestamp: Date.now(),
                description:
                    funFact ||
                    `A ${displayName} observed at ${depth.toFixed(0)}m depth.`,
            }) as unknown as boolean;

            // Observe quality from Trust + gentleness (kids understand "you scared it")
            const gentleness = this.swimmerController.getGentleness?.() ?? 0.7;
            const moodInfo = this.fishSystem.getNearestFishMood?.(this.camera.position, 8);
            const mood = moodInfo?.mood ?? 'calm';
            const trait = moodInfo?.trait ?? '';
            let observeTier: 'scared' | 'quick' | 'calm' | 'trusting' = 'quick';
            let cpBonus = 2;
            if (mood === 'scared' || gentleness < 0.35) {
                observeTier = 'scared';
                cpBonus = 1;
            } else if (
                gentleness > 0.78 &&
                (mood === 'trusting' || mood === 'curious' || (moodInfo?.trust ?? 0) > 0.7)
            ) {
                observeTier = 'trusting';
                cpBonus = 7;
            } else if (gentleness > 0.55) {
                observeTier = 'calm';
                cpBonus = 4;
            }

            // Build dive memory on this individual
            if (moodInfo?.fish && observeTier !== 'scared') {
                const q =
                    observeTier === 'trusting' ? 1 : observeTier === 'calm' ? 0.6 : 0.3;
                this.fishSystem.recordGentleObserve?.(moodInfo.fish, q);
            }

            // Explicit discover + CP for new species
            if (isNewType !== false) {
                const wasNew = store.discoverSpeciesId?.(speciesId);
                if (wasNew) {
                    store.addConservationPoints?.(8 + cpBonus, `discover:${speciesId}`);
                } else {
                    store.addConservationPoints?.(cpBonus, `observe_${observeTier}`);
                }
            }

            if (observeTier === 'trusting' || observeTier === 'calm') {
                getReefHealthSystem().reportCare(
                    this.camera.position.x,
                    this.camera.position.z,
                    'observe_calm'
                );
            }

            const tierLabel =
                observeTier === 'trusting'
                    ? trait
                        ? `${trait} — and they trust you`
                        : 'They trust you'
                    : observeTier === 'calm'
                      ? 'Quiet study'
                      : observeTier === 'scared'
                        ? 'You scared it — sit still…'
                        : 'Quick look';

            // Toast (DiscoveryToast if wired on window)
            try {
                const Toast = (window as any).DiscoveryToast;
                if (Toast && typeof Toast.show === 'function') {
                    if (discovery?.isNew || isNewType) {
                        Toast.show(discovery?.toastText || `New discovery: ${displayName}!`, {
                            icon: discovery?.card?.emoji || '✦',
                            subtitle: `${tierLabel} · ${
                                funFact
                                    ? funFact.slice(0, 90) + (funFact.length > 90 ? '…' : '')
                                    : 'Marinepedia updated'
                            }`,
                            durationMs: 4200,
                        });
                        try {
                            (window as any).gameHUD?.showDiscoveryCard?.(
                                displayName,
                                'Added to Marinepedia!'
                            );
                        } catch {
                            /* soft */
                        }
                    } else {
                        Toast.show(tierLabel, {
                            icon: observeTier === 'trusting' ? '♥' : '·',
                            subtitle: `${displayName}${
                                trait ? ` · ${trait}` : ''
                            }${funFact ? ' — ' + funFact.slice(0, 70) : ''}`,
                            durationMs: 3000,
                        });
                    }
                }
            } catch (e) {
                /* toast optional */
            }

            // Update quests (Observe language — legacy catch_* aliases still accepted)
            if (this.questSystem) {
                this.questSystem.updateQuestProgress('observe_fish', 1);
                if (fish.type === 'clownfish' || speciesId === 'clownfish') {
                    this.questSystem.updateQuestProgress('observe_clownfish', 1);
                } else if (fish.type === 'angelfish' || speciesId === 'angelfish') {
                    this.questSystem.updateQuestProgress('observe_angelfish', 1);
                }
            }

            // Soft observe chime
            try {
                this.audioManager.playSound('collect');
            } catch (e) {
                console.warn('Could not play observe sound:', e);
            }

            this.fishSystem.removeFish(fish);
            this.rangerAlerts.report('observe');
            getBuddySession().sendAction('collect');

            // Bubbles celebration
            try {
                this.bubblesSystem?.emitBubbles?.(this.camera.position.clone(), 12);
            } catch {
                /* optional */
            }

            console.log(
                `Observed: ${speciesId}! ${this.fishSystem.getFishes().length} remaining`
            );
            return true;
        }

        return false;
    }

    /**
     * Update quest progress for depth
     */
    updateDepthQuest(): void {
        if (!this.questSystem) return;
        const depth = this.getCurrentDepth();
        this.questSystem.updateQuestProgress('depth', depth);
    }

    getQuestSystem(): QuestSystem {
        return this.questSystem;
    }

    getBubblesSystem(): BubblesSystem {
        return this.bubblesSystem;
    }

    getConservationWorld(): ConservationWorld | null {
        return this.conservationWorld;
    }

    /**
     * Interact key (F): try collect nearby litter + free nearest ghost net.
     * Fish collect stays on E (collectFish). Soft-fail if ConservationWorld missing.
     * Returns summary so main/Education can award conservation points (CP).
     */
    tryConservationInteract(range: number = 5.8): {
        litter: { collected: number; ids: string[] };
        netFreed: boolean;
    } {
        const empty = { litter: { collected: 0, ids: [] as string[] }, netFreed: false };
        try {
            const world = this.conservationWorld;
            if (!world) return empty;

            const pos =
                typeof this.swimmerController?.getPosition === 'function'
                    ? this.swimmerController.getPosition()
                    : this.camera.position.clone();

            let litter = { collected: 0, ids: [] as string[] };
            if (typeof world.tryCollectLitter === 'function') {
                litter = world.tryCollectLitter(pos, range);
            }

            let netFreed = false;
            if (typeof world.tryFreeNet === 'function') {
                netFreed = world.tryFreeNet(pos, range);
            }

            return { litter, netFreed };
        } catch (e) {
            console.warn('tryConservationInteract soft-fail:', e);
            return empty;
        }
    }
}
