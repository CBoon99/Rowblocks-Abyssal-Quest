import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';
import * as CANNON from 'cannon-es';

interface Block {
    mesh: THREE.Mesh;
    body: CANNON.Body;
    gridX: number;
    gridY: number;
    gridZ: number;
    type: 'rock' | 'coral' | 'gem' | 'dark' | 'glow';
}

export class BlockPuzzleSystem {
    private blocks: Block[] = [];
    private gridSize: { x: number; y: number; z: number } = { x: 5, y: 3, z: 5 };
    private blockSize: number = 1;
    private selectedAxis: 'x' | 'y' | 'z' | null = null;
    private selectedIndex: number = -1;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private audioManager: any = null;
    private levelSystem: any = null;
    private upgradeSystem: any = null;
    private moveHistory: Array<{ blocks: Block[]; positions: Map<string, THREE.Vector3> }> = [];
    private maxUndos: number = 0;
    
    constructor(
        private scene: THREE.Scene,
        private physicsWorld: PhysicsWorld
    ) {}
    
    setAudioManager(audioManager: any): void {
        this.audioManager = audioManager;
    }
    
    setLevelSystem(levelSystem: any): void {
        this.levelSystem = levelSystem;
        // Load current level blocks if a level is already selected
        if (levelSystem && levelSystem.getCurrentLevel()) {
            this.loadLevelBlocks();
        }
    }
    
    setUpgradeSystem(upgradeSystem: any): void {
        this.upgradeSystem = upgradeSystem;
        this.maxUndos = upgradeSystem.getUpgradeEffect('undo') || 0;
    }
    
    loadLevelBlocks(): void {
        if (!this.levelSystem) {
            console.warn('BlockPuzzleSystem: No level system set');
            // Create test blocks as fallback
            this.createTestBlocks();
            return;
        }
        
        const level = this.levelSystem.getCurrentLevel();
        if (!level) {
            console.warn('BlockPuzzleSystem: No current level');
            // Create test blocks as fallback
            this.createTestBlocks();
            return;
        }
        
        console.log(`📦 Loading blocks for level ${level.id}: ${level.name}`);
        
        // Clear existing blocks
        this.blocks.forEach(block => {
            this.scene.remove(block.mesh);
            this.physicsWorld.removeBody(block.body);
        });
        this.blocks = [];
        
        // Set grid size
        this.gridSize = level.gridSize;
        
        // Create blocks from level data
        if (level.blocks && level.blocks.length > 0) {
            level.blocks.forEach(blockData => {
                // Map level block types to BlockPuzzleSystem types
                let blockType: Block['type'] = 'rock';
                if (blockData.type === 'start' || blockData.type === 'exit') {
                    blockType = 'glow'; // Special blocks are glowing
                } else if (blockData.type === 'gem') {
                    blockType = 'gem';
                } else if (blockData.type === 'coral') {
                    blockType = 'coral';
                } else {
                    blockType = blockData.type as Block['type'];
                }
                
                this.createBlock(blockData.x, blockData.y, blockData.z, blockType);
            });
        } else {
            console.warn('⚠️ Level has no blocks defined, creating test blocks');
            this.createTestBlocks();
        }
        
        const blockPositions = this.blocks.map(b => `(${b.gridX},${b.gridY},${b.gridZ})`).join(', ');
        console.log(`✅ Created ${this.blocks.length} blocks at positions: ${blockPositions}`);
        
        // Ensure all blocks are in scene (they should be added in createBlock, but verify)
        this.blocks.forEach(block => {
            if (!this.scene.children.includes(block.mesh)) {
                console.log(`⚠️ Block mesh not in scene, adding: (${block.gridX}, ${block.gridY}, ${block.gridZ})`);
                this.scene.add(block.mesh);
            }
        });
    }
    
    /**
     * Create test blocks as fallback if no level data exists
     */
    private createTestBlocks(): void {
        console.log('🧪 Creating test blocks (fallback)...');
        
        // Clear existing blocks
        this.blocks.forEach(block => {
            this.scene.remove(block.mesh);
            this.physicsWorld.removeBody(block.body);
        });
        this.blocks = [];
        
        // Create 5 test blocks in a simple pattern
        const testPositions = [
            { x: 0, y: 0, z: 0, type: 'glow' as Block['type'] },
            { x: 2, y: 0, z: 0, type: 'gem' as Block['type'] },
            { x: -2, y: 0, z: 0, type: 'coral' as Block['type'] },
            { x: 0, y: 0, z: 2, type: 'rock' as Block['type'] },
            { x: 0, y: 0, z: -2, type: 'rock' as Block['type'] }
        ];
        
        testPositions.forEach(pos => {
            this.createBlock(pos.x, pos.y, pos.z, pos.type);
        });
        
        console.log(`✅ Created ${this.blocks.length} test blocks`);
    }
    
    async init(): Promise<void> {
        console.log('🧩 BlockPuzzleSystem.init() started');
        try {
            // Setup mouse interaction
            console.log('🖱️ Setting up mouse/keyboard interactions...');
            document.addEventListener('click', (e) => this.onClick(e));
            document.addEventListener('keydown', (e) => this.onKeyDown(e));
            
            // If level system is set, it will load blocks via loadLevelBlocks
            // Otherwise create default grid
            if (!this.levelSystem) {
                console.log('📦 No level system, creating default grid...');
                this.createPuzzleGrid();
            } else {
                console.log('✅ Level system connected, blocks will load when level starts');
            }
            
            console.log('✅ BlockPuzzleSystem initialized');
        } catch (error) {
            console.error('❌ BlockPuzzleSystem initialization failed:', error);
            throw error;
        }
    }
    
    private createPuzzleGrid(): void {
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
    
    private getRandomBlockType(): Block['type'] {
        const rand = Math.random();
        if (rand < 0.4) return 'rock';
        if (rand < 0.6) return 'coral';
        if (rand < 0.8) return 'gem';
        if (rand < 0.9) return 'dark';
        return 'glow';
    }
    
    private createBlock(gridX: number, gridY: number, gridZ: number, type: Block['type'] | 'start' | 'exit'): void {
        // Map start/exit to appropriate visual types
        let visualType: Block['type'] = type as Block['type'];
        if (type === 'start') visualType = 'glow';
        if (type === 'exit') visualType = 'gem';
        
        const blockType = visualType;
        // Cartoon rounded blocks - use RoundedBoxGeometry if available, or regular BoxGeometry
        // For now, use regular box but we'll apply cartoon materials
        const geometry = new THREE.BoxGeometry(this.blockSize, this.blockSize, this.blockSize);
        
        // Cartoon materials - use MeshToonMaterial for cel shading effect
        let material: THREE.MeshToonMaterial;
        switch (blockType) {
            case 'gem':
                material = new THREE.MeshToonMaterial({
                    color: 0x00ffff, // Bright cyan
                    emissive: 0x0066aa,
                    emissiveIntensity: 0.6,
                    gradientMap: null // Will create simple gradient for cel shading
                });
                break;
            case 'glow':
                material = new THREE.MeshToonMaterial({
                    color: 0xff88ff, // Bright magenta
                    emissive: 0x660066,
                    emissiveIntensity: 0.9
                });
                break;
            case 'coral':
                material = new THREE.MeshToonMaterial({
                    color: 0xff6666, // Bright coral red
                    emissive: 0x330000,
                    emissiveIntensity: 0.3
                });
                break;
            case 'dark':
                material = new THREE.MeshToonMaterial({
                    color: 0x333333, // Dark gray
                    emissive: 0x000000,
                    emissiveIntensity: 0.0
                });
                break;
            default: // rock
                material = new THREE.MeshToonMaterial({
                    color: 0x888888, // Medium gray
                    emissive: 0x000000,
                    emissiveIntensity: 0.0
                });
        }
        
        // Create simple gradient texture for cel shading (3-step gradient)
        const gradientTexture = new THREE.DataTexture(
            new Uint8Array([0, 0, 0, 128, 128, 128, 255, 255, 255]),
            3, 1,
            THREE.RGBFormat
        );
        gradientTexture.needsUpdate = true;
        material.gradientMap = gradientTexture;
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (gridX - this.gridSize.x / 2) * this.blockSize,
            gridY * this.blockSize,
            (gridZ - this.gridSize.z / 2) * this.blockSize
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        
        // Create physics body
        const shape = new CANNON.Box(new CANNON.Vec3(this.blockSize / 2, this.blockSize / 2, this.blockSize / 2));
        const body = new CANNON.Body({ mass: 1 });
        body.addShape(shape);
        body.position.copy(mesh.position as any);
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
    
    private onClick(event: MouseEvent): void {
        // Convert mouse to normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycast from camera
        const camera = (window as any).game?.getCamera();
        if (!camera) return;
        
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
                    } else if (absY > absX && absY > absZ) {
                        this.selectRow('y', hitBlock.gridY);
                    } else {
                        this.selectRow('z', hitBlock.gridZ);
                    }
                }
            }
        }
    }
    
    private selectRow(axis: 'x' | 'y' | 'z', index: number): void {
        this.selectedAxis = axis;
        this.selectedIndex = index;
        
        // Highlight selected blocks
        this.blocks.forEach(block => {
            const matches = 
                (axis === 'x' && block.gridX === index) ||
                (axis === 'y' && block.gridY === index) ||
                (axis === 'z' && block.gridZ === index);
            
            if (matches) {
                (block.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x444444);
            } else {
                (block.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            }
        });
    }
    
    private onKeyDown(event: KeyboardEvent): void {
        // Award gems when collecting gem blocks (check if any gem blocks were collected)
        // This will be called when blocks are interacted with
        if (!this.selectedAxis || this.selectedIndex === -1) return;
        
        const blocksInRow = this.blocks.filter(block => {
            if (this.selectedAxis === 'x') return block.gridX === this.selectedIndex;
            if (this.selectedAxis === 'y') return block.gridY === this.selectedIndex;
            return block.gridZ === this.selectedIndex;
        });
        
        if (blocksInRow.length === 0) return;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                if (this.selectedAxis === 'x') {
                    const direction = event.key === 'ArrowRight' ? 1 : -1;
                    this.slideRow(blocksInRow, 'x', direction);
                } else if (this.selectedAxis === 'z') {
                    const direction = event.key === 'ArrowRight' ? 1 : -1;
                    this.slideRow(blocksInRow, 'z', direction);
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                if (this.selectedAxis === 'y') {
                    const direction = event.key === 'ArrowUp' ? 1 : -1;
                    this.slideRow(blocksInRow, 'y', direction);
                } else if (this.selectedAxis === 'z') {
                    const direction = event.key === 'ArrowUp' ? 1 : -1;
                    this.slideRow(blocksInRow, 'z', direction);
                }
                break;
        }
    }
    
    private slideRow(blocks: Block[], axis: 'x' | 'y' | 'z', direction: number): void {
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
            if (axis === 'x') impulse.x = direction * 5;
            else if (axis === 'y') impulse.y = direction * 5;
            else impulse.z = direction * 5;
            
            block.body.applyImpulse(impulse, block.body.position);
            
            // Update grid position
            if (axis === 'x') block.gridX += direction;
            else if (axis === 'y') block.gridY += direction;
            else block.gridZ += direction;
        });
        
        // Check win condition
        this.checkWinCondition();
    }
    
    private saveState(): void {
        if (this.moveHistory.length >= this.maxUndos) {
            this.moveHistory.shift();
        }
        
        const positions = new Map<string, THREE.Vector3>();
        this.blocks.forEach(block => {
            positions.set(`${block.gridX},${block.gridY},${block.gridZ}`, block.mesh.position.clone());
        });
        
        this.moveHistory.push({
            blocks: JSON.parse(JSON.stringify(this.blocks)),
            positions: positions
        });
    }
    
    undo(): boolean {
        if (this.moveHistory.length === 0) return false;
        
        const state = this.moveHistory.pop();
        if (!state) return false;
        
        // Restore block positions
        // Simplified - in production, fully restore state
        return true;
    }
    
    private checkWinCondition(): void {
        if (!this.levelSystem) return;
        
        const positions = new Map<string, THREE.Vector3>();
        this.blocks.forEach(block => {
            positions.set(`${block.gridX},${block.gridY},${block.gridZ}`, block.mesh.position.clone());
        });
        
        if (this.levelSystem.checkWinCondition(positions)) {
            const result = this.levelSystem.completeLevel();
            // Trigger win screen
            if ((window as any).gameHUD) {
                (window as any).gameHUD.showWinScreen(result.stars, result.score, result.unlocked);
            }
            
            // Award currency
            if (this.upgradeSystem) {
                this.upgradeSystem.addCurrency(result.score);
            }
        }
    }
    
    showHint(): void {
        // Simple hint: highlight a random row that can be moved
        // Clear previous hints
        this.blocks.forEach(block => {
            if (block.mesh.material instanceof THREE.MeshStandardMaterial) {
                block.mesh.material.emissive.setHex(0x000000);
            }
        });
        
        // Find a movable row (simple: just highlight first row)
        if (this.blocks.length > 0) {
            const hintBlock = this.blocks[0];
            if (hintBlock.mesh.material instanceof THREE.MeshStandardMaterial) {
                hintBlock.mesh.material.emissive.setHex(0x00ffff);
                hintBlock.mesh.material.emissiveIntensity = 0.5;
                
                // Remove hint after 3 seconds
                setTimeout(() => {
                    if (hintBlock.mesh.material instanceof THREE.MeshStandardMaterial) {
                        hintBlock.mesh.material.emissive.setHex(0x000000);
                    }
                }, 3000);
            }
        }
    }
    
    update(deltaTime: number): void {
        // Update block visuals from physics
        this.blocks.forEach(block => {
            block.mesh.position.copy(block.body.position as any);
            block.mesh.quaternion.copy(block.body.quaternion as any);
        });
    }
}
