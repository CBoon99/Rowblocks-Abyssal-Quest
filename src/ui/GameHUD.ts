import { LevelSystem } from '../systems/LevelSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';

export class GameHUD {
    private container: HTMLElement;
    private levelSystem: LevelSystem;
    private upgradeSystem: UpgradeSystem;
    
    constructor(
        container: HTMLElement,
        levelSystem: LevelSystem,
        upgradeSystem: UpgradeSystem
    ) {
        this.container = container;
        this.levelSystem = levelSystem;
        this.upgradeSystem = upgradeSystem;
        this.render();
    }
    
    render(): void {
        const currentLevel = this.levelSystem.getCurrentLevel();
        const moves = this.levelSystem.getMoves();
        const score = this.levelSystem.getScore();
        const currency = this.upgradeSystem.getCurrency();
        
        this.container.innerHTML = `
            <div class="game-hud">
                <div class="hud-top">
                    <div class="hud-stat">
                        <span class="stat-icon">💎</span>
                        <span id="hud-currency">${currency}</span>
                    </div>
                    <div class="hud-stat">
                        <span class="stat-icon">⭐</span>
                        <span id="hud-stars">0</span>
                    </div>
                    <div class="hud-stat">
                        <span class="stat-icon">📊</span>
                        <span id="hud-score">${score}</span>
                    </div>
                </div>
                <div class="hud-center">
                    <div class="level-info">
                        <div class="level-name">${currentLevel?.name || 'No Level'}</div>
                        <div class="moves-counter">
                            <span>Moves: </span>
                            <span id="hud-moves">${moves}</span>
                            <span> / ${currentLevel?.maxMoves || 0}</span>
                        </div>
                    </div>
                </div>
                <div class="hud-bottom">
                    <button class="hud-btn" id="btn-pause" title="Pause">
                        ⏸️
                    </button>
                    <button class="hud-btn" id="btn-undo" title="Undo Move">
                        ↩️
                    </button>
                    <button class="hud-btn" id="btn-hint" title="Hint">
                        💡
                    </button>
                    <button class="hud-btn" id="btn-menu" title="Menu">
                        ☰
                    </button>
                </div>
            </div>
        `;
        
        // Update move counter color based on remaining moves
        this.updateMoveCounter();
    }
    
    update(): void {
        const moves = this.levelSystem.getMoves();
        const score = this.levelSystem.getScore();
        const currency = this.upgradeSystem.getCurrency();
        const currentLevel = this.levelSystem.getCurrentLevel();
        
        const movesEl = document.getElementById('hud-moves');
        const scoreEl = document.getElementById('hud-score');
        const currencyEl = document.getElementById('hud-currency');
        
        if (movesEl) movesEl.textContent = moves.toString();
        if (scoreEl) scoreEl.textContent = score.toString();
        if (currencyEl) currencyEl.textContent = currency.toString();
        
        this.updateMoveCounter();
    }
    
    private updateMoveCounter(): void {
        const currentLevel = this.levelSystem.getCurrentLevel();
        if (!currentLevel) return;
        
        const moves = this.levelSystem.getMoves();
        const remaining = currentLevel.maxMoves - moves;
        const ratio = remaining / currentLevel.maxMoves;
        
        const movesCounter = document.querySelector('.moves-counter');
        if (movesCounter) {
            if (ratio < 0.2) {
                (movesCounter as HTMLElement).style.color = '#ff0000';
            } else if (ratio < 0.5) {
                (movesCounter as HTMLElement).style.color = '#ffaa00';
            } else {
                (movesCounter as HTMLElement).style.color = '#00ff00';
            }
        }
    }
    
    showWinScreen(stars: number, score: number, unlocked: number[]): void {
        const winScreen = document.createElement('div');
        winScreen.className = 'win-screen';
        winScreen.innerHTML = `
            <div class="win-content">
                <div class="win-title">Level Complete!</div>
                <div class="win-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
                <div class="win-score">Score: ${score}</div>
                ${unlocked.length > 0 ? `
                    <div class="unlocked-levels">
                        <div>New Level Unlocked!</div>
                        <div class="unlocked-list">
                            ${unlocked.map(id => `<span>Level ${id}</span>`).join(', ')}
                        </div>
                    </div>
                ` : ''}
                <div class="win-buttons">
                    <button class="btn-primary" id="btn-next-level">Next Level</button>
                    <button class="btn-secondary" id="btn-level-select">Level Select</button>
                    <button class="btn-secondary" id="btn-retry">Retry</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(winScreen);
        
        // Event listeners
        document.getElementById('btn-next-level')?.addEventListener('click', () => {
            winScreen.remove();
            // Trigger next level
        });
        
        document.getElementById('btn-level-select')?.addEventListener('click', () => {
            winScreen.remove();
            // Show level select
        });
        
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            winScreen.remove();
            // Retry current level
        });
    }
    
    showLoseScreen(): void {
        const loseScreen = document.createElement('div');
        loseScreen.className = 'lose-screen';
        loseScreen.innerHTML = `
            <div class="lose-content">
                <div class="lose-title">Out of Moves!</div>
                <div class="lose-message">Try again or use a power-up</div>
                <div class="lose-buttons">
                    <button class="btn-primary" id="btn-retry-lose">Retry</button>
                    <button class="btn-secondary" id="btn-level-select-lose">Level Select</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(loseScreen);
        
        document.getElementById('btn-retry-lose')?.addEventListener('click', () => {
            loseScreen.remove();
        });
        
        document.getElementById('btn-level-select-lose')?.addEventListener('click', () => {
            loseScreen.remove();
        });
    }
}
