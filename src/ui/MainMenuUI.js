export class MainMenuUI {
    constructor(container, onPlay, onShop, onSettings) {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onPlay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onShop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.container = container;
        this.onPlay = onPlay;
        this.onShop = onShop;
        this.onSettings = onSettings;
        this.render();
    }
    render() {
        this.container.innerHTML = `
            <div class="main-menu-screen">
                <div class="menu-content">
                    <h1>Rowblocks: Abyssal Quest</h1>
                    <p class="subtitle">3D Immersive Underwater Puzzle Adventure</p>
                    <div class="menu-buttons">
                        <button class="menu-btn btn-primary" id="btn-play">
                            <span class="btn-icon">🎮</span>
                            <span>Play</span>
                        </button>
                        <button class="menu-btn btn-secondary" id="btn-shop">
                            <span class="btn-icon">🛍️</span>
                            <span>Upgrade Shop</span>
                        </button>
                        <button class="menu-btn btn-secondary" id="btn-settings">
                            <span class="btn-icon">⚙️</span>
                            <span>Settings</span>
                        </button>
                    </div>
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
        // Event listeners
        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.onPlay();
        });
        document.getElementById('btn-shop')?.addEventListener('click', () => {
            this.onShop();
        });
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            this.onSettings();
        });
    }
    updateStats(levels, stars, pearls) {
        const levelsEl = document.getElementById('total-levels');
        const starsEl = document.getElementById('total-stars-menu');
        const pearlsEl = document.getElementById('total-pearls-menu');
        if (levelsEl)
            levelsEl.textContent = levels.toString();
        if (starsEl)
            starsEl.textContent = stars.toString();
        if (pearlsEl)
            pearlsEl.textContent = pearls.toString();
    }
    show() {
        this.container.style.display = 'flex';
    }
    hide() {
        this.container.style.display = 'none';
    }
}
