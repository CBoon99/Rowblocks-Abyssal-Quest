import { describe, it, expect, beforeEach } from 'vitest';
import {
    getQualityConfig,
    setQualityTier,
    loadSavedQualityTier,
    initQuality,
} from './QualitySettings';

describe('QualitySettings', () => {
    const store: Record<string, string> = {};

    beforeEach(() => {
        Object.keys(store).forEach((k) => delete store[k]);
        Object.defineProperty(globalThis, 'localStorage', {
            value: {
                getItem: (k: string) => store[k] ?? null,
                setItem: (k: string, v: string) => {
                    store[k] = v;
                },
                removeItem: (k: string) => {
                    delete store[k];
                },
            },
            configurable: true,
            writable: true,
        });
    });

    it('persists quality tier and lowers fish count on medium', () => {
        const highFish = getQualityConfig('high').fishCount;
        const medium = setQualityTier('medium');
        expect(loadSavedQualityTier()).toBe('medium');
        expect(medium.tier).toBe('medium');
        expect(medium.fishCount).toBeLessThan(highFish);
        expect(medium.postBloom).toBe(false);
    });

    it('initQuality prefers saved tier', () => {
        store['rowblocks_quality_tier'] = 'low';
        const cfg = initQuality();
        expect(cfg.tier).toBe('low');
        expect(cfg.shadows).toBe(false);
        expect(cfg.fishCount).toBeLessThanOrEqual(14);
    });

    it('high tier keeps shadows and bloom', () => {
        const high = setQualityTier('high');
        expect(high.shadows).toBe(true);
        expect(high.postBloom).toBe(true);
        expect(high.pixelRatioMax).toBeGreaterThanOrEqual(1.5);
    });
});
