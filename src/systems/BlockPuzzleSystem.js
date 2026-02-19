import * as THREE from 'three';
import * as CANNON from 'cannon-es';
export class BlockPuzzleSystem {
    constructor(scene, physicsWorld) {
        Object.defineProperty(this, "scene", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: scene
        });
        Object.defineProperty(this, "physicsWorld", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: physicsWorld
        });
        Object.defineProperty(this, "blocks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "gridSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { x: 5, y: 3, z: 5 }
        });
        Object.defineProperty(this, "blockSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "selectedAxis", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "selectedIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        });
        Object.defineProperty(this, "raycaster", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Raycaster()
        });
        Object.defineProperty(this, "mouse", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector2()
        });
        Object.defineProperty(this, "audioManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "levelSystem", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "upgradeSystem", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "moveHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "maxUndos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }
    setLevelSystem(levelSystem) {
        this.levelSystem = levelSystem;
        // Load current level blocks
        this.loadLevelBlocks();
    }
    setUpgradeSystem(upgradeSystem) {
        this.upgradeSystem = upgradeSystem;
        this.maxUndos = upgradeSystem.getUpgradeEffect('undo') || 0;
    }
    loadLevelBlocks() {
        if (!this.levelSystem)
            return;
        const level = this.levelSystem.getCurrentLevel();
        if (!level)
            return;
        // Clear existing blocks
        this.blocks.forEach(block => {
            this.scene.remove(block.mesh);
            this.physicsWorld.removeBody(block.body);
        });
        this.blocks = [];
        // Set grid size
        this.gridSize = level.gridSize;
        // Create blocks from level data
        level.blocks.forEach(blockData => {
            this.createBlock(blockData.x, blockData.y, blockData.z, blockData.type);
        });
    }
    async init() {
        // Setup mouse interaction
        document.addEventListener('click', (e) => this.onClick(e));
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        // If level system is set, it will load blocks via loadLevelBlocks
        // Otherwise create default grid
        if (!this.levelSystem) {
            this.createPuzzleGrid();
        }
    }
    createPuzzleGrid() {
        // Create a simple 5x3x5 grid of blocks (fallback)
        for (let x = 0; x < this.gridSize.x; x++) {
            for (let y = 0; y < this.gridSize.y; y++) {
                for (let z = 0; z < this.gridSize.z; z++) {
                    // Skip some blocks to create a puzzle
                    if (Math.random() > 0.3) {
                        const type = this.getRandomBlockType();
                        this.createBlock(x, y, z, type);
                    }
                }
            }
        }
    }
    getRandomBlockType() {
        const rand = Math.random();
        if (rand < 0.4)
            return 'rock';
        if (rand < 0.6)
            return 'coral';
        if (rand < 0.8)
            return 'gem';
        if (rand < 0.9)
            return 'dark';
        return 'glow';
    }
    createBlock(gridX, gridY, gridZ, type) {
        // Map start/exit to appropriate visual types
        let visualType = type;
        if (type === 'start')
            visualType = 'glow';
        if (type === 'exit')
            visualType = 'gem';
        const blockType = visualType;
        const geometry = new THREE.BoxGeometry(this.blockSize, this.blockSize, this.blockSize);
        // Enhanced materials with better textures and emissive properties
        let material;
        switch (blockType) {
            case 'gem':
                material = new THREE.MeshStandardMaterial({
                    color: 0x00ffff,
                    emissive: 0x0066aa,
                    emissiveIntensity: 0.5,
                    metalness: 0.9,
                    roughness: 0.1,
                    envMapIntensity: 1.5
                });
                break;
            case 'glow':
                material = new THREE.MeshStandardMaterial({
                    color: 0xff88ff,
                    emissive: 0x660066,
                    emissiveIntensity: 0.8,
                    metalness: 0.6,
                    roughness: 0.3
                });
                break;
            case 'coral':
                material = new THREE.MeshStandardMaterial({
                    color: 0xff8888,
                    emissive: 0x330000,
                    emissiveIntensity: 0.2,
                    roughness: 0.6,
                    metalness: 0.1
                });
                break;
            case 'dark':
                material = new THREE.MeshStandardMaterial({
                    color: 0x111111,
                    emissive: 0x000000,
                    roughness: 0.95,
                    metalness: 0.05
                });
                break;
            default: // rock
                material = new THREE.MeshStandardMaterial({
                    color: 0x555555,
                    emissive: 0x000000,
                    roughness: 0.85,
                    metalness: 0.1
                });
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set((gridX - this.gridSize.x / 2) * this.blockSize, gridY * this.blockSize, (gridZ - this.gridSize.z / 2) * this.blockSize);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        // Create physics body
        const shape = new CANNON.Box(new CANNON.Vec3(this.blockSize / 2, this.blockSize / 2, this.blockSize / 2));
        const body = new CANNON.Body({ mass: 1 });
        body.addShape(shape);
        body.position.copy(mesh.position);
        body.material = new CANNON.Material('block');
        body.material.friction = 0.4;
        body.material.restitution = 0.1;
        this.physicsWorld.addBody(body);
        // Note: Physics sync happens in update() method
        this.blocks.push({
            mesh,
            body,
            gridX,
            gridY,
            gridZ,
            type: blockType
        });
    }
    onClick(event) {
        // Convert mouse to normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        // Raycast from camera
        const camera = window.game?.getCamera();
        if (!camera)
            return;
        this.raycaster.setFromCamera(this.mouse, camera);
        const intersects = this.raycaster.intersectObjects(this.blocks.map(b => b.mesh));
        if (intersects.length > 0) {
            const hitBlock = this.blocks.find(b => b.mesh === intersects[0].object);
            if (hitBlock) {
                // Determine which axis to slide based on hit normal
                const normal = intersects[0].face?.normal;
                if (normal) {
                    const worldNormal = normal.clone().transformDirection(hitBlock.mesh.matrixWorld);
                    const absX = Math.abs(worldNormal.x);
                    const absY = Math.abs(worldNormal.y);
                    const absZ = Math.abs(worldNormal.z);
                    if (absX > absY && absX > absZ) {
                        this.selectRow('x', hitBlock.gridX);
                    }
                    else if (absY > absX && absY > absZ) {
                        this.selectRow('y', hitBlock.gridY);
                    }
                    else {
                        this.selectRow('z', hitBlock.gridZ);
                    }
                }
            }
        }
    }
    selectRow(axis, index) {
        this.selectedAxis = axis;
        this.selectedIndex = index;
        // Highlight selected blocks
        this.blocks.forEach(block => {
            const matches = (axis === 'x' && block.gridX === index) ||
                (axis === 'y' && block.gridY === index) ||
                (axis === 'z' && block.gridZ === index);
            if (matches) {
                block.mesh.material.emissive.setHex(0x444444);
            }
            else {
                block.mesh.material.emissive.setHex(0x000000);
            }
        });
    }
    onKeyDown(event) {
        if (!this.selectedAxis || this.selectedIndex === -1)
            return;
        const blocksInRow = this.blocks.filter(block => {
            if (this.selectedAxis === 'x')
                return block.gridX === this.selectedIndex;
            if (this.selectedAxis === 'y')
                return block.gridY === this.selectedIndex;
            return block.gridZ === this.selectedIndex;
        });
        if (blocksInRow.length === 0)
            return;
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                if (this.selectedAxis === 'x') {
                    const direction = event.key === 'ArrowRight' ? 1 : -1;
                    this.slideRow(blocksInRow, 'x', direction);
                }
                else if (this.selectedAxis === 'z') {
                    const direction = event.key === 'ArrowRight' ? 1 : -1;
                    this.slideRow(blocksInRow, 'z', direction);
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                if (this.selectedAxis === 'y') {
                    const direction = event.key === 'ArrowUp' ? 1 : -1;
                    this.slideRow(blocksInRow, 'y', direction);
                }
                else if (this.selectedAxis === 'z') {
                    const direction = event.key === 'ArrowUp' ? 1 : -1;
                    this.slideRow(blocksInRow, 'z', direction);
                }
                break;
        }
    }
    slideRow(blocks, axis, direction) {
        // Save state for undo
        this.saveState();
        // Record move
        if (this.levelSystem) {
            this.levelSystem.recordMove();
        }
        // Play block slide sound
        if (this.audioManager && blocks.length > 0) {
            const avgPosition = new THREE.Vector3();
            blocks.forEach(block => {
                avgPosition.add(block.mesh.position);
            });
            avgPosition.divideScalar(blocks.length);
            this.audioManager.playSound('blockSlide', avgPosition);
        }
        blocks.forEach(block => {
            const impulse = new CANNON.Vec3();
            if (axis === 'x')
                impulse.x = direction * 5;
            else if (axis === 'y')
                impulse.y = direction * 5;
            else
                impulse.z = direction * 5;
            block.body.applyImpulse(impulse, block.body.position);
            // Update grid position
            if (axis === 'x')
                block.gridX += direction;
            else if (axis === 'y')
                block.gridY += direction;
            else
                block.gridZ += direction;
        });
        // Check win condition
        this.checkWinCondition();
    }
    saveState() {
        if (this.moveHistory.length >= this.maxUndos) {
            this.moveHistory.shift();
        }
        const positions = new Map();
        this.blocks.forEach(block => {
            positions.set(`${block.gridX},${block.gridY},${block.gridZ}`, block.mesh.position.clone());
        });
        this.moveHistory.push({
            blocks: JSON.parse(JSON.stringify(this.blocks)),
            positions: positions
        });
    }
    undo() {
        if (this.moveHistory.length === 0)
            return false;
        const state = this.moveHistory.pop();
        if (!state)
            return false;
        // Restore block positions
        // Simplified - in production, fully restore state
        return true;
    }
    checkWinCondition() {
        if (!this.levelSystem)
            return;
        const positions = new Map();
        this.blocks.forEach(block => {
            positions.set(`${block.gridX},${block.gridY},${block.gridZ}`, block.mesh.position.clone());
        });
        if (this.levelSystem.checkWinCondition(positions)) {
            const result = this.levelSystem.completeLevel();
            // Trigger win screen
            if (window.gameHUD) {
                window.gameHUD.showWinScreen(result.stars, result.score, result.unlocked);
            }
            // Award currency
            if (this.upgradeSystem) {
                this.upgradeSystem.addCurrency(result.score);
            }
        }
    }
    update(deltaTime) {
        // Update block visuals from physics
        this.blocks.forEach(block => {
            block.mesh.position.copy(block.body.position);
            block.mesh.quaternion.copy(block.body.quaternion);
        });
    }
}
