import { describe, it, expect, vi } from 'vitest';
import { tryGiftSwimWin } from './GiftSwimWin';
import { GIFT_CLEAN_WIN_TARGET } from './GiftMode';

describe('tryGiftSwimWin', () => {
    it('does nothing below target', () => {
        const showWin = vi.fn();
        const markWon = vi.fn();
        const ok = tryGiftSwimWin({
            getCleans: () => GIFT_CLEAN_WIN_TARGET - 1,
            isAlreadyWon: () => false,
            markWon,
            getLevelSystem: () => ({
                completeLevel: () => ({ stars: 3, score: 100, unlocked: [2] }),
            }),
            showWinScreen: showWin,
        });
        expect(ok).toBe(false);
        expect(showWin).not.toHaveBeenCalled();
        expect(markWon).not.toHaveBeenCalled();
    });

    it('fires win once at target with stars and pearls', () => {
        let won = false;
        const showWin = vi.fn();
        const addCurrency = vi.fn();
        const completeLevel = vi.fn(() => ({
            stars: 3,
            score: 150,
            unlocked: [2],
        }));
        const ok = tryGiftSwimWin({
            getCleans: () => GIFT_CLEAN_WIN_TARGET,
            isAlreadyWon: () => won,
            markWon: () => {
                won = true;
            },
            clearWon: () => {
                won = false;
            },
            getLevelSystem: () => ({
                getCurrentLevel: () => ({ id: 1 }),
                completeLevel,
                addScore: vi.fn(),
            }),
            getUpgradeSystem: () => ({ addCurrency }),
            showWinScreen: showWin,
            doAutoSave: vi.fn(),
        });
        expect(ok).toBe(true);
        expect(won).toBe(true);
        expect(completeLevel).toHaveBeenCalled();
        expect(showWin).toHaveBeenCalledWith(3, 150, [2]);
        expect(addCurrency).toHaveBeenCalled();

        // Second call blocked
        const ok2 = tryGiftSwimWin({
            getCleans: () => GIFT_CLEAN_WIN_TARGET + 5,
            isAlreadyWon: () => won,
            markWon: () => {
                won = true;
            },
            getLevelSystem: () => ({
                completeLevel: () => ({ stars: 3, score: 1, unlocked: [] }),
            }),
            showWinScreen: showWin,
        });
        expect(ok2).toBe(false);
        expect(showWin).toHaveBeenCalledTimes(1);
    });

    it('clears won flag if showWinScreen throws', () => {
        let won = false;
        const ok = tryGiftSwimWin({
            getCleans: () => GIFT_CLEAN_WIN_TARGET,
            isAlreadyWon: () => won,
            markWon: () => {
                won = true;
            },
            clearWon: () => {
                won = false;
            },
            getLevelSystem: () => ({
                getCurrentLevel: () => ({ id: 1 }),
                completeLevel: () => ({ stars: 3, score: 100, unlocked: [] }),
            }),
            showWinScreen: () => {
                throw new Error('UI boom');
            },
        });
        expect(ok).toBe(false);
        expect(won).toBe(false);
    });
});
