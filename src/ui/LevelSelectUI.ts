import { LevelSystem, LevelData } from '../systems/LevelSystem';

export class LevelSelectUI {
    private container: HTMLElement;
    private levelSystem: LevelSystem;
    private onLevelSelect: (levelId: number) => void;
    private selectedIndex: number = 0;
    private levels: LevelData[] = [];
    private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
    
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
        this.levels = this.levelSystem.getAllLevels();
        const unlockedLevels = this.levels.filter(l => l.unlocked);
        
        // Reset selection to first unlocked level
        if (unlockedLevels.length > 0) {
            this.selectedIndex = this.levels.findIndex(l => l.id === unlockedLevels[0].id);
        }
        
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
                    ${this.levels.map(level => this.renderLevelCard(level)).join('')}
                </div>
                <div class="level-select-hint">
                    <p>Use Arrow Keys to navigate • Enter to select • ESC to close</p>
                </div>
                <button class="btn-close" id="close-level-select">Close</button>
            </div>
        `;
        
        // Attach event listeners
        this.levels.forEach(level => {
            const card = document.getElementById(`level-${level.id}`);
            if (card) {
                if (level.unlocked) {
                    card.addEventListener('click', () => {
                        this.selectLevel(level.id);
                    });
                }
            }
        });
        
        document.getElementById('close-level-select')?.addEventListener('click', () => {
            this.hide();
        });
        
        this.updateStats();
        this.updateSelection();
        this.setupKeyboardNavigation();
    }
    
    private setupKeyboardNavigation(): void {
        // Remove old handler if exists
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        
        // Add new handler
        this.keyboardHandler = (e: KeyboardEvent) => {
            if (this.container.style.display === 'none') return;
            
            const unlockedLevels = this.levels.filter(l => l.unlocked);
            if (unlockedLevels.length === 0) return;
            
            let currentUnlockedIndex = unlockedLevels.findIndex(l => l.id === this.levels[this.selectedIndex].id);
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    currentUnlockedIndex = Math.max(0, currentUnlockedIndex - 1);
                    this.selectedIndex = this.levels.findIndex(l => l.id === unlockedLevels[currentUnlockedIndex].id);
                    this.updateSelection();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    currentUnlockedIndex = Math.min(unlockedLevels.length - 1, currentUnlockedIndex + 1);
                    this.selectedIndex = this.levels.findIndex(l => l.id === unlockedLevels[currentUnlockedIndex].id);
                    this.updateSelection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    // Move up by 4 (assuming 4 columns)
                    currentUnlockedIndex = Math.max(0, currentUnlockedIndex - 4);
                    this.selectedIndex = this.levels.findIndex(l => l.id === unlockedLevels[currentUnlockedIndex].id);
                    this.updateSelection();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    // Move down by 4
                    currentUnlockedIndex = Math.min(unlockedLevels.length - 1, currentUnlockedIndex + 4);
                    this.selectedIndex = this.levels.findIndex(l => l.id === unlockedLevels[currentUnlockedIndex].id);
                    this.updateSelection();
                    break;
                case 'Enter':
                    e.preventDefault();
                    const selectedLevel = this.levels[this.selectedIndex];
                    if (selectedLevel && selectedLevel.unlocked) {
                        this.selectLevel(selectedLevel.id);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hide();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardHandler);
    }
    
    private updateSelection(): void {
        this.levels.forEach((level, index) => {
            const card = document.getElementById(`level-${level.id}`);
            if (card) {
                if (index === this.selectedIndex && level.unlocked) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            }
        });
    }
    
    private selectLevel(levelId: number): void {
        const level = this.levels.find(l => l.id === levelId);
        if (level && level.unlocked) {
            this.onLevelSelect(levelId);
        }
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
        // Remove keyboard handler when hidden
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
    }
    
    update(): void {
        this.render();
    }
}
