import { LevelSystem, LevelData } from '../systems/LevelSystem';

export class LevelSelectUI {
    private container: HTMLElement;
    private levelSystem: LevelSystem;
    private onLevelSelect: (levelId: number) => void;
    
    constructor(
        container: HTMLElement,
        levelSystem: LevelSystem,
        onLevelSelect: (levelId: number) => void
    ) {
        this.container = container;
        this.levelSystem = levelSystem;
        this.onLevelSelect = onLevelSelect;
        this.render();
    }
    
    render(): void {
        const levels = this.levelSystem.getAllLevels();
        
        this.container.innerHTML = `
            <div class="level-select-screen">
                <div class="level-select-header">
                    <h2>Select Level</h2>
                    <div class="level-stats">
                        <div class="stat-item">
                            <span class="stat-icon">⭐</span>
                            <span id="total-stars">0</span> Stars
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">💎</span>
                            <span id="total-pearls">0</span> Pearls
                        </div>
                    </div>
                </div>
                <div class="levels-grid" id="levels-grid">
                    ${levels.map(level => this.renderLevelCard(level)).join('')}
                </div>
                <button class="btn-close" id="close-level-select">Close</button>
            </div>
        `;
        
        // Attach event listeners
        levels.forEach(level => {
            const card = document.getElementById(`level-${level.id}`);
            if (card) {
                if (level.unlocked) {
                    card.addEventListener('click', () => {
                        this.onLevelSelect(level.id);
                    });
                }
            }
        });
        
        document.getElementById('close-level-select')?.addEventListener('click', () => {
            this.hide();
        });
        
        this.updateStats();
    }
    
    private renderLevelCard(level: LevelData): string {
        const stars = this.renderStars(level.stars);
        const lockedClass = level.unlocked ? '' : 'locked';
        const completedClass = level.stars > 0 ? 'completed' : '';
        
        return `
            <div class="level-card ${lockedClass} ${completedClass}" id="level-${level.id}">
                <div class="level-number">${level.id}</div>
                <div class="level-name">${level.name}</div>
                <div class="level-stars">${stars}</div>
                <div class="level-info">
                    <div class="info-item">
                        <span>⏱️</span>
                        <span>${level.maxMoves} moves</span>
                    </div>
                    <div class="info-item">
                        <span>💎</span>
                        <span>${level.targetScore}</span>
                    </div>
                </div>
                ${!level.unlocked ? '<div class="lock-overlay">🔒</div>' : ''}
            </div>
        `;
    }
    
    private renderStars(count: number): string {
        return '⭐'.repeat(count) + '☆'.repeat(3 - count);
    }
    
    private updateStats(): void {
        const totalStars = this.levelSystem.getAllLevels().reduce((sum, level) => sum + level.stars, 0);
        const starsEl = document.getElementById('total-stars');
        if (starsEl) starsEl.textContent = totalStars.toString();
    }
    
    show(): void {
        this.render();
        this.container.style.display = 'flex';
    }
    
    hide(): void {
        this.container.style.display = 'none';
    }
    
    update(): void {
        this.render();
    }
}
