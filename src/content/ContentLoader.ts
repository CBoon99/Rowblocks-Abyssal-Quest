/**
 * Content loader for educational species, missions, and ranger ranks.
 * Reads JSON from /content (bundled via Vite import).
 *
 * Functional API (EducationSystem / ConservationSystem / GameStore):
 *   getSpeciesById, getAllSpecies, getMissions, getRangerRanks, getRankForCp
 *
 * Class API (MarinepediaUI compat):
 *   ContentLoader.getAllSpecies() → SpeciesData[]
 */

import speciesJson from '../../content/species.json';
import missionsJson from '../../content/missions.json';
import rangerRanksJson from '../../content/ranger_ranks.json';

export type SpeciesRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | string;

/** Canonical species record used by EducationSystem + JSON content. */
export interface Species {
    id: string;
    type?: string;
    name: string;
    commonName?: string;
    scientificName?: string;
    emoji?: string;
    icon?: string;
    rarity?: SpeciesRarity;
    description?: string;
    funFact?: string;
    habitat?: string;
    ecologyRole?: string;
    threats?: string;
    conservationTip?: string;
    minDepth?: number;
    maxDepth?: number;
    depthMin?: number;
    depthMax?: number;
    size?: string;
    diet?: string;
    lifespan?: string;
}

/** MarinepediaUI field-guide shape (subset + aliases). */
export interface SpeciesData {
    id: string;
    type: string;
    commonName: string;
    scientificName: string;
    icon: string;
    funFact: string;
    ecologyRole: string;
    threats: string;
    conservationTip: string;
    depthMin: number;
    depthMax: number;
    diet: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface MissionDef {
    id: string;
    name: string;
    description?: string;
    type?: string;
    target?: number;
    cpReward?: number;
    pearlReward?: number;
}

export interface RangerRank {
    id: string;
    name: string;
    minCp: number;
    badge?: string;
    description?: string;
}

function normalizeSpecies(raw: Record<string, unknown>): Species {
    const id = String(raw.id ?? raw.type ?? '');
    const name = String(raw.name ?? raw.commonName ?? id);
    return {
        id,
        type: String(raw.type ?? id),
        name,
        commonName: String(raw.commonName ?? name),
        scientificName: raw.scientificName != null ? String(raw.scientificName) : undefined,
        emoji: raw.emoji != null ? String(raw.emoji) : raw.icon != null ? String(raw.icon) : '🐟',
        icon: raw.icon != null ? String(raw.icon) : raw.emoji != null ? String(raw.emoji) : '🐟',
        rarity: (raw.rarity as SpeciesRarity) || 'common',
        description: raw.description != null ? String(raw.description) : undefined,
        funFact: raw.funFact != null ? String(raw.funFact) : undefined,
        habitat: raw.habitat != null ? String(raw.habitat) : undefined,
        ecologyRole: raw.ecologyRole != null ? String(raw.ecologyRole) : undefined,
        threats: raw.threats != null ? String(raw.threats) : undefined,
        conservationTip: raw.conservationTip != null ? String(raw.conservationTip) : undefined,
        minDepth: num(raw.minDepth, num(raw.depthMin, 0)),
        maxDepth: num(raw.maxDepth, num(raw.depthMax, 100)),
        depthMin: num(raw.depthMin, num(raw.minDepth, 0)),
        depthMax: num(raw.depthMax, num(raw.maxDepth, 100)),
        size: raw.size != null ? String(raw.size) : undefined,
        diet: raw.diet != null ? String(raw.diet) : undefined,
        lifespan: raw.lifespan != null ? String(raw.lifespan) : undefined,
    };
}

function num(v: unknown, fallback: number): number {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function toSpeciesData(s: Species): SpeciesData {
    return {
        id: s.id,
        type: s.type || s.id,
        commonName: s.commonName || s.name,
        scientificName: s.scientificName || '',
        icon: s.icon || s.emoji || '🐟',
        funFact: s.funFact || '',
        ecologyRole: s.ecologyRole || s.habitat || '',
        threats: s.threats || '',
        conservationTip: s.conservationTip || '',
        depthMin: s.depthMin ?? s.minDepth ?? 0,
        depthMax: s.depthMax ?? s.maxDepth ?? 0,
        diet: s.diet || '',
        rarity: (s.rarity as SpeciesData['rarity']) || 'common',
    };
}

const speciesList: Species[] = (Array.isArray(speciesJson) ? speciesJson : []).map((row) =>
    normalizeSpecies(row as Record<string, unknown>)
);
const missionList: MissionDef[] = Array.isArray(missionsJson)
    ? (missionsJson as MissionDef[])
    : [];
const rankList: RangerRank[] = (
    Array.isArray(rangerRanksJson) ? (rangerRanksJson as RangerRank[]) : []
)
    .map((r) => ({
        id: r.id,
        name: r.name,
        minCp: num(r.minCp, 0),
        badge: r.badge,
        description: r.description,
    }))
    .sort((a, b) => a.minCp - b.minCp);

const speciesById = new Map<string, Species>();
for (const s of speciesList) {
    speciesById.set(s.id, s);
    if (s.type && s.type !== s.id) {
        speciesById.set(s.type, s);
    }
}
const missionById = new Map(missionList.map((m) => [m.id, m]));
const rankById = new Map(rankList.map((r) => [r.id, r]));

// ── Functional API ──────────────────────────────────────────────

export function getAllSpecies(): Species[] {
    return speciesList.slice();
}

export function getSpeciesById(id: string): Species | undefined {
    if (!id) return undefined;
    return speciesById.get(id) ?? speciesById.get(id.toLowerCase());
}

export function getMissions(): MissionDef[] {
    return missionList.slice();
}

export function getMissionById(id: string): MissionDef | undefined {
    if (!id) return undefined;
    return missionById.get(id);
}

export function getRangerRanks(): RangerRank[] {
    return rankList.slice();
}

export function getRankById(id: string): RangerRank | undefined {
    if (!id) return undefined;
    return rankById.get(id);
}

/**
 * Highest rank whose minCp <= conservation points.
 * Falls back to tide_explorer / first rank.
 */
export function getRankForCp(cp: number): RangerRank {
    const points = Math.max(0, cp ?? 0);
    if (rankList.length === 0) {
        return {
            id: 'tide_explorer',
            name: 'Tide Explorer',
            minCp: 0,
            badge: '🌊',
            description: 'Just starting your ocean ranger journey.',
        };
    }
    let current = rankList[0];
    for (const rank of rankList) {
        if (points >= (rank.minCp ?? 0)) {
            current = rank;
        } else {
            break;
        }
    }
    return current;
}

/** Rank immediately above the current one for CP, or null if max rank. */
export function getNextRankForCp(cp: number): RangerRank | null {
    const current = getRankForCp(cp);
    const idx = rankList.findIndex((r) => r.id === current.id);
    if (idx < 0 || idx >= rankList.length - 1) return null;
    return rankList[idx + 1];
}

// ── Class API (MarinepediaUI / legacy) ──────────────────────────

export class ContentLoader {
    /** All species as SpeciesData for field-guide UI. */
    static getAllSpecies(): SpeciesData[] {
        return speciesList.map(toSpeciesData);
    }

    static getSpeciesByType(type: string): SpeciesData | undefined {
        const found = getSpeciesById(type);
        return found ? toSpeciesData(found) : undefined;
    }

    static getSpeciesById(id: string): SpeciesData | undefined {
        return ContentLoader.getSpeciesByType(id);
    }

    static getSpeciesCount(): number {
        return speciesList.length;
    }
}

export default ContentLoader;
