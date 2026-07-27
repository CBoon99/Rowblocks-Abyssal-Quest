/**
 * Birthday gift scope lock — Home Reef loop only.
 * See docs/BIRTHDAY_SHIP_PLAN.md
 */

/** Highest level id shown/playable on gift day (1 = Home Reef). */
export const GIFT_MAX_LEVEL_ID = 3;

/** Primary dive always starts here for one-tap play. */
export const GIFT_HOME_LEVEL_ID = 1;

/**
 * Free-swim win: cleans (litter + net frees count as +2) needed for “You did it!”
 * Puzzle win still works separately; this is the gift path without Puzzle tool.
 */
export const GIFT_CLEAN_WIN_TARGET = 6;

/** Default HUD clean progress denominator (path litter count). */
export const GIFT_CLEAN_PROGRESS_TARGET = 8;

export function isGiftLevel(id: number): boolean {
    return id >= 1 && id <= GIFT_MAX_LEVEL_ID;
}

/** Levels beyond gift scope stay locked with friendly copy. */
export const GIFT_COMING_SOON_LABEL = 'Soon';

export function hasMetGiftCleanWin(cleans: number, target = GIFT_CLEAN_WIN_TARGET): boolean {
    return cleans >= target;
}

/**
 * Pure helper: should free-swim win fire once?
 * @param cleans current dive clean score
 * @param alreadyWon session flag
 */
export function shouldFireGiftSwimWin(
    cleans: number,
    alreadyWon: boolean,
    target = GIFT_CLEAN_WIN_TARGET
): boolean {
    if (alreadyWon) return false;
    return hasMetGiftCleanWin(cleans, target);
}
