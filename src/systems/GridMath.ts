/**
 * GridMath — shared grid helpers for BlockPuzzleSystem + LevelSystem.
 * Coordinate key format: "x,y,z" (integer grid indices).
 */

export type GridAxis = 'x' | 'y' | 'z';

export interface GridCoord {
    x: number;
    y: number;
    z: number;
}

export interface GridSize {
    x: number;
    y: number;
    z: number;
}

/** Serializable block snapshot for undo + win checks (no mesh/body refs). */
export interface SerializableBlockState {
    id: string;
    x: number;
    y: number;
    z: number;
    type: string;
}

export function gridKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
}

export function parseGridKey(key: string): GridCoord {
    const [x, y, z] = key.split(',').map(Number);
    return { x, y, z };
}

export function inBounds(x: number, y: number, z: number, size: GridSize): boolean {
    return x >= 0 && y >= 0 && z >= 0 && x < size.x && y < size.y && z < size.z;
}

export const NEIGHBOR6: ReadonlyArray<GridCoord> = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
];

/**
 * Obstacle types that block pathfinding (solid walls).
 * start / exit / gem / glow are walkable (path may pass through them).
 */
export function isBlockingType(type: string): boolean {
    return type === 'rock' || type === 'coral' || type === 'dark';
}

/**
 * BFS: can we walk from start → exit through non-blocking cells?
 * Empty cells are walkable. Blocking block types obstruct.
 * Start/exit cells are always walkable endpoints.
 */
export function hasPathStartToExit(
    blocks: Array<{ x: number; y: number; z: number; type: string }>,
    gridSize: GridSize
): boolean {
    const start = blocks.find(b => b.type === 'start');
    const exit = blocks.find(b => b.type === 'exit');
    if (!start || !exit) return false;

    const blocked = new Set<string>();
    for (const b of blocks) {
        if (isBlockingType(b.type)) {
            blocked.add(gridKey(b.x, b.y, b.z));
        }
    }

    const startKey = gridKey(start.x, start.y, start.z);
    const exitKey = gridKey(exit.x, exit.y, exit.z);

    // Start/exit never count as blocked even if mis-typed
    blocked.delete(startKey);
    blocked.delete(exitKey);

    if (startKey === exitKey) return true;

    const visited = new Set<string>([startKey]);
    const queue: GridCoord[] = [{ x: start.x, y: start.y, z: start.z }];

    while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const d of NEIGHBOR6) {
            const nx = cur.x + d.x;
            const ny = cur.y + d.y;
            const nz = cur.z + d.z;
            if (!inBounds(nx, ny, nz, gridSize)) continue;
            const k = gridKey(nx, ny, nz);
            if (visited.has(k) || blocked.has(k)) continue;
            if (k === exitKey) return true;
            visited.add(k);
            queue.push({ x: nx, y: ny, z: nz });
        }
    }
    return false;
}

/**
 * Mulberry32 seeded PRNG — same seed ⇒ same sequence (deterministic levels).
 */
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** World position for a grid cell (matches BlockPuzzleSystem layout). */
export function gridToWorld(
    gridX: number,
    gridY: number,
    gridZ: number,
    gridSize: GridSize,
    blockSize: number
): { x: number; y: number; z: number } {
    return {
        x: (gridX - gridSize.x / 2) * blockSize,
        y: gridY * blockSize,
        z: (gridZ - gridSize.z / 2) * blockSize,
    };
}
