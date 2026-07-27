import { describe, it, expect } from 'vitest';
import {
    gridKey,
    parseGridKey,
    inBounds,
    hasPathStartToExit,
    isBlockingType,
    mulberry32,
    gridToWorld,
} from './GridMath';

describe('GridMath', () => {
    it('gridKey / parseGridKey round-trip', () => {
        expect(gridKey(1, 2, 3)).toBe('1,2,3');
        expect(parseGridKey('1,2,3')).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('inBounds respects size', () => {
        const size = { x: 3, y: 2, z: 1 };
        expect(inBounds(0, 0, 0, size)).toBe(true);
        expect(inBounds(2, 1, 0, size)).toBe(true);
        expect(inBounds(3, 0, 0, size)).toBe(false);
        expect(inBounds(-1, 0, 0, size)).toBe(false);
    });

    it('isBlockingType matches solid obstacles', () => {
        expect(isBlockingType('rock')).toBe(true);
        expect(isBlockingType('coral')).toBe(true);
        expect(isBlockingType('dark')).toBe(true);
        expect(isBlockingType('start')).toBe(false);
        expect(isBlockingType('exit')).toBe(false);
        expect(isBlockingType('gem')).toBe(false);
    });

    it('hasPathStartToExit is false when rock blocks corridor', () => {
        const blocks = [
            { x: 0, y: 0, z: 0, type: 'start' },
            { x: 1, y: 0, z: 0, type: 'rock' },
            { x: 2, y: 0, z: 0, type: 'exit' },
        ];
        expect(hasPathStartToExit(blocks, { x: 3, y: 1, z: 1 })).toBe(false);
    });

    it('hasPathStartToExit is true when corridor is clear', () => {
        const blocks = [
            { x: 0, y: 0, z: 0, type: 'start' },
            { x: 2, y: 0, z: 0, type: 'exit' },
            { x: 1, y: 0, z: 0, type: 'gem' },
        ];
        expect(hasPathStartToExit(blocks, { x: 3, y: 1, z: 1 })).toBe(true);
    });

    it('mulberry32 is deterministic', () => {
        const a = mulberry32(42);
        const b = mulberry32(42);
        expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it('gridToWorld centres the grid', () => {
        const p = gridToWorld(1, 0, 1, { x: 3, y: 1, z: 3 }, 1);
        expect(p.x).toBeCloseTo(-0.5);
        expect(p.y).toBe(0);
        expect(p.z).toBeCloseTo(-0.5);
    });
});
