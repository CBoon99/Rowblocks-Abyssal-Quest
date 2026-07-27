import { describe, it, expect } from 'vitest';
import {
    GIFT_MAX_LEVEL_ID,
    GIFT_HOME_LEVEL_ID,
    GIFT_CLEAN_WIN_TARGET,
    isGiftLevel,
    GIFT_COMING_SOON_LABEL,
    hasMetGiftCleanWin,
    shouldFireGiftSwimWin,
} from './GiftMode';

describe('GiftMode', () => {
    it('levels 1 through 3 are gift levels', () => {
        for (let id = 1; id <= GIFT_MAX_LEVEL_ID; id++) {
            expect(isGiftLevel(id)).toBe(true);
        }
    });

    it('levels beyond the gift scope are not gift levels', () => {
        expect(isGiftLevel(0)).toBe(false);
        expect(isGiftLevel(GIFT_MAX_LEVEL_ID + 1)).toBe(false);
        expect(isGiftLevel(30)).toBe(false);
    });

    it('home level is always within gift scope', () => {
        expect(isGiftLevel(GIFT_HOME_LEVEL_ID)).toBe(true);
    });

    it('coming-soon label is friendly copy', () => {
        expect(GIFT_COMING_SOON_LABEL).toMatch(/soon/i);
    });

    it('clean win target is reachable kid target (6–8 range)', () => {
        expect(GIFT_CLEAN_WIN_TARGET).toBeGreaterThanOrEqual(6);
        expect(GIFT_CLEAN_WIN_TARGET).toBeLessThanOrEqual(8);
    });

    it('hasMetGiftCleanWin at threshold', () => {
        expect(hasMetGiftCleanWin(GIFT_CLEAN_WIN_TARGET - 1)).toBe(false);
        expect(hasMetGiftCleanWin(GIFT_CLEAN_WIN_TARGET)).toBe(true);
        expect(hasMetGiftCleanWin(GIFT_CLEAN_WIN_TARGET + 2)).toBe(true);
    });

    it('shouldFireGiftSwimWin is once-only', () => {
        expect(shouldFireGiftSwimWin(GIFT_CLEAN_WIN_TARGET, false)).toBe(true);
        expect(shouldFireGiftSwimWin(GIFT_CLEAN_WIN_TARGET, true)).toBe(false);
        expect(shouldFireGiftSwimWin(0, false)).toBe(false);
    });
});
