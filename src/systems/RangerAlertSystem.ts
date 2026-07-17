/**
 * Solo Ranger Alerts — kid-safe emergencies (always winnable, no horror).
 */

export type RangerAlertType =
    | 'ghost_net'
    | 'litter_surge'
    | 'anchor_crush'
    | 'turtle_help';

export interface RangerAlert {
    id: string;
    type: RangerAlertType;
    title: string;
    body: string;
    /** World hint */
    x: number;
    z: number;
    /** Seconds remaining (generous) */
    timeLeft: number;
    maxTime: number;
    completed: boolean;
    failed: boolean;
    /** Progress 0–target */
    progress: number;
    target: number;
}

const ALERT_POOL: Omit<RangerAlert, 'id' | 'timeLeft' | 'completed' | 'failed' | 'progress' | 'x' | 'z'>[] = [
    {
        type: 'ghost_net',
        title: 'Ranger Alert!',
        body: 'A ghost net is trapping friends — free it with Clean!',
        maxTime: 120,
        target: 1,
    },
    {
        type: 'litter_surge',
        title: 'Plastic Wave!',
        body: 'Litter spotted on a reef — collect 4 pieces with Clean!',
        maxTime: 150,
        target: 4,
    },
    {
        type: 'turtle_help',
        title: 'Turtle Needs You!',
        body: 'Observe 2 sea creatures and clean 2 pieces of trash!',
        maxTime: 180,
        target: 4, // combined steps tracked externally loosely
    },
    {
        type: 'anchor_crush',
        title: 'Anchor on Coral!',
        body: 'Careless boat gear — free a net near the reef to clear the chain!',
        maxTime: 140,
        target: 1,
    },
];

export class RangerAlertSystem {
    private active: RangerAlert | null = null;
    private cooldown = 25; // first alert after 25s
    private completedCount = 0;

    onAlertStart?: (alert: RangerAlert) => void;
    onAlertComplete?: (alert: RangerAlert) => void;
    onAlertExpire?: (alert: RangerAlert) => void;

    getActive(): RangerAlert | null {
        return this.active;
    }

    getCompletedCount(): number {
        return this.completedCount;
    }

    /** Call each frame while diving */
    update(dt: number, playerX: number, playerZ: number): void {
        if (this.active) {
            if (!this.active.completed && !this.active.failed) {
                this.active.timeLeft -= dt;
                if (this.active.timeLeft <= 0) {
                    // Soft fail — no punishment, just expire with kindness
                    this.active.failed = true;
                    this.onAlertExpire?.(this.active);
                    this.active = null;
                    this.cooldown = 40;
                }
            }
            return;
        }

        this.cooldown -= dt;
        if (this.cooldown <= 0) {
            this.spawnAlert(playerX, playerZ);
            this.cooldown = 55 + Math.random() * 40;
        }
    }

    private spawnAlert(px: number, pz: number): void {
        const template = ALERT_POOL[Math.floor(Math.random() * ALERT_POOL.length)];
        // Place near player-ish open water or reef edge
        const ang = Math.random() * Math.PI * 2;
        const dist = 12 + Math.random() * 18;
        const alert: RangerAlert = {
            ...template,
            id: `alert_${Date.now()}`,
            x: px + Math.cos(ang) * dist,
            z: pz + Math.sin(ang) * dist,
            timeLeft: template.maxTime,
            completed: false,
            failed: false,
            progress: 0,
        };
        this.active = alert;
        this.onAlertStart?.(alert);
    }

    /** Progress from gameplay events */
    report(event: 'net_free' | 'litter' | 'observe'): void {
        const a = this.active;
        if (!a || a.completed || a.failed) return;

        if (a.type === 'ghost_net' && event === 'net_free') {
            a.progress = a.target;
        } else if (a.type === 'litter_surge' && event === 'litter') {
            a.progress = Math.min(a.target, a.progress + 1);
        } else if (a.type === 'anchor_crush' && event === 'net_free') {
            a.progress = a.target;
        } else if (a.type === 'turtle_help') {
            if (event === 'observe' || event === 'litter') {
                a.progress = Math.min(a.target, a.progress + 1);
            }
        }

        if (a.progress >= a.target) {
            a.completed = true;
            this.completedCount += 1;
            this.onAlertComplete?.(a);
            this.active = null;
            this.cooldown = 35;
        }
    }

    clear(): void {
        this.active = null;
        this.cooldown = 30;
    }
}
