/**
 * HOME REEF STAGE — structural bones for the birthday vertical slice.
 *
 * Single source of truth for:
 *  - spawn pose
 *  - sand corridor axis
 *  - memory-hero placements
 *  - first-session objective copy
 *
 * Other reefs do not invent their own numbers until this stage is locked.
 */

export const HOME_REEF_ID = 'home_reef';

/** Jasmine spawn (physics body centre) — on the golden path */
export const SPAWN = {
    x: 0,
    y: 2.4,
    z: 3.5,
} as const;

/** Corridor runs +Z from spawn toward open blue / wreck */
export const PATH = {
    /** Lane width (world units) */
    width: 5.2,
    /** Length along +Z */
    length: 22,
    /** Centre of lane on Z */
    centerZ: 10,
} as const;

/**
 * Memory heroes — ONE of each emotional role.
 * Positions are stage marks, not ambient spawns.
 */
export const MEMORY_HEROES = {
    friendTurtle: {
        speciesId: 'seaturtle',
        // Closer to path so first 30s can find her without hunting
        x: -4.6,
        y: 2.35,
        z: 7.2,
        scale: 2.15,
        trust: 0.55,
        role: 'friend_turtle' as const,
    },
    skyManta: {
        speciesId: 'manta',
        x: -7.5,
        y: 5.5,
        z: 7.0,
        scale: 2.55,
        trust: 0.55,
        role: 'sky_manta' as const,
    },
    respectShark: {
        speciesId: 'shark',
        x: 10.5,
        y: 3.0,
        z: 13.5,
        scale: 2.25,
        trust: 0.6,
        role: 'respect_shark' as const,
    },
    lanternJellyA: {
        speciesId: 'jellyfish',
        x: 4.5,
        y: 3.6,
        z: 8.2,
        scale: 1.85,
        trust: 0.45,
        role: 'lantern_jelly' as const,
    },
    lanternJellyB: {
        speciesId: 'jellyfish',
        x: 6.2,
        y: 3.2,
        z: 10.0,
        scale: 1.55,
        trust: 0.45,
        role: 'lantern_jelly' as const,
    },
} as const;

/** Path ribbon — few school fish, not a carpet */
export const PATH_RIBBON: Array<{
    speciesId: string;
    x: number;
    y: number;
    z: number;
    scale: number;
}> = [
    { speciesId: 'clownfish', x: -2.5, y: 1.9, z: 5.5, scale: 1.15 },
    { speciesId: 'blue_tang', x: -1.4, y: 2.05, z: 6.9, scale: 1.15 },
    { speciesId: 'butterfly_fish', x: -0.3, y: 2.2, z: 8.3, scale: 1.15 },
];

/** Kid-facing first objective (not puzzle-first) */
export const FIRST_DIVE_OBJECTIVE =
    'Follow the golden path. Swim gentle — a friend may come to see you.';

export const FIRST_DIVE_OBJECTIVE_TITLE = 'HOME REEF';

/** Chase camera offset (behind / above Jasmine) — classic over-shoulder swim cam */
export const CAMERA_OFFSET = {
    y: 1.75,
    z: 5.4,
} as const;

/**
 * Manta glide trigger — when Jasmine crosses this Z on the path.
 */
export const MANTA_TRIGGER_Z = 4.5;

/**
 * Turtle notice radius (calm required).
 */
export const TURTLE_NOTICE_DIST = 14;
