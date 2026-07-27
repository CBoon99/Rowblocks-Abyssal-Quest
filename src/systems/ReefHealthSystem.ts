/**
 * Per-reef health 0–100 — thrives when rangers clean/rescue.
 * Visual tint for map + optional fog/prop density later.
 */

import { REEF_ZONES, nearestReef } from './WorldMap';

export type ReefHealthSnapshot = {
    id: string;
    name: string;
    health: number;
    label: 'struggling' | 'recovering' | 'healthy' | 'thriving';
};

export class ReefHealthSystem {
    private health = new Map<string, number>();

    constructor() {
        for (const r of REEF_ZONES) {
            // Start a bit imperfect so cleaning feels good
            this.health.set(r.id, r.id === 'home_reef' ? 62 : 48 + Math.floor(Math.random() * 20));
        }
    }

    getHealth(reefId: string): number {
        return this.health.get(reefId) ?? 50;
    }

    getLabel(h: number): ReefHealthSnapshot['label'] {
        if (h < 35) return 'struggling';
        if (h < 55) return 'recovering';
        if (h < 80) return 'healthy';
        return 'thriving';
    }

    addHealth(reefId: string, delta: number): number {
        const cur = this.getHealth(reefId);
        const next = Math.max(0, Math.min(100, cur + delta));
        this.health.set(reefId, next);
        return next;
    }

    /** Apply clean/rescue near a world position */
    reportCare(x: number, z: number, kind: 'litter' | 'net' | 'observe_calm'): number {
        const { reef } = nearestReef(x, z);
        let next = this.getHealth(reef.id);
        if (kind === 'litter') next = this.addHealth(reef.id, 2.5);
        else if (kind === 'net') next = this.addHealth(reef.id, 6);
        else if (kind === 'observe_calm') next = this.addHealth(reef.id, 0.8);
        // Memory: world visibly thanks — signal for visual pulse
        try {
            (window as any).__reefThanksPulse = {
                reefId: reef.id,
                t: performance.now(),
                health: next,
            };
        } catch {
            /* soft */
        }
        return next;
    }

    reportThrash(x: number, z: number): void {
        const { reef, dist } = nearestReef(x, z);
        if (dist < reef.radius * 1.2) {
            this.addHealth(reef.id, -0.35);
        }
    }

    getAll(): ReefHealthSnapshot[] {
        return REEF_ZONES.map((r) => {
            const h = this.getHealth(r.id);
            return { id: r.id, name: r.name, health: h, label: this.getLabel(h) };
        });
    }

    /** 0–1 for map color blend */
    getHealth01(reefId: string): number {
        return this.getHealth(reefId) / 100;
    }
}

let _reef: ReefHealthSystem | null = null;
export function getReefHealthSystem(): ReefHealthSystem {
    if (!_reef) _reef = new ReefHealthSystem();
    return _reef;
}
