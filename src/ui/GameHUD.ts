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
        // Pause button — resume overlay (kid-friendly, not dump to level select)
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.showPauseMenu();
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

    private showToast(message: string): void {
        this.showHintMessage(message);
    }

    /** Snapshot active profile via AccountSystem if available. */
    private autoSave(): void {
        try {
            const account = (window as any).accountSystem;
            const game = (window as any).game;
            if (account && typeof account.autoSave === 'function') {
                if (game) {
                    account.autoSave({
                        levelSystem: game.getLevelSystem?.() ?? this.levelSystem,
                        upgradeSystem: game.getUpgradeSystem?.() ?? this.upgradeSystem,
                    });
                } else {
                    account.autoSave({
                        levelSystem: this.levelSystem,
                        upgradeSystem: this.upgradeSystem,
                    });
                }
            }
        } catch (e) {
            console.warn('[GameHUD] autoSave failed:', e);
        }
    }

    private escapeHtml(s: string): string {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private removeExistingOverlay(className: string): void {
        document.querySelectorAll(`.${className}`).forEach((el) => el.remove());
    }

    private restartCurrentLevel(): void {
        const game = (window as any).game ?? this.game;
        const levelSystem = game?.getLevelSystem?.() ?? this.levelSystem;
        const currentLevel = levelSystem?.getCurrentLevel?.();
        if (!currentLevel || !game) return;

        const blockSystem = game.getBlockPuzzleSystem?.();
        if (blockSystem && typeof blockSystem.loadLevelBlocks === 'function') {
            levelSystem.startLevel(currentLevel.id);
            blockSystem.loadLevelBlocks();
            if (typeof game.onLevelStarted === 'function') {
                game.onLevelStarted();
            }
            if (!game.isRunning) {
                game.start();
            }
            this.render();
            this.show();
        }
    }

    update(): void {
        const moves = this.levelSystem.getMoves();
        const score = this.levelSystem.getScore();
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

    showPauseMenu(): void {
        this.removeExistingOverlay('pause-screen');
        const game = (window as any).game ?? this.game;
        const wasRunning = !!game?.isRunning;
        if (wasRunning) game.stop();

        // Hide mobile controls while paused
        (window as any).mobileControls?.hide?.();

        const el = document.createElement('div');
        el.className = 'pause-screen win-screen';
        el.innerHTML = `
            <div class="win-content pause-content">
                <div class="win-title">Paused</div>
                <p class="win-ranger-line">Take a breath, Ocean Ranger.</p>
                <div class="win-buttons">
                    <button class="btn-primary" id="btn-resume">Resume Dive</button>
                    <button class="btn-secondary" id="btn-pause-levels">Level Select</button>
                    <button class="btn-secondary" id="btn-pause-menu">Main Menu</button>
                </div>
            </div>
        `;
        document.body.appendChild(el);

        el.querySelector('#btn-resume')?.addEventListener('click', () => {
            el.remove();
            if (game && !game.isRunning) game.start();
            if ((window as any).shouldUseMobileControls?.()) {
                (window as any).mobileControls?.show?.({ showCoach: false });
            }
        });
        el.querySelector('#btn-pause-levels')?.addEventListener('click', () => {
            el.remove();
            this.autoSave();
            (window as any).levelSelectUI?.show?.();
        });
        el.querySelector('#btn-pause-menu')?.addEventListener('click', () => {
            el.remove();
            this.autoSave();
            (window as any).mainMenuUI?.show?.();
            const ss = document.getElementById('start-screen');
            if (ss) {
                ss.classList.remove('hidden');
                ss.style.display = 'flex';
            }
        });
    }

    showObjectiveBanner(text: string, durationMs = 6000): void {
        document.getElementById('objective-banner')?.remove();
        const b = document.createElement('div');
        b.id = 'objective-banner';
        b.className = 'objective-banner';
        b.textContent = text;
        document.body.appendChild(b);
        setTimeout(() => b.classList.add('visible'), 30);
        setTimeout(() => {
            b.classList.remove('visible');
            setTimeout(() => b.remove(), 400);
        }, durationMs);
    }

    showWinScreen(stars: number, score: number, unlocked: number[]): void {
        // Prevent multiple win screens
        this.removeExistingOverlay('win-screen');
        this.removeExistingOverlay('lose-screen');
        this.removeExistingOverlay('pause-screen');

        // Pearls already awarded in BlockPuzzleSystem via upgradeSystem.addCurrency
        this.autoSave();

        // Stop game so player focuses on UI
        const game = (window as any).game ?? this.game;
        if (game?.isRunning) {
            game.stop();
        }
        (window as any).mobileControls?.hide?.();

        // Win audio
        try {
            game?.getAudioManager?.()?.playSound?.('win');
            game?.audioManager?.playSound?.('win');
        } catch {
            /* optional */
        }

        const profile = (window as any).accountSystem?.getActiveProfile?.();
        const name = profile?.displayName || 'Ranger';
        const cp = (window as any).useGameStore?.getState?.()?.conservationPoints ?? 0;

        const winScreen = document.createElement('div');
        winScreen.className = 'win-screen';
        winScreen.innerHTML = `
            <div class="win-content win-celebrate">
                <div class="win-burst" aria-hidden="true">✨🌊✨</div>
                <div class="win-title">You did it, ${this.escapeHtml(name)}!</div>
                <div class="win-stars win-stars-pop">${'⭐'.repeat(Math.max(1, stars))}${'☆'.repeat(Math.max(0, 3 - stars))}</div>
                <div class="win-score">Score: ${score}</div>
                <p class="win-edu">The path is open — and the reef is safer with a ranger like you.</p>
                <div class="win-cp">🌿 Conservation spirit: ${cp} CP</div>
                ${unlocked.length > 0 ? `
                    <div class="unlocked-levels">
                        <div>New depth unlocked!</div>
                        <div class="unlocked-list">
                            ${unlocked.map(id => `<span>Level ${id}</span>`).join(', ')}
                        </div>
                    </div>
                ` : ''}
                <div class="win-buttons">
                    <button class="btn-primary" id="btn-next-level">Next Adventure</button>
                    <button class="btn-secondary" id="btn-level-select">Level Select</button>
                    <button class="btn-secondary" id="btn-retry">Try Again</button>
                </div>
            </div>
        `;

        document.body.appendChild(winScreen);

        // Event listeners
        const nextLevelBtn = document.getElementById('btn-next-level');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                winScreen.remove();
                const levelSystem = game?.getLevelSystem?.() ?? this.levelSystem;
                const currentLevel = levelSystem?.getCurrentLevel?.();
                if (!currentLevel) return;

                const nextLevelId = currentLevel.id + 1;
                const levelSelectUI = (window as any).levelSelectUI;

                if (levelSelectUI && typeof levelSelectUI.isLevelUnlocked === 'function') {
                    if (!levelSelectUI.isLevelUnlocked(nextLevelId)) {
                        this.showToast(`Level ${nextLevelId} is still locked!`);
                        if (typeof levelSelectUI.show === 'function') {
                            levelSelectUI.show();
                        }
                        return;
                    }
                } else if (levelSystem && typeof levelSystem.isLevelUnlocked === 'function') {
                    if (!levelSystem.isLevelUnlocked(nextLevelId)) {
                        this.showToast(`Level ${nextLevelId} is still locked!`);
                        return;
                    }
                }

                if (levelSelectUI && typeof levelSelectUI.selectLevel === 'function') {
                    levelSelectUI.selectLevel(nextLevelId);
                } else {
                    this.showToast('Could not start next level');
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
                this.restartCurrentLevel();
            });
        }
    }

    showLoseScreen(): void {
        // Prevent stacking
        this.removeExistingOverlay('lose-screen');
        this.removeExistingOverlay('win-screen');

        const game = (window as any).game ?? this.game;
        if (game?.isRunning) {
            game.stop();
        }

        this.autoSave();

        const loseScreen = document.createElement('div');
        loseScreen.className = 'lose-screen';
        loseScreen.innerHTML = `
            <div class="lose-content">
                <div class="lose-title">Out of moves!</div>
                <div class="lose-message">Almost! Try a different slide — or undo and rethink the path.</div>
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
                this.restartCurrentLevel();
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
        this.ensureDiveHud();
    }

    hide(): void {
        this.container.style.display = 'none';
        this.hideRangerAlert();
    }

    private ensureDiveHud(): void {
        if (document.getElementById('dive-budget-hud')) return;
        const el = document.createElement('div');
        el.id = 'dive-budget-hud';
        el.className = 'dive-budget-hud';
        el.innerHTML = `
          <div class="dive-budget-label">Dive Budget</div>
          <div class="dive-budget-bar"><div class="dive-budget-fill" id="dive-budget-fill"></div></div>
          <div class="dive-budget-msg" id="dive-budget-msg">OK</div>
        `;
        document.body.appendChild(el);
    }

    updateDiveBudget(state: {
        ratio: number;
        status: string;
        message: string;
        isSurfaced: boolean;
    }): void {
        this.ensureDiveHud();
        const fill = document.getElementById('dive-budget-fill');
        const msg = document.getElementById('dive-budget-msg');
        const hud = document.getElementById('dive-budget-hud');
        if (fill) {
            fill.style.width = `${Math.round(state.ratio * 100)}%`;
            fill.dataset.status = state.status;
        }
        if (msg) msg.textContent = state.message;
        if (hud) {
            hud.classList.toggle('warn', state.status === 'surface' || state.status === 'assist');
            hud.classList.toggle('surfaced', state.isSurfaced);
        }
    }

    showRangerAlert(alert: {
        title: string;
        body: string;
        timeLeft: number;
        maxTime: number;
        progress: number;
        target: number;
    }): void {
        let el = document.getElementById('ranger-alert-hud');
        if (!el) {
            el = document.createElement('div');
            el.id = 'ranger-alert-hud';
            el.className = 'ranger-alert-hud';
            document.body.appendChild(el);
        }
        el.innerHTML = `
          <div class="ra-title">🚨 ${this.escapeHtml(alert.title)}</div>
          <div class="ra-body">${this.escapeHtml(alert.body)}</div>
          <div class="ra-progress">${alert.progress}/${alert.target} · ${Math.ceil(alert.timeLeft)}s</div>
        `;
        el.classList.add('visible');
    }

    updateRangerAlert(alert: {
        title: string;
        body: string;
        timeLeft: number;
        maxTime: number;
        progress: number;
        target: number;
    }): void {
        const el = document.getElementById('ranger-alert-hud');
        if (!el) {
            this.showRangerAlert(alert);
            return;
        }
        const prog = el.querySelector('.ra-progress');
        if (prog) {
            prog.textContent = `${alert.progress}/${alert.target} · ${Math.ceil(alert.timeLeft)}s`;
        }
    }

    hideRangerAlert(): void {
        document.getElementById('ranger-alert-hud')?.classList.remove('visible');
    }

    /** Trust UI: 0 thrash … 1 calm — kids read "swim gentle" */
    updateGentleness(g: number): void {
        let el = document.getElementById('gentleness-hud');
        if (!el) {
            el = document.createElement('div');
            el.id = 'gentleness-hud';
            el.className = 'gentleness-hud';
            el.innerHTML = `
              <div class="gentleness-label">Trust</div>
              <div class="gentleness-bar"><div class="gentleness-fill" id="gentleness-fill"></div></div>
              <div class="gentleness-hint" id="gentleness-hint">Swim gentle</div>
            `;
            document.body.appendChild(el);
        }
        const fill = document.getElementById('gentleness-fill');
        const hint = document.getElementById('gentleness-hint');
        if (fill) {
            fill.style.width = `${Math.round(g * 100)}%`;
            fill.dataset.level = g > 0.7 ? 'calm' : g > 0.4 ? 'ok' : 'thrash';
        }
        if (hint) {
            hint.textContent =
                g > 0.75 ? 'They can trust you' : g > 0.45 ? 'Slow down a little' : 'Too fast — you scare them';
        }
        el.classList.toggle('thrashing', g < 0.4);
    }
}
