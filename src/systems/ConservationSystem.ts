/**
 * ConservationSystem — CP, cleanups, rescues, ranger ranks.
 * In-memory state with serialize/apply for AccountSystem persistence.
 */

import {
    getNextRankForCp,
    getRankForCp,
    type RangerRank,
} from '../content/ContentLoader';
import { DEFAULT_RANGER_RANK_ID } from '../types/Progress';

export interface ConservationSnapshot {
    conservationPoints: number;
    rangerRankId: string;
    cleanups: number;
    rescues: number;
}

export interface RankProgress {
    current: RangerRank;
    next: RangerRank | null;
    /** CP within the current rank band (0 if at min of current). */
    cpIntoRank: number;
    /** CP needed from current rank min to next rank min (0 if max rank). */
    cpSpan: number;
    /** 0–1 progress toward next rank. */
    ratio: number;
    /** CP remaining until next rank (0 if max). */
    remaining: number;
}

/** Default CP awards for cleanup / rescue actions. */
export const CP_CLEANUP = 5;
export const CP_RESCUE = 10;

export type CpChangedHandler = (cp: number, delta: number, reason: string) => void;
export type RankUpHandler = (rank: RangerRank, previous: RangerRank) => void;

export class ConservationSystem {
    private conservationPoints = 0;
    private cleanups = 0;
    private rescues = 0;
    private rangerRankId: string = DEFAULT_RANGER_RANK_ID;

    onCpChanged: CpChangedHandler | null = null;
    onRankUp: RankUpHandler | null = null;

    /** Current conservation points. */
    getCp(): number {
        return this.conservationPoints;
    }

    getCleanups(): number {
        return this.cleanups;
    }

    getRescues(): number {
        return this.rescues;
    }

    getRangerRankId(): string {
        return this.rangerRankId;
    }

    /** Ranger rank for current CP (content-backed). */
    getRank(): RangerRank {
        return getRankForCp(this.conservationPoints);
    }

    /** Progress toward the next ranger rank. */
    getProgressToNextRank(): RankProgress {
        const current = this.getRank();
        const next = getNextRankForCp(this.conservationPoints);
        const min = current.minCp ?? 0;

        if (!next) {
            return {
                current,
                next: null,
                cpIntoRank: Math.max(0, this.conservationPoints - min),
                cpSpan: 0,
                ratio: 1,
                remaining: 0,
            };
        }

        const span = Math.max(1, (next.minCp ?? 0) - min);
        const into = Math.max(0, this.conservationPoints - min);
        const ratio = Math.min(1, into / span);
        const remaining = Math.max(0, (next.minCp ?? 0) - this.conservationPoints);

        return {
            current,
            next,
            cpIntoRank: into,
            cpSpan: span,
            ratio,
            remaining,
        };
    }

    /**
     * Award conservation points. Updates ranger rank when threshold crossed.
     * @returns new total CP
     */
    addCp(amount: number, reason: string = 'award'): number {
        const delta = Math.floor(amount);
        if (!Number.isFinite(delta) || delta === 0) {
            return this.conservationPoints;
        }

        const previousRank = this.getRank();
        this.conservationPoints = Math.max(0, this.conservationPoints + delta);

        const nextRank = getRankForCp(this.conservationPoints);
        this.rangerRankId = nextRank.id;

        if (this.onCpChanged) {
            this.onCpChanged(this.conservationPoints, delta, reason);
        }

        if (nextRank.id !== previousRank.id && delta > 0) {
            console.log(
                `🏅 Rank up! ${previousRank.name} → ${nextRank.badge ?? ''} ${nextRank.name}`
            );
            if (this.onRankUp) {
                this.onRankUp(nextRank, previousRank);
            }
        }

        console.log(
            `🌿 CP ${delta >= 0 ? '+' : ''}${delta} (${reason}) → ${this.conservationPoints} [${this.rangerRankId}]`
        );
        return this.conservationPoints;
    }

    /** Record a litter cleanup; awards CP_CLEANUP. */
    recordCleanup(cpAward: number = CP_CLEANUP): number {
        this.cleanups += 1;
        this.addCp(cpAward, 'cleanup');
        return this.cleanups;
    }

    /** Record a creature rescue; awards CP_RESCUE. */
    recordRescue(cpAward: number = CP_RESCUE): number {
        this.rescues += 1;
        this.addCp(cpAward, 'rescue');
        return this.rescues;
    }

    /** Snapshot for AccountSystem / GameStore persistence. */
    serialize(): ConservationSnapshot {
        // Keep rank id in sync with CP before export
        this.rangerRankId = getRankForCp(this.conservationPoints).id;
        return {
            conservationPoints: this.conservationPoints,
            rangerRankId: this.rangerRankId,
            cleanups: this.cleanups,
            rescues: this.rescues,
        };
    }

    /** Hydrate from profile / store snapshot. */
    apply(data: Partial<ConservationSnapshot> | null | undefined): void {
        if (!data) {
            this.reset();
            return;
        }
        this.conservationPoints = Math.max(0, data.conservationPoints ?? 0);
        this.cleanups = Math.max(0, data.cleanups ?? 0);
        this.rescues = Math.max(0, data.rescues ?? 0);
        const rank = getRankForCp(this.conservationPoints);
        this.rangerRankId = data.rangerRankId || rank.id;
        // Prefer rank derived from CP if stored id is stale
        if (this.rangerRankId !== rank.id) {
            this.rangerRankId = rank.id;
        }
    }

    reset(): void {
        this.conservationPoints = 0;
        this.cleanups = 0;
        this.rescues = 0;
        this.rangerRankId = DEFAULT_RANGER_RANK_ID;
    }
}

/** Optional singleton for UI / wiring. */
let _conservationSingleton: ConservationSystem | null = null;

export function getConservationSystem(): ConservationSystem {
    if (!_conservationSingleton) {
        _conservationSingleton = new ConservationSystem();
    }
    return _conservationSingleton;
}
