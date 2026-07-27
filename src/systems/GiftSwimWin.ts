/**
 * Free-swim gift win — celebrate cleaning the reef without opening Puzzle.
 * Wired from main.ts conservation callbacks; safe to call often (idempotent).
 */

import {
    GIFT_CLEAN_WIN_TARGET,
    GIFT_HOME_LEVEL_ID,
    shouldFireGiftSwimWin,
} from './GiftMode';

export type GiftSwimWinDeps = {
    getCleans: () => number;
    isAlreadyWon: () => boolean;
    markWon: () => void;
    /** Clear won flag if UI fails so player can retry this dive */
    clearWon?: () => void;
    getLevelSystem: () => {
        getCurrentLevel?: () => { id: number } | null;
        startLevel?: (id: number) => boolean;
        completeLevel: () => { stars: number; score: number; unlocked: number[] };
        addScore?: (n: number) => void;
    };
    getUpgradeSystem?: () => { addCurrency?: (n: number) => void } | null;
    showWinScreen: (stars: number, score: number, unlocked: number[]) => void;
    onBeforeWin?: () => void;
    doAutoSave?: () => void;
};

/**
 * If clean target met and not yet won, complete current (or Home) level and show win.
 * Returns true if win UI was shown.
 */
export function tryGiftSwimWin(deps: GiftSwimWinDeps): boolean {
    const cleans = deps.getCleans();
    if (!shouldFireGiftSwimWin(cleans, deps.isAlreadyWon())) {
        return false;
    }

    // Mark early to block double-fire from collect+net same frame
    deps.markWon();

    try {
        deps.onBeforeWin?.();
    } catch {
        /* soft */
    }

    const levels = deps.getLevelSystem();
    const cur = levels.getCurrentLevel?.();
    if (!cur || !cur.id) {
        try {
            levels.startLevel?.(GIFT_HOME_LEVEL_ID);
        } catch {
            /* soft */
        }
    }

    try {
        levels.addScore?.(40 + cleans * 12);
    } catch {
        /* soft */
    }

    let result = { stars: 3, score: 100 + cleans * 12, unlocked: [] as number[] };
    try {
        result = levels.completeLevel();
        if (result.stars < 2) {
            result = { ...result, stars: Math.max(2, result.stars) };
        }
    } catch (e) {
        console.warn('[GiftSwimWin] completeLevel soft-fail', e);
    }

    try {
        const pearls = 25 + result.stars * 10;
        deps.getUpgradeSystem?.()?.addCurrency?.(pearls);
    } catch {
        /* soft */
    }

    try {
        deps.showWinScreen(result.stars, result.score, result.unlocked);
    } catch (e) {
        console.warn('[GiftSwimWin] showWinScreen failed — clearing won flag', e);
        try {
            deps.clearWon?.();
        } catch {
            /* soft */
        }
        return false;
    }

    try {
        deps.doAutoSave?.();
    } catch {
        /* soft */
    }

    console.log(
        `[GiftSwimWin] Free-swim win! cleans=${cleans}/${GIFT_CLEAN_WIN_TARGET} stars=${result.stars}`
    );
    return true;
}
