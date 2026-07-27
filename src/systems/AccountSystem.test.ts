import { describe, it, expect, beforeEach } from 'vitest';
import { AccountSystem } from './AccountSystem';
import { ACCOUNT_STORAGE_KEY } from '../types/Progress';
import { LevelSystem } from './LevelSystem';
import { UpgradeSystem } from './UpgradeSystem';

/**
 * Minimal in-memory localStorage mock for Node/Vitest.
 */
function createStorageMock() {
    const store: Record<string, string> = {};
    return {
        getItem(key: string): string | null {
            return store[key] ?? null;
        },
        setItem(key: string, value: string): void {
            store[key] = value;
        },
        removeItem(key: string): void {
            delete store[key];
        },
        clear(): void {
            Object.keys(store).forEach((k) => delete store[k]);
        },
        get length() {
            return Object.keys(store).length;
        },
        key(index: number): string | null {
            return Object.keys(store)[index] ?? null;
        },
    };
}

describe('AccountSystem', () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, 'localStorage', {
            value: createStorageMock(),
            writable: true,
            configurable: true,
        });
    });

    it('creates and persists a default Jasmine profile when none exist', () => {
        const account = new AccountSystem();
        account.load();
        const profile = account.ensureDefaultProfiles();

        expect(profile.displayName).toBe('Jasmine');
        expect(profile.levels).toHaveLength(30);
        expect(profile.levels[0].unlocked).toBe(true);
        expect(profile.pearls).toBeGreaterThan(0);
        expect(profile.gems).toBeGreaterThan(0);

        // Reload and confirm it persists
        const account2 = new AccountSystem();
        account2.load();
        expect(account2.getActiveProfile()?.displayName).toBe('Jasmine');
    });

    it('round-trips progress through save/load', () => {
        const account = new AccountSystem();
        account.load();
        account.ensureDefaultProfiles();

        const levelSystem = new LevelSystem();
        const upgradeSystem = new UpgradeSystem();
        account.applyToSystems({ levelSystem, upgradeSystem });

        // Simulate play: complete level 1 with 2 stars and earn 42 pearls.
        levelSystem.startLevel(1);
        levelSystem['currentLevelData']!.stars = 2;
        upgradeSystem.setCurrency(42);

        account.snapshotFromSystems({ levelSystem, upgradeSystem });
        account.save();

        const account2 = new AccountSystem();
        account2.load();
        const profile = account2.getActiveProfile()!;
        expect(profile.levels[0].stars).toBe(2);
        expect(profile.pearls).toBe(42);
    });

    it('resets to empty state when localStorage payload is corrupt', () => {
        localStorage.setItem(ACCOUNT_STORAGE_KEY, 'not valid json');
        const account = new AccountSystem();
        const state = account.load();
        expect(state.profiles).toHaveLength(0);
        expect(state.activeProfileId).toBeNull();
    });
});
