import * as THREE from 'three';
import { Game } from './systems/Game';
import { UIManager } from './ui/UIManager';
import { GameHUD } from './ui/GameHUD';
import { LevelSelectUI } from './ui/LevelSelectUI';
import { UpgradeShopUI } from './ui/UpgradeShopUI';
import { MainMenuUI } from './ui/MainMenuUI';

// Initialize game when DOM is ready
const initGame = async () => {
    const loadingEl = document.getElementById('loading');
    const canvasContainer = document.getElementById('canvas-container');
    
    console.log('🚀 Starting game initialization...');
    console.log('Loading element:', loadingEl);
    console.log('Canvas container:', canvasContainer);
    
    if (!canvasContainer) {
        console.error('❌ Canvas container not found!');
        if (loadingEl) {
            loadingEl.innerHTML = '<p style="color: #ff0000;">Error: Canvas container not found!</p>';
        }
        return;
    }
    
    try {
        console.log('📦 Init step 1: Creating Game instance...');
        // Initialize game
        const game = new Game(canvasContainer);
        console.log('✅ Init step 1 complete: Game instance created');
        
        console.log('🔧 Init step 2: Initializing game systems...');
        await game.init();
        console.log('✅ Init step 2 complete: Game systems initialized');
        
        console.log('✅ Game systems initialized successfully');
        
        // Initialize UI systems
        const uiManager = new UIManager(game);
        const gameHUD = new GameHUD(
            document.getElementById('game-hud-container')!,
            game.getLevelSystem(),
            game.getUpgradeSystem()
        );
        const levelSelectUI = new LevelSelectUI(
            document.getElementById('level-select-container')!,
            game.getLevelSystem(),
            (levelId) => {
                console.log(`Level ${levelId} selected`);
                const levelSystem = game.getLevelSystem();
                
                if (levelSystem.startLevel(levelId)) {
                    console.log(`Level ${levelId} started successfully`);
                    
                    // Reload blocks for the new level
                    const blockSystem = game.getBlockPuzzleSystem();
                    if (blockSystem && typeof blockSystem.loadLevelBlocks === 'function') {
                        blockSystem.loadLevelBlocks();
                    } else {
                        console.error('BlockPuzzleSystem.loadLevelBlocks is not available');
                    }
                    
                    // Hide all UI overlays
                    levelSelectUI.hide();
                    const startScreen = document.getElementById('start-screen');
                    if (startScreen) {
                        startScreen.classList.add('hidden');
                    }
                    const upgradeShop = document.getElementById('upgrade-shop-container');
                    if (upgradeShop) {
                        upgradeShop.style.display = 'none';
                    }
                    
                    // Show canvas and start game
                    const canvasContainer = document.getElementById('canvas-container');
                    if (canvasContainer) {
                        canvasContainer.style.display = 'block';
                    }
                    
                    // Start the game
                    console.log('Starting game...');
                    game.start();
                    console.log('Game started, isRunning:', game.isRunning);
                    
                    // Show game HUD
                    gameHUD.show();
                } else {
                    console.error(`Failed to start level ${levelId}`);
                }
            }
        );
        const upgradeShopUI = new UpgradeShopUI(
            document.getElementById('upgrade-shop-container')!,
            game.getUpgradeSystem()
        );
        const mainMenuUI = new MainMenuUI(
            document.getElementById('start-screen')!,
            () => {
                mainMenuUI.hide();
                levelSelectUI.show();
            },
            () => {
                mainMenuUI.hide();
                upgradeShopUI.show();
            },
            () => {
                // Settings - placeholder
                console.log('Settings clicked');
            }
        );
        
        // Make UI accessible globally
        (window as any).gameHUD = gameHUD;
        (window as any).levelSelectUI = levelSelectUI;
        (window as any).upgradeShopUI = upgradeShopUI;
        (window as any).mainMenuUI = mainMenuUI;
        
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
                } else {
                    levelSelectUI.show();
                }
            }
            if (e.key === 'u' || e.key === 'U') {
                upgradeShopUI.show();
            }
        });
        
        // Update HUD in game loop (only when game is running)
        let hudAnimationId: number | null = null;
        const updateHUD = () => {
            try {
                if (game.isRunning) {
                    gameHUD.update();
                }
                hudAnimationId = requestAnimationFrame(updateHUD);
            } catch (error) {
                console.error('HUD update error:', error);
                // Stop the loop on error
                if (hudAnimationId !== null) {
                    cancelAnimationFrame(hudAnimationId);
                }
            }
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
                    } catch (err) {
                        console.error('VR not available:', err);
                        alert('VR not available on this device');
                    }
                });
            }
        }
        
        // Make game accessible globally for debugging
        (window as any).game = game;
        
                // Connect the HTML "Dive In" button if it exists
                const startBtn = document.getElementById('start-btn');
                if (startBtn) {
                    startBtn.addEventListener('click', () => {
                        mainMenuUI.hide();
                        levelSelectUI.show();
                    });
                }
                
                // DEBUG: Connect force start button
                const debugStartBtn = document.getElementById('debug-start');
                if (debugStartBtn) {
                    debugStartBtn.style.display = 'block';
                    debugStartBtn.addEventListener('click', () => {
                        console.log('🔧 DEBUG: Force start button clicked');
                        // Hide loading screen
                        if (loadingEl) {
                            loadingEl.classList.add('hidden');
                        }
                        // Start level 1 if none selected
                        const levelSystem = game.getLevelSystem();
                        if (!levelSystem.getCurrentLevel()) {
                            levelSystem.startLevel(1);
                        }
                        // Start game
                        game.start();
                        // Show canvas
                        if (canvasContainer) {
                            canvasContainer.style.display = 'block';
                        }
                        // Show HUD
                        gameHUD.show();
                    });
                    console.log('✅ Debug start button connected');
                }
                
                console.log('✅ Game initialized successfully!');
        console.log('Game object:', game);
        console.log('Level system:', game.getLevelSystem());
        console.log('Available levels:', game.getLevelSystem().getAllLevels());
        
        // Hide loading screen on success
        if (loadingEl) {
            loadingEl.classList.add('hidden');
            console.log('✅ Loading screen hidden');
        }
        
        // Verify canvas is visible
        const canvas = canvasContainer.querySelector('canvas');
        if (canvas) {
            console.log('✅ Canvas found:', canvas.width, 'x', canvas.height);
        } else {
            console.warn('⚠️ Canvas not found in container!');
        }
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Show error to user
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="color: #ff0000; text-align: center; padding: 2rem;">
                    <h2>❌ Failed to Load Game</h2>
                    <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
                    <p style="font-size: 0.9rem; margin-top: 1rem;">Check browser console (F12) for details.</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #00d4ff; border: none; border-radius: 5px; cursor: pointer; color: white; font-weight: bold;">
                        Reload Page
                    </button>
                </div>
            `;
        }
        
        // Also show alert for immediate feedback
        alert(`Game failed to load: ${error instanceof Error ? error.message : String(error)}\n\nCheck console (F12) for details.`);
    }
};

// Try immediate initialization if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM is already loaded
    initGame();
}
