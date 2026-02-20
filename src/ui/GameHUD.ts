import { LevelSystem } from '../systems/LevelSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { useGameStore } from '../stores/GameStore';

export class GameHUD {
    private container: HTMLElement;
    private levelSystem: LevelSystem;
    private upgradeSystem: UpgradeSystem;
    private game: any = null; // Reference to Game for depth access
    
    constructor(
        container: HTMLElement,
        levelSystem: LevelSystem,
        upgradeSystem: UpgradeSystem,
        game?: any // Optional game reference for depth meter
    ) {
        this.container = container;
        this.levelSystem = levelSystem;
        this.upgradeSystem = upgradeSystem;
        this.game = game;
        this.render();
    }
    
    setGame(game: any): void {
        this.game = game;
    }
    
    render(): void {
        const currentLevel = this.levelSystem.getCurrentLevel();
        const moves = this.levelSystem.getMoves();
        const score = this.levelSystem.getScore();
        const currency = this.upgradeSystem.getCurrency();
        const depth = this.game ? Math.round(this.game.getCurrentDepth()) : 0;
        
        // Get gems and collected fish count from store
        const store = useGameStore.getState();
        const gems = store.gems;
        const collectedCount = store.collectedFish.length;
        
        this.container.innerHTML = `
            <div class="game-hud">
                <div class="hud-top">
                    <div class="hud-stat">
                        <span class="stat-icon">💎</span>
                        <span id="hud-gems">${gems}</span>
                    </div>
                    <div class="hud-stat">
                        <span class="stat-icon">🐟</span>
                        <span id="hud-collected">${collectedCount}</span>
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
                <div class="hud-bottom-left">
                    <div class="depth-meter-container">
                        <div class="depth-meter-label">Depth</div>
                        <div class="depth-meter">
                            <div class="depth-meter-bar" id="depth-meter-bar">
                                <div class="depth-meter-fill" id="depth-meter-fill"></div>
                            </div>
                            <div class="depth-meter-value" id="depth-meter-value">${depth}m</div>
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
        
        // Wire up HUD buttons
        this.setupButtonListeners();
        
        // Update move counter color based on remaining moves
        this.updateMoveCounter();
    }
    
    private setupButtonListeners(): void {
        // Pause button
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                const game = (window as any).game;
                if (game && game.isRunning) {
                    game.stop();
                    // Show pause menu or level select
                    const levelSelectUI = (window as any).levelSelectUI;
                    if (levelSelectUI) {
                        levelSelectUI.show();
                    }
                }
            });
        }
        
        // Undo button
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                const game = (window as any).game;
                if (game) {
                    const blockSystem = game.getBlockPuzzleSystem();
                    if (blockSystem && typeof blockSystem.undo === 'function') {
                        const success = blockSystem.undo();
                        if (success) {
                            console.log('✅ Undo successful');
                        } else {
                            console.log('⚠️ No moves to undo');
                        }
                    }
                }
            });
        }
        
        // Hint button
        const hintBtn = document.getElementById('btn-hint');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                const game = (window as any).game;
                if (game) {
                    const blockSystem = game.getBlockPuzzleSystem();
                    if (blockSystem && typeof blockSystem.showHint === 'function') {
                        blockSystem.showHint();
                    } else {
                        console.log('💡 Hint system not yet implemented');
                        // Show a simple message
                        this.showHintMessage('Try sliding rows to create a path!');
                    }
                }
            });
        }
        
        // Menu button
        const menuBtn = document.getElementById('btn-menu');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                const game = (window as any).game;
                if (game && game.isRunning) {
                    game.stop();
                }
                const levelSelectUI = (window as any).levelSelectUI;
                if (levelSelectUI) {
                    levelSelectUI.show();
                }
            });
        }
    }
    
    private showHintMessage(message: string): void {
        const hintMsg = document.createElement('div');
        hintMsg.className = 'hint-message';
        hintMsg.textContent = message;
        hintMsg.style.position = 'fixed';
        hintMsg.style.top = '50%';
        hintMsg.style.left = '50%';
        hintMsg.style.transform = 'translate(-50%, -50%)';
        hintMsg.style.zIndex = '10000';
        hintMsg.style.background = 'rgba(0, 212, 255, 0.95)';
        hintMsg.style.color = '#fff';
        hintMsg.style.padding = '20px 40px';
        hintMsg.style.borderRadius = '10px';
        hintMsg.style.fontSize = '1.2rem';
        hintMsg.style.fontWeight = 'bold';
        hintMsg.style.textAlign = 'center';
        hintMsg.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        hintMsg.style.animation = 'fadeInOut 3s ease-out';
        
        document.body.appendChild(hintMsg);
        
        setTimeout(() => {
            hintMsg.remove();
        }, 3000);
    }
    
    update(): void {
        const moves = this.levelSystem.getMoves();
        const score = this.levelSystem.getScore();
        const currency = this.upgradeSystem.getCurrency();
        const currentLevel = this.levelSystem.getCurrentLevel();
        const depth = this.game ? Math.round(this.game.getCurrentDepth()) : 0;
        
        // Get gems and collected fish count from store
        const store = useGameStore.getState();
        const gems = store.gems;
        const collectedCount = store.collectedFish.length;
        
        const movesEl = document.getElementById('hud-moves');
        const scoreEl = document.getElementById('hud-score');
        const gemsEl = document.getElementById('hud-gems');
        const collectedEl = document.getElementById('hud-collected');
        const depthValueEl = document.getElementById('depth-meter-value');
        const depthFillEl = document.getElementById('depth-meter-fill');
        
        if (movesEl) movesEl.textContent = moves.toString();
        if (scoreEl) scoreEl.textContent = score.toString();
        if (gemsEl) gemsEl.textContent = gems.toString();
        if (collectedEl) collectedEl.textContent = collectedCount.toString();
        
        // Update depth meter
        if (depthValueEl) depthValueEl.textContent = `${depth}m`;
        if (depthFillEl) {
            const maxDepth = 100; // Max depth for meter
            const fillPercentage = Math.min(100, (depth / maxDepth) * 100);
            depthFillEl.style.width = `${fillPercentage}%`;
            
            // Color change based on depth
            if (fillPercentage < 25) {
                depthFillEl.style.background = 'linear-gradient(90deg, #00ff00, #ffff00)';
            } else if (fillPercentage < 50) {
                depthFillEl.style.background = 'linear-gradient(90deg, #ffff00, #ff8800)';
            } else if (fillPercentage < 75) {
                depthFillEl.style.background = 'linear-gradient(90deg, #ff8800, #ff0000)';
            } else {
                depthFillEl.style.background = 'linear-gradient(90deg, #ff0000, #880000)';
            }
        }
        
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
        const nextLevelBtn = document.getElementById('btn-next-level');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                winScreen.remove();
                const game = (window as any).game;
                const levelSystem = game?.getLevelSystem();
                if (levelSystem) {
                    const currentLevel = levelSystem.getCurrentLevel();
                    if (currentLevel) {
                        const nextLevelId = currentLevel.id + 1;
                        const levelSelectUI = (window as any).levelSelectUI;
                        if (levelSelectUI) {
                            levelSelectUI.selectLevel(nextLevelId);
                        }
                    }
                }
            });
        }
        
        const levelSelectBtn = document.getElementById('btn-level-select');
        if (levelSelectBtn) {
            levelSelectBtn.addEventListener('click', () => {
                winScreen.remove();
                const levelSelectUI = (window as any).levelSelectUI;
                if (levelSelectUI) {
                    levelSelectUI.show();
                }
            });
        }
        
        const retryBtn = document.getElementById('btn-retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                winScreen.remove();
                const game = (window as any).game;
                const levelSystem = game?.getLevelSystem();
                if (levelSystem) {
                    const currentLevel = levelSystem.getCurrentLevel();
                    if (currentLevel) {
                        // Restart current level
                        const blockSystem = game?.getBlockPuzzleSystem();
                        if (blockSystem && typeof blockSystem.loadLevelBlocks === 'function') {
                            levelSystem.startLevel(currentLevel.id);
                            blockSystem.loadLevelBlocks();
                            if (game && !game.isRunning) {
                                game.start();
                            }
                        }
                    }
                }
            });
        }
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
        
        const retryLoseBtn = document.getElementById('btn-retry-lose');
        if (retryLoseBtn) {
            retryLoseBtn.addEventListener('click', () => {
                loseScreen.remove();
                const game = (window as any).game;
                const levelSystem = game?.getLevelSystem();
                if (levelSystem) {
                    const currentLevel = levelSystem.getCurrentLevel();
                    if (currentLevel) {
                        // Restart current level
                        const blockSystem = game?.getBlockPuzzleSystem();
                        if (blockSystem && typeof blockSystem.loadLevelBlocks === 'function') {
                            levelSystem.startLevel(currentLevel.id);
                            blockSystem.loadLevelBlocks();
                            if (game && !game.isRunning) {
                                game.start();
                            }
                        }
                    }
                }
            });
        }
        
        const levelSelectLoseBtn = document.getElementById('btn-level-select-lose');
        if (levelSelectLoseBtn) {
            levelSelectLoseBtn.addEventListener('click', () => {
                loseScreen.remove();
                const levelSelectUI = (window as any).levelSelectUI;
                if (levelSelectUI) {
                    levelSelectUI.show();
                }
            });
        }
    }
    
    show(): void {
        this.container.style.display = 'block';
        // Re-wire buttons when showing (in case render was called)
        this.setupButtonListeners();
    }
    
    hide(): void {
        this.container.style.display = 'none';
    }
}
