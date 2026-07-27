/**
 * World layout: open deep-blue ocean + discrete reef islands.
 * Birthday scale: 7 reefs, ~75–90 unit hops, sparse corridors.
 */

export interface ReefZone {
    id: string;
    name: string;
    x: number;
    z: number;
    radius: number;
    shelfY: number;
    color: string;
    blurb: string;
}

/** Named reefs — breathing room between each. */
export const REEF_ZONES: ReefZone[] = [
    {
        id: 'home_reef',
        name: 'Home Reef',
        x: 0,
        z: 0,
        radius: 15,
        shelfY: -2.5,
        color: '#00d4ff',
        blurb: 'Dive start — golden path, turtle friend, manta sky',
    },
    {
        id: 'east_garden',
        name: 'East Garden',
        x: 82,
        z: 18,
        radius: 13,
        shelfY: -3.0,
        color: '#ff8c42',
        blurb: 'Warm coral towers past the open blue',
    },
    {
        id: 'north_drop',
        name: 'North Drop',
        x: -12,
        z: -88,
        radius: 12,
        shelfY: -4.2,
        color: '#c77dff',
        blurb: 'Deeper edge — lanternfish & mystery',
    },
    {
        id: 'west_meadow',
        name: 'Kelp Meadow',
        x: -78,
        z: 42,
        radius: 13,
        shelfY: -2.8,
        color: '#4caf70',
        blurb: 'Seagrass walls & seahorses',
    },
    {
        id: 'south_ridge',
        name: 'South Ridge',
        x: 28,
        z: 95,
        radius: 12,
        shelfY: -3.4,
        color: '#ffd166',
        blurb: 'Sunny sand ridge — turtle cleaning station',
    },
    {
        id: 'wreck_cove',
        name: 'Wreck Cove',
        x: 95,
        z: -55,
        radius: 14,
        shelfY: -3.6,
        color: '#e76f51',
        blurb: 'Ghost nets & ranger rescue missions',
    },
    {
        id: 'blue_gate',
        name: 'Blue Gate',
        x: -70,
        z: -70,
        radius: 11,
        shelfY: -5.0,
        color: '#4cc9f0',
        blurb: 'Gateway to the deep — plan your air',
    },
];

/** World bounds for map (half-extent). */
export const WORLD_MAP_EXTENT = 160;

/** Mid-corridor landmarks (empty blue with one interest). */
export const CORRIDOR_LANDMARKS: { x: number; z: number; label: string }[] = [
    { x: 40, z: 8, label: 'Buoy' },
    { x: -6, z: -42, label: 'Ridge' },
    { x: -38, z: 18, label: 'Arch' },
    { x: 14, z: 48, label: 'Float' },
    { x: 48, z: -28, label: 'Marker' },
    { x: -40, z: -35, label: 'Pinnacle' },
];

export function dist2d(x: number, z: number, reef: ReefZone): number {
    return Math.hypot(x - reef.x, z - reef.z);
}

export function nearestReef(x: number, z: number): { reef: ReefZone; dist: number } {
    let best = REEF_ZONES[0];
    let bestD = dist2d(x, z, best);
    for (let i = 1; i < REEF_ZONES.length; i++) {
        const d = dist2d(x, z, REEF_ZONES[i]);
        if (d < bestD) {
            bestD = d;
            best = REEF_ZONES[i];
        }
    }
    return { reef: best, dist: bestD };
}

export function reefInfluence(x: number, z: number): number {
    let maxInf = 0;
    for (const reef of REEF_ZONES) {
        const d = dist2d(x, z, reef);
        const inner = reef.radius * 0.7;
        const outer = reef.radius * 1.35;
        let inf = 0;
        if (d <= inner) inf = 1;
        else if (d < outer) {
            const t = (d - inner) / (outer - inner);
            inf = 1 - t * t * (3 - 2 * t);
        }
        if (inf > maxInf) maxInf = inf;
    }
    return maxInf;
}

export function isOnReef(x: number, z: number, pad = 1.0): boolean {
    for (const reef of REEF_ZONES) {
        if (dist2d(x, z, reef) <= reef.radius * pad) return true;
    }
    return false;
}

export function randomInReef(
    reef: ReefZone,
    minFrac = 0.15,
    maxFrac = 0.92
): { x: number; z: number } {
    const a = Math.random() * Math.PI * 2;
    const r = reef.radius * (minFrac + Math.random() * (maxFrac - minFrac));
    return { x: reef.x + Math.cos(a) * r, z: reef.z + Math.sin(a) * r };
}

export function pickReefWeighted(): ReefZone {
    const weights = REEF_ZONES.map((r) => (r.id === 'home_reef' ? 2.5 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < REEF_ZONES.length; i++) {
        r -= weights[i];
        if (r <= 0) return REEF_ZONES[i];
    }
    return REEF_ZONES[0];
}

export function randomOpenWater(
    minAway = 28,
    maxR = 120
): { x: number; z: number } {
    for (let attempt = 0; attempt < 50; attempt++) {
        const a = Math.random() * Math.PI * 2;
        const r = 35 + Math.random() * (maxR - 35);
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (nearestReef(x, z).dist >= minAway) return { x, z };
    }
    return { x: 50, z: 50 };
}
