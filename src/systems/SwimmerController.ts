import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';
import * as CANNON from 'cannon-es';

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
    
    private readonly SPEED: number = 5;
    private readonly SWIM_SPEED: number = 3;
    
    constructor(
        private camera: THREE.PerspectiveCamera,
        private physicsWorld: PhysicsWorld
    ) {
        // Note: Camera hierarchy managed separately
        // Camera is added to scene directly, rotation controlled via euler
        
        // Create physics body (capsule shape for swimmer)
        const shape = new CANNON.Cylinder(0.3, 0.3, 1.5, 8);
        this.physicsBody = new CANNON.Body({ mass: 1 });
        this.physicsBody.addShape(shape);
        this.physicsBody.position.set(0, 5, 0);
        this.physicsBody.linearDamping = 0.8; // Water resistance
        this.physicsBody.angularDamping = 0.9;
        physicsWorld.addBody(this.physicsBody);
        
        // Create flashlight
        this.flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.3);
        this.flashlight.position.copy(this.camera.position);
        this.flashlight.target.position.set(0, 0, -10);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse look (pointer lock) - request on canvas element
        const requestLock = () => {
            // Find canvas element
            const canvas = document.querySelector('canvas');
            if (canvas && document.pointerLockElement !== canvas) {
                canvas.requestPointerLock();
            }
        };
        
        // Request pointer lock on click (but not when clicking UI)
        document.addEventListener('click', (e) => {
            // Only request lock if clicking on canvas area (not UI)
            const target = e.target as HTMLElement;
            if (target.tagName === 'CANVAS' || target.id === 'canvas-container' || !target.closest('#ui-overlay')) {
                requestLock();
            }
        });
        
        // Handle pointer lock changes
        const mouseMoveHandler = (e: MouseEvent) => this.onMouseMove(e);
        document.addEventListener('pointerlockchange', () => {
            const canvas = document.querySelector('canvas');
            if (document.pointerLockElement === canvas) {
                document.addEventListener('mousemove', mouseMoveHandler);
            } else {
                document.removeEventListener('mousemove', mouseMoveHandler);
            }
        });
    }
    
    private onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space': this.moveUp = true; event.preventDefault(); break;
            case 'ShiftLeft': this.moveDown = true; break;
        }
    }
    
    private onKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'Space': this.moveUp = false; break;
            case 'ShiftLeft': this.moveDown = false; break;
        }
    }
    
    private onMouseMove(event: MouseEvent): void {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        this.yawObject.rotation.y -= movementX * 0.002;
        this.pitchObject.rotation.x -= movementY * 0.002;
        
        // Limit pitch
        this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    }
    
    update(deltaTime: number): void {
        // Apply camera rotation from yaw/pitch objects
        this.euler.set(0, 0, 0, 'YXZ');
        this.euler.y = this.yawObject.rotation.y;
        this.euler.x = this.pitchObject.rotation.x;
        this.camera.rotation.setFromEuler(this.euler);
        
        // Update camera position from physics body
        this.camera.position.copy(this.physicsBody.position as any);
        this.camera.position.y += 0.5; // Offset for eye level
        
        // Calculate movement direction based on camera rotation
        this.velocity.set(0, 0, 0);
        this.direction.set(0, 0, -1);
        this.direction.applyEuler(this.camera.rotation);
        
        if (this.moveForward) {
            this.velocity.add(this.direction.clone().multiplyScalar(this.SPEED));
        }
        if (this.moveBackward) {
            this.velocity.add(this.direction.clone().multiplyScalar(-this.SPEED));
        }
        
        // Strafe - use camera's right vector
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(this.camera.rotation);
        
        if (this.moveLeft) {
            this.velocity.add(right.clone().multiplyScalar(-this.SPEED));
        }
        if (this.moveRight) {
            this.velocity.add(right.clone().multiplyScalar(this.SPEED));
        }
        
        // Vertical movement (swimming up/down)
        if (this.moveUp) {
            this.velocity.y += this.SWIM_SPEED;
        }
        if (this.moveDown) {
            this.velocity.y -= this.SWIM_SPEED;
        }
        
        // Apply velocity to physics body
        const currentVel = this.physicsBody.velocity;
        this.physicsBody.velocity.set(
            this.velocity.x,
            currentVel.y + this.velocity.y * deltaTime,
            this.velocity.z
        );
        
        // Update flashlight
        if (this.flashlight) {
            this.flashlight.position.copy(this.camera.position);
            this.flashlight.target.position.copy(this.camera.position);
            this.flashlight.target.position.add(this.direction.multiplyScalar(10));
        }
    }
    
    getPosition(): THREE.Vector3 {
        return this.camera.position.clone();
    }
    
    getDirection(): THREE.Vector3 {
        return this.direction.clone();
    }
}
