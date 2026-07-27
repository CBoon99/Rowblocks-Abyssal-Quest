import { describe, it, expect } from 'vitest';
import { GIFT_MAX_LEVEL_ID, GIFT_HOME_LEVEL_ID, isGiftLevel, GIFT_COMING_SOON_LABEL } from './GiftMode';

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
});
