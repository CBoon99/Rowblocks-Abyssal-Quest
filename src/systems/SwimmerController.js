import * as THREE from 'three';
import * as CANNON from 'cannon-es';
export class SwimmerController {
    constructor(camera, physicsWorld) {
        // Note: Camera hierarchy managed separately
        // Camera is added to scene directly, rotation controlled via euler
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: camera
        });
        Object.defineProperty(this, "physicsWorld", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: physicsWorld
        });
        Object.defineProperty(this, "velocity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        Object.defineProperty(this, "direction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        Object.defineProperty(this, "euler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Euler(0, 0, 0, 'YXZ')
        });
        Object.defineProperty(this, "pitchObject", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Object3D()
        });
        Object.defineProperty(this, "yawObject", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Object3D()
        });
        Object.defineProperty(this, "moveForward", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "moveBackward", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "moveLeft", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "moveRight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "moveUp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "moveDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "canJump", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "prevTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: performance.now()
        });
        Object.defineProperty(this, "flashlight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "physicsBody", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "SPEED", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5
        });
        Object.defineProperty(this, "SWIM_SPEED", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
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
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        // Mouse look (pointer lock)
        document.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        });
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                document.addEventListener('mousemove', (e) => this.onMouseMove(e));
            }
            else {
                document.removeEventListener('mousemove', (e) => this.onMouseMove(e));
            }
        });
    }
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                this.moveUp = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
                this.moveDown = true;
                break;
        }
    }
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'Space':
                this.moveUp = false;
                break;
            case 'ShiftLeft':
                this.moveDown = false;
                break;
        }
    }
    onMouseMove(event) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        this.yawObject.rotation.y -= movementX * 0.002;
        this.pitchObject.rotation.x -= movementY * 0.002;
        // Limit pitch
        this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    }
    update(deltaTime) {
        // Update camera position from physics body
        this.camera.position.copy(this.physicsBody.position);
        this.camera.position.y += 0.5; // Offset for eye level
        // Calculate movement direction
        this.velocity.set(0, 0, 0);
        this.direction.set(0, 0, -1);
        this.direction.applyQuaternion(this.yawObject.quaternion);
        if (this.moveForward) {
            this.velocity.add(this.direction.clone().multiplyScalar(this.SPEED));
        }
        if (this.moveBackward) {
            this.velocity.add(this.direction.clone().multiplyScalar(-this.SPEED));
        }
        // Strafe
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.yawObject.quaternion);
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
        this.physicsBody.velocity.set(this.velocity.x, this.physicsBody.velocity.y + this.velocity.y * deltaTime, this.velocity.z);
        // Apply horizontal movement
        const currentVel = this.physicsBody.velocity;
        this.physicsBody.velocity.set(this.velocity.x, currentVel.y, this.velocity.z);
        // Update flashlight
        if (this.flashlight) {
            this.flashlight.position.copy(this.camera.position);
            this.flashlight.target.position.copy(this.camera.position);
            this.flashlight.target.position.add(this.direction.multiplyScalar(10));
        }
    }
    getPosition() {
        return this.camera.position.clone();
    }
    getDirection() {
        return this.direction.clone();
    }
}
