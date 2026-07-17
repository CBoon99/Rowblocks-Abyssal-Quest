/**
 * Swimmer controls (kid-friendly) — Jasmine Ocean Ranger (third-person):
 *   W/A/S/D  — swim forward / left / back / right (look-relative)
 *   Space    — swim UP only (does NOT collect fish)
 *   Shift    — swim DOWN
 *   E        — collect nearest fish in look cone (net range)
 *   F        — conservation interact: collect nearby litter + free ghost nets
 *   Mouse    — look (requires pointer lock)
 *   Click canvas — request pointer lock for look
 *   Alt or Escape — temporarily release pointer lock (UI / block click)
 */
import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';
import * as CANNON from 'cannon-es';
import {
    animateJasmine,
    applyJasmineSuit,
    buildJasmineDiver,
    makeNameSprite,
    suitIdFromStore,
    type JasmineBuild,
} from './JasmineCharacter';

export class SwimmerController {
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private direction: THREE.Vector3 = new THREE.Vector3();
    private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private pitchObject: THREE.Object3D = new THREE.Object3D();
    private yawObject: THREE.Object3D = new THREE.Object3D();
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private moveUp: boolean = false;
    private moveDown: boolean = false;
    private canJump: boolean = false;
    private prevTime: number = performance.now();
    private flashlight: THREE.SpotLight | null = null;
    private physicsBody: CANNON.Body;
    private swimSpeedMult: number = 1;
    /** When true (touch/iPad), never request pointer lock on click. */
    private touchMode: boolean = false;
    /** When true (puzzle UI), never request pointer lock on click. */
    private puzzleMode: boolean = false;
    /** Respect system: 0 thrash … 1 calm */
    private gentleness = 1;
    private recentSpeed = 0;
    private animTime = 0;
    private jasmine: JasmineBuild | null = null;
    private lastSkin = '';
    private camOffset = new THREE.Vector3(0, 1.15, 3.6);
    private camLookAt = new THREE.Vector3();
    private camSmooth = new THREE.Vector3(0, 8, 8);

    private readonly SPEED: number = 5;
    private readonly SWIM_SPEED: number = 3;

    constructor(
        private camera: THREE.PerspectiveCamera,
        private physicsWorld: PhysicsWorld,
        private scene: THREE.Scene
    ) {
        // Create physics body (capsule shape for swimmer)
        const shape = new CANNON.Cylinder(0.3, 0.3, 1.5, 8);
        this.physicsBody = new CANNON.Body({ mass: 1 });
        this.physicsBody.addShape(shape);
        // Position swimmer above the block grid
        this.physicsBody.position.set(0, 8, 5);
        this.physicsBody.linearDamping = 0.8; // Water resistance
        this.physicsBody.angularDamping = 0.9;
        physicsWorld.addBody(this.physicsBody);

        // Jasmine Ocean Ranger — visible character (third-person)
        this.spawnJasmine();

        // Initial camera behind her
        this.camera.position.set(0, 9.2, 8.6);
        this.camSmooth.copy(this.camera.position);

        // Flashlight on camera so look aim lights what she sees
        this.flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.3);
        this.flashlight.position.set(0, 0, 0);
        this.flashlight.target.position.set(0, 0, -10);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);

        // Subscribe to store for customization updates
        this.updateCustomization();
        this.subscribeToStore();

        this.setupEventListeners();
    }

    private spawnJasmine(): void {
        const name = this.resolveDiverName();
        this.jasmine = buildJasmineDiver({
            suitId: 'default',
            displayName: name,
            showName: true,
        });
        this.jasmine.group.position.set(0, 8, 5);
        this.scene.add(this.jasmine.group);
        console.log(`🧜 Jasmine character ready — Ocean Ranger "${name}"`);
    }

    private resolveDiverName(): string {
        try {
            const acc = (window as any).accountSystem;
            const p = acc?.getActiveProfile?.();
            if (p?.displayName && String(p.displayName).trim()) {
                return String(p.displayName).trim();
            }
        } catch {
            /* ignore */
        }
        try {
            const store = (window as any).useGameStore;
            const n = store?.getState?.()?.playerName;
            if (typeof n === 'string' && n.trim()) return n.trim();
        } catch {
            /* ignore */
        }
        return 'Jasmine';
    }

    /** Refresh nameplate after profile select (call when dive starts). */
    refreshDiverIdentity(): void {
        if (!this.jasmine) return;
        const name = this.resolveDiverName();
        this.jasmine.group.name = name;
        if (this.jasmine.nameLabel) {
            this.jasmine.group.remove(this.jasmine.nameLabel);
            const mat = this.jasmine.nameLabel.material;
            mat.map?.dispose();
            mat.dispose();
        }
        const spr = makeNameSprite(name);
        this.jasmine.group.add(spr);
        this.jasmine.nameLabel = spr;
    }

    getJasmineGroup(): THREE.Group | null {
        return this.jasmine?.group ?? null;
    }

    private subscribeToStore(): void {
        try {
            const store = (window as any).useGameStore;
            if (store && typeof store.subscribe === 'function') {
                store.subscribe(() => {
                    this.updateCustomization();
                });
            }
        } catch {
            // Store may not be exposed yet; updateCustomization is also called each frame lightly via update
        }
    }
    
    private setupEventListeners(): void {
        // Keyboard controls - use capture phase to ensure we get events
        const keyDownHandler = (e: KeyboardEvent) => {
            // Don't capture if typing in an input field or if UI is open
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
                return;
            }
            // Don't capture if a modal/overlay is visible
            const marinepedia = document.getElementById('marinepedia-container');
            const shop = document.getElementById('customization-shop-container');
            const levelSelect = document.getElementById('level-select-container');
            const upgradeShop = document.getElementById('upgrade-shop-container');
            if (marinepedia?.style.display === 'block' || 
                shop?.style.display === 'block' || 
                levelSelect?.style.display === 'block' ||
                upgradeShop?.style.display === 'block') {
                return;
            }
            this.onKeyDown(e);
        };
        const keyUpHandler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
                return;
            }
            this.onKeyUp(e);
        };
        
        document.addEventListener('keydown', keyDownHandler, true);
        document.addEventListener('keyup', keyUpHandler, true);
        
        // Mouse look (pointer lock) - request on canvas element
        const requestLock = () => {
            if (this.touchMode || this.puzzleMode) return;
            const canvas = document.querySelector('canvas');
            if (canvas && document.pointerLockElement !== canvas) {
                canvas.requestPointerLock().catch(err => {
                    console.warn('Pointer lock failed:', err);
                });
            }
        };
        
        // Click canvas (or game area) to re-lock look
        document.addEventListener('click', (e) => {
            if (this.touchMode || this.puzzleMode) return;
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'CANVAS' ||
                target.id === 'canvas-container' ||
                (!target.closest('#ui-overlay') && !target.closest('#start-screen'))
            ) {
                requestLock();
            }
        });
        
        // Handle pointer lock changes
        const mouseMoveHandler = (e: MouseEvent) => this.onMouseMove(e);
        document.addEventListener('pointerlockchange', () => {
            const canvas = document.querySelector('canvas');
            if (document.pointerLockElement === canvas) {
                document.addEventListener('mousemove', mouseMoveHandler);
                console.log('Pointer lock acquired - mouse controls enabled');
            } else {
                document.removeEventListener('mousemove', mouseMoveHandler);
                console.log('Pointer lock released');
            }
        });
    }

    /** Release pointer lock so player can click UI / blocks */
    private releasePointerLock(): void {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }
    
    private onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space':
                // Swim up ONLY — fish collect is E
                this.moveUp = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveDown = true;
                break;
            case 'KeyE':
                // Collect fish along look direction (do NOT use for litter/nets)
                this.tryCollectFish();
                break;
            case 'KeyF':
                // Conservation interact: litter + ghost nets near player (not fish)
                this.tryConservationInteract();
                break;
            case 'AltLeft':
            case 'AltRight':
                // Temporarily free cursor for UI / block click
                this.releasePointerLock();
                event.preventDefault();
                break;
            case 'Escape':
                // Free cursor for UI
                this.releasePointerLock();
                break;
        }
    }

    private tryCollectFish(): void {
        try {
            const game = (window as any).game;
            if (game && typeof game.collectFish === 'function') {
                game.collectFish();
            }
        } catch (e) {
            console.warn('collectFish failed:', e);
        }
    }

    /** F key: litter collect + free ghost net near swimmer (soft-wired). */
    private tryConservationInteract(): void {
        try {
            const game = (window as any).game;
            if (game && typeof game.tryConservationInteract === 'function') {
                game.tryConservationInteract(4);
            }
        } catch (e) {
            console.warn('tryConservationInteract failed:', e);
        }
    }
    
    private onKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'Space': this.moveUp = false; break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveDown = false;
                break;
        }
    }
    
    private onMouseMove(event: MouseEvent): void {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        this.addLookDelta(movementX, movementY);
    }

    /**
     * Drive move flags from virtual stick / touch buttons.
     * Keyboard path still sets the same flags independently.
     */
    setMoveState(state: {
        forward: boolean;
        backward: boolean;
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
    }): void {
        this.moveForward = state.forward;
        this.moveBackward = state.backward;
        this.moveLeft = state.left;
        this.moveRight = state.right;
        this.moveUp = state.up;
        this.moveDown = state.down;
    }

    /**
     * Apply look delta (same scale as mouse movementX/Y * 0.002).
     * Used by touch look drag and desktop pointer-lock mouse move.
     */
    addLookDelta(dx: number, dy: number): void {
        this.yawObject.rotation.y -= dx * 0.002;
        this.pitchObject.rotation.x -= dy * 0.002;
        // Limit pitch
        this.pitchObject.rotation.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, this.pitchObject.rotation.x)
        );
    }

    /** Touch Observe button / E key equivalent. */
    triggerCollect(): void {
        this.tryCollectFish();
    }

    /** Touch Clean button / F key equivalent. */
    triggerConserve(): void {
        this.tryConservationInteract();
    }

    /** When true, skip pointer lock requests (touch / iPad path). */
    setTouchMode(enabled: boolean): void {
        this.touchMode = enabled;
        if (enabled) {
            this.releasePointerLock();
        }
    }

    /** When true (puzzle pad active), do not request pointer lock. */
    setPuzzleMode(on: boolean): void {
        this.puzzleMode = on;
        if (on) {
            this.releasePointerLock();
        }
    }
    
    update(deltaTime: number): void {
        // Refresh helmet/net/swim mods occasionally from store (cheap)
        this.applyStoreModifiers();
        this.animTime += deltaTime;

        // Look yaw/pitch from input
        this.euler.set(0, 0, 0, 'YXZ');
        this.euler.y = this.yawObject.rotation.y;
        this.euler.x = this.pitchObject.rotation.x;
        const lookQuat = new THREE.Quaternion().setFromEuler(this.euler);

        const speed = this.SPEED * this.swimSpeedMult;
        const swimSpeed = this.SWIM_SPEED * this.swimSpeedMult;

        // Movement relative to look direction
        this.velocity.set(0, 0, 0);
        this.direction.set(0, 0, -1);
        this.direction.applyQuaternion(lookQuat);

        if (this.moveForward) {
            this.velocity.add(this.direction.clone().multiplyScalar(speed));
        }
        if (this.moveBackward) {
            this.velocity.add(this.direction.clone().multiplyScalar(-speed));
        }

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(lookQuat);

        if (this.moveLeft) {
            this.velocity.add(right.clone().multiplyScalar(-speed));
        }
        if (this.moveRight) {
            this.velocity.add(right.clone().multiplyScalar(speed));
        }

        if (this.moveUp) {
            this.velocity.y += swimSpeed;
        }
        if (this.moveDown) {
            this.velocity.y -= swimSpeed;
        }

        // Track horizontal thrash for Respect / wildlife mood
        const planar = Math.hypot(this.velocity.x, this.velocity.z);
        this.recentSpeed = this.recentSpeed * 0.85 + planar * 0.15;
        const rawG = 1 - Math.min(1, this.recentSpeed / (this.SPEED * 0.95));
        this.gentleness = this.gentleness * 0.9 + rawG * 0.1;

        // Apply velocity to physics body
        const currentVel = this.physicsBody.velocity;
        this.physicsBody.velocity.set(
            this.velocity.x,
            currentVel.y + this.velocity.y * deltaTime,
            this.velocity.z
        );

        const bodyPos = this.physicsBody.position;
        const px = bodyPos.x;
        const py = bodyPos.y;
        const pz = bodyPos.z;

        // ── Jasmine body ─────────────────────────────────────────
        if (this.jasmine) {
            this.jasmine.group.position.set(px, py, pz);
            // Face swim / look yaw (pitch slightly for dive angle)
            this.jasmine.group.rotation.order = 'YXZ';
            this.jasmine.group.rotation.y = this.euler.y;
            this.jasmine.group.rotation.x = this.euler.x * 0.45;
            const moveSpeed = Math.hypot(
                this.physicsBody.velocity.x,
                this.physicsBody.velocity.y,
                this.physicsBody.velocity.z
            );
            animateJasmine(
                this.jasmine,
                this.animTime,
                moveSpeed * 0.22,
                this.gentleness
            );
            // Soft idle float bob
            this.jasmine.group.position.y +=
                Math.sin(this.animTime * 1.4) * 0.03 * (1 - Math.min(1, moveSpeed * 0.1));
        }

        // ── Third-person chase camera ────────────────────────────
        // Behind & above Jasmine, along look vector
        const back = new THREE.Vector3(0, 0, 1).applyQuaternion(lookQuat);
        const up = new THREE.Vector3(0, 1, 0);
        const desired = new THREE.Vector3(px, py, pz)
            .add(back.multiplyScalar(this.camOffset.z))
            .add(up.multiplyScalar(this.camOffset.y));
        // Soft follow — feels like swimming cinema
        this.camSmooth.lerp(desired, 1 - Math.exp(-6 * deltaTime));
        this.camera.position.copy(this.camSmooth);

        // Look toward a point slightly ahead of Jasmine's head
        this.camLookAt.set(px, py + 0.45, pz);
        this.camLookAt.add(
            new THREE.Vector3(0, 0, -1).applyQuaternion(lookQuat).multiplyScalar(2.5)
        );
        this.camera.lookAt(this.camLookAt);
        // Keep euler in sync for getDirection (use look quat on camera)
        this.camera.quaternion.copy(lookQuat);
        // Re-apply lookAt feel: blend camera forward with look
        // (pointer look remains source of truth via lookQuat already set)
        this.camera.quaternion.copy(lookQuat);

        // Flashlight aims where she's looking
        if (this.flashlight) {
            this.flashlight.target.position.set(0, 0, -10);
        }
    }

    /** Jasmine body position (wildlife, collect, map) */
    getPosition(): THREE.Vector3 {
        return new THREE.Vector3(
            this.physicsBody.position.x,
            this.physicsBody.position.y,
            this.physicsBody.position.z
        );
    }

    /** 0 = thrashing, 1 = still — for wildlife Respect system */
    getGentleness(): number {
        return this.gentleness;
    }

    getRecentSpeed(): number {
        return this.recentSpeed;
    }

    /** Soft outward push (shark respect zone) */
    applySoftPush(dir: THREE.Vector3, strength: number): void {
        const d = dir.clone().normalize().multiplyScalar(strength);
        this.physicsBody.velocity.x += d.x;
        this.physicsBody.velocity.z += d.z;
        this.physicsBody.position.x += d.x * 0.02;
        this.physicsBody.position.z += d.z * 0.02;
    }
    
    getDirection(): THREE.Vector3 {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(this.camera.quaternion);
        return dir;
    }

    /** Net collect range from store (base + upgrades applied by Game.collectFish). */
    getNetRange(): number {
        try {
            const store = (window as any).useGameStore;
            if (store) {
                const state = store.getState();
                if (typeof state.netRange === 'number') {
                    return state.netRange;
                }
            }
        } catch {
            // fall through
        }
        return 5.0;
    }
    
    /**
     * Update customization (skin color, helmet upgrade, etc.)
     */
    private updateCustomization(): void {
        this.applyStoreModifiers();
    }

    private applyStoreModifiers(): void {
        try {
            const store = (window as any).useGameStore;
            if (!store) return;

            const state = store.getState();

            // Suit colour from customization shop
            if (this.jasmine) {
                const skin =
                    typeof state.currentSkin === 'string' ? state.currentSkin : 'default';
                if (skin !== this.lastSkin) {
                    this.lastSkin = skin;
                    applyJasmineSuit(this.jasmine, suitIdFromStore(skin));
                }
            }

            // Helmet light intensity from store.helmetUpgrade
            if (this.flashlight) {
                const baseIntensity = 2;
                const helmetLevel =
                    typeof state.helmetUpgrade === 'number' ? state.helmetUpgrade : 0;
                const upgradeMultiplier = 1 + helmetLevel * 0.5;
                this.flashlight.intensity = baseIntensity * upgradeMultiplier;
            }

            // Optional: gameplay modifiers from UpgradeSystem via window.game
            const game = (window as any).game;
            if (game && typeof game.getUpgradeSystem === 'function') {
                const upgrades = game.getUpgradeSystem();
                if (upgrades && typeof upgrades.getGameplayModifiers === 'function') {
                    const mods = upgrades.getGameplayModifiers();
                    if (typeof mods.swimSpeedMult === 'number' && mods.swimSpeedMult > 0) {
                        this.swimSpeedMult = mods.swimSpeedMult;
                    }
                    if (this.flashlight && typeof mods.lightIntensity === 'number') {
                        const helmetLevel =
                            typeof state.helmetUpgrade === 'number'
                                ? state.helmetUpgrade
                                : 0;
                        const baseIntensity = 2 * (1 + helmetLevel * 0.5);
                        const bioBonus = Math.max(0, (mods.lightIntensity - 100) / 100);
                        this.flashlight.intensity = baseIntensity * (1 + bioBonus);
                    }
                }
            }
        } catch {
            // Soft-fail — never break swim loop
        }
    }
}
