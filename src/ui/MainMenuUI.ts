export class MainMenuUI {
    private container: HTMLElement;
    private onPlay: () => void;
    private onShop: () => void;
    private onSettings: () => void;
    private onSwitchProfile?: () => void;
    private onBuddyDive?: () => void;
    private onMoreLevels?: () => void;
    private diverName: string = 'Diver';
    private rangerRankName: string = '';
    private rangerCp: number = 0;

    constructor(
        container: HTMLElement,
        onPlay: () => void,
        onShop: () => void,
        onSettings: () => void,
        onSwitchProfile?: () => void,
        onBuddyDive?: () => void,
        onMoreLevels?: () => void
    ) {
        this.container = container;
        this.onPlay = onPlay;
        this.onShop = onShop;
        this.onSettings = onSettings;
        this.onSwitchProfile = onSwitchProfile;
        this.onBuddyDive = onBuddyDive;
        this.onMoreLevels = onMoreLevels;
        this.render();
    }

    render(): void {
        const rangerLine =
            this.rangerRankName
                ? `<div class="menu-ranger-line" id="menu-ranger-line">
                        <span class="menu-ranger-rank" id="menu-ranger-rank">${this.escapeHtml(this.rangerRankName)}</span>
                        <span class="menu-ranger-cp" id="menu-ranger-cp">${this.rangerCp} CP</span>
                   </div>`
                : `<div class="menu-ranger-line" id="menu-ranger-line" style="display:none">
                        <span class="menu-ranger-rank" id="menu-ranger-rank"></span>
                        <span class="menu-ranger-cp" id="menu-ranger-cp"></span>
                   </div>`;

        this.container.innerHTML = `
            <div class="main-menu-screen">
                <div class="menu-content">
                    <h1>Abyssal Quest</h1>
                    <p class="subtitle">Ocean Ranger · Respect the Ocean</p>
                    <div class="menu-diver-badge" id="menu-diver-badge">
                        <span class="diver-icon">🌊</span>
                        <span class="diver-label">Ranger:</span>
                        <span class="diver-name" id="menu-diver-name">${this.escapeHtml(this.diverName)}</span>
                    </div>
                    ${rangerLine}
                    <div class="menu-buttons">
                        <button class="menu-btn btn-primary" id="btn-play">
                            <span class="btn-icon">▶</span>
                            <span>Dive Home Reef</span>
                        </button>
                        <button class="menu-btn btn-secondary" id="btn-levels" title="More reefs (gift: 1–3)">
                            <span class="btn-icon">▣</span>
                            <span>More Levels</span>
                        </button>
                        <button class="menu-btn btn-secondary" id="btn-shop">
                            <span class="btn-icon">◆</span>
                            <span>Upgrades</span>
                        </button>
                        <button class="menu-btn btn-secondary" id="btn-settings">
                            <span class="btn-icon">⚙</span>
                            <span>Settings</span>
                        </button>
                        ${this.onSwitchProfile ? `
                        <button class="menu-btn btn-secondary" id="btn-switch-diver">
                            <span class="btn-icon">◎</span>
                            <span>Switch Ranger</span>
                        </button>
                        ` : ''}
                        <button class="menu-btn btn-secondary menu-btn-subtle" id="btn-buddy" title="Same browser tabs only — not online multiplayer">
                            <span class="btn-icon">+</span>
                            <span>Buddy (local tabs)</span>
                        </button>
                    </div>
                    <p class="menu-gift-tip">Birthday gift loop: Home Reef · be gentle · clean trash · meet friends</p>
                    <div class="menu-stats">
                        <div class="stat-card">
                            <div class="stat-value" id="total-levels">0</div>
                            <div class="stat-label">Levels Completed</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="total-stars-menu">0</div>
                            <div class="stat-label">Total Stars</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="total-pearls-menu">0</div>
                            <div class="stat-label">Pearls</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.onPlay();
        });
        document.getElementById('btn-levels')?.addEventListener('click', () => {
            this.onMoreLevels?.();
        });
        document.getElementById('btn-buddy')?.addEventListener('click', () => {
            this.onBuddyDive?.();
        });

        document.getElementById('btn-shop')?.addEventListener('click', () => {
            this.onShop();
        });

        document.getElementById('btn-settings')?.addEventListener('click', () => {
            this.onSettings();
        });

        document.getElementById('btn-switch-diver')?.addEventListener('click', () => {
            this.onSwitchProfile?.();
        });
    }

    setDiverName(name: string): void {
        this.diverName = name || 'Diver';
        const el = document.getElementById('menu-diver-name');
        if (el) {
            el.textContent = this.diverName;
        } else {
            // Re-render if badge not yet in DOM
            this.render();
            this.syncStatsFromDom();
        }
    }

    /**
     * Optional ranger strip under diver name (education UI).
     * Safe no-op style: stores values and updates DOM if present.
     */
    setRangerInfo(rankName: string, cp: number): void {
        this.rangerRankName = rankName || '';
        this.rangerCp = Math.max(0, Math.floor(cp || 0));

        const line = document.getElementById('menu-ranger-line');
        const rankEl = document.getElementById('menu-ranger-rank');
        const cpEl = document.getElementById('menu-ranger-cp');

        if (rankEl) rankEl.textContent = this.rangerRankName;
        if (cpEl) cpEl.textContent = this.rangerRankName ? `${this.rangerCp} CP` : '';

        if (line) {
            line.style.display = this.rangerRankName ? '' : 'none';
        } else if (this.rangerRankName) {
            this.render();
            this.syncStatsFromDom();
        }
    }

    /** Keep last stats if we re-render after setDiverName. */
    private lastStats: { levels: number; stars: number; pearls: number } = {
        levels: 0,
        stars: 0,
        pearls: 0,
    };

    private syncStatsFromDom(): void {
        this.updateStats(this.lastStats.levels, this.lastStats.stars, this.lastStats.pearls);
    }

    updateStats(levels: number, stars: number, pearls: number): void {
        this.lastStats = { levels, stars, pearls };
        const levelsEl = document.getElementById('total-levels');
        const starsEl = document.getElementById('total-stars-menu');
        const pearlsEl = document.getElementById('total-pearls-menu');

        if (levelsEl) levelsEl.textContent = levels.toString();
        if (starsEl) starsEl.textContent = stars.toString();
        if (pearlsEl) pearlsEl.textContent = pearls.toString();
    }

    show(): void {
        this.container.style.display = 'flex';
        // Ensure diver name is current when shown
        const el = document.getElementById('menu-diver-name');
        if (el) el.textContent = this.diverName;
    }

    hide(): void {
        this.container.style.display = 'none';
    }

    private escapeHtml(s: string): string {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
