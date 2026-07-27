import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';
import * as CANNON from 'cannon-es';
import {
    SerializableBlockState,
    GridSize,
    gridKey,
    gridToWorld,
    inBounds,
    NEIGHBOR6,
} from './GridMath';

/** Logical block types (start/exit preserved for win checks). */
export type BlockType = 'rock' | 'coral' | 'gem' | 'dark' | 'glow' | 'exit' | 'start';

interface Block {
    id: string;
    mesh: THREE.Mesh;
    body: CANNON.Body;
    gridX: number;
    gridY: number;
    gridZ: number;
    type: BlockType;
}

export type WinResult = { stars: number; score: number; unlocked: number[] };

/**
 * BlockPuzzleSystem — grid-locked 3D row-slide puzzle.
 *
 * ## Movement model
 * Blocks are **kinematic** (mass 0). Slides snap exactly one grid cell along the
 * selected axis. Mesh + Cannon body positions stay in sync via gridToWorld.
 * No free-body impulses / tumbling.
 *
 * ## External API (for Agent C / Game / HUD)
 * - setOnWin(cb: (result: WinResult) => void)
 * - setOnLose(cb: () => void)
 * - setLevelSystem / setUpgradeSystem / setAudioManager
 * - loadLevelBlocks()
 * - undo(): boolean
 * - getMoves() / getMaxMoves()
 * - getSerializableState(): SerializableBlockState[]
 *
 * ## Gem collection rule (honest collect levels)
 * After a successful slide, any gem face-adjacent to the **start** block is auto-collected
 * (removed + LevelSystem.recordGemCollected). Player may also press **E** while a row
 * containing a gem is selected to collect one gem from that row.
 */
export class BlockPuzzleSystem {
    private blocks: Block[] = [];
    private gridSize: GridSize = { x: 5, y: 3, z: 5 };
    private blockSize: number = 1;
    private selectedAxis: 'x' | 'y' | 'z' | null = null;
    private selectedIndex: number = -1;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private audioManager: any = null;
    private levelSystem: any = null;
    private upgradeSystem: any = null;
    /** Undo stack: serializable {id,x,y,z,type} only (+ collectedGems snapshot). */
    private moveHistory: Array<{ blocks: SerializableBlockState[]; collectedGems: number }> = [];
    private maxUndos: number = 10;
    private nextBlockId: number = 1;
    private levelResolved: boolean = false;

    private onWinCb: ((result: WinResult) => void) | null = null;
    private onLoseCb: (() => void) | null = null;

    constructor(
        private scene: THREE.Scene,
        private physicsWorld: PhysicsWorld
    ) {}

    // ─── Wiring ───────────────────────────────────────────────────────────

    setAudioManager(audioManager: any): void {
        this.audioManager = audioManager;
    }

    setLevelSystem(levelSystem: any): void {
        this.levelSystem = levelSystem;
        if (levelSystem && levelSystem.getCurrentLevel()) {
            this.loadLevelBlocks();
        }
    }

    setUpgradeSystem(upgradeSystem: any): void {
        this.upgradeSystem = upgradeSystem;
        const extra = upgradeSystem?.getUpgradeEffect?.('undo') ?? 0;
        this.maxUndos = Math.max(10, extra || 0);
    }

    /** Agent C / GameHUD: win callback (preferred over window.gameHUD). */
    setOnWin(cb: ((result: WinResult) => void) | null): void {
        this.onWinCb = cb;
    }

    /** Agent C / GameHUD: lose callback when moves >= maxMoves without win. */
    setOnLose(cb: (() => void) | null): void {
        this.onLoseCb = cb;
    }

    getMoves(): number {
        return this.levelSystem?.getMoves?.() ?? 0;
    }

    getMaxMoves(): number {
        return this.levelSystem?.getMaxMoves?.() ?? 0;
    }

    getSerializableState(): SerializableBlockState[] {
        return this.blocks.map(b => ({
            id: b.id,
            x: b.gridX,
            y: b.gridY,
            z: b.gridZ,
            type: b.type,
        }));
    }

    // ─── Level load ───────────────────────────────────────────────────────

    loadLevelBlocks(): void {
        this.levelResolved = false;
        this.moveHistory = [];
        this.selectedAxis = null;
        this.selectedIndex = -1;

        if (!this.levelSystem) {
            console.warn('BlockPuzzleSystem: No level system set');
            this.createTestBlocks();
            return;
        }

        const level = this.levelSystem.getCurrentLevel();
        if (!level) {
            console.warn('BlockPuzzleSystem: No current level');
            this.createTestBlocks();
            return;
        }

        console.log(`📦 Loading blocks for level ${level.id}: ${level.name}`);

        this.clearBlocks();
        this.gridSize = { ...level.gridSize };
        this.nextBlockId = 1;

        if (level.blocks && level.blocks.length > 0) {
            level.blocks.forEach((blockData: { x: number; y: number; z: number; type: string }) => {
                this.createBlock(
                    blockData.x,
                    blockData.y,
                    blockData.z,
                    blockData.type as BlockType
                );
            });
        } else {
            console.warn('⚠️ Level has no blocks defined, creating test blocks');
            this.createTestBlocks();
        }

        const blockPositions = this.blocks.map(b => `(${b.gridX},${b.gridY},${b.gridZ}:${b.type})`).join(', ');
        console.log(`✅ Created ${this.blocks.length} blocks at positions: ${blockPositions}`);
        // Memory Pass: blocks leave the emotional stage until Puzzle tool
        this.setBlocksVisible(false);
    }

    /** Hide puzzle mesh until invited — protect turtle/manta entrances */
    setBlocksVisible(visible: boolean): void {
        for (const block of this.blocks) {
            block.mesh.visible = visible;
            // Soft physics: still solid when hidden so win state works if needed
        }
        this.blocksVisible = visible;
    }

    private blocksVisible = false;

    private clearBlocks(): void {
        this.blocks.forEach(block => {
            this.scene.remove(block.mesh);
            block.mesh.geometry.dispose();
            const mat = block.mesh.material;
            if (Array.isArray(mat)) mat.forEach(m => m.dispose());
            else mat.dispose();
            this.physicsWorld.removeBody(block.body);
        });
        this.blocks = [];
    }

    private createTestBlocks(): void {
        console.log('🧪 Creating test blocks (fallback)...');
        this.clearBlocks();
        this.gridSize = { x: 5, y: 3, z: 5 };
        const testPositions: Array<{ x: number; y: number; z: number; type: BlockType }> = [
            { x: 0, y: 0, z: 0, type: 'start' },
            { x: 2, y: 0, z: 0, type: 'gem' },
            { x: 4, y: 0, z: 0, type: 'exit' },
            { x: 1, y: 0, z: 0, type: 'rock' },
            { x: 0, y: 0, z: 2, type: 'rock' },
        ];
        testPositions.forEach(pos => this.createBlock(pos.x, pos.y, pos.z, pos.type));
        console.log(`✅ Created ${this.blocks.length} test blocks`);
    }

    async init(): Promise<void> {
        console.log('🧩 BlockPuzzleSystem.init() started');
        try {
            console.log('🖱️ Setting up mouse/keyboard interactions...');
            document.addEventListener('click', (e) => this.onClick(e));
            document.addEventListener('keydown', (e) => this.onKeyDown(e));

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
        for (let x = 0; x < this.gridSize.x; x++) {
            for (let y = 0; y < this.gridSize.y; y++) {
                for (let z = 0; z < this.gridSize.z; z++) {
                    if (Math.random() > 0.3) {
                        this.createBlock(x, y, z, this.getRandomBlockType());
                    }
                }
            }
        }
    }

    private getRandomBlockType(): BlockType {
        const rand = Math.random();
        if (rand < 0.4) return 'rock';
        if (rand < 0.6) return 'coral';
        if (rand < 0.8) return 'gem';
        if (rand < 0.9) return 'dark';
        return 'glow';
    }

    private createBlock(gridX: number, gridY: number, gridZ: number, type: BlockType): void {
        const visualType = this.visualTypeFor(type);
        const geometry = new THREE.BoxGeometry(this.blockSize, this.blockSize, this.blockSize);

        let material: THREE.MeshToonMaterial;
        switch (visualType) {
            case 'gem':
                material = new THREE.MeshToonMaterial({
                    color: 0x00ffff,
                    emissive: 0x0066aa,
                    emissiveIntensity: 0.6,
                    gradientMap: null
                });
                break;
            case 'glow':
            case 'start':
                material = new THREE.MeshToonMaterial({
                    color: type === 'start' ? 0x88ff88 : 0xff88ff,
                    emissive: type === 'start' ? 0x226622 : 0x660066,
                    emissiveIntensity: 0.9
                });
                break;
            case 'exit':
                material = new THREE.MeshToonMaterial({
                    color: 0xffaa00,
                    emissive: 0x664400,
                    emissiveIntensity: 0.8
                });
                break;
            case 'coral':
                material = new THREE.MeshToonMaterial({
                    color: 0xff6666,
                    emissive: 0x330000,
                    emissiveIntensity: 0.3
                });
                break;
            case 'dark':
                material = new THREE.MeshToonMaterial({
                    color: 0x333333,
                    emissive: 0x000000,
                    emissiveIntensity: 0.0
                });
                break;
            default:
                material = new THREE.MeshToonMaterial({
                    color: 0x888888,
                    emissive: 0x000000,
                    emissiveIntensity: 0.0
                });
        }

        const gradientTexture = new THREE.DataTexture(
            new Uint8Array([0, 0, 0, 128, 128, 128, 255, 255, 255]),
            3, 1,
            THREE.RGBFormat
        );
        gradientTexture.needsUpdate = true;
        material.gradientMap = gradientTexture;

        const mesh = new THREE.Mesh(geometry, material);
        const world = gridToWorld(gridX, gridY, gridZ, this.gridSize, this.blockSize);
        mesh.position.set(world.x, world.y, world.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Tag for raycast / debug
        mesh.userData.blockId = `b${this.nextBlockId}`;
        this.scene.add(mesh);

        // Kinematic body — no tumbling; position driven by grid
        const shape = new CANNON.Box(
            new CANNON.Vec3(this.blockSize / 2, this.blockSize / 2, this.blockSize / 2)
        );
        const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
        body.addShape(shape);
        body.position.set(world.x, world.y, world.z);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.material = new CANNON.Material('block');
        body.material.friction = 0.4;
        body.material.restitution = 0.0;
        this.physicsWorld.addBody(body);

        const id = `b${this.nextBlockId++}`;
        mesh.userData.blockId = id;

        this.blocks.push({
            id,
            mesh,
            body,
            gridX,
            gridY,
            gridZ,
            type
        });
    }

    private visualTypeFor(type: BlockType): BlockType {
        return type;
    }

    private syncBlockTransform(block: Block): void {
        const world = gridToWorld(block.gridX, block.gridY, block.gridZ, this.gridSize, this.blockSize);
        block.mesh.position.set(world.x, world.y, world.z);
        block.mesh.quaternion.identity();
        block.body.position.set(world.x, world.y, world.z);
        block.body.quaternion.set(0, 0, 0, 1);
        block.body.velocity.set(0, 0, 0);
        block.body.angularVelocity.set(0, 0, 0);
    }

    // ─── Input ────────────────────────────────────────────────────────────

    private onClick(event: MouseEvent): void {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const camera = (window as any).game?.getCamera();
        if (!camera) return;

        this.raycaster.setFromCamera(this.mouse, camera);
        const intersects = this.raycaster.intersectObjects(this.blocks.map(b => b.mesh));

        if (intersects.length > 0) {
            const hitBlock = this.blocks.find(b => b.mesh === intersects[0].object);
            if (hitBlock) {
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

        this.blocks.forEach(block => {
            const matches =
                (axis === 'x' && block.gridX === index) ||
                (axis === 'y' && block.gridY === index) ||
                (axis === 'z' && block.gridZ === index);

            const mat = block.mesh.material as THREE.MeshToonMaterial;
            if (matches) {
                mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.5);
                mat.emissive.setHex(0x446688);
            } else {
                this.resetEmissive(block);
            }
        });
    }

    private resetEmissive(block: Block): void {
        const mat = block.mesh.material as THREE.MeshToonMaterial;
        switch (block.type) {
            case 'gem':
                mat.emissive.setHex(0x0066aa);
                mat.emissiveIntensity = 0.6;
                break;
            case 'glow':
                mat.emissive.setHex(0x660066);
                mat.emissiveIntensity = 0.9;
                break;
            case 'start':
                mat.emissive.setHex(0x226622);
                mat.emissiveIntensity = 0.9;
                break;
            case 'exit':
                mat.emissive.setHex(0x664400);
                mat.emissiveIntensity = 0.8;
                break;
            case 'coral':
                mat.emissive.setHex(0x330000);
                mat.emissiveIntensity = 0.3;
                break;
            default:
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0.0;
        }
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (this.levelResolved) return;

        // Collect gem with E while a gem is in the selected row
        if (event.key === 'e' || event.key === 'E') {
            this.tryCollectSelectedGem();
            return;
        }

        // Undo
        if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.undo();
            return;
        }

        switch (event.key) {
            case 'ArrowLeft':
                this.slideSelected('left');
                break;
            case 'ArrowRight':
                this.slideSelected('right');
                break;
            case 'ArrowUp':
                this.slideSelected('up');
                break;
            case 'ArrowDown':
                this.slideSelected('down');
                break;
        }
    }

    /**
     * Public touch/API slide of the currently selected row/column/stack.
     * Maps to the same axis logic as arrow keys in onKeyDown.
     * @returns true if a slide was accepted and applied
     */
    slideSelected(direction: 'left' | 'right' | 'up' | 'down'): boolean {
        if (this.levelResolved) return false;
        if (!this.selectedAxis || this.selectedIndex === -1) return false;

        const blocksInRow = this.getSelectedBlocks();
        if (blocksInRow.length === 0) return false;

        let axis: 'x' | 'y' | 'z' | null = null;
        let dir = 0;

        switch (direction) {
            case 'left':
                if (this.selectedAxis === 'x') { axis = 'x'; dir = -1; }
                else if (this.selectedAxis === 'z') { axis = 'z'; dir = -1; }
                break;
            case 'right':
                if (this.selectedAxis === 'x') { axis = 'x'; dir = 1; }
                else if (this.selectedAxis === 'z') { axis = 'z'; dir = 1; }
                break;
            case 'up':
                if (this.selectedAxis === 'y') { axis = 'y'; dir = 1; }
                else if (this.selectedAxis === 'z') { axis = 'z'; dir = -1; }
                break;
            case 'down':
                if (this.selectedAxis === 'y') { axis = 'y'; dir = -1; }
                else if (this.selectedAxis === 'z') { axis = 'z'; dir = 1; }
                break;
        }

        if (!axis) return false;
        if (!this.canSlide(blocksInRow, axis, dir)) {
            console.log('🚫 Slide blocked (bounds or collision)');
            return false;
        }

        this.slideRow(blocksInRow, axis, dir);
        return true;
    }

    private getSelectedBlocks(): Block[] {
        if (!this.selectedAxis || this.selectedIndex === -1) return [];
        return this.blocks.filter(block => {
            if (this.selectedAxis === 'x') return block.gridX === this.selectedIndex;
            if (this.selectedAxis === 'y') return block.gridY === this.selectedIndex;
            return block.gridZ === this.selectedIndex;
        });
    }

    // ─── Grid-locked slide ────────────────────────────────────────────────

    /**
     * Slide all blocks in the selected row/column/stack by ±1 cell on `axis`.
     * Simultaneous move: destinations vacated by co-moving blocks are free.
     * Rejects if any block would leave grid or hit a non-moving block.
     */
    private slideRow(blocks: Block[], axis: 'x' | 'y' | 'z', direction: number): void {
        if (this.levelResolved) return;
        if (!this.canSlide(blocks, axis, direction)) {
            console.log('🚫 Slide blocked (bounds or collision)');
            return;
        }

        this.saveState();

        if (this.levelSystem) {
            this.levelSystem.recordMove();
        }

        if (this.audioManager && blocks.length > 0) {
            const avgPosition = new THREE.Vector3();
            blocks.forEach(block => avgPosition.add(block.mesh.position));
            avgPosition.divideScalar(blocks.length);
            this.audioManager.playSound('blockSlide', avgPosition);
        }

        // Apply grid update + kinematic snap
        for (const block of blocks) {
            if (axis === 'x') block.gridX += direction;
            else if (axis === 'y') block.gridY += direction;
            else block.gridZ += direction;
            this.syncBlockTransform(block);
        }

        // Blocks that left the grid are removed (enables clear-type wins)
        const fallen = this.blocks.filter(
            b => !inBounds(b.gridX, b.gridY, b.gridZ, this.gridSize)
        );
        for (const b of fallen) {
            this.removeBlock(b);
        }

        // Keep selection index in sync when the whole slab moved along its selection axis
        if (this.selectedAxis === axis) {
            this.selectedIndex += direction;
        }

        // Auto-collect gems adjacent to start
        this.autoCollectGemsNearStart();

        this.evaluateWinLose();
    }

    private canSlide(blocks: Block[], axis: 'x' | 'y' | 'z', direction: number): boolean {
        const movingIds = new Set(blocks.map(b => b.id));
        const occupiedByStatic = new Set<string>();
        for (const b of this.blocks) {
            if (!movingIds.has(b.id)) {
                occupiedByStatic.add(gridKey(b.gridX, b.gridY, b.gridZ));
            }
        }

        for (const block of blocks) {
            const nx = block.gridX + (axis === 'x' ? direction : 0);
            const ny = block.gridY + (axis === 'y' ? direction : 0);
            const nz = block.gridZ + (axis === 'z' ? direction : 0);

            if (!inBounds(nx, ny, nz, this.gridSize)) {
                // Start/exit cannot leave the grid; other blocks may fall off (clear win).
                if (block.type === 'start' || block.type === 'exit') {
                    return false;
                }
                continue;
            }
            if (occupiedByStatic.has(gridKey(nx, ny, nz))) {
                return false;
            }
        }
        return true;
    }

    // ─── Gems ─────────────────────────────────────────────────────────────

    /**
     * After moves: collect any gem face-adjacent to start.
     * Rule documented for other agents — LevelSystem.recordGemCollected is the counter.
     */
    private autoCollectGemsNearStart(): void {
        const start = this.blocks.find(b => b.type === 'start');
        if (!start || !this.levelSystem) return;

        const toCollect = this.blocks.filter(b => {
            if (b.type !== 'gem') return false;
            return NEIGHBOR6.some(
                d =>
                    b.gridX === start.gridX + d.x &&
                    b.gridY === start.gridY + d.y &&
                    b.gridZ === start.gridZ + d.z
            );
        });

        for (const gem of toCollect) {
            this.removeBlock(gem);
            this.levelSystem.recordGemCollected(1);
            if (this.upgradeSystem?.addCurrency) {
                this.upgradeSystem.addCurrency(5);
            }
        }
    }

    /** Press E: collect one gem from the currently selected row. */
    private tryCollectSelectedGem(): void {
        if (this.levelResolved || !this.levelSystem) return;
        const row = this.getSelectedBlocks();
        const gem = row.find(b => b.type === 'gem');
        if (!gem) return;

        this.saveState();
        this.removeBlock(gem);
        this.levelSystem.recordGemCollected(1);
        if (this.upgradeSystem?.addCurrency) {
            this.upgradeSystem.addCurrency(5);
        }
        this.evaluateWinLose();
    }

    private removeBlock(block: Block): void {
        this.scene.remove(block.mesh);
        block.mesh.geometry.dispose();
        const mat = block.mesh.material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat.dispose();
        this.physicsWorld.removeBody(block.body);
        this.blocks = this.blocks.filter(b => b.id !== block.id);
    }

    // ─── Undo ─────────────────────────────────────────────────────────────

    private saveState(): void {
        while (this.moveHistory.length >= this.maxUndos) {
            this.moveHistory.shift();
        }
        this.moveHistory.push({
            blocks: this.getSerializableState(),
            collectedGems: this.levelSystem?.getCollectedGems?.() ?? 0,
        });
    }

    /**
     * Restore last serializable snapshot {id,x,y,z,type}.
     * Recreates missing blocks (e.g. collected gems) and removes extras.
     */
    undo(): boolean {
        if (this.moveHistory.length === 0 || this.levelResolved) return false;

        const state = this.moveHistory.pop();
        if (!state) return false;

        this.restoreFromSerializable(state.blocks);

        if (this.levelSystem) {
            if (typeof this.levelSystem.undoMove === 'function') {
                this.levelSystem.undoMove();
            }
            if (typeof this.levelSystem.setCollectedGems === 'function') {
                this.levelSystem.setCollectedGems(state.collectedGems);
            }
        }

        console.log('↩️ Undo restored', state.blocks.length, 'blocks');
        return true;
    }

    private restoreFromSerializable(states: SerializableBlockState[]): void {
        const byId = new Map(this.blocks.map(b => [b.id, b]));
        const keep = new Set(states.map(s => s.id));

        // Remove blocks not in snapshot
        for (const b of [...this.blocks]) {
            if (!keep.has(b.id)) {
                this.removeBlock(b);
            }
        }

        for (const s of states) {
            let block = byId.get(s.id);
            if (!block) {
                // Recreate (e.g. un-collect gem)
                this.createBlock(s.x, s.y, s.z, s.type as BlockType);
                // Fix id to match snapshot
                const created = this.blocks[this.blocks.length - 1];
                created.id = s.id;
                created.mesh.userData.blockId = s.id;
                block = created;
            } else {
                block.gridX = s.x;
                block.gridY = s.y;
                block.gridZ = s.z;
                block.type = s.type as BlockType;
                this.syncBlockTransform(block);
            }
        }

        // Refresh byId after potential creates
        this.blocks.forEach(b => this.syncBlockTransform(b));
    }

    // ─── Win / Lose ───────────────────────────────────────────────────────

    private evaluateWinLose(): void {
        if (!this.levelSystem || this.levelResolved) return;

        const state = this.getSerializableState();
        const won = this.levelSystem.checkWinCondition(state);

        if (won) {
            this.levelResolved = true;
            const result: WinResult = this.levelSystem.completeLevel();
            console.log('🏆 Level won', result);

            if (this.upgradeSystem?.addCurrency) {
                this.upgradeSystem.addCurrency(result.score);
            }

            if (this.onWinCb) {
                this.onWinCb(result);
            } else if ((window as any).gameHUD?.showWinScreen) {
                // Fallback until Agent C wires setOnWin
                (window as any).gameHUD.showWinScreen(result.stars, result.score, result.unlocked);
            }
            return;
        }

        const moves = this.levelSystem.getMoves?.() ?? 0;
        const maxMoves = this.levelSystem.getMaxMoves?.() ?? 0;
        if (maxMoves > 0 && moves >= maxMoves) {
            this.levelResolved = true;
            console.log('💀 Out of moves — lose');
            if (this.onLoseCb) {
                this.onLoseCb();
            } else if ((window as any).gameHUD?.showLoseScreen) {
                (window as any).gameHUD.showLoseScreen();
            }
        }
    }

    /** @deprecated internal path still used after slides; prefer evaluateWinLose */
    private checkWinCondition(): void {
        this.evaluateWinLose();
    }

    showHint(): void {
        this.blocks.forEach(block => this.resetEmissive(block));

        if (this.blocks.length > 0) {
            const hintBlock = this.blocks.find(b => b.type === 'rock') ?? this.blocks[0];
            const mat = hintBlock.mesh.material as THREE.MeshToonMaterial;
            mat.emissive.setHex(0x00ffff);
            mat.emissiveIntensity = 0.5;
            this.selectRow('x', hintBlock.gridX);

            setTimeout(() => {
                if (this.blocks.includes(hintBlock)) {
                    this.resetEmissive(hintBlock);
                }
            }, 3000);
        }
    }

    /**
     * Keep mesh + kinematic body locked to grid every frame
     * (guards against any external physics nudge).
     */
    update(_deltaTime: number): void {
        this.blocks.forEach(block => {
            this.syncBlockTransform(block);
        });
    }
}
