/**
 * Birthday gift scope lock — Home Reef loop only.
 * See docs/BIRTHDAY_SHIP_PLAN.md
 */

/** Highest level id shown/playable on gift day (1 = Home Reef). */
export const GIFT_MAX_LEVEL_ID = 3;

/** Primary dive always starts here for one-tap play. */
export const GIFT_HOME_LEVEL_ID = 1;

export function isGiftLevel(id: number): boolean {
    return id >= 1 && id <= GIFT_MAX_LEVEL_ID;
}

/** Levels beyond gift scope stay locked with friendly copy. */
export const GIFT_COMING_SOON_LABEL = 'Soon';
