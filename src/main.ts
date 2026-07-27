import * as THREE from 'three';
import { Game } from './systems/Game';
import { GameHUD } from './ui/GameHUD';
import { LevelSelectUI } from './ui/LevelSelectUI';
import { UpgradeShopUI } from './ui/UpgradeShopUI';
import { MainMenuUI } from './ui/MainMenuUI';
import { MarinepediaUI } from './ui/MarinepediaUI';
import { CustomizationShop } from './ui/CustomizationShop';
import { ProfileSelectUI } from './ui/ProfileSelectUI';
import { AccountSystem, getAccountSystem } from './systems/AccountSystem';
import { useGameStore } from './stores/GameStore';
import { DiscoveryToast } from './ui/DiscoveryToast';
import {
    RangerBadgeUI,
    getRankForCp,
    getConservationPointsFromStore,
} from './ui/RangerBadgeUI';
import { getEducationSystem } from './systems/EducationSystem';
import { getConservationSystem } from './systems/ConservationSystem';
import { getRankForCp as getContentRankForCp } from './content/ContentLoader';
import { MobileControls, shouldUseMobileControls } from './ui/MobileControls';
import { isTouchPrimary, getQualityConfig } from './systems/QualitySettings';
import { OceanMapUI } from './ui/OceanMapUI';
import { BuddyDiveUI } from './ui/BuddyDiveUI';
import {
    FIRST_DIVE_OBJECTIVE,
    FIRST_DIVE_OBJECTIVE_TITLE,
} from './systems/HomeReefStage';
import {
    GIFT_CLEAN_PROGRESS_TARGET,
    GIFT_CLEAN_WIN_TARGET,
    GIFT_HOME_LEVEL_ID,
} from './systems/GiftMode';
import { getFirstDiveDirector } from './systems/FirstDiveDirector';
import { tryGiftSwimWin } from './systems/GiftSwimWin';

// Initialize game when DOM is ready
const initGame = async () => {
    const loadingEl = document.getElementById('loading');
    const canvasContainer = document.getElementById('canvas-container');

    console.log('🚀 Starting game initialization...');

    if (!canvasContainer) {
        console.error('❌ Canvas container not found!');
        if (loadingEl) {
            loadingEl.innerHTML = '<p style="color: #ff0000;">Error: Canvas container not found!</p>';
        }
        return;
    }

    try {
        // ── 1. Game systems ──────────────────────────────────────────────
        console.log('📦 Init step 1: Creating Game instance...');
        const game = new Game(canvasContainer);
        console.log('✅ Init step 1 complete: Game instance created');

        console.log('🔧 Init step 2: Initializing game systems...');
        await game.init();
        console.log('✅ Init step 2 complete: Game systems initialized');

        // ── 2. Account ───────────────────────────────────────────────────
        const accountSystem: AccountSystem = getAccountSystem();
        accountSystem.load();
        accountSystem.ensureDefaultProfiles();

        const systemsRef = () => ({
            levelSystem: game.getLevelSystem(),
            upgradeSystem: game.getUpgradeSystem(),
        });

        const doAutoSave = () => {
            try {
                accountSystem.autoSave(systemsRef());
            } catch (e) {
                console.warn('[main] autoSave failed:', e);
            }
        };

        // ── 3. UI systems ────────────────────────────────────────────────
        const gameHUD = new GameHUD(
            document.getElementById('game-hud-container')!,
            game.getLevelSystem(),
            game.getUpgradeSystem(),
            game
        );

        // ── iPad / touch controls ────────────────────────────────────────
        const swimmer = game.getSwimmerController();
        const useMobile = shouldUseMobileControls();
        if (useMobile && swimmer?.setTouchMode) {
            swimmer.setTouchMode(true);
        }

        const mobileControls = new MobileControls({
            setMoveState: (state) => swimmer?.setMoveState?.(state),
            addLookDelta: (dx, dy) => swimmer?.addLookDelta?.(dx, dy),
            triggerCollect: () => swimmer?.triggerCollect?.() ?? game.collectFish?.(),
            triggerConserve: () =>
                swimmer?.triggerConserve?.() ?? game.tryConservationInteract?.(5.8),
            slidePuzzle: (dir) => {
                const blocks = game.getBlockPuzzleSystem();
                return blocks?.slideSelected?.(dir) ?? false;
            },
            setPuzzleMode: (on) => {
                swimmer?.setPuzzleMode?.(on);
            },
        });
        (window as any).mobileControls = mobileControls;
        (window as any).shouldUseMobileControls = shouldUseMobileControls;

        // Ocean chart (minimap + full map) — deep blue + reef islands
        const oceanMap = new OceanMapUI();
        oceanMap.hide(); // show when diving
        (window as any).oceanMap = oceanMap;

        console.log(
            `📱 Touch primary: ${isTouchPrimary()} | quality: ${getQualityConfig().tier}`
        );

        const startLevelFlow = (levelId: number) => {
            console.log(`Level ${levelId} selected`);
            const levelSystem = game.getLevelSystem();

            if (!levelSystem.startLevel(levelId)) {
                console.error(`Failed to start level ${levelId}`);
                return;
            }

            console.log(`Level ${levelId} started successfully`);

            const blockSystem = game.getBlockPuzzleSystem();
            if (blockSystem && typeof blockSystem.loadLevelBlocks === 'function') {
                blockSystem.loadLevelBlocks();
            } else {
                console.error('BlockPuzzleSystem.loadLevelBlocks is not available');
            }

            // Extra moves from upgrades
            if (typeof game.onLevelStarted === 'function') {
                game.onLevelStarted();
            }

            // Hide menus / overlays
            levelSelectUI.hide();
            mainMenuUI.hide();
            profileSelectUI.hide();
            upgradeShopUI.hide();
            marinepediaUI.hide();
            customizationShopUI.hide();

            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.classList.add('hidden');
                startScreen.style.display = 'none';
            }

            // Show canvas and start game
            canvasContainer.style.display = 'block';
            console.log('Starting game...');
            game.start();
            console.log('Game started, isRunning:', game.isRunning);

            gameHUD.render();
            gameHUD.show();
            oceanMap.show();

            // Home Reef bones: explore first, puzzle later
            (window as any).__diveCleans = 0;
            (window as any).__diveCleanTarget = GIFT_CLEAN_PROGRESS_TARGET;
            (window as any).__giftSwimWon = false;
            gameHUD.showObjectiveBanner?.(FIRST_DIVE_OBJECTIVE, 7000);
            const titleEl = document.getElementById('aq-obj-title');
            const bodyEl = document.getElementById('aq-obj-body');
            if (titleEl) titleEl.textContent = FIRST_DIVE_OBJECTIVE_TITLE;
            if (bodyEl) bodyEl.textContent = FIRST_DIVE_OBJECTIVE;
            gameHUD.updateCleanProgress?.(0, GIFT_CLEAN_PROGRESS_TARGET);
            game.getBlockPuzzleSystem?.()?.setBlocksVisible?.(false);

            // iPad controls — coach only until dismissed (localStorage)
            if (useMobile) {
                mobileControls.show(); // respects rowblocks_coach_seen_v1
            }
        };

        // Keep minimap player marker in sync
        const mapLoop = () => {
            try {
                if (game.isRunning) {
                    const p = game.getSwimmerController?.()?.getPosition?.();
                    if (p) oceanMap.setPlayerPosition(p.x, p.z);
                    else {
                        const cam = (game as any).camera;
                        if (cam?.position) {
                            oceanMap.setPlayerPosition(cam.position.x, cam.position.z);
                        }
                    }
                }
            } catch {
                /* soft */
            }
            requestAnimationFrame(mapLoop);
        };
        requestAnimationFrame(mapLoop);

        const levelSelectUI = new LevelSelectUI(
            document.getElementById('level-select-container')!,
            game.getLevelSystem(),
            startLevelFlow
        );

        const upgradeShopUI = new UpgradeShopUI(
            document.getElementById('upgrade-shop-container')!,
            game.getUpgradeSystem()
        );

        const marinepediaUI = new MarinepediaUI(
            document.getElementById('marinepedia-container')!
        );
        (window as any).marinepediaUI = marinepediaUI;

        const customizationShopUI = new CustomizationShop(
            document.getElementById('customization-shop-container')!
        );
        (window as any).customizationShopUI = customizationShopUI;
        (window as any).upgradeShopUI = upgradeShopUI;

        // Profile select container (created in index-3d.html)
        let profileContainer = document.getElementById('profile-select-container');
        if (!profileContainer) {
            profileContainer = document.createElement('div');
            profileContainer.id = 'profile-select-container';
            profileContainer.style.display = 'none';
            const overlay = document.getElementById('ui-overlay');
            (overlay || document.getElementById('game-container') || document.body).appendChild(
                profileContainer
            );
        }

        // Education + conservation singletons (also on window for Game.collectFish)
        const educationSystem = getEducationSystem();
        const conservationSystem = getConservationSystem();
        (window as any).educationSystem = educationSystem;
        (window as any).conservationSystem = conservationSystem;
        (window as any).DiscoveryToast = DiscoveryToast;

        // Ranger badge — fixed corner (HUD re-render safe)
        const rangerBadge = new RangerBadgeUI();
        rangerBadge.show();

        const refreshRangerUI = () => {
            try {
                const cp = getConservationPointsFromStore();
                // Prefer content ranks when available
                let rankName = getRankForCp(cp).name;
                try {
                    const contentRank = getContentRankForCp(cp);
                    if (contentRank?.name) rankName = contentRank.name;
                } catch {
                    /* content optional */
                }
                mainMenuUI.setRangerInfo?.(rankName, cp);
                rangerBadge.update();
            } catch (e) {
                console.warn('[main] refreshRangerUI', e);
            }
        };

        // Sync ConservationSystem from store after profile load
        const syncConservationFromStore = () => {
            const s = useGameStore.getState();
            conservationSystem.apply?.({
                conservationPoints: s.conservationPoints ?? 0,
                rangerRankId: s.rangerRankId ?? 'tide_explorer',
                cleanups: s.cleanups ?? 0,
                rescues: s.rescues ?? 0,
            });
        };

        conservationSystem.onCpChanged = (_cp: number, delta: number, reason?: string) => {
            // Store is usually already updated by GameStore.recordCleanup; keep badge fresh
            refreshRangerUI();
            if (delta > 0 && (reason?.includes('cleanup') || reason?.includes('litter'))) {
                DiscoveryToast.show(`+${delta} Conservation Points!`, {
                    icon: '♻️',
                    subtitle: 'Plastic off the reef — press M for tips',
                    durationMs: 2800,
                });
            }
        };

        conservationSystem.onRankUp = (rank: { name?: string; badge?: string; briefing?: string; description?: string }) => {
            DiscoveryToast.show(`Rank up: ${rank.name || 'Ranger'}!`, {
                icon: rank.badge || '🏆',
                subtitle: rank.briefing || rank.description || 'You are growing as an Ocean Ranger',
                durationMs: 5000,
            });
            refreshRangerUI();
            doAutoSave();
        };

        // Conservation world juice + mission-facing toasts + free-swim gift win
        const consWorld = game.getConservationWorld?.();
        const maybeGiftSwimWin = () => {
            try {
                tryGiftSwimWin({
                    getCleans: () => (window as any).__diveCleans || 0,
                    isAlreadyWon: () => !!(window as any).__giftSwimWon,
                    markWon: () => {
                        (window as any).__giftSwimWon = true;
                    },
                    clearWon: () => {
                        (window as any).__giftSwimWon = false;
                    },
                    getLevelSystem: () => game.getLevelSystem(),
                    getUpgradeSystem: () => game.getUpgradeSystem(),
                    showWinScreen: (stars, score, unlocked) => {
                        gameHUD.showWinScreen(stars, score, unlocked);
                    },
                    onBeforeWin: () => {
                        DiscoveryToast.show('The reef thanks you!', {
                            icon: '·',
                            subtitle: `You cleaned ${GIFT_CLEAN_WIN_TARGET}+ pieces — Guardian moment!`,
                            durationMs: 4200,
                        });
                    },
                    doAutoSave,
                });
            } catch (e) {
                console.warn('[main] gift swim win soft-fail', e);
            }
        };

        if (consWorld) {
            const prevCollect = consWorld.onCollect;
            consWorld.onCollect = (e: {
                kind: 'litter';
                ids: string[];
                position: import('three').Vector3;
            }) => {
                prevCollect?.(e);
                const n = e.ids?.length ?? 1;
                // Memory language: pride, not inventory
                // Dive clean counter for HUD quest card
                const w = window as any;
                w.__diveCleans = (w.__diveCleans || 0) + n;
                w.__diveCleanTarget = w.__diveCleanTarget || GIFT_CLEAN_PROGRESS_TARGET;
                DiscoveryToast.show(
                    n > 1 ? 'The path is clearer!' : 'Trash gone — fish can breathe easier.',
                    {
                        icon: '·',
                        subtitle: 'The reef is a little happier because of you.',
                        durationMs: 3800,
                    }
                );
                (window as any).gameHUD?.updateCleanProgress?.(
                    w.__diveCleans,
                    w.__diveCleanTarget
                );
                try {
                    getFirstDiveDirector().notifyClean(w.__diveCleans);
                } catch {
                    /* soft */
                }
                maybeGiftSwimWin();
                refreshRangerUI();
                doAutoSave();
            };
            const prevFree = consWorld.onFree;
            consWorld.onFree = (e: unknown) => {
                prevFree?.(e as any);
                const w = window as any;
                w.__diveCleans = (w.__diveCleans || 0) + 2;
                w.__diveCleanTarget = w.__diveCleanTarget || GIFT_CLEAN_PROGRESS_TARGET;
                DiscoveryToast.show('You freed them!', {
                    icon: '·',
                    subtitle: 'The net can’t hurt anyone anymore. The ocean thanks you.',
                    durationMs: 4200,
                });
                (window as any).gameHUD?.updateCleanProgress?.(
                    w.__diveCleans,
                    w.__diveCleanTarget
                );
                try {
                    getFirstDiveDirector().notifyNetFreed();
                } catch {
                    /* soft */
                }
                maybeGiftSwimWin();
                refreshRangerUI();
                doAutoSave();
            };
        }

        const applyProfileToUI = () => {
            accountSystem.applyAll(systemsRef());
            syncConservationFromStore();
            const profile = accountSystem.getActiveProfile();
            const name = profile?.displayName ?? 'Diver';
            mainMenuUI.setDiverName(name);
            updateMenuStats();
            refreshRangerUI();
            levelSelectUI.update();
            console.log(`[main] Profile ready: ${name}`);
        };

        const profileSelectUI = new ProfileSelectUI(
            profileContainer,
            accountSystem,
            () => {
                // onProfileReady
                applyProfileToUI();
                profileSelectUI.hide();
                const startScreen = document.getElementById('start-screen');
                if (startScreen) {
                    startScreen.classList.remove('hidden');
                    startScreen.style.display = 'flex';
                }
                mainMenuUI.show();
            }
        );

        const buddyDiveUI = new BuddyDiveUI();
        (window as any).buddyDiveUI = buddyDiveUI;

        const mainMenuUI = new MainMenuUI(
            document.getElementById('start-screen')!,
            // Play — one-tap Home Reef (gift path)
            () => {
                try {
                    (game as any).audioManager?.startAudio?.();
                    (game as any).audioManager?.playAmbient?.();
                } catch {
                    /* soft */
                }
                mainMenuUI.hide();
                startLevelFlow(GIFT_HOME_LEVEL_ID);
            },
            // Shop
            () => {
                mainMenuUI.hide();
                upgradeShopUI.show();
            },
            // Settings
            () => {
                gameHUD.showSettingsPanel();
            },
            // Switch Diver
            () => {
                doAutoSave();
                mainMenuUI.hide();
                const startScreen = document.getElementById('start-screen');
                if (startScreen) {
                    startScreen.style.display = 'none';
                    startScreen.classList.add('hidden');
                }
                profileSelectUI.show();
            },
            // Buddy Dive (local tabs only — honest)
            () => {
                const name =
                    accountSystem.getActiveProfile()?.displayName || 'Ranger';
                buddyDiveUI.show(name);
            },
            // More Levels (gift: 1–3 only)
            () => {
                mainMenuUI.hide();
                levelSelectUI.show();
            }
        );

        // ── 4. Global exposure ───────────────────────────────────────────
        (window as any).game = game;
        (window as any).gameHUD = gameHUD;
        (window as any).levelSelectUI = levelSelectUI;
        (window as any).upgradeShopUI = upgradeShopUI;
        (window as any).marinepediaUI = marinepediaUI;
        (window as any).customizationShopUI = customizationShopUI;
        (window as any).mainMenuUI = mainMenuUI;
        (window as any).profileSelectUI = profileSelectUI;
        (window as any).accountSystem = accountSystem;
        (window as any).useGameStore = useGameStore;
        (window as any).rangerBadge = rangerBadge;
        (window as any).educationSystem = educationSystem;

        // ── 5. Win / Lose wiring ─────────────────────────────────────────
        const blockSystem = game.getBlockPuzzleSystem();
        if (blockSystem) {
            if (typeof blockSystem.setOnWin === 'function') {
                blockSystem.setOnWin((result: { stars: number; score: number; unlocked: number[] }) => {
                    console.log('[main] onWin', result);
                    // Pearls already awarded in BlockPuzzleSystem; gems in LevelSystem.completeLevel
                    doAutoSave();
                    if (game.isRunning) {
                        game.stop();
                    }
                    gameHUD.showWinScreen(result.stars, result.score, result.unlocked);
                });
            }
            if (typeof blockSystem.setOnLose === 'function') {
                blockSystem.setOnLose(() => {
                    console.log('[main] onLose');
                    if (game.isRunning) {
                        game.stop();
                    }
                    doAutoSave();
                    gameHUD.showLoseScreen();
                });
            }
        }

        // ── 6. Menu stats helper ─────────────────────────────────────────
        const updateMenuStats = () => {
            const levels = game.getLevelSystem().getAllLevels().filter((l) => l.stars > 0).length;
            const stars = game.getLevelSystem().getAllLevels().reduce((sum, l) => sum + l.stars, 0);
            const pearls = game.getUpgradeSystem().getCurrency();
            mainMenuUI.updateStats(levels, stars, pearls);
        };

        // ── 7. Profile gate (hide start, show profile first) ─────────────
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }

        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.classList.add('hidden');
            startScreen.style.display = 'none';
        }

        // Show profile select first — user must pick Jasmine / create
        profileSelectUI.show();

        // ── 8. Keyboard shortcuts ────────────────────────────────────────
        document.addEventListener('keydown', (e) => {
            const marinepedia = document.getElementById('marinepedia-container');
            const shop = document.getElementById('customization-shop-container');
            const levelSelect = document.getElementById('level-select-container');
            const upgradeShop = document.getElementById('upgrade-shop-container');
            const profileEl = document.getElementById('profile-select-container');

            const isUIOpen =
                marinepedia?.style.display === 'block' ||
                shop?.style.display === 'block' ||
                levelSelect?.style.display === 'flex' ||
                levelSelect?.style.display === 'block' ||
                upgradeShop?.style.display === 'block' ||
                upgradeShop?.style.display === 'flex' ||
                (profileEl?.style.display !== 'none' && profileEl?.style.display !== '');

            if (e.key === 'Escape') {
                // Close overlays first (settings / objectives / pause)
                const settingsEl = document.querySelector('.aq-settings');
                const objectivesEl = document.getElementById('aq-objectives');
                const pauseEl = document.querySelector('.pause-screen');
                if (settingsEl) {
                    settingsEl.remove();
                    return;
                }
                if (objectivesEl) {
                    objectivesEl.remove();
                    return;
                }
                if (pauseEl) {
                    // Resume dive — never dump a kid to level select on ESC
                    document.getElementById('btn-resume')?.dispatchEvent(new Event('click'));
                    return;
                }
                if (isUIOpen) {
                    marinepediaUI.hide();
                    customizationShopUI.hide();
                    upgradeShopUI.hide();
                    levelSelectUI.hide();
                    return;
                }
                if (game.isRunning) {
                    // Pause in place so Resume Dive works
                    doAutoSave();
                    gameHUD.showPauseMenu();
                    return;
                }
                // Not diving — show main menu, not a random level list dump
                const startScreen = document.getElementById('start-screen');
                if (startScreen) {
                    startScreen.classList.remove('hidden');
                    startScreen.style.display = 'flex';
                }
                mainMenuUI.show();
            }
            if (e.key === 'u' || e.key === 'U') {
                if (!isUIOpen && !game.isRunning) upgradeShopUI.show();
            }
            if (e.key === 'm' || e.key === 'M') {
                if (!isUIOpen) marinepediaUI.show();
                else if (marinepedia?.style.display === 'block') marinepediaUI.hide();
            }
            if (e.key === 'c' || e.key === 'C') {
                if (!isUIOpen) customizationShopUI.show();
                else if (shop?.style.display === 'block') customizationShopUI.hide();
            }
        });

        // ── 9. HUD loop ──────────────────────────────────────────────────
        let hudAnimationId: number | null = null;
        const updateHUD = () => {
            try {
                if (game.isRunning) {
                    gameHUD.update();
                    rangerBadge.update();
                }
                hudAnimationId = requestAnimationFrame(updateHUD);
            } catch (error) {
                console.error('HUD update error:', error);
                if (hudAnimationId !== null) {
                    cancelAnimationFrame(hudAnimationId);
                }
            }
        };
        updateHUD();

        // ── 10. VR button ────────────────────────────────────────────────
        if (navigator.xr) {
            const vrBtn = document.getElementById('vr-btn');
            if (vrBtn) {
                vrBtn.style.display = 'inline-block';
                vrBtn.addEventListener('click', async () => {
                    try {
                        await game.enableVR();
                        const ss = document.getElementById('start-screen');
                        if (ss) ss.classList.add('hidden');
                    } catch (err) {
                        console.error('VR not available:', err);
                        alert('VR not available on this device');
                    }
                });
            }
        }

        // ── 11. Legacy Dive In button (if present) ───────────────────────
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                mainMenuUI.hide();
                levelSelectUI.show();
            });
        }

        // ── 12. Persist on leave ─────────────────────────────────────────
        window.addEventListener('beforeunload', () => {
            doAutoSave();
        });

        // Periodic soft save while running (catches fish collects, etc.)
        setInterval(() => {
            if (game.isRunning && accountSystem.getActiveProfile()) {
                doAutoSave();
            }
        }, 30_000);

        // Optional: wrap collectFish to autoSave after catch
        const originalCollect = game.collectFish?.bind(game);
        if (originalCollect) {
            (game as any).collectFish = () => {
                const ok = originalCollect();
                if (ok) doAutoSave();
                return ok;
            };
        }

        // Silence unused THREE warning if tree-shaken differently
        void THREE;

        console.log('✅ Game initialized successfully!');
        console.log('Available levels:', game.getLevelSystem().getAllLevels().length);
        console.log(
            'Profiles:',
            accountSystem.listProfiles().map((p) => p.displayName)
        );
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

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

        alert(
            `Game failed to load: ${error instanceof Error ? error.message : String(error)}\n\nCheck console (F12) for details.`
        );
    }
};

// Try immediate initialization if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
