/**
 * FirstDiveDirector — sequential kid objectives for Home Reef gift loop.
 * One directive at a time. No new mechanics.
 *
 * Phases:
 *  0 welcome  → path invitation
 *  1 turtle   → soft look + "a friend may come"
 *  2 clean    → glowing trash
 *  3 free     → optional net (soft)
 *  4 explore  → rest of reef / optional pearl
 */

export type FirstDivePhase =
    | 'welcome'
    | 'turtle'
    | 'clean'
    | 'free'
    | 'explore'
    | 'done';

export class FirstDiveDirector {
    private t = 0;
    private phase: FirstDivePhase = 'welcome';
    private phaseT = 0;
    private nudgedLook = false;
    private active = true;
    private lastBody = '';

    reset(): void {
        this.t = 0;
        this.phase = 'welcome';
        this.phaseT = 0;
        this.nudgedLook = false;
        this.active = true;
        this.lastBody = '';
        try {
            document.getElementById('aq-hud')?.classList.add('first-dive-calm');
        } catch {
            /* */
        }
        this.setObjective('HOME REEF', 'Follow the golden path. Swim gentle.');
    }

    getPhase(): FirstDivePhase {
        return this.phase;
    }

    /** Call when trash is cleaned this dive */
    notifyClean(total: number): void {
        if (!this.active) return;
        if (this.phase === 'clean' || this.phase === 'turtle') {
            if (total >= 1) {
                this.advance('free');
                this.setObjective(
                    'GHOST NET',
                    'See a net with fish? Swim close and press Clean (F).'
                );
            }
        }
        if (total >= 3 && (this.phase === 'free' || this.phase === 'clean')) {
            this.advance('explore');
            this.setObjective(
                'EXPLORE',
                'Look up for a manta · give the shark space · be gentle.'
            );
        }
        if (total >= 6) {
            this.advance('done');
            this.setObjective(
                'GUARDIAN',
                'The reef is happier. Keep exploring — or try Puzzle (3).'
            );
            this.endCalmSoon(2);
        }
    }

    /** Call when a ghost net is freed */
    notifyNetFreed(): void {
        if (!this.active) return;
        if (this.phase === 'free' || this.phase === 'clean') {
            this.advance('explore');
            this.setObjective(
                'EXPLORE',
                'You freed them! Look up for a manta · stay gentle.'
            );
        }
    }

    /** Call when friend turtle memory fires */
    notifyTurtleMoment(): void {
        if (!this.active) return;
        if (this.phase === 'welcome' || this.phase === 'turtle') {
            this.advance('clean');
            this.setObjective(
                'CLEAN',
                'Glowing trash on the path — press Clean (or F).'
            );
            try {
                (window as any).DiscoveryToast?.show?.('She came to see you', {
                    icon: '·',
                    subtitle: 'Now help the reef — clean the glowing trash',
                    durationMs: 3600,
                });
            } catch {
                /* soft */
            }
        }
    }

    update(
        dt: number,
        swimmer: any,
        getPos: () => { x: number; y: number; z: number }
    ): void {
        if (!this.active && this.phase === 'done') return;
        this.t += dt;
        this.phaseT += dt;

        const cleans = (window as any).__diveCleans || 0;

        // ── Phase machine (time + position backups) ────────────────
        if (this.phase === 'welcome' && this.phaseT > 2.5) {
            this.advance('turtle');
            this.setObjective(
                'A FRIEND',
                'Swim gentle along the path. Look left — a turtle may come.'
            );
            try {
                (window as any).DiscoveryToast?.show?.('Welcome to Home Reef', {
                    icon: '·',
                    subtitle: 'Be gentle. The ocean is watching.',
                    durationMs: 3400,
                });
            } catch {
                /* soft */
            }
        }

        if (this.phase === 'turtle') {
            // Soft look toward turtle (left of path)
            if (!this.nudgedLook && this.t > 4 && this.t < 14) {
                const p = getPos();
                if (Math.hypot(p.x, p.z - 3.5) < 10) {
                    try {
                        const yaw = swimmer?.yawObject;
                        if (yaw) {
                            const target = -0.58;
                            yaw.rotation.y += (target - yaw.rotation.y) * 0.1;
                            if (Math.abs(yaw.rotation.y - target) < 0.07) {
                                this.nudgedLook = true;
                            }
                        } else {
                            this.nudgedLook = true;
                        }
                    } catch {
                        this.nudgedLook = true;
                    }
                }
            }
            // Backup: if she swims forward without turtle event, still teach clean
            if (this.phaseT > 18 || (getPos().z > 6 && this.phaseT > 10)) {
                this.advance('clean');
                this.setObjective(
                    'CLEAN',
                    'Glowing trash on the path — press Clean (or F).'
                );
            }
        }

        if (this.phase === 'clean') {
            if (cleans >= 1) {
                this.notifyClean(cleans);
            } else if (this.phaseT > 22) {
                this.advance('free');
                this.setObjective(
                    'HELP',
                    'Clean trash or free a net — the reef will thank you.'
                );
            }
        }

        if (this.phase === 'free' && this.phaseT > 16) {
            this.advance('explore');
            this.setObjective(
                'EXPLORE',
                'Look up for a manta · give sharks space · optional Puzzle (3).'
            );
        }

        // End calm chrome after explore settles
        if (this.phase === 'explore' && this.phaseT > 8) {
            this.endCalmSoon(0);
        }

        if (this.t > 90 && this.phase !== 'done') {
            this.advance('done');
            this.endCalmSoon(0);
        }
    }

    private advance(next: FirstDivePhase): void {
        if (this.phase === next) return;
        // Don't go backwards
        const order: FirstDivePhase[] = [
            'welcome',
            'turtle',
            'clean',
            'free',
            'explore',
            'done',
        ];
        if (order.indexOf(next) < order.indexOf(this.phase)) return;
        this.phase = next;
        this.phaseT = 0;
    }

    private endCalmSoon(delaySec: number): void {
        const finish = () => {
            this.active = false;
            try {
                document.getElementById('aq-hud')?.classList.remove('first-dive-calm');
            } catch {
                /* */
            }
        };
        if (delaySec <= 0) finish();
        else setTimeout(finish, delaySec * 1000);
    }

    private setObjective(title: string, body: string): void {
        if (body === this.lastBody) return;
        this.lastBody = body;
        try {
            const t = document.getElementById('aq-obj-title');
            const b = document.getElementById('aq-obj-body');
            if (t) t.textContent = title;
            if (b) b.textContent = body;
            document.getElementById('aq-objective')?.classList.add('alert');
            setTimeout(() => {
                document.getElementById('aq-objective')?.classList.remove('alert');
            }, 1600);
        } catch {
            /* soft */
        }
    }
}

let _dir: FirstDiveDirector | null = null;
export function getFirstDiveDirector(): FirstDiveDirector {
    if (!_dir) _dir = new FirstDiveDirector();
    return _dir;
}
