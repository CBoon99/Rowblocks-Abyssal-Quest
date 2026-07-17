/**
 * Shared progress / account types for Rowblocks Abyssal Quest.
 * Used by AccountSystem, LevelSystem, UpgradeSystem, and GameStore hydrate.
 */

export interface LevelProgress {
    id: number;
    unlocked: boolean;
    stars: number;
    bestScore: number;
}

export interface QuestProgress {
    id: string;
    current: number;
    completed: boolean;
}

export interface CollectedFish {
    type: string;
    name: string;
    depth: number;
    timestamp: number;
    description: string;
}

export interface UpgradeProgress {
    currency: number; // pearls
    upgrades: Record<string, number>;
}

export interface StoreProgressSnapshot {
    gems: number;
    collectedFish: CollectedFish[];
    quests: QuestProgress[];
    currentSkin: string;
    ownedSkins: string[];
    helmetUpgrade: number;
    netRange: number;
    /** Conservation / ranger progression (synced with profile). */
    conservationPoints: number;
    rangerRankId: string;
    cleanups: number;
    rescues: number;
    speciesDiscovered: string[];
}

export interface RowblocksProfile {
    id: string;
    displayName: string;
    pin?: string;
    createdAt: number;
    lastPlayedAt: number;
    pearls: number;
    gems: number;
    levels: LevelProgress[];
    collectedFish: CollectedFish[];
    quests: QuestProgress[];
    currentSkin: string;
    ownedSkins: string[];
    helmetUpgrade: number;
    netRange: number;
    upgrades: Record<string, number>;
    /** Ocean ranger / conservation progression */
    conservationPoints: number;
    rangerRankId: string;
    cleanups: number;
    rescues: number;
    /** Discovered species ids (content species.json). */
    speciesDiscovered: string[];
}

export interface AccountState {
    version: 1;
    activeProfileId: string | null;
    profiles: RowblocksProfile[];
}

export const ACCOUNT_STORAGE_KEY = 'rowblocks_abyssal_account_v1';

export const DEFAULT_LEVEL_COUNT = 30;

/** Starter ranger rank id (content/ranger_ranks.json). */
export const DEFAULT_RANGER_RANK_ID = 'tide_explorer';

/** Build default level progress (L1 unlocked, rest locked). */
export function createDefaultLevels(count: number = DEFAULT_LEVEL_COUNT): LevelProgress[] {
    const levels: LevelProgress[] = [];
    for (let id = 1; id <= count; id++) {
        levels.push({
            id,
            unlocked: id === 1,
            stars: 0,
            bestScore: 0,
        });
    }
    return levels;
}

/** Create a blank profile shell with starter economy. */
export function createEmptyProfile(
    displayName: string,
    pin?: string,
    options?: { pearls?: number; gems?: number; conservationPoints?: number }
): RowblocksProfile {
    const now = Date.now();
    return {
        id: generateProfileId(),
        displayName,
        pin,
        createdAt: now,
        lastPlayedAt: now,
        pearls: options?.pearls ?? 0,
        gems: options?.gems ?? 0,
        levels: createDefaultLevels(),
        collectedFish: [],
        quests: [],
        currentSkin: 'default',
        ownedSkins: ['default'],
        helmetUpgrade: 0,
        netRange: 5.0,
        upgrades: {},
        conservationPoints: options?.conservationPoints ?? 0,
        rangerRankId: DEFAULT_RANGER_RANK_ID,
        cleanups: 0,
        rescues: 0,
        speciesDiscovered: [],
    };
}

export function generateProfileId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `profile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
