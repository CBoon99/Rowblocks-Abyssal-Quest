/**
 * Dive Budget — kid-safe "air" system.
 * Surface / boat refills. Empty = soft assist up, never drowning death.
 */

export type DiveBudgetState = {
    /** 0–1 remaining */
    ratio: number;
    /** Friendly label */
    status: 'ok' | 'plan' | 'surface' | 'assist';
    message: string;
    isSurfaced: boolean;
};

export class DiveBudget {
    private air = 1;
    private readonly maxAir = 1;
    /** Drain per second at surface-ish depth (gentle — gift play, not survival stress) */
    private baseDrain = 0.007;
    private assisting = false;
    private assistTimer = 0;
    private lastWarn = 0;

    onWarn?: (msg: string) => void;
    onAssist?: () => void;
    onRefill?: () => void;

    reset(): void {
        this.air = this.maxAir;
        this.assisting = false;
        this.assistTimer = 0;
    }

    getAir(): number {
        return this.air;
    }

    getState(depthMeters: number, isSurfaced: boolean): DiveBudgetState {
        let status: DiveBudgetState['status'] = 'ok';
        let message = 'Air OK';
        if (this.air <= 0.12 || this.assisting) {
            status = 'assist';
            message = 'Buddy boost — floating up for fresh air';
        } else if (this.air <= 0.28) {
            status = 'surface';
            message = 'Swim up for fresh air!';
        } else if (this.air <= 0.5) {
            status = 'plan';
            message = 'Plan your air — surface soon';
        }
        if (isSurfaced && this.air > 0.9) {
            message = 'Breathing easy at the surface';
        }
        return {
            ratio: this.air,
            status,
            message,
            isSurfaced,
        };
    }

    /**
     * @param dt seconds
     * @param depthMeters 0 at surface, higher = deeper
     * @param isSurfaced true if near/above water surface
     * @param buddyNearby slows drain slightly
     * @returns true if soft-assist to surface should apply
     */
    update(
        dt: number,
        depthMeters: number,
        isSurfaced: boolean,
        buddyNearby = false
    ): boolean {
        if (isSurfaced) {
            const before = this.air;
            this.air = Math.min(this.maxAir, this.air + dt * 0.45);
            this.assisting = false;
            if (before < 0.95 && this.air >= 0.95) {
                this.onRefill?.();
            }
            return false;
        }

        // Deeper = faster drain (gentle)
        const depthFactor = 1 + Math.min(2.2, depthMeters / 18);
        let drain = this.baseDrain * depthFactor * dt;
        if (buddyNearby) drain *= 0.72;
        this.air = Math.max(0, this.air - drain);

        // Warnings (throttled)
        const now = performance.now();
        if (this.air <= 0.28 && this.air > 0.12 && now - this.lastWarn > 8000) {
            this.lastWarn = now;
            this.onWarn?.('Swim up for fresh air!');
        }

        if (this.air <= 0.08) {
            this.assisting = true;
            this.assistTimer += dt;
            if (this.assistTimer > 0.3) {
                this.onAssist?.();
            }
            return true; // caller applies upward assist force
        }

        this.assistTimer = 0;
        return false;
    }

    /** Co-op: friend shares a bubble boost once */
    shareBoost(amount = 0.35): void {
        this.air = Math.min(this.maxAir, this.air + amount);
        this.assisting = false;
        this.onRefill?.();
    }

    /** Jelly tingle / thrash — tiny air nibble, never lethal alone */
    applySting(amount = 0.04): void {
        this.air = Math.max(0.12, this.air - amount);
    }

    /** Extra drain while thrashing near wildlife */
    applyThrashDrain(dt: number, intensity = 1): void {
        this.air = Math.max(0.15, this.air - this.baseDrain * 0.8 * intensity * dt);
    }
}
