import * as THREE from 'three';
export class LevelSystem {
    constructor() {
        Object.defineProperty(this, "levels", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "currentLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "currentLevelData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "moves", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "score", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "stars", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.initializeLevels();
    }
    initializeLevels() {
        // Level 1: Tutorial - Simple path
        this.levels.push({
            id: 1,
            name: 'First Dive',
            gridSize: { x: 3, y: 2, z: 3 },
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
            description: 'Slide the middle row to create a path from start to exit!',
            unlocked: true,
            stars: 0
        });
        // Level 2: Collect gems
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
            description: 'Collect all gems before reaching the exit!',
            unlocked: false,
            stars: 0
        });
        // Level 3: Pattern alignment
        this.levels.push({
            id: 3,
            name: 'Ancient Pattern',
            gridSize: { x: 5, y: 2, z: 5 },
            blocks: [
                { x: 0, y: 0, z: 0, type: 'start' },
                { x: 1, y: 0, z: 0, type: 'gem' },
                { x: 2, y: 0, z: 0, type: 'gem' },
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
            description: 'Align the gems in a row to unlock the exit!',
            unlocked: false,
            stars: 0
        });
        // Add more levels (up to 30)
        for (let i = 4; i <= 30; i++) {
            this.levels.push(this.generateLevel(i));
        }
    }
    generateLevel(id) {
        const difficulty = Math.floor((id - 1) / 5) + 1;
        const gridSize = {
            x: 3 + difficulty,
            y: 2 + Math.floor(difficulty / 2),
            z: 3 + difficulty
        };
        const blocks = [];
        const blockCount = (gridSize.x * gridSize.y * gridSize.z) * (0.3 + difficulty * 0.1);
        // Add start block
        blocks.push({ x: 0, y: 0, z: 0, type: 'start' });
        // Add exit block
        blocks.push({
            x: gridSize.x - 1,
            y: gridSize.y - 1,
            z: gridSize.z - 1,
            type: 'exit'
        });
        // Add random blocks
        const blockTypes = ['rock', 'coral', 'gem', 'dark', 'glow'];
        for (let i = 0; i < blockCount; i++) {
            const x = Math.floor(Math.random() * gridSize.x);
            const y = Math.floor(Math.random() * gridSize.y);
            const z = Math.floor(Math.random() * gridSize.z);
            // Don't overlap with start/exit
            if ((x === 0 && y === 0 && z === 0) ||
                (x === gridSize.x - 1 && y === gridSize.y - 1 && z === gridSize.z - 1)) {
                continue;
            }
            const type = blockTypes[Math.floor(Math.random() * blockTypes.length)];
            blocks.push({ x, y, z, type });
        }
        return {
            id,
            name: `Abyssal Depth ${id}`,
            gridSize,
            blocks,
            solution: {
                type: 'path',
                target: {
                    path: {
                        from: new THREE.Vector3(0, 0, 0),
                        to: new THREE.Vector3(gridSize.x - 1, gridSize.y - 1, gridSize.z - 1)
                    }
                }
            },
            maxMoves: 10 + difficulty * 3,
            targetScore: 100 * id,
            description: `Navigate through the abyss. Difficulty: ${difficulty}/5`,
            unlocked: false,
            stars: 0
        };
    }
    startLevel(levelId) {
        const level = this.levels.find(l => l.id === levelId);
        if (!level || !level.unlocked) {
            return false;
        }
        this.currentLevel = levelId;
        this.currentLevelData = level;
        this.moves = 0;
        this.score = 0;
        this.stars = 0;
        return true;
    }
    recordMove() {
        this.moves++;
    }
    checkWinCondition(blockPositions) {
        if (!this.currentLevelData)
            return false;
        const solution = this.currentLevelData.solution;
        switch (solution.type) {
            case 'path':
                // Check if path exists from start to exit
                return this.checkPath(blockPositions);
            case 'collect':
                // Check if required gems collected
                return this.checkGemsCollected(blockPositions);
            case 'align':
                // Check if pattern aligned
                return this.checkPattern(blockPositions);
            case 'clear':
                // Check if obstacles cleared
                return this.checkCleared(blockPositions);
            default:
                return false;
        }
    }
    checkPath(blockPositions) {
        // Simplified path check - in production, use pathfinding
        if (!this.currentLevelData)
            return false;
        const start = this.currentLevelData.blocks.find(b => b.type === 'start');
        const exit = this.currentLevelData.blocks.find(b => b.type === 'exit');
        if (!start || !exit)
            return false;
        // Check if exit is reachable (simplified)
        const startPos = blockPositions.get(`${start.x},${start.y},${start.z}`);
        const exitPos = blockPositions.get(`${exit.x},${exit.y},${exit.z}`);
        return startPos !== undefined && exitPos !== undefined;
    }
    checkGemsCollected(blockPositions) {
        if (!this.currentLevelData)
            return false;
        const requiredGems = this.currentLevelData.blocks.filter(b => b.type === 'gem' && b.required);
        return requiredGems.length === 0; // All collected
    }
    checkPattern(blockPositions) {
        // Check if gems are aligned in pattern
        // Simplified - check if gems are in a row
        return true; // Placeholder
    }
    checkCleared(blockPositions) {
        // Check if obstacles cleared
        return true; // Placeholder
    }
    calculateStars() {
        if (!this.currentLevelData)
            return 0;
        const moveRatio = this.moves / this.currentLevelData.maxMoves;
        const scoreRatio = this.score / this.currentLevelData.targetScore;
        if (moveRatio <= 0.5 && scoreRatio >= 1.0)
            return 3;
        if (moveRatio <= 0.75 && scoreRatio >= 0.8)
            return 2;
        if (moveRatio <= 1.0 && scoreRatio >= 0.6)
            return 1;
        return 0;
    }
    completeLevel() {
        if (!this.currentLevelData) {
            return { stars: 0, score: 0, unlocked: [] };
        }
        this.stars = this.calculateStars();
        this.currentLevelData.stars = Math.max(this.currentLevelData.stars, this.stars);
        // Unlock next level
        const nextLevel = this.levels.find(l => l.id === this.currentLevel + 1);
        const unlocked = [];
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
    getCurrentLevel() {
        return this.currentLevelData;
    }
    getAllLevels() {
        return this.levels;
    }
    getMoves() {
        return this.moves;
    }
    getScore() {
        return this.score;
    }
    addScore(points) {
        this.score += points;
    }
    isLevelUnlocked(levelId) {
        const level = this.levels.find(l => l.id === levelId);
        return level ? level.unlocked : false;
    }
}
