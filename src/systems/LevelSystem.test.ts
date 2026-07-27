import { describe, it, expect } from 'vitest';
import { LevelSystem } from './LevelSystem';
import type { SerializableBlockState } from './GridMath';

function getBlocks(levels: LevelSystem): SerializableBlockState[] {
    return levels.getCurrentLevel()!.blocks.map((b, i) => ({
        id: `b${i}`,
        x: b.x,
        y: b.y,
        z: b.z,
        type: b.type,
    }));
}

describe('LevelSystem', () => {
    it('starts level 1 unlocked', () => {
        const levels = new LevelSystem();
        expect(levels.startLevel(1)).toBe(true);
        expect(levels.getCurrentLevel()?.id).toBe(1);
    });

    it('does not start locked levels', () => {
        const levels = new LevelSystem();
        expect(levels.startLevel(2)).toBe(false);
    });

    it('detects a losing initial state for level 1', () => {
        const levels = new LevelSystem();
        levels.startLevel(1);
        expect(levels.checkWinCondition(getBlocks(levels))).toBe(false);
    });

    it('detects a winning path state for level 1', () => {
        const levels = new LevelSystem();
        levels.startLevel(1);

        // Initial level 1 blocks:
        // (0,0,0) start, (1,0,0) rock, (2,0,0) exit, (0,1,0) rock, (1,1,0) rock
        // Move the blocking rock from (1,0,0) to (2,1,0) to clear the y=0 path.
        const state = getBlocks(levels).map((b) => {
            if (b.x === 1 && b.y === 0 && b.z === 0 && b.type === 'rock') {
                return { ...b, x: 2, y: 1 };
            }
            return b;
        });

        expect(levels.checkWinCondition(state)).toBe(true);
    });

    it('calculates stars based on move efficiency', () => {
        const levels = new LevelSystem();
        levels.startLevel(1);
        // Level 1 maxMoves = 5; winning in 2 moves should give 3 stars.
        levels.recordMove();
        levels.recordMove();
        expect(levels.calculateStars()).toBe(3);
    });
});
