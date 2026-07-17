/**
 * Small ocean-ranger HUD widget: rank name, badge emoji, conservation points (CP),
 * and progress bar to next rank.
 *
 * API:
 *   new RangerBadgeUI(mountEl?)
 *   update()            — refresh from GameStore
 *   show() / hide()
 *   destroy()
 *   getElement()
 *
 * Rank table is local; CP is read from store.conservationPoints if present,
 * otherwise derived from unique collected fish × 10.
 */

import { useGameStore } from '../stores/GameStore';
import {
    getRangerRanks as getContentRanks,
    getRankForCp as getContentRankForCp,
    getNextRankForCp,
} from '../content/ContentLoader';

export interface RangerRank {
    id: string;
    name: string;
    emoji: string;
    /** Minimum CP required for this rank */
    minCp: number;
}

/** Fallback if content JSON fails to load. */
export const RANGER_RANKS: RangerRank[] = [
    { id: 'tide_explorer', name: 'Tide Explorer', emoji: '🌊', minCp: 0 },
    { id: 'reef_scout', name: 'Reef Scout', emoji: '🪸', minCp: 50 },
    { id: 'kelp_keeper', name: 'Kelp Keeper', emoji: '🌿', minCp: 150 },
    { id: 'abyss_ranger', name: 'Abyss Ranger', emoji: '🌑', minCp: 300 },
    { id: 'ocean_guardian', name: 'Ocean Guardian', emoji: '🏆', minCp: 500 },
];

function ranksFromContent(): RangerRank[] {
    try {
        const list = getContentRanks();
        if (list && list.length > 0) {
            return list.map((r) => ({
                id: r.id,
                name: r.name,
                emoji: r.badge || '🌊',
                minCp: r.minCp ?? 0,
            }));
        }
    } catch {
        /* use fallback */
    }
    return RANGER_RANKS;
}

export function getRankForCp(cp: number): RangerRank {
    try {
        const r = getContentRankForCp(cp);
        if (r) {
            return {
                id: r.id,
                name: r.name,
                emoji: r.badge || '🌊',
                minCp: r.minCp ?? 0,
            };
        }
    } catch {
        /* fallback */
    }
    let current = RANGER_RANKS[0];
    for (const rank of ranksFromContent()) {
        if (cp >= rank.minCp) current = rank;
    }
    return current;
}

export function getNextRank(cp: number): RangerRank | null {
    try {
        const next = getNextRankForCp?.(cp);
        if (next) {
            return {
                id: next.id,
                name: next.name,
                emoji: next.badge || '🌊',
                minCp: next.minCp ?? 0,
            };
        }
        if (next === null) return null;
    } catch {
        /* fallback */
    }
    for (const rank of ranksFromContent()) {
        if (cp < rank.minCp) return rank;
    }
    return null;
}

/** Read conservation points from store (optional field) or derive. */
export function getConservationPointsFromStore(): number {
    const state = useGameStore.getState() as {
        conservationPoints?: number;
        collectedFish?: { type: string }[];
    };
    if (typeof state.conservationPoints === 'number' && !Number.isNaN(state.conservationPoints)) {
        return Math.max(0, Math.floor(state.conservationPoints));
    }
    const types = new Set((state.collectedFish ?? []).map((f) => f.type));
    return types.size * 10;
}

export class RangerBadgeUI {
    private root: HTMLElement;
    private owned = false;
    private unsub: (() => void) | null = null;

    /**
     * @param mount Prefer #game-hud-container or any corner host.
     *              If omitted, creates a fixed corner widget on body.
     */
    constructor(mount?: HTMLElement | null) {
        if (mount) {
            this.root = document.createElement('div');
            this.root.className = 'ranger-badge';
            this.root.id = 'ranger-badge';
            mount.appendChild(this.root);
            this.owned = true;
        } else {
            let existing = document.getElementById('ranger-badge');
            if (existing) {
                this.root = existing;
                this.owned = false;
            } else {
                this.root = document.createElement('div');
                this.root.className = 'ranger-badge ranger-badge--fixed';
                this.root.id = 'ranger-badge';
                document.body.appendChild(this.root);
                this.owned = true;
            }
        }

        this.renderShell();
        this.update();

        // Live updates when collection / CP changes
        this.unsub = useGameStore.subscribe(() => {
            this.update();
        });
    }

    private renderShell(): void {
        this.root.innerHTML = `
            <div class="ranger-badge-inner">
                <div class="ranger-badge-emoji" id="ranger-badge-emoji">🌱</div>
                <div class="ranger-badge-info">
                    <div class="ranger-badge-rank" id="ranger-badge-rank">Junior Ranger</div>
                    <div class="ranger-badge-cp">
                        <span class="ranger-badge-cp-label">CP</span>
                        <span class="ranger-badge-cp-value" id="ranger-badge-cp">0</span>
                    </div>
                    <div class="ranger-badge-progress" title="Progress to next rank">
                        <div class="ranger-badge-progress-fill" id="ranger-badge-progress-fill"></div>
                    </div>
                    <div class="ranger-badge-next" id="ranger-badge-next">Next: Ocean Scout</div>
                </div>
            </div>
        `;
    }

    /** Refresh rank, CP, and progress from store. */
    update(): void {
        const cp = getConservationPointsFromStore();
        const rank = getRankForCp(cp);
        const next = getNextRank(cp);

        const emojiEl = this.root.querySelector('#ranger-badge-emoji');
        const rankEl = this.root.querySelector('#ranger-badge-rank');
        const cpEl = this.root.querySelector('#ranger-badge-cp');
        const fillEl = this.root.querySelector('#ranger-badge-progress-fill') as HTMLElement | null;
        const nextEl = this.root.querySelector('#ranger-badge-next');

        if (emojiEl) emojiEl.textContent = rank.emoji;
        if (rankEl) rankEl.textContent = rank.name;
        if (cpEl) cpEl.textContent = String(cp);

        let pct = 100;
        let nextLabel = 'Max rank!';
        if (next) {
            const span = Math.max(1, next.minCp - rank.minCp);
            const progress = Math.min(1, Math.max(0, (cp - rank.minCp) / span));
            pct = Math.round(progress * 100);
            nextLabel = `Next: ${next.name} (${next.minCp} CP)`;
        }
        if (fillEl) fillEl.style.width = `${pct}%`;
        if (nextEl) nextEl.textContent = nextLabel;

        this.root.setAttribute('data-rank', rank.id);
        this.root.setAttribute('aria-label', `${rank.name}, ${cp} conservation points`);
    }

    show(): void {
        this.root.style.display = '';
        this.update();
    }

    hide(): void {
        this.root.style.display = 'none';
    }

    getElement(): HTMLElement {
        return this.root;
    }

    destroy(): void {
        if (this.unsub) {
            this.unsub();
            this.unsub = null;
        }
        if (this.owned && this.root.parentElement) {
            this.root.remove();
        }
    }
}

export default RangerBadgeUI;
