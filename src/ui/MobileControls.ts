/**
 * iPad / touch control overlay for Rowblocks Abyssal Quest.
 * Landscape-first: stick (move), drag look, vertical swim, Observe + Clean, puzzle pad.
 */

import { isTouchPrimary } from '../systems/QualitySettings';
import { ICONS } from './HudIcons';

export interface MobileControlsHost {
    setMoveState(state: {
        forward: boolean;
        backward: boolean;
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
    }): void;
    addLookDelta(dx: number, dy: number): void;
    triggerCollect(): void;
    triggerConserve(): void;
    slidePuzzle?(dir: 'left' | 'right' | 'up' | 'down'): void;
    setPuzzleMode?(on: boolean): void;
}

export class MobileControls {
    private root: HTMLElement;
    private host: MobileControlsHost;
    private visible = false;
    private puzzleMode = false;

    private stickActive = false;
    private stickId: number | null = null;
    private stickOrigin = { x: 0, y: 0 };
    private stickKnob: HTMLElement | null = null;
    private stickBase: HTMLElement | null = null;

    private lookId: number | null = null;
    private lookLast = { x: 0, y: 0 };

    private move = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
    };

    constructor(host: MobileControlsHost) {
        this.host = host;
        this.root = document.createElement('div');
        this.root.id = 'mobile-controls';
        this.root.className = 'mobile-controls hidden';
        this.root.innerHTML = this.template();
        document.body.appendChild(this.root);
        this.stickBase = this.root.querySelector('.mc-stick-base');
        this.stickKnob = this.root.querySelector('.mc-stick-knob');
        this.bind();
    }

    private template(): string {
        return `
      <div class="mc-safe">
        <div class="mc-stick-zone" id="mc-stick-zone">
          <div class="mc-stick-base">
            <div class="mc-stick-knob"></div>
          </div>
          <div class="mc-stick-label">Swim</div>
        </div>

        <div class="mc-look-zone" id="mc-look-zone" aria-label="Drag to look"></div>

        <div class="mc-right-cluster">
          <button type="button" class="mc-btn mc-vert" id="mc-up" aria-label="Swim up">↑</button>
          <button type="button" class="mc-btn mc-vert" id="mc-down" aria-label="Swim down">↓</button>
          <button type="button" class="mc-btn mc-action mc-observe" id="mc-observe" aria-label="Observe fish">
            <span class="mc-ico mc-ico-svg">${ICONS.binoculars}</span><span class="mc-txt">Observe</span>
          </button>
          <button type="button" class="mc-btn mc-action mc-clean" id="mc-clean" aria-label="Clean ocean">
            <span class="mc-ico mc-ico-svg">${ICONS.trash}</span><span class="mc-txt">Clean</span>
          </button>
          <button type="button" class="mc-btn mc-toggle" id="mc-puzzle" aria-label="Puzzle mode">
            <span class="mc-ico mc-ico-svg">${ICONS.puzzle}</span><span class="mc-txt">Puzzle</span>
          </button>
        </div>

        <div class="mc-puzzle-pad hidden" id="mc-puzzle-pad">
          <button type="button" class="mc-pad-btn" data-dir="up">↑</button>
          <div class="mc-pad-mid">
            <button type="button" class="mc-pad-btn" data-dir="left">←</button>
            <button type="button" class="mc-pad-btn" data-dir="right">→</button>
          </div>
          <button type="button" class="mc-pad-btn" data-dir="down">↓</button>
          <div class="mc-pad-hint">Tap a block, then slide</div>
        </div>

        <div class="mc-coach" id="mc-coach">
          <div class="mc-coach-card">
            <h3>You’re the Ocean Ranger!</h3>
            <p><strong>Swim gentle</strong> — animals trust you</p>
            <p><strong>Left stick</strong> — move · <strong>drag right</strong> — look</p>
            <p><strong>Follow the golden path</strong> — look left for a turtle</p>
            <p><strong>Clean</strong> — trash & nets (help the reef)</p>
            <p><strong>Observe</strong> — when you’re close and calm</p>
            <button type="button" class="mc-coach-go" id="mc-coach-go">Let’s dive!</button>
          </div>
        </div>

        <div class="mc-orient" id="mc-orient">
          <div class="mc-orient-card">Turn your iPad sideways to dive!</div>
        </div>
      </div>
    `;
    }

    private bind(): void {
        const stickZone = this.root.querySelector('#mc-stick-zone') as HTMLElement;
        const lookZone = this.root.querySelector('#mc-look-zone') as HTMLElement;

        // Stick
        stickZone.addEventListener(
            'pointerdown',
            (e) => {
                if (this.puzzleMode) return;
                e.preventDefault();
                e.stopPropagation();
                stickZone.setPointerCapture(e.pointerId);
                this.stickActive = true;
                this.stickId = e.pointerId;
                const rect = this.stickBase!.getBoundingClientRect();
                this.stickOrigin = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                };
                this.updateStick(e.clientX, e.clientY);
            },
            { passive: false }
        );
        stickZone.addEventListener(
            'pointermove',
            (e) => {
                if (!this.stickActive || e.pointerId !== this.stickId) return;
                e.preventDefault();
                this.updateStick(e.clientX, e.clientY);
            },
            { passive: false }
        );
        const endStick = (e: PointerEvent) => {
            if (e.pointerId !== this.stickId) return;
            this.stickActive = false;
            this.stickId = null;
            this.resetStick();
        };
        stickZone.addEventListener('pointerup', endStick);
        stickZone.addEventListener('pointercancel', endStick);

        // Look zone (right half of screen area)
        lookZone.addEventListener(
            'pointerdown',
            (e) => {
                if (this.puzzleMode) return;
                // Don't steal if pressing buttons (they're outside look zone)
                e.preventDefault();
                this.lookId = e.pointerId;
                this.lookLast = { x: e.clientX, y: e.clientY };
                lookZone.setPointerCapture(e.pointerId);
            },
            { passive: false }
        );
        lookZone.addEventListener(
            'pointermove',
            (e) => {
                if (this.lookId !== e.pointerId) return;
                e.preventDefault();
                const dx = e.clientX - this.lookLast.x;
                const dy = e.clientY - this.lookLast.y;
                this.lookLast = { x: e.clientX, y: e.clientY };
                // Slightly higher sensitivity for finger
                this.host.addLookDelta(dx * 1.35, dy * 1.35);
            },
            { passive: false }
        );
        const endLook = (e: PointerEvent) => {
            if (e.pointerId === this.lookId) this.lookId = null;
        };
        lookZone.addEventListener('pointerup', endLook);
        lookZone.addEventListener('pointercancel', endLook);

        // Vertical hold buttons
        this.bindHold('mc-up', 'up');
        this.bindHold('mc-down', 'down');

        this.root.querySelector('#mc-observe')?.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.host.triggerCollect();
            this.pulse('#mc-observe');
        });
        this.root.querySelector('#mc-clean')?.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.host.triggerConserve();
            this.pulse('#mc-clean');
        });

        this.root.querySelector('#mc-puzzle')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.setPuzzleMode(!this.puzzleMode);
        });

        this.root.querySelectorAll('.mc-pad-btn').forEach((btn) => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const dir = (btn as HTMLElement).dataset.dir as 'left' | 'right' | 'up' | 'down';
                this.host.slidePuzzle?.(dir);
            });
        });

        this.root.querySelector('#mc-coach-go')?.addEventListener('click', () => {
            this.hideCoach();
            try {
                localStorage.setItem('rowblocks_coach_seen_v1', '1');
            } catch {
                /* ignore */
            }
        });

        // Orientation
        const checkOrient = () => {
            const el = this.root.querySelector('#mc-orient');
            if (!el) return;
            const portrait = window.innerHeight > window.innerWidth;
            el.classList.toggle('visible', portrait && this.visible);
        };
        window.addEventListener('resize', checkOrient);
        window.addEventListener('orientationchange', checkOrient);
        checkOrient();
    }

    private bindHold(id: string, key: 'up' | 'down'): void {
        const el = this.root.querySelector(`#${id}`) as HTMLElement | null;
        if (!el) return;
        const on = (e: PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            el.setPointerCapture(e.pointerId);
            this.move[key] = true;
            this.pushMove();
        };
        const off = () => {
            this.move[key] = false;
            this.pushMove();
        };
        el.addEventListener('pointerdown', on, { passive: false });
        el.addEventListener('pointerup', off);
        el.addEventListener('pointercancel', off);
        el.addEventListener('pointerleave', off);
    }

    private updateStick(cx: number, cy: number): void {
        const maxR = 54;
        let dx = cx - this.stickOrigin.x;
        let dy = cy - this.stickOrigin.y;
        const len = Math.hypot(dx, dy) || 1;
        if (len > maxR) {
            dx = (dx / len) * maxR;
            dy = (dy / len) * maxR;
        }
        if (this.stickKnob) {
            this.stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        }
        const nx = dx / maxR;
        const ny = dy / maxR;
        const dead = 0.18;
        this.move.forward = ny < -dead;
        this.move.backward = ny > dead;
        this.move.left = nx < -dead;
        this.move.right = nx > dead;
        this.pushMove();
    }

    private resetStick(): void {
        if (this.stickKnob) this.stickKnob.style.transform = 'translate(0,0)';
        this.move.forward = false;
        this.move.backward = false;
        this.move.left = false;
        this.move.right = false;
        this.pushMove();
    }

    private pushMove(): void {
        this.host.setMoveState({ ...this.move });
    }

    private pulse(sel: string): void {
        const el = this.root.querySelector(sel);
        el?.classList.add('mc-pulse');
        setTimeout(() => el?.classList.remove('mc-pulse'), 180);
    }

    setPuzzleMode(on: boolean): void {
        this.puzzleMode = on;
        this.root.querySelector('#mc-puzzle-pad')?.classList.toggle('hidden', !on);
        this.root.querySelector('#mc-puzzle')?.classList.toggle('active', on);
        this.root.classList.toggle('puzzle-mode', on);
        this.host.setPuzzleMode?.(on);
        this.resetStick();
    }

    show(opts?: { showCoach?: boolean }): void {
        if (!isTouchPrimary() && !opts?.showCoach) {
            // Still allow force show for testing
        }
        this.visible = true;
        this.root.classList.remove('hidden');
        let showCoach = opts?.showCoach;
        if (showCoach === undefined) {
            try {
                showCoach = localStorage.getItem('rowblocks_coach_seen_v1') !== '1';
            } catch {
                showCoach = true;
            }
        }
        if (showCoach) this.showCoach();
        else this.hideCoach();
    }

    hide(): void {
        this.visible = false;
        this.root.classList.add('hidden');
        this.resetStick();
        this.move.up = false;
        this.move.down = false;
        this.pushMove();
    }

    showCoach(): void {
        this.root.querySelector('#mc-coach')?.classList.add('visible');
    }

    hideCoach(): void {
        this.root.querySelector('#mc-coach')?.classList.remove('visible');
    }

    isVisible(): boolean {
        return this.visible;
    }

    destroy(): void {
        this.root.remove();
    }
}

export function shouldUseMobileControls(): boolean {
    return isTouchPrimary();
}
