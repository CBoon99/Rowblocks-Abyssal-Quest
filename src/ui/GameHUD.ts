/**
 * Dive HUD — Visual lock mock plate #1
 * Jasmine identity · currencies · left rail · bottom tools · objective · discovery
 */
import { LevelSystem } from '../systems/LevelSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { useGameStore } from '../stores/GameStore';
import { setQualityTier, type QualityTier } from '../systems/QualitySettings';
import { getFirstDiveDirector } from '../systems/FirstDiveDirector';
import { ICONS } from './HudIcons';

export class GameHUD {
    private container: HTMLElement;
    private levelSystem: LevelSystem;
    private upgradeSystem: UpgradeSystem;
    private game: any = null;
    private lanternOn = true;
    private puzzleMode = false;
    private lastDiscoveryAt = 0;

    constructor(
        container: HTMLElement,
        levelSystem: LevelSystem,
        upgradeSystem: UpgradeSystem,
        game?: any
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

    private diverName(): string {
        try {
            const p = (window as any).accountSystem?.getActiveProfile?.();
            if (p?.displayName) return String(p.displayName);
        } catch {
            /* */
        }
        return 'Jasmine';
    }

    private rankLabel(): string {
        try {
            const id =
                useGameStore.getState().rangerRankId ||
                (window as any).accountSystem?.getActiveProfile?.()?.rangerRankId;
            const map: Record<string, string> = {
                tide_explorer: 'Junior Reef Ranger',
                reef_scout: 'Reef Scout',
                kelp_keeper: 'Kelp Keeper',
                abyss_ranger: 'Abyss Ranger',
                ocean_guardian: 'Ocean Guardian',
            };
            return map[id] || 'Junior Reef Ranger';
        } catch {
            return 'Junior Reef Ranger';
        }
    }

    render(): void {
        const stars = this.levelSystem.getCurrentLevel()?.stars ?? 0;
        // Birthday gift: one currency only — pearls (gems hidden)
        const pearls =
            typeof this.upgradeSystem.getCurrency === 'function'
                ? this.upgradeSystem.getCurrency()
                : 0;
        const name = this.diverName();
        const rank = this.rankLabel();
        const levelId = this.levelSystem.getCurrentLevel()?.id ?? 1;
        const depth = this.game ? Math.round(this.game.getCurrentDepth()) : 0;
        const moves = this.levelSystem.getMoves();
        const maxMoves = this.levelSystem.getCurrentLevel()?.maxMoves ?? 0;

        this.container.innerHTML = `
            <div class="aq-hud" id="aq-hud">
              <!-- TOP LEFT: identity -->
              <div class="aq-identity">
                <div class="aq-identity-row">
                  <div class="aq-avatar" aria-hidden="true">
                    <div class="aq-avatar-face"></div>
                  </div>
                  <div class="aq-identity-text">
                    <div class="aq-name">${this.escapeHtml(name.toUpperCase())}</div>
                    <div class="aq-rank">${this.escapeHtml(rank)}</div>
                  </div>
                </div>
                <div class="aq-bars">
                  <div class="aq-bar-row">
                    <span class="aq-lvl">${levelId}</span>
                    <span class="aq-ico-heart">${ICONS.heart}</span>
                    <div class="aq-bar aq-bar-trust">
                      <div class="aq-bar-fill" id="aq-trust-fill" style="width:70%"></div>
                    </div>
                    <span class="aq-bar-val" id="aq-trust-val">—</span>
                  </div>
                  <div class="aq-bar-row">
                    <span class="aq-ico-air">◉</span>
                    <span class="aq-bar-label">AIR</span>
                    <div class="aq-bar aq-bar-air">
                      <div class="aq-bar-fill" id="aq-air-fill" style="width:100%"></div>
                    </div>
                    <span class="aq-bar-val" id="aq-air-val">100/100</span>
                  </div>
                </div>
              </div>

              <!-- TOP CENTRE: compass (readable strip — mock plate) -->
              <div class="aq-compass" id="aq-compass" aria-label="Compass">
                <span data-b="N">N</span>
                <span data-b="NE">NE</span>
                <span data-b="E">E</span>
              </div>

              <!-- TOP RIGHT: pearls only (gift currency lock) + objective -->
              <div class="aq-top-right">
                <div class="aq-currency-stack">
                  <div class="aq-currency aq-shell" title="Pearls">
                    <span class="aq-c-ico">${ICONS.shell}</span>
                    <span id="aq-pearls">${pearls}</span>
                    <span class="aq-c-lbl">PEARLS</span>
                  </div>
                  <div class="aq-currency aq-star" title="Stars this reef">
                    <span class="aq-c-ico">${ICONS.star}</span>
                    <span id="aq-stars">${stars}</span>
                  </div>
                </div>
                <div class="aq-objective" id="aq-objective">
                  <div class="aq-obj-title">
                    <span class="aq-obj-ico">${ICONS.alert}</span>
                    <span id="aq-obj-title">HOME REEF</span>
                  </div>
                  <div class="aq-obj-body" id="aq-obj-body">Follow the golden path · be gentle</div>
                  <div class="aq-obj-progress">
                    <div class="aq-obj-bar"><div class="aq-obj-fill" id="aq-obj-fill" style="width:0%"></div></div>
                    <span id="aq-obj-count">0/8 cleaned</span>
                  </div>
                </div>
              </div>

              <!-- LEFT RAIL -->
              <nav class="aq-rail" aria-label="Dive menu">
                <button type="button" class="aq-rail-btn" data-action="marinepedia" title="Marinepedia">
                  <span class="aq-rail-ico">${ICONS.book}</span>
                  <span class="aq-rail-lbl">MARINEPEDIA</span>
                </button>
                <button type="button" class="aq-rail-btn" data-action="map" title="Map">
                  <span class="aq-rail-ico">${ICONS.mapPin}</span>
                  <span class="aq-rail-lbl">MAP</span>
                </button>
                <button type="button" class="aq-rail-btn" data-action="quests" title="Quests">
                  <span class="aq-rail-ico">${ICONS.clipboard}</span>
                  <span class="aq-rail-lbl">QUESTS</span>
                </button>
                <button type="button" class="aq-rail-btn" data-action="shop" title="Shop">
                  <span class="aq-rail-ico">${ICONS.shop}</span>
                  <span class="aq-rail-lbl">SHOP</span>
                </button>
                <button type="button" class="aq-rail-btn" data-action="settings" title="Settings">
                  <span class="aq-rail-ico">${ICONS.settings}</span>
                  <span class="aq-rail-lbl">SETTINGS</span>
                </button>
              </nav>

              <!-- BOTTOM TOOLS -->
              <div class="aq-tools" role="toolbar" aria-label="Dive tools">
                <button type="button" class="aq-tool" data-tool="observe" id="aq-tool-observe">
                  <span class="aq-tool-num">1</span>
                  <span class="aq-tool-ico">${ICONS.binoculars}</span>
                  <span class="aq-tool-lbl">OBSERVE</span>
                </button>
                <button type="button" class="aq-tool" data-tool="clean" id="aq-tool-clean">
                  <span class="aq-tool-num">2</span>
                  <span class="aq-tool-ico">${ICONS.trash}</span>
                  <span class="aq-tool-lbl">CLEAN</span>
                </button>
                <button type="button" class="aq-tool" data-tool="puzzle" id="aq-tool-puzzle" title="Optional brain game — free swim first">
                  <span class="aq-tool-num">3</span>
                  <span class="aq-tool-ico">${ICONS.puzzle}</span>
                  <span class="aq-tool-lbl">PUZZLE</span>
                </button>
                <button type="button" class="aq-tool" data-tool="boost" id="aq-tool-boost">
                  <span class="aq-tool-num">4</span>
                  <span class="aq-tool-ico">${ICONS.fins}</span>
                  <span class="aq-tool-lbl">BOOST</span>
                </button>
                <button type="button" class="aq-tool" data-tool="lantern" id="aq-tool-lantern">
                  <span class="aq-tool-num">5</span>
                  <span class="aq-tool-ico">${ICONS.lantern}</span>
                  <span class="aq-tool-lbl">LANTERN</span>
                </button>
              </div>

              <!-- DEPTH chip -->
              <div class="aq-depth-chip" id="aq-depth-chip">${depth}m</div>

              <!-- Discovery card -->
              <div class="aq-discovery" id="aq-discovery" hidden>
                <div class="aq-disc-title">NEW DISCOVERY!</div>
                <div class="aq-disc-body">
                  <div class="aq-disc-art" id="aq-disc-art"></div>
                  <div>
                    <div class="aq-disc-name" id="aq-disc-name">—</div>
                    <div class="aq-disc-sub" id="aq-disc-sub">Added to Marinepedia!</div>
                  </div>
                </div>
              </div>

              <!-- Mini compass -->
              <div class="aq-minicompass" id="aq-minicompass" aria-hidden="true">
                <div class="aq-mc-ring">
                  <span class="aq-mc-n">N</span>
                  <div class="aq-mc-needle" id="aq-mc-needle"></div>
                </div>
              </div>

              <!-- Puzzle strip (moves only when puzzle focus) -->
              <div class="aq-puzzle-strip" id="aq-puzzle-strip" hidden>
                <span>Moves <strong id="aq-moves">${moves}</strong> / ${maxMoves}</span>
                <button type="button" class="aq-mini-btn" id="aq-undo">Undo</button>
                <button type="button" class="aq-mini-btn" id="aq-hint">Hint</button>
              </div>

              <button type="button" class="aq-pause" id="aq-pause" title="Pause">${ICONS.pause}</button>
            </div>
        `;

        this.setupButtonListeners();
        // Hide legacy floating bars
        document.getElementById('dive-budget-hud')?.remove();
        document.getElementById('gentleness-hud')?.remove();
    }

    private setupButtonListeners(): void {
        // Left rail
        this.container.querySelectorAll('.aq-rail-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = (btn as HTMLElement).dataset.action;
                this.handleRail(action || '');
            });
        });

        // Tools
        this.container.querySelectorAll('.aq-tool').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tool = (btn as HTMLElement).dataset.tool;
                this.handleTool(tool || '');
            });
        });

        document.getElementById('aq-pause')?.addEventListener('click', () => {
            this.showPauseMenu();
        });

        document.getElementById('aq-undo')?.addEventListener('click', () => {
            const game = (window as any).game;
            game?.getBlockPuzzleSystem?.()?.undo?.();
        });

        document.getElementById('aq-hint')?.addEventListener('click', () => {
            const game = (window as any).game;
            const bs = game?.getBlockPuzzleSystem?.();
            if (bs?.showHint) bs.showHint();
            else this.showHintMessage('Slide rows to open a path to the exit!');
        });

        // Keyboard 1–5
        if (!(window as any)._aqHudKeys) {
            (window as any)._aqHudKeys = true;
            window.addEventListener('keydown', (e) => {
                if (!this.container.offsetParent && this.container.style.display === 'none')
                    return;
                if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
                const map: Record<string, string> = {
                    Digit1: 'observe',
                    Digit2: 'clean',
                    Digit3: 'puzzle',
                    Digit4: 'boost',
                    Digit5: 'lantern',
                    KeyM: 'marinepedia',
                    KeyN: 'map',
                };
                if (map[e.code]?.length === 1 || e.code.startsWith('Digit')) {
                    if (map[e.code] && e.code.startsWith('Digit')) {
                        e.preventDefault();
                        this.handleTool(map[e.code]);
                    }
                }
            });
        }
    }

    private handleRail(action: string): void {
        switch (action) {
            case 'marinepedia':
                (window as any).marinepediaUI?.show?.();
                break;
            case 'map':
                (window as any).oceanMap?.toggleFull?.() ??
                    (window as any).oceanMap?.showFull?.() ??
                    (window as any).oceanMap?.open?.();
                // fallback: click expand if present
                document.querySelector('.ocean-map-expand')?.dispatchEvent(new Event('click'));
                break;
            case 'quests':
                this.showRangerObjectivesPanel();
                break;
            case 'shop':
                (window as any).customizationShopUI?.show?.() ??
                    (window as any).upgradeShopUI?.show?.();
                break;
            case 'settings':
                this.showSettingsPanel();
                break;
        }
    }

    private handleTool(tool: string): void {
        const game = (window as any).game;
        // Visual press
        this.container.querySelectorAll('.aq-tool').forEach((b) => b.classList.remove('active'));
        document.getElementById(`aq-tool-${tool}`)?.classList.add('active');

        switch (tool) {
            case 'observe':
                game?.collectFish?.();
                break;
            case 'clean':
                game?.tryConservationInteract?.(5.8);
                break;
            case 'puzzle':
                this.puzzleMode = !this.puzzleMode;
                const strip = document.getElementById('aq-puzzle-strip');
                if (strip) strip.hidden = !this.puzzleMode;
                game?.getSwimmerController?.()?.setPuzzleMode?.(this.puzzleMode);
                (window as any).mobileControls?.setPuzzleMode?.(this.puzzleMode);
                // Memory: puzzle blocks leave the emotional stage until invited
                try {
                    game?.getBlockPuzzleSystem?.()?.setBlocksVisible?.(this.puzzleMode);
                } catch {
                    /* soft */
                }
                this.showHintMessage(
                    this.puzzleMode
                        ? 'Puzzle mode — click blocks, use arrows or Undo'
                        : 'Back to free swim'
                );
                break;
            case 'boost': {
                // Soft upward + air sip
                try {
                    const sc = game?.getSwimmerController?.();
                    const body = (sc as any)?.physicsBody;
                    if (body?.velocity) {
                        body.velocity.y += 4;
                        body.velocity.x *= 1.15;
                        body.velocity.z *= 1.15;
                    }
                    game?.getDiveBudget?.()?.shareBoost?.(0.12);
                    this.showHintMessage('Boost!');
                } catch {
                    /* */
                }
                break;
            }
            case 'lantern': {
                this.lanternOn = !this.lanternOn;
                try {
                    const fl = (game?.getSwimmerController?.() as any)?.flashlight;
                    if (fl) fl.intensity = this.lanternOn ? 2.4 : 0.15;
                } catch {
                    /* */
                }
                document
                    .getElementById('aq-tool-lantern')
                    ?.classList.toggle('off', !this.lanternOn);
                break;
            }
        }
    }

    /** Public for main menu Settings */
    showSettingsPanel(): void {
        this.removeExistingOverlay('aq-settings');
        const el = document.createElement('div');
        el.className = 'aq-settings';
        el.innerHTML = `
          <div class="aq-settings-card">
            <h2>Settings</h2>
            <label class="aq-set-row">
              <span>Quality</span>
              <select id="aq-quality">
                <option value="high">High</option>
                <option value="medium">Medium (iPad)</option>
                <option value="low">Low</option>
              </select>
            </label>
            <p class="aq-set-hint">Reload after changing quality for full effect.</p>
            <label class="aq-set-row">
              <span>Sound</span>
              <button type="button" id="aq-sound-toggle" class="aq-mini-btn">Sound On</button>
            </label>
            <button type="button" class="btn-primary" id="aq-set-close">Close</button>
          </div>
        `;
        document.body.appendChild(el);
        const qc = (window as any).qualityConfig?.tier || 'high';
        const sel = el.querySelector('#aq-quality') as HTMLSelectElement;
        if (sel) sel.value = qc;
        sel?.addEventListener('change', () => {
            const tier = sel.value as QualityTier;
            const qc = setQualityTier(tier);
            (window as any).qualityConfig = qc;
            try {
                const game = (window as any).game as any;
                // Private fields may be closed over on window.game methods; soft apply
                game?.postProcessing?.applyQuality?.(qc);
                const r = game?.renderer as
                    | { setPixelRatio?: (n: number) => void; shadowMap?: { enabled: boolean } }
                    | undefined;
                r?.setPixelRatio?.(Math.min(window.devicePixelRatio, qc.pixelRatioMax));
                if (r?.shadowMap) r.shadowMap.enabled = !!qc.shadows;
            } catch {
                /* soft — full density still needs reload */
            }
            this.showHintMessage(
                `Quality → ${tier}. Full reef density applies on next dive / reload.`
            );
        });
        const soundBtn = el.querySelector('#aq-sound-toggle') as HTMLButtonElement | null;
        const syncSoundLabel = () => {
            try {
                const game = (window as any).game as any;
                const am = game?.getAudioManager?.() ?? game?.audioManager;
                const muted = !!(am?.isMuted?.() ?? am?.muted);
                if (soundBtn) soundBtn.textContent = muted ? 'Sound Off' : 'Sound On';
            } catch {
                if (soundBtn) soundBtn.textContent = 'Sound On';
            }
        };
        syncSoundLabel();
        soundBtn?.addEventListener('click', () => {
            try {
                const game = (window as any).game as any;
                const am = game?.getAudioManager?.() ?? game?.audioManager;
                if (!am) {
                    this.showHintMessage('Sound controls loading…');
                    return;
                }
                let muted: boolean;
                if (typeof am.toggleMute === 'function') {
                    muted = !!am.toggleMute();
                } else if (typeof am.setMuted === 'function') {
                    muted = !(am.isMuted?.() ?? false);
                    am.setMuted(muted);
                } else {
                    this.showHintMessage('Sound controls loading…');
                    return;
                }
                if (soundBtn) soundBtn.textContent = muted ? 'Sound Off' : 'Sound On';
                this.showHintMessage(muted ? 'Sound off' : 'Sound on');
            } catch {
                this.showHintMessage('Sound controls loading…');
            }
        });
        el.querySelector('#aq-set-close')?.addEventListener('click', () => el.remove());
        el.addEventListener('click', (e) => {
            if (e.target === el) el.remove();
        });
    }

    /** Show current objective + controls reminder from the Quests rail. */
    private showRangerObjectivesPanel(): void {
        this.removeExistingOverlay('aq-objectives');
        const title = document.getElementById('aq-obj-title')?.textContent ?? 'HOME REEF';
        const body =
            document.getElementById('aq-obj-body')?.textContent ??
            'Follow the golden path. Swim gentle.';
        const touch = (window as any).shouldUseMobileControls?.() ?? false;
        const el = document.createElement('div');
        el.className = 'aq-settings aq-objectives';
        el.id = 'aq-objectives';
        el.innerHTML = `
          <div class="aq-settings-card">
            <h2>Ranger Objectives</h2>
            <div class="aq-obj-current">
              <div class="aq-obj-current-title">${this.escapeHtml(title)}</div>
              <p>${this.escapeHtml(body)}</p>
            </div>
            <div class="aq-controls-reminder">
              ${
                  touch
                      ? `<p><strong>Swim:</strong> left stick · drag right to look</p>
                         <p><strong>Up / Down:</strong> vertical buttons</p>
                         <p><strong>Actions:</strong> Observe · Clean · Puzzle · Lantern</p>`
                      : `<p><strong>Swim:</strong> WASD / arrows · Space up · Shift down</p>
                         <p><strong>Actions:</strong> E Observe · F Clean · 3 Puzzle · 5 Lantern</p>`
              }
            </div>
            <button type="button" class="btn-primary" id="aq-obj-close">Close</button>
          </div>
        `;
        document.body.appendChild(el);
        el.querySelector('#aq-obj-close')?.addEventListener('click', () => el.remove());
        el.addEventListener('click', (e) => {
            if (e.target === el) el.remove();
        });
    }

    private showHintMessage(message: string): void {
        const hintMsg = document.createElement('div');
        hintMsg.className = 'hint-message';
        hintMsg.textContent = message;
        document.body.appendChild(hintMsg);
        setTimeout(() => hintMsg.remove(), 2800);
    }

    private showToast(message: string): void {
        this.showHintMessage(message);
    }

    private autoSave(): void {
        try {
            const account = (window as any).accountSystem;
            const game = (window as any).game;
            if (account && typeof account.autoSave === 'function') {
                account.autoSave({
                    levelSystem: game?.getLevelSystem?.() ?? this.levelSystem,
                    upgradeSystem: game?.getUpgradeSystem?.() ?? this.upgradeSystem,
                });
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
        // Reset free-swim gift win so Try Again can celebrate again
        try {
            (window as any).__diveCleans = 0;
            (window as any).__giftSwimWon = false;
            (window as any).__diveCleanTarget =
                (window as any).__diveCleanTarget || 8;
            this.updateCleanProgress?.(0, (window as any).__diveCleanTarget || 8);
            game.getDiveBudget?.()?.reset?.();
            game.getConservationWorld?.()?.respawnHomeReefGiftTrash?.();
            getFirstDiveDirector().reset();
        } catch {
            /* soft */
        }
        const blockSystem = game.getBlockPuzzleSystem?.();
        if (blockSystem && typeof blockSystem.loadLevelBlocks === 'function') {
            levelSystem.startLevel(currentLevel.id);
            blockSystem.loadLevelBlocks();
            try {
                blockSystem.setBlocksVisible?.(false);
            } catch {
                /* soft */
            }
            if (typeof game.onLevelStarted === 'function') game.onLevelStarted();
            if (!game.isRunning) game.start();
            this.render();
            this.show();
        }
    }

    update(): void {
        const pearls =
            typeof this.upgradeSystem.getCurrency === 'function'
                ? this.upgradeSystem.getCurrency()
                : 0;
        const depth = this.game ? Math.round(this.game.getCurrentDepth()) : 0;
        const moves = this.levelSystem.getMoves();
        const stars = this.levelSystem.getCurrentLevel()?.stars ?? 0;

        const set = (id: string, t: string) => {
            const el = document.getElementById(id);
            if (el) el.textContent = t;
        };
        set('aq-pearls', String(pearls));
        set('aq-stars', String(stars));
        set('aq-moves', String(moves));
        set('aq-depth-chip', `${depth}m`);

        // Compass from look direction
        try {
            const dir = this.game?.getSwimmerController?.()?.getDirection?.();
            if (dir) {
                const yaw = Math.atan2(dir.x, dir.z);
                const deg = ((yaw * 180) / Math.PI + 360) % 360;
                const bearings = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                const idx = Math.round(deg / 45) % 8;
                const bearing = bearings[idx];
                this.container.querySelectorAll('.aq-compass span').forEach((s) => {
                    s.classList.toggle(
                        'active',
                        (s as HTMLElement).dataset.b === bearing
                    );
                });
                const needle = document.getElementById('aq-mc-needle');
                if (needle) needle.style.transform = `rotate(${-deg}deg)`;
            }
        } catch {
            /* soft */
        }
    }

    showPauseMenu(): void {
        // Don't stack pause screens — second ESC resumes via #btn-resume
        if (document.querySelector('.pause-screen')) return;

        this.removeExistingOverlay('pause-screen');
        const game = (window as any).game ?? this.game;
        const wasRunning = !!game?.isRunning;
        if (wasRunning) game.stop();
        (window as any).mobileControls?.hide?.();
        try {
            if (document.pointerLockElement) {
                document.exitPointerLock?.();
            }
        } catch {
            /* soft */
        }

        const el = document.createElement('div');
        el.className = 'pause-screen win-screen';
        el.innerHTML = `
            <div class="win-content pause-content">
                <div class="win-title">Paused</div>
                <p class="win-ranger-line">Take a breath, Ocean Ranger.</p>
                <p class="win-edu">Press Esc or Resume Dive to keep swimming.</p>
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
        // Also feed objective card
        const body = document.getElementById('aq-obj-body');
        if (body) body.textContent = text.slice(0, 80);
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
        this.removeExistingOverlay('win-screen');
        this.removeExistingOverlay('lose-screen');
        this.removeExistingOverlay('pause-screen');
        this.autoSave();
        const game = (window as any).game ?? this.game;
        if (game?.isRunning) game.stop();
        (window as any).mobileControls?.hide?.();

        const profile = (window as any).accountSystem?.getActiveProfile?.();
        const name = profile?.displayName || 'Ranger';
        const cp = useGameStore.getState().conservationPoints ?? 0;

        // Celebration juice — win arpeggio (not collect chime)
        try {
            const am = game?.getAudioManager?.() ?? (game as any).audioManager;
            am?.startAudio?.();
            am?.playSound?.('win');
            const pos = game?.getSwimmerController?.()?.getPosition?.();
            if (pos) game?.getBubblesSystem?.()?.emitBubbles?.(pos.clone(), 40);
        } catch {
            /* soft */
        }

        const winScreen = document.createElement('div');
        winScreen.className = 'win-screen';
        winScreen.innerHTML = `
            <div class="win-content win-celebrate">
                <div class="win-sparkle" aria-hidden="true"></div>
                <div class="win-title">You did it, ${this.escapeHtml(name)}!</div>
                <div class="win-sub">Guardian of the Reef</div>
                <div class="win-stars">${'★'.repeat(Math.max(1, stars))}${'☆'.repeat(Math.max(0, 3 - stars))}</div>
                <div class="win-score">Score: ${score}</div>
                <p class="win-edu">The path is open — and the reef is safer with a ranger like you.</p>
                <div class="win-cp">Conservation: ${cp} CP · Pearls saved</div>
                ${
                    unlocked.length > 0
                        ? `<div class="unlocked-levels">New reef unlocked: ${unlocked
                              .filter((id) => id <= 3)
                              .map((id) => `Level ${id}`)
                              .join(', ') || 'keep exploring!'}</div>`
                        : ''
                }
                <div class="win-buttons">
                    <button class="btn-primary" id="btn-next-level">Next Adventure</button>
                    <button class="btn-secondary" id="btn-level-select">Level Select</button>
                    <button class="btn-secondary" id="btn-retry">Try Again</button>
                </div>
            </div>
        `;
        document.body.appendChild(winScreen);

        document.getElementById('btn-next-level')?.addEventListener('click', () => {
            winScreen.remove();
            const levelSystem = game?.getLevelSystem?.() ?? this.levelSystem;
            const currentLevel = levelSystem?.getCurrentLevel?.();
            if (!currentLevel) return;
            const nextLevelId = currentLevel.id + 1;
            const levelSelectUI = (window as any).levelSelectUI;
            if (levelSystem?.isLevelUnlocked?.(nextLevelId) === false) {
                this.showToast(`Level ${nextLevelId} is still locked!`);
                levelSelectUI?.show?.();
                return;
            }
            levelSelectUI?.selectLevel?.(nextLevelId);
        });
        document.getElementById('btn-level-select')?.addEventListener('click', () => {
            winScreen.remove();
            (window as any).levelSelectUI?.show?.();
        });
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            winScreen.remove();
            this.restartCurrentLevel();
        });
    }

    showLoseScreen(): void {
        this.removeExistingOverlay('lose-screen');
        this.removeExistingOverlay('win-screen');
        const game = (window as any).game ?? this.game;
        if (game?.isRunning) game.stop();
        this.autoSave();
        const loseScreen = document.createElement('div');
        loseScreen.className = 'lose-screen';
        loseScreen.innerHTML = `
            <div class="lose-content">
                <div class="lose-title">Out of moves!</div>
                <div class="lose-message">Try a different slide — or undo and rethink the path.</div>
                <div class="lose-buttons">
                    <button class="btn-primary" id="btn-retry-lose">Retry</button>
                    <button class="btn-secondary" id="btn-level-select-lose">Level Select</button>
                </div>
            </div>
        `;
        document.body.appendChild(loseScreen);
        document.getElementById('btn-retry-lose')?.addEventListener('click', () => {
            loseScreen.remove();
            this.restartCurrentLevel();
        });
        document.getElementById('btn-level-select-lose')?.addEventListener('click', () => {
            loseScreen.remove();
            (window as any).levelSelectUI?.show?.();
        });
    }

    show(): void {
        this.container.style.display = 'block';
        this.setupButtonListeners();
    }

    hide(): void {
        this.container.style.display = 'none';
        this.hideRangerAlert();
    }

    updateDiveBudget(state: {
        ratio: number;
        status: string;
        message: string;
        isSurfaced: boolean;
    }): void {
        const fill = document.getElementById('aq-air-fill');
        const val = document.getElementById('aq-air-val');
        const pct = Math.round(state.ratio * 100);
        if (fill) {
            fill.style.width = `${pct}%`;
            fill.dataset.status = state.status;
        }
        if (val) val.textContent = `${pct}/100`;
        document
            .getElementById('aq-hud')
            ?.classList.toggle('air-warn', state.status === 'surface' || state.status === 'assist');
    }

    showRangerAlert(alert: {
        title: string;
        body: string;
        timeLeft: number;
        maxTime: number;
        progress: number;
        target: number;
    }): void {
        const title = document.getElementById('aq-obj-title');
        const body = document.getElementById('aq-obj-body');
        const count = document.getElementById('aq-obj-count');
        const fill = document.getElementById('aq-obj-fill');
        if (title) title.textContent = alert.title.toUpperCase();
        if (body) body.textContent = alert.body;
        if (count) count.textContent = `${alert.progress}/${alert.target}`;
        if (fill) {
            const p = alert.target > 0 ? (alert.progress / alert.target) * 100 : 0;
            fill.style.width = `${Math.min(100, p)}%`;
        }
        document.getElementById('aq-objective')?.classList.add('alert');
    }

    updateRangerAlert(alert: {
        title: string;
        body: string;
        timeLeft: number;
        maxTime: number;
        progress: number;
        target: number;
    }): void {
        this.showRangerAlert(alert);
    }

    hideRangerAlert(): void {
        document.getElementById('aq-objective')?.classList.remove('alert');
    }

    /** Trust / gentleness 0–1 */
    updateGentleness(g: number): void {
        const fill = document.getElementById('aq-trust-fill');
        const val = document.getElementById('aq-trust-val');
        const pct = Math.round(g * 100);
        if (fill) {
            fill.style.width = `${pct}%`;
            fill.dataset.level = g > 0.7 ? 'calm' : g > 0.4 ? 'ok' : 'thrash';
        }
        if (val) val.textContent = `${pct}`;
        document.getElementById('aq-hud')?.classList.toggle('thrashing', g < 0.4);
    }

    /** Quest card clean progress (litter + nets this dive) */
    updateCleanProgress(done: number, target = 8): void {
        const count = document.getElementById('aq-obj-count');
        const fill = document.getElementById('aq-obj-fill');
        const title = document.getElementById('aq-obj-title');
        const body = document.getElementById('aq-obj-body');
        const d = Math.max(0, done | 0);
        const t = Math.max(1, target | 0);
        if (count) count.textContent = `${Math.min(d, t)}/${t} cleaned`;
        if (fill) fill.style.width = `${Math.min(100, (d / t) * 100)}%`;
        if (d >= 1 && title && body) {
            title.textContent = 'CLEAN THE REEF';
            body.textContent = 'Remove trash · free ghost nets';
        }
        if (d >= t && body) {
            body.textContent = 'The reef is thanking you…';
            document.getElementById('aq-objective')?.classList.add('alert');
        }
    }

    /** Discovery card (Marinepedia unlock) */
    showDiscoveryCard(name: string, subtitle = 'Added to Marinepedia!'): void {
        const card = document.getElementById('aq-discovery');
        if (!card) return;
        const n = document.getElementById('aq-disc-name');
        const s = document.getElementById('aq-disc-sub');
        if (n) n.textContent = name;
        if (s) s.textContent = subtitle;
        card.hidden = false;
        card.classList.add('visible');
        this.lastDiscoveryAt = performance.now();
        setTimeout(() => {
            if (performance.now() - this.lastDiscoveryAt >= 4500) {
                card.classList.remove('visible');
                setTimeout(() => {
                    card.hidden = true;
                }, 400);
            }
        }, 5000);
    }
}
