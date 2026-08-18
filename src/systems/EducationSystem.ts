/**
 * EducationSystem — species discovery, Marinepedia cards, fun-fact toasts.
 * Content-backed via ContentLoader (species.json).
 */

import {
    getAllSpecies,
    getSpeciesById,
    type Species,
    type SpeciesRarity,
} from '../content/ContentLoader';
import { useGameStore } from '../stores/GameStore';

export interface SpeciesCard {
    id: string;
    name: string;
    emoji: string;
    rarity: SpeciesRarity;
    description: string;
    funFact: string;
    habitat: string;
    size: string;
    diet: string;
    lifespan: string;
    minDepth: number;
    maxDepth: number;
}

export interface MarinepediaEntry extends SpeciesCard {
    discovered: boolean;
    discoveredAtDepth?: number;
}

export interface DiscoverSpeciesResult {
    isNew: boolean;
    species: Species | null;
    toastText: string;
    card: SpeciesCard | null;
}

const RARITY_TOAST: Record<string, string> = {
    legendary: '🌟 LEGENDARY FIND!',
    rare: '✨ Rare Discovery!',
    uncommon: '🎊 New Species!',
    common: '🐠 New Discovery!',
};

function asCard(species: Species): SpeciesCard {
    return {
        id: species.id,
        name: species.commonName || species.name,
        emoji: species.emoji || species.icon || '🐟',
        rarity: species.rarity || 'common',
        description: species.description || '',
        funFact: species.funFact || '',
        habitat: species.habitat || species.ecologyRole || 'Ocean',
        size: species.size || 'Unknown',
        diet: species.diet || 'Unknown',
        lifespan: species.lifespan || 'Unknown',
        minDepth: species.minDepth ?? species.depthMin ?? 0,
        maxDepth: species.maxDepth ?? species.depthMax ?? 100,
    };
}

export class EducationSystem {
    /**
     * Look up a species discovery for toasts / Marinepedia.
     * Does NOT mutate store — caller should call store.discoverSpeciesId when isNew.
     */
    discoverSpecies(speciesId: string, depth: number): DiscoverSpeciesResult {
        const species = getSpeciesById(speciesId) ?? null;
        const discovered = useGameStore.getState().speciesDiscovered ?? [];
        const isNew = !!species && !discovered.includes(speciesId);

        if (!species) {
            return {
                isNew: false,
                species: null,
                toastText: 'Unknown creature spotted…',
                card: null,
            };
        }

        const card = asCard(species);
        const toastText = isNew
            ? this.buildNewDiscoveryToast(card, depth)
            : this.buildRepeatToast(card, depth);

        return { isNew, species, toastText, card };
    }

    /** Full card for a species id, or null if missing. */
    getSpeciesCard(id: string): SpeciesCard | null {
        const species = getSpeciesById(id);
        return species ? asCard(species) : null;
    }

    /**
     * Marinepedia rows: all species, marked discovered when id is in discoveredIds.
     * Unknown discovered ids (not in content) are appended as stub entries.
     */
    getMarinepediaEntries(discoveredIds: string[]): MarinepediaEntry[] {
        const set = new Set(discoveredIds ?? []);
        const entries: MarinepediaEntry[] = getAllSpecies().map((s) => ({
            ...asCard(s),
            discovered: set.has(s.id),
        }));

        // Append any discovered ids not yet in content catalog
        for (const id of set) {
            if (entries.some((e) => e.id === id)) continue;
            entries.push({
                id,
                name: id,
                emoji: '🐟',
                rarity: 'common',
                description: 'A mystery of the deep.',
                funFact: '',
                habitat: 'Unknown',
                size: 'Unknown',
                diet: 'Unknown',
                lifespan: 'Unknown',
                minDepth: 0,
                maxDepth: 0,
                discovered: true,
            });
        }

        return entries;
    }

    /** Short kid-friendly fun fact for toasts / HUD. */
    getFunFact(speciesId: string): string {
        const species = getSpeciesById(speciesId);
        if (!species) return '';
        return this.shortFunFact(species);
    }

    /** Collection progress against the full catalog. */
    getCollectionProgress(discoveredIds: string[]): { found: number; total: number } {
        const total = getAllSpecies().length;
        const catalogIds = new Set(getAllSpecies().map((s) => s.id));
        const found = (discoveredIds ?? []).filter((id) => catalogIds.has(id)).length;
        return { found, total };
    }

    private buildNewDiscoveryToast(card: SpeciesCard, depth: number): string {
        const banner = RARITY_TOAST[String(card.rarity)] || RARITY_TOAST.common;
        const fact = this.shortFunFact(card);
        // Title only — Game.ts adds one short fact as subtitle. Skip 0m (looks broken).
        const depthBit = Number.isFinite(depth) && depth >= 2 ? ` · ${Math.round(depth)}m` : '';
        return `${banner} ${card.name}${depthBit}`;
    }

    private buildRepeatToast(card: SpeciesCard, depth: number): string {
        const depthBit = Number.isFinite(depth) && depth >= 2 ? ` · ${Math.round(depth)}m` : '';
        return `${card.emoji} ${card.name} spotted again${depthBit}`;
    }

    /** Trim fun fact to a toast-friendly length. */
    private shortFunFact(species: Species | SpeciesCard): string {
        const raw = (species.funFact || '').trim();
        if (!raw) return '';
        if (raw.length <= 120) return raw;
        return raw.slice(0, 117).trimEnd() + '…';
    }
}

/** Optional singleton for UI / wiring. */
let _educationSingleton: EducationSystem | null = null;

export function getEducationSystem(): EducationSystem {
    if (!_educationSingleton) {
        _educationSingleton = new EducationSystem();
    }
    return _educationSingleton;
}
