import * as THREE from 'three';
import {
    SerializableBlockState,
    GridSize,
    gridKey,
    hasPathStartToExit,
    mulberry32,
    inBounds,
} from './GridMath';
import type { LevelProgress } from '../types/Progress';

export interface LevelData {
    id: number;
    name: string;
    gridSize: { x: number; y: number; z: number };
    blocks: BlockPlacement[];
    solution: SolutionCondition;
    maxMoves: number;
    targetScore: number;
    description: string;
    unlocked: boolean;
    stars: number; // 0-3 stars based on performance
}

export interface BlockPlacement {
    x: number;
    y: number;
    z: number;
    type: 'rock' | 'coral' | 'gem' | 'dark' | 'glow' | 'exit' | 'start';
    required?: boolean; // Must be moved / collected to solve
}

export interface SolutionCondition {
    type: 'path' | 'collect' | 'align' | 'clear';
    target?: {
        gems?: number;
        path?: { from: THREE.Vector3; to: THREE.Vector3 };
        pattern?: string[];
    };
}

/**
 * LevelSystem — level data, move counting, honest win conditions.
 *
 * Gem collection API (for BlockPuzzleSystem / other agents):
 *   recordGemCollected(count?: number)  — increment collectedGems (default +1)
 *   getCollectedGems()                  — current count this run
 *   getRequiredGems()                   — target from solution (0 if N/A)
 * Reset to 0 automatically in startLevel().
 *
 * Win check API:
 *   checkWinCondition(blocks: SerializableBlockState[]) — preferred
 *   checkWinCondition(legacy Map) — still accepted; path/pattern limited without types
 */
export class LevelSystem {
    private levels: LevelData[] = [];
    private currentLevel: number = 0;
    private currentLevelData: LevelData | null = null;
    private moves: number = 0;
    private score: number = 0;
    private stars: number = 0;
    /** Extra moves from upgrades for the current run (does not permanently mutate level data). */
    private bonusMoves: number = 0;
    /** Gems collected during the current level run (honest collect win). */
    private collectedGems: number = 0;
    /** Best session scores per level id (account persistence). */
    private bestScores: Map<number, number> = new Map();

    constructor() {
        this.initializeLevels();
    }

    private initializeLevels(): void {
        // Level 1: Tutorial - Simple path
        // z=1 so no walk-around detour. Rock at (1,0,0) blocks start→exit on the only floor plane.
        // Solution: select x=1 column, slide on Y (ArrowUp/Down) to clear the corridor.
        this.levels.push({
            id: 1,
            name: 'Home Reef',
            gridSize: { x: 3, y: 2, z: 1 },
            blocks: [
                { x: 0, y: 0, z: 0, type: 'start' },
                { x: 1, y: 0, z: 0, type: 'rock' },
                { x: 2, y: 0, z: 0, type: 'exit' },
                { x: 0, y: 1, z: 0, type: 'rock' },
                { x: 1, y: 1, z: 0, type: 'rock' },
            ],
            solution: {
                type: 'path',
                target: {
                    path: {
                        from: new THREE.Vector3(0, 0, 0),
                        to: new THREE.Vector3(2, 0, 0)
                    }
                }
            },
            maxMoves: 5,
            targetScore: 100,
            description:
                'Swim the golden path. Be gentle with wildlife. Clean trash. Puzzle when you are ready (tool 3).',
            unlocked: true,
            stars: 0
        });

        // Level 2: Collect gems — win when collectedGems >= 2 via recordGemCollected
        this.levels.push({
            id: 2,
            name: 'Treasure Hunt',
            gridSize: { x: 4, y: 2, z: 4 },
            blocks: [
                { x: 0, y: 0, z: 0, type: 'start' },
                { x: 1, y: 0, z: 0, type: 'gem', required: true },
                { x: 2, y: 0, z: 0, type: 'rock' },
                { x: 3, y: 0, z: 0, type: 'gem', required: true },
                { x: 0, y: 1, z: 0, type: 'rock' },
                { x: 1, y: 1, z: 0, type: 'rock' },
                { x: 2, y: 1, z: 0, type: 'exit' },
            ],
            solution: {
                type: 'collect',
                target: { gems: 2 }
            },
            maxMoves: 8,
            targetScore: 200,
            description: 'Collect all gems (slide next to start, or press E on a selected gem)!',
            unlocked: false,
            stars: 0
        });

        // Level 3: Pattern alignment — three gems in a contiguous straight line
        this.levels.push({
            id: 3,
            name: 'Ancient Pattern',
            gridSize: { x: 5, y: 2, z: 5 },
            blocks: [
                { x: 0, y: 0, z: 0, type: 'start' },
                { x: 1, y: 0, z: 0, type: 'gem' },
                { x: 2, y: 0, z: 1, type: 'gem' },
                { x: 3, y: 0, z: 0, type: 'gem' },
                { x: 4, y: 0, z: 0, type: 'exit' },
                { x: 0, y: 1, z: 0, type: 'rock' },
                { x: 1, y: 1, z: 0, type: 'rock' },
                { x: 2, y: 1, z: 0, type: 'rock' },
                { x: 3, y: 1, z: 0, type: 'rock' },
            ],
            solution: {
                type: 'align',
                target: {
                    pattern: ['gem', 'gem', 'gem']
                }
            },
            maxMoves: 10,
            targetScore: 300,
            description: 'Align the gems in a contiguous row to unlock the exit!',
            unlocked: false,
            stars: 0
        });

        // Levels 4–30: deterministic from seeded PRNG (level id)
        for (let i = 4; i <= 30; i++) {
            this.levels.push(this.generateLevel(i));
        }
    }

    /**
     * Deterministic procedural level from id. Same id ⇒ same layout every load.
     */
    private generateLevel(id: number): LevelData {
        const rng = mulberry32(id * 2654435761);
        const difficulty = Math.floor((id - 1) / 5) + 1;
        const gridSize = {
            x: 3 + difficulty,
            y: 2 + Math.floor(difficulty / 2),
            z: 3 + difficulty
        };

        const blocks: BlockPlacement[] = [];
        const occupied = new Set<string>();

        const place = (x: number, y: number, z: number, type: BlockPlacement['type'], required?: boolean) => {
            const k = gridKey(x, y, z);
            if (occupied.has(k)) return false;
            occupied.add(k);
            const b: BlockPlacement = { x, y, z, type };
            if (required) b.required = true;
            blocks.push(b);
            return true;
        };

        place(0, 0, 0, 'start');
        place(gridSize.x - 1, gridSize.y - 1, gridSize.z - 1, 'exit');

        // Wall of rocks at mid-X so path levels are not free at spawn (still deterministic)
        const midX = Math.floor(gridSize.x / 2);
        for (let y = 0; y < gridSize.y; y++) {
            for (let z = 0; z < gridSize.z; z++) {
                place(midX, y, z, 'rock');
            }
        }

        const targetCount = Math.floor(
            (gridSize.x * gridSize.y * gridSize.z) * (0.25 + difficulty * 0.08)
        );
        const blockTypes: BlockPlacement['type'][] = ['rock', 'coral', 'gem', 'dark', 'glow'];
        let placed = 0;
        let attempts = 0;
        while (placed < targetCount && attempts < targetCount * 8) {
            attempts++;
            const x = Math.floor(rng() * gridSize.x);
            const y = Math.floor(rng() * gridSize.y);
            const z = Math.floor(rng() * gridSize.z);
            const type = blockTypes[Math.floor(rng() * blockTypes.length)];
            if (place(x, y, z, type, type === 'gem' && rng() > 0.5)) {
                placed++;
            }
        }

        // Mix solution types by id for variety (still deterministic)
        const roll = rng();
        let solution: SolutionCondition;
        if (roll < 0.55) {
            solution = {
                type: 'path',
                target: {
                    path: {
                        from: new THREE.Vector3(0, 0, 0),
                        to: new THREE.Vector3(gridSize.x - 1, gridSize.y - 1, gridSize.z - 1)
                    }
                }
            };
        } else if (roll < 0.75) {
            const gemCount = blocks.filter(b => b.type === 'gem').length;
            const need = Math.max(1, Math.min(gemCount, 1 + Math.floor(difficulty / 2)));
            solution = { type: 'collect', target: { gems: need } };
        } else if (roll < 0.9) {
            solution = { type: 'align', target: { pattern: ['gem', 'gem', 'gem'] } };
        } else {
            solution = { type: 'clear' };
        }

        return {
            id,
            name: `Abyssal Depth ${id}`,
            gridSize,
            blocks,
            solution,
            maxMoves: 10 + difficulty * 3,
            targetScore: 100 * id,
            description: `Navigate through the abyss. Difficulty: ${difficulty}/5`,
            unlocked: false,
            stars: 0
        };
    }

    startLevel(levelId: number): boolean {
        const level = this.levels.find(l => l.id === levelId);
        if (!level) {
            console.warn(`Level ${levelId} not found`);
            return false;
        }
        if (!level.unlocked) {
            console.warn(`Level ${levelId} is locked`);
            return false;
        }

        console.log(`Starting level ${levelId}: ${level.name}`);
        this.currentLevel = levelId;
        this.currentLevelData = level;
        this.moves = 0;
        this.score = 0;
        this.stars = 0;
        this.collectedGems = 0;
        this.bonusMoves = 0;

        return true;
    }

    recordMove(): void {
        this.moves++;
    }

    /**
     * Agent D / UpgradeSystem: grant extra moves for this run only.
     * Prefer setBonusMoves (absolute) or addBonusMoves / addMoves (relative).
     */
    setBonusMoves(n: number): void {
        this.bonusMoves = Math.max(0, n | 0);
    }

    addBonusMoves(n: number): void {
        this.bonusMoves = Math.max(0, this.bonusMoves + (n | 0));
    }

    /** Alias expected by Game.applyUpgradeEffectsToLevel. */
    addMoves(n: number): void {
        this.addBonusMoves(n);
    }

    /** Decrement move counter on undo (never below 0). */
    undoMove(): void {
        if (this.moves > 0) this.moves--;
    }

    /**
     * Record one or more gems collected during play.
     * Call from BlockPuzzleSystem when a gem is picked up (adjacent to start, or E key).
     */
    recordGemCollected(count: number = 1): void {
        if (count <= 0) return;
        this.collectedGems += count;
        console.log(`💎 Gem collected (+${count}). Total: ${this.collectedGems}`);
    }

    getCollectedGems(): number {
        return this.collectedGems;
    }

    /** Restore gem counter on undo (BlockPuzzleSystem). */
    setCollectedGems(count: number): void {
        this.collectedGems = Math.max(0, count | 0);
    }

    getRequiredGems(): number {
        return this.currentLevelData?.solution?.target?.gems ?? 0;
    }

    getMaxMoves(): number {
        return (this.currentLevelData?.maxMoves ?? 0) + this.bonusMoves;
    }

    getBonusMoves(): number {
        return this.bonusMoves;
    }

    /**
     * Honest win check.
     * Preferred: array of serializable block states with types + positions.
     * Legacy: Map keyed by "x,y,z" → world Vector3 (types inferred weak; path may fail).
     */
    checkWinCondition(
        blockPositions: SerializableBlockState[] | Map<string, THREE.Vector3>
    ): boolean {
        if (!this.currentLevelData) return false;

        const blocks = this.normalizeBlocks(blockPositions);
        const solution = this.currentLevelData.solution;

        switch (solution.type) {
            case 'path':
                return this.checkPath(blocks);
            case 'collect':
                return this.checkGemsCollected();
            case 'align':
                return this.checkPattern(blocks);
            case 'clear':
                return this.checkCleared(blocks);
            default:
                return false;
        }
    }

    private normalizeBlocks(
        input: SerializableBlockState[] | Map<string, THREE.Vector3>
    ): SerializableBlockState[] {
        if (Array.isArray(input)) {
            return input;
        }
        // Legacy Map: only positions — type unknown, mark as rock (blocking)
        const out: SerializableBlockState[] = [];
        let i = 0;
        input.forEach((_world, key) => {
            const [x, y, z] = key.split(',').map(Number);
            out.push({ id: `legacy_${i++}`, x, y, z, type: 'rock' });
        });
        return out;
    }

    /**
     * Real connectivity: BFS on grid from current start block to current exit block.
     * Walkable = empty cell OR non-blocking type (start/exit/gem/glow).
     * Blocked by rock / coral / dark.
     */
    private checkPath(blocks: SerializableBlockState[]): boolean {
        if (!this.currentLevelData) return false;
        return hasPathStartToExit(blocks, this.currentLevelData.gridSize as GridSize);
    }

    /**
     * Honest collect win: collectedGems counter must meet solution target.
     * Does NOT stub based on remaining gem blocks.
     */
    private checkGemsCollected(_blockPositions?: SerializableBlockState[]): boolean {
        if (!this.currentLevelData) return false;
        const required =
            this.currentLevelData.solution.target?.gems ??
            this.currentLevelData.blocks.filter(b => b.type === 'gem' && b.required).length;
        if (required <= 0) return false;
        return this.collectedGems >= required;
    }

    /**
     * Align: required pattern of types appears as contiguous cells along X, Y, or Z.
     * Default pattern ['gem','gem','gem'] = three gems in a straight line.
     */
    private checkPattern(blocks: SerializableBlockState[]): boolean {
        if (!this.currentLevelData) return false;

        const pattern = this.currentLevelData.solution.target?.pattern ?? ['gem', 'gem', 'gem'];
        if (pattern.length === 0) return false;

        const byCell = new Map<string, string>();
        for (const b of blocks) {
            byCell.set(gridKey(b.x, b.y, b.z), b.type);
        }

        const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
        const size = this.currentLevelData.gridSize;

        for (const b of blocks) {
            for (const axis of axes) {
                if (this.matchesPatternFrom(b.x, b.y, b.z, axis, 1, pattern, byCell, size)) {
                    return true;
                }
                if (this.matchesPatternFrom(b.x, b.y, b.z, axis, -1, pattern, byCell, size)) {
                    return true;
                }
            }
        }
        return false;
    }

    private matchesPatternFrom(
        x: number,
        y: number,
        z: number,
        axis: 'x' | 'y' | 'z',
        dir: number,
        pattern: string[],
        byCell: Map<string, string>,
        size: GridSize
    ): boolean {
        for (let i = 0; i < pattern.length; i++) {
            const cx = x + (axis === 'x' ? dir * i : 0);
            const cy = y + (axis === 'y' ? dir * i : 0);
            const cz = z + (axis === 'z' ? dir * i : 0);
            if (!inBounds(cx, cy, cz, size)) return false;
            const t = byCell.get(gridKey(cx, cy, cz));
            if (t !== pattern[i]) return false;
        }
        return true;
    }

    /**
     * Clear: no rock / coral / dark obstacles remain.
     * BlockPuzzleSystem removes non-start/exit blocks that slide off-grid.
     */
    private checkCleared(blocks: SerializableBlockState[]): boolean {
        if (!this.currentLevelData) return false;
        const obstacles = blocks.filter(
            b => b.type === 'rock' || b.type === 'coral' || b.type === 'dark'
        );
        return obstacles.length === 0;
    }

    calculateStars(): number {
        if (!this.currentLevelData) return 0;

        const max = this.getMaxMoves() || this.currentLevelData.maxMoves;
        const moveRatio = this.moves / max;
        const scoreRatio =
            this.currentLevelData.targetScore > 0
                ? this.score / this.currentLevelData.targetScore
                : 1;

        // Prefer move efficiency; score is optional bonus
        if (moveRatio <= 0.5) return 3;
        if (moveRatio <= 0.75) return 2;
        if (moveRatio <= 1.0) return 1;
        // Over max moves should not normally complete, but if it does:
        if (scoreRatio >= 0.6) return 1;
        return 0;
    }

    completeLevel(): { stars: number; score: number; unlocked: number[] } {
        if (!this.currentLevelData) {
            return { stars: 0, score: 0, unlocked: [] };
        }

        // Base score from remaining move budget
        const remaining = Math.max(0, this.getMaxMoves() - this.moves);
        this.score = Math.max(this.score, remaining * 20 + this.stars * 50 + 50);

        this.stars = this.calculateStars();
        this.score = Math.max(this.score, this.stars * 50 + remaining * 20 + 50);
        this.currentLevelData.stars = Math.max(this.currentLevelData.stars, this.stars);
        this.setBestScore(this.currentLevel, this.score);

        // Gift day: award pearls (primary currency) + keep gems in store for legacy shop
        const pearlReward = this.stars * 10 + 15;
        const store = (window as any).useGameStore;
        if (store) {
            store.getState().addGems?.(pearlReward);
        }
        try {
            const game = (window as any).game;
            game?.getUpgradeSystem?.()?.addCurrency?.(pearlReward);
            console.log(`◆ Level complete! +${pearlReward} pearls (${this.stars} stars)`);
        } catch {
            /* soft */
        }

        // Unlock next level
        const nextLevel = this.levels.find(l => l.id === this.currentLevel + 1);
        const unlocked: number[] = [];

        if (nextLevel && this.stars > 0) {
            nextLevel.unlocked = true;
            unlocked.push(nextLevel.id);
        }

        return {
            stars: this.stars,
            score: this.score,
            unlocked
        };
    }

    getCurrentLevel(): LevelData | null {
        return this.currentLevelData;
    }

    getAllLevels(): LevelData[] {
        return this.levels;
    }

    getMoves(): number {
        return this.moves;
    }

    getScore(): number {
        return this.score;
    }

    addScore(points: number): void {
        this.score += points;
    }

    isLevelUnlocked(levelId: number): boolean {
        const level = this.levels.find(l => l.id === levelId);
        return level ? level.unlocked : false;
    }

    /**
     * Serialize unlocks / stars / best scores for AccountSystem persistence.
     */
    serializeProgress(): LevelProgress[] {
        return this.levels.map((level) => ({
            id: level.id,
            unlocked: level.unlocked,
            stars: level.stars,
            bestScore: this.bestScores.get(level.id) ?? 0,
        }));
    }

    /**
     * Apply saved progress onto in-memory levels (does not rewrite layouts / win logic).
     */
    applyProgress(data: LevelProgress[] | Array<{ id: number; unlocked: boolean; stars: number; bestScore?: number }>): void {
        if (!data || data.length === 0) return;

        for (const entry of data) {
            const level = this.levels.find((l) => l.id === entry.id);
            if (!level) continue;

            level.unlocked = Boolean(entry.unlocked);
            level.stars = Math.max(0, Math.min(3, entry.stars ?? 0));

            const best = entry.bestScore ?? 0;
            const prev = this.bestScores.get(entry.id) ?? 0;
            this.bestScores.set(entry.id, Math.max(prev, best));
        }

        // Always keep level 1 unlocked
        const l1 = this.levels.find((l) => l.id === 1);
        if (l1) l1.unlocked = true;
    }

    /** Alias used by some call sites / older drafts. */
    getProgressSnapshot(): LevelProgress[] {
        return this.serializeProgress();
    }

    setBestScore(levelId: number, score: number): void {
        const prev = this.bestScores.get(levelId) ?? 0;
        if (score > prev) {
            this.bestScores.set(levelId, score);
        }
    }
}
