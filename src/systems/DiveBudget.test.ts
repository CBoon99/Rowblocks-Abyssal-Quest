import { describe, it, expect, beforeEach } from 'vitest';
import { DiveBudget } from './DiveBudget';

describe('DiveBudget', () => {
    let budget: DiveBudget;

    beforeEach(() => {
        budget = new DiveBudget();
        budget.reset();
    });

    it('starts full', () => {
        expect(budget.getAir()).toBe(1);
        expect(budget.getState(0, true).status).toBe('ok');
    });

    it('drains underwater and never goes below 0', () => {
        for (let i = 0; i < 200; i++) {
            budget.update(0.5, 10, false, false);
        }
        expect(budget.getAir()).toBeGreaterThanOrEqual(0);
        expect(budget.getAir()).toBeLessThan(1);
    });

    it('refills at the surface', () => {
        for (let i = 0; i < 80; i++) {
            budget.update(0.5, 12, false, false);
        }
        const mid = budget.getAir();
        expect(mid).toBeLessThan(0.9);
        for (let i = 0; i < 20; i++) {
            budget.update(0.5, 0, true, false);
        }
        expect(budget.getAir()).toBeGreaterThan(mid);
        expect(budget.getAir()).toBeCloseTo(1, 1);
    });

    it('shareBoost restores air without exceeding max', () => {
        for (let i = 0; i < 60; i++) {
            budget.update(0.5, 8, false, false);
        }
        budget.shareBoost(0.5);
        expect(budget.getAir()).toBeLessThanOrEqual(1);
        expect(budget.getAir()).toBeGreaterThan(0.3);
    });

    it('applySting never drops below soft floor', () => {
        budget.applySting(1);
        expect(budget.getAir()).toBeGreaterThanOrEqual(0.12);
    });

    it('uses kid-friendly Air labels', () => {
        const state = budget.getState(0, false);
        expect(state.message.toLowerCase()).toMatch(/air|ok|surface|plan/);
        expect(state.message.toLowerCase()).not.toMatch(/dive budget/);
    });
});
