import { Game } from './systems/Game';
import { UIManager } from './ui/UIManager';
import { GameHUD } from './ui/GameHUD';
import { LevelSelectUI } from './ui/LevelSelectUI';
import { UpgradeShopUI } from './ui/UpgradeShopUI';
import { MainMenuUI } from './ui/MainMenuUI';
// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('loading');
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
        console.error('Canvas container not found!');
        return;
    }
    try {
        // Initialize game
        const game = new Game(canvasContainer);
        await game.init();
        // Initialize UI systems
        const uiManager = new UIManager(game);
        const gameHUD = new GameHUD(document.getElementById('game-hud-container'), game.getLevelSystem(), game.getUpgradeSystem());
        const levelSelectUI = new LevelSelectUI(document.getElementById('level-select-container'), game.getLevelSystem(), (levelId) => {
            if (game.getLevelSystem().startLevel(levelId)) {
                levelSelectUI.hide();
                game.start();
                const startScreen = document.getElementById('start-screen');
                if (startScreen) {
                    startScreen.classList.add('hidden');
                }
            }
        });
        const upgradeShopUI = new UpgradeShopUI(document.getElementById('upgrade-shop-container'), game.getUpgradeSystem());
        const mainMenuUI = new MainMenuUI(document.getElementById('start-screen'), () => {
            mainMenuUI.hide();
            levelSelectUI.show();
        }, () => {
            mainMenuUI.hide();
            upgradeShopUI.show();
        }, () => {
            // Settings - placeholder
            console.log('Settings clicked');
        });
        // Make UI accessible globally
        window.gameHUD = gameHUD;
        window.levelSelectUI = levelSelectUI;
        window.upgradeShopUI = upgradeShopUI;
        window.mainMenuUI = mainMenuUI;
        // Hide loading screen
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
        // Update menu stats
        const updateMenuStats = () => {
            const levels = game.getLevelSystem().getAllLevels().filter(l => l.stars > 0).length;
            const stars = game.getLevelSystem().getAllLevels().reduce((sum, l) => sum + l.stars, 0);
            const pearls = game.getUpgradeSystem().getCurrency();
            mainMenuUI.updateStats(levels, stars, pearls);
        };
        updateMenuStats();
        // Setup menu button in HUD
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (game.isRunning) {
                    game.stop();
                    levelSelectUI.show();
                }
                else {
                    levelSelectUI.show();
                }
            }
            if (e.key === 'u' || e.key === 'U') {
                upgradeShopUI.show();
            }
        });
        // Update HUD in game loop
        const updateHUD = () => {
            if (game.isRunning) {
                gameHUD.update();
            }
            requestAnimationFrame(updateHUD);
        };
        updateHUD();
        // Setup VR button (if available)
        if (navigator.xr) {
            const vrBtn = document.getElementById('vr-btn');
            if (vrBtn) {
                vrBtn.style.display = 'inline-block';
                vrBtn.addEventListener('click', async () => {
                    try {
                        await game.enableVR();
                        const startScreen = document.getElementById('start-screen');
                        if (startScreen) {
                            startScreen.classList.add('hidden');
                        }
                    }
                    catch (err) {
                        console.error('VR not available:', err);
                        alert('VR not available on this device');
                    }
                });
            }
        }
        // Make game accessible globally for debugging
        window.game = game;
        console.log('✅ Game initialized successfully!');
    }
    catch (error) {
        console.error('❌ Failed to initialize game:', error);
        if (loadingEl) {
            loadingEl.innerHTML = '<p style="color: #ff0000;">Failed to load game. Check console for details.</p>';
        }
    }
});
