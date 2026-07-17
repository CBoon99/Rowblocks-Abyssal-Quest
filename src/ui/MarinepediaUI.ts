/**
 * Field-guide Marinepedia — locked/unlocked species cards with education fields.
 *
 * API:
 *   new MarinepediaUI(container)
 *   show() / hide()
 *   render()
 *   isOpen(): boolean
 *
 * Data:
 *   ContentLoader.getAllSpecies() when available
 *   Fallback to classic 4 fish types if loader missing or empty
 *   Unlocked state from useGameStore.collectedFish
 */

import { useGameStore, CollectedFish } from '../stores/GameStore';
import { ContentLoader, type SpeciesData } from '../content/ContentLoader';

/** Minimal card model used for both content-backed and fallback entries. */
interface GuideEntry {
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
    rarity?: string;
}

const FALLBACK_SPECIES: GuideEntry[] = [
    {
        type: 'clownfish',
        commonName: 'Clownfish',
        scientificName: 'Amphiprion ocellaris',
        icon: '🐠',
        funFact:
            'Did you know? Clownfish can change their gender! All clownfish are born male, and the largest one becomes female.',
        ecologyRole: 'Partners with sea anemones on coral reefs.',
        threats: 'Reef damage and aquarium trade.',
        conservationTip: 'Protect coral reefs and leave wild fish in the ocean.',
        depthMin: 1,
        depthMax: 15,
        diet: 'Algae and tiny plankton',
        rarity: 'common',
    },
    {
        type: 'angelfish',
        commonName: 'Angelfish',
        scientificName: 'Pomacanthus imperator',
        icon: '🐟',
        funFact: 'Cool fact: Angelfish are territorial and defend their coral homes.',
        ecologyRole: 'Grazes sponges and algae on reefs.',
        threats: 'Habitat loss and over-collection.',
        conservationTip: 'Use reef-safe sunscreen when swimming near coral.',
        depthMin: 5,
        depthMax: 40,
        diet: 'Sponges, algae, small invertebrates',
        rarity: 'common',
    },
    {
        type: 'jellyfish',
        commonName: 'Jellyfish',
        scientificName: 'Aurelia aurita',
        icon: '🎐',
        funFact: 'Jellyfish are about 95% water and have no brain, heart, or bones!',
        ecologyRole: 'Eats plankton; food for turtles and sunfish.',
        threats: 'Plastic bags confuse turtles that eat jellies.',
        conservationTip: 'Keep plastics out of the sea.',
        depthMin: 0,
        depthMax: 50,
        diet: 'Plankton and tiny fish',
        rarity: 'common',
    },
    {
        type: 'shark',
        commonName: 'Shark',
        scientificName: 'Carcharhinus spp.',
        icon: '🦈',
        funFact: 'Sharks have been swimming the oceans for over 400 million years!',
        ecologyRole: 'Top predator that keeps fish populations healthy.',
        threats: 'Overfishing and shark finning.',
        conservationTip: 'Healthy oceans need healthy sharks.',
        depthMin: 10,
        depthMax: 80,
        diet: 'Fish, squid, crustaceans',
        rarity: 'rare',
    },
];

function speciesToEntry(s: SpeciesData): GuideEntry {
    return {
        type: s.type || s.id,
        commonName: s.commonName,
        scientificName: s.scientificName,
        icon: s.icon || '🐟',
        funFact: s.funFact || '',
        ecologyRole: s.ecologyRole || '',
        threats: s.threats || '',
        conservationTip: s.conservationTip || '',
        depthMin: s.depthMin ?? 0,
        depthMax: s.depthMax ?? 0,
        diet: s.diet || '',
        rarity: s.rarity,
    };
}

function loadGuideSpecies(): GuideEntry[] {
    try {
        if (typeof ContentLoader?.getAllSpecies === 'function') {
            const list = ContentLoader.getAllSpecies();
            if (Array.isArray(list) && list.length > 0) {
                return list.map(speciesToEntry);
            }
        }
    } catch (e) {
        console.warn('[MarinepediaUI] ContentLoader unavailable, using fallback species', e);
    }
    return FALLBACK_SPECIES.map((s) => ({ ...s }));
}

export class MarinepediaUI {
    private container: HTMLElement;
    private isVisible = false;
    private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
    private unsub: (() => void) | null = null;
    private selectedType: string | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();

        this.unsub = useGameStore.subscribe(() => {
            if (this.isVisible) {
                this.render();
            }
        });
    }

    isOpen(): boolean {
        return this.isVisible;
    }

    render(): void {
        const state = useGameStore.getState();
        const collectedFish = state.collectedFish;
        const discovered = new Set<string>([
            ...(state.speciesDiscovered ?? []),
            ...collectedFish.map((f) => f.type),
        ]);
        const species = loadGuideSpecies();
        const unlockedCount = species.filter(
            (s) => discovered.has(s.type) || collectedFish.some((f) => f.type === s.type)
        ).length;
        const total = species.length;
        const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

        this.container.innerHTML = `
            <div class="marinepedia-screen" role="dialog" aria-label="Marinepedia field guide">
                <div class="marinepedia-header">
                    <div class="marinepedia-title-block">
                        <h2>📚 Marinepedia</h2>
                        <p class="marinepedia-tagline">Your ocean field guide</p>
                    </div>
                    <button class="close-btn" id="marinepedia-close" type="button" aria-label="Close Marinepedia">✕</button>
                </div>
                <div class="marinepedia-stats">
                    <div class="stat-item">
                        <span class="stat-label">Discovered:</span>
                        <span class="stat-value" id="marinepedia-progress-text">${unlockedCount} / ${total}</span>
                    </div>
                    <div class="stat-item marinepedia-progress-stat">
                        <span class="stat-label">Progress:</span>
                        <div class="progress-bar marinepedia-progress-bar" role="progressbar"
                             aria-valuenow="${unlockedCount}" aria-valuemin="0" aria-valuemax="${total}">
                            <div class="progress-fill" style="width: ${pct}%"></div>
                        </div>
                        <span class="marinepedia-pct">${pct}%</span>
                    </div>
                </div>
                <div class="marinepedia-grid" id="marinepedia-grid">
                    ${species.map((entry) => this.renderCard(entry, collectedFish)).join('')}
                </div>
                <div class="marinepedia-detail-panel ${this.selectedType ? 'is-open' : ''}" id="marinepedia-detail">
                    ${this.selectedType ? this.renderDetail(species, collectedFish) : ''}
                </div>
            </div>
        `;

        this.wireEvents(species, collectedFish);
    }

    private renderCard(entry: GuideEntry, collected: CollectedFish[]): string {
        const found = collected.find((f) => f.type === entry.type);
        const discoveredIds = useGameStore.getState().speciesDiscovered ?? [];
        const unlocked = Boolean(found) || discoveredIds.includes(entry.type);
        const isNew = found && Date.now() - found.timestamp < 10000;
        const selected = this.selectedType === entry.type ? ' is-selected' : '';

        if (!unlocked) {
            return `
                <div class="fish-entry marinepedia-card locked${selected}" data-type="${this.escape(entry.type)}" tabindex="0" role="button" aria-label="Undiscovered species">
                    <div class="fish-icon marinepedia-card-icon locked-silhouette">${entry.icon}</div>
                    <div class="fish-name">???</div>
                    <div class="fish-locked">
                        <div class="locked-icon">🔒</div>
                        <div class="locked-text">Not discovered yet</div>
                        <div class="locked-hint">Explore the ocean to unlock!</div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="fish-entry marinepedia-card collected unlocked${selected}" data-type="${this.escape(entry.type)}" tabindex="0" role="button" aria-label="${this.escape(entry.commonName)}">
                ${isNew ? '<div class="new-badge">NEW!</div>' : ''}
                <div class="fish-icon marinepedia-card-icon">${entry.icon}</div>
                <div class="fish-name">${this.escape(entry.commonName)}</div>
                <div class="marinepedia-sci-name">${this.escape(entry.scientificName)}</div>
                <div class="fish-details marinepedia-card-preview">
                    <p class="marinepedia-funfact-preview">${this.escape(this.truncate(entry.funFact, 90))}</p>
                    <div class="fish-info marinepedia-meta-row">
                        <span>🌊 ${entry.depthMin}–${entry.depthMax}m</span>
                        <span>🍽️ ${this.escape(this.truncate(entry.diet, 28))}</span>
                    </div>
                    <button type="button" class="marinepedia-more-btn" data-type="${this.escape(entry.type)}">Read more</button>
                </div>
            </div>
        `;
    }

    private renderDetail(species: GuideEntry[], collected: CollectedFish[]): string {
        const entry = species.find((s) => s.type === this.selectedType);
        if (!entry) return '';
        const found = collected.find((f) => f.type === entry.type);
        if (!found) {
            return `
                <div class="marinepedia-detail-card locked-detail">
                    <button type="button" class="marinepedia-detail-close" id="marinepedia-detail-close">✕</button>
                    <div class="locked-icon">🔒</div>
                    <p>Discover this creature in the ocean first!</p>
                </div>
            `;
        }

        return `
            <div class="marinepedia-detail-card">
                <button type="button" class="marinepedia-detail-close" id="marinepedia-detail-close" aria-label="Close details">✕</button>
                <div class="marinepedia-detail-hero">
                    <span class="marinepedia-detail-icon">${entry.icon}</span>
                    <div>
                        <h3 class="marinepedia-detail-name">${this.escape(entry.commonName)}</h3>
                        <p class="marinepedia-sci-name">${this.escape(entry.scientificName)}</p>
                    </div>
                </div>
                <div class="marinepedia-detail-section funfact">
                    <h4>✨ Fun Fact</h4>
                    <p>${this.escape(entry.funFact)}</p>
                </div>
                <div class="marinepedia-detail-grid">
                    <div class="marinepedia-detail-section">
                        <h4>🌍 Ecology Role</h4>
                        <p>${this.escape(entry.ecologyRole)}</p>
                    </div>
                    <div class="marinepedia-detail-section">
                        <h4>⚠️ Threats</h4>
                        <p>${this.escape(entry.threats)}</p>
                    </div>
                    <div class="marinepedia-detail-section tip">
                        <h4>💚 Conservation Tip</h4>
                        <p>${this.escape(entry.conservationTip)}</p>
                    </div>
                    <div class="marinepedia-detail-section">
                        <h4>📊 Field Notes</h4>
                        <ul class="marinepedia-field-notes">
                            <li><strong>Depth range:</strong> ${entry.depthMin}–${entry.depthMax} m</li>
                            <li><strong>Diet:</strong> ${this.escape(entry.diet)}</li>
                            <li><strong>Found at:</strong> ${found.depth.toFixed(0)} m</li>
                            <li><strong>First seen:</strong> ${new Date(found.timestamp).toLocaleDateString()}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    private wireEvents(species: GuideEntry[], collected: CollectedFish[]): void {
        const closeBtn = this.container.querySelector('#marinepedia-close');
        closeBtn?.addEventListener('click', () => {
            this.hide();
        });

        const detailClose = this.container.querySelector('#marinepedia-detail-close');
        detailClose?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectedType = null;
            this.render();
        });

        this.container.querySelectorAll('.marinepedia-card.unlocked, .marinepedia-more-btn').forEach((el) => {
            el.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const type = target.getAttribute('data-type');
                if (!type) return;
                const unlocked = collected.some((f) => f.type === type);
                if (!unlocked) return;
                this.selectedType = type;
                this.render();
            });
        });

        this.container.querySelectorAll('.marinepedia-card.unlocked').forEach((el) => {
            el.addEventListener('keydown', (e) => {
                const ke = e as KeyboardEvent;
                if (ke.key === 'Enter' || ke.key === ' ') {
                    ke.preventDefault();
                    const type = (el as HTMLElement).getAttribute('data-type');
                    if (type && collected.some((f) => f.type === type)) {
                        this.selectedType = type;
                        this.render();
                    }
                }
            });
        });

        // Escape closes detail first, then panel (M still toggled by main)
        this.detachEscape();
        this.escapeHandler = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || !this.isVisible) return;
            if (this.selectedType) {
                this.selectedType = null;
                this.render();
                e.stopPropagation();
            } else {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    private detachEscape(): void {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    }

    show(): void {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.render();
    }

    hide(): void {
        this.isVisible = false;
        this.selectedType = null;
        this.container.style.display = 'none';
        this.detachEscape();
    }

    private truncate(s: string, n: number): string {
        if (!s) return '';
        if (s.length <= n) return s;
        return s.slice(0, n - 1).trimEnd() + '…';
    }

    private escape(s: string): string {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
