import {
    ACCOUNT_STORAGE_KEY,
    AccountState,
    createEmptyProfile,
    createDefaultLevels,
    DEFAULT_RANGER_RANK_ID,
    LevelProgress,
    RowblocksProfile,
} from '../types/Progress';
import {
    applyStoreProgressSnapshot,
    getStoreProgressSnapshot,
    useGameStore,
} from '../stores/GameStore';
import type { LevelSystem } from './LevelSystem';
import type { UpgradeSystem } from './UpgradeSystem';
import { getRankForCp } from '../content/ContentLoader';

export interface AccountSystemsRef {
    levelSystem: LevelSystem;
    upgradeSystem: UpgradeSystem;
}

/**
 * Local multi-profile Rowblocks accounts + progress persistence.
 * Storage key: rowblocks_abyssal_account_v1
 */
export class AccountSystem {
    private state: AccountState = {
        version: 1,
        activeProfileId: null,
        profiles: [],
    };

    /** Load AccountState from localStorage (or empty shell). Does not auto-seed. */
    load(): AccountState {
        try {
            const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
            if (!raw) {
                this.state = { version: 1, activeProfileId: null, profiles: [] };
                return this.state;
            }
            const parsed = JSON.parse(raw) as AccountState;
            if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.profiles)) {
                console.warn('[AccountSystem] Invalid save payload — resetting');
                this.state = { version: 1, activeProfileId: null, profiles: [] };
                return this.state;
            }
            this.state = {
                version: 1,
                activeProfileId: parsed.activeProfileId ?? null,
                profiles: parsed.profiles.map((p) => this.normalizeProfile(p)),
            };
            // Drop dangling active id
            if (
                this.state.activeProfileId &&
                !this.state.profiles.some((p) => p.id === this.state.activeProfileId)
            ) {
                this.state.activeProfileId = null;
            }
            console.log(
                `[AccountSystem] Loaded ${this.state.profiles.length} profile(s)`
            );
        } catch (err) {
            console.error('[AccountSystem] load failed:', err);
            this.state = { version: 1, activeProfileId: null, profiles: [] };
        }
        return this.state;
    }

    /** Persist current AccountState to localStorage. */
    save(): void {
        try {
            localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(this.state));
            console.log('[AccountSystem] Saved');
        } catch (err) {
            console.error('[AccountSystem] save failed:', err);
        }
    }

    /**
     * If no profiles exist, create starter "Jasmine" (L1 unlocked, 50 pearls, 25 gems,
     * 10 conservation points encouragement) and select her as active.
     */
    ensureDefaultProfiles(): RowblocksProfile {
        if (this.state.profiles.length === 0) {
            const jasmine = createEmptyProfile('Jasmine', undefined, {
                pearls: 50,
                gems: 25,
                conservationPoints: 10,
            });
            jasmine.levels = createDefaultLevels();
            jasmine.rangerRankId = getRankForCp(jasmine.conservationPoints).id;
            this.state.profiles.push(jasmine);
            this.state.activeProfileId = jasmine.id;
            this.save();
            console.log('[AccountSystem] Seeded default profile: Jasmine');
            return jasmine;
        }
        // Ensure there is an active profile when any exist
        if (!this.state.activeProfileId) {
            this.state.activeProfileId = this.state.profiles[0].id;
            this.save();
        }
        return this.getActiveProfile()!;
    }

    createProfile(name: string, pin?: string): RowblocksProfile {
        const trimmed = (name || '').trim() || 'Diver';
        const profile = createEmptyProfile(trimmed, pin);
        this.state.profiles.push(profile);
        this.state.activeProfileId = profile.id;
        this.save();
        console.log(`[AccountSystem] Created profile: ${profile.displayName}`);
        return profile;
    }

    selectProfile(id: string): boolean {
        const profile = this.state.profiles.find((p) => p.id === id);
        if (!profile) {
            console.warn(`[AccountSystem] Profile not found: ${id}`);
            return false;
        }
        this.state.activeProfileId = id;
        profile.lastPlayedAt = Date.now();
        this.save();
        console.log(`[AccountSystem] Selected profile: ${profile.displayName}`);
        return true;
    }

    listProfiles(): RowblocksProfile[] {
        return this.state.profiles.map((p) => ({ ...p, levels: p.levels.map((l) => ({ ...l })) }));
    }

    getActiveProfile(): RowblocksProfile | null {
        if (!this.state.activeProfileId) return null;
        return this.state.profiles.find((p) => p.id === this.state.activeProfileId) ?? null;
    }

    getActiveProfileId(): string | null {
        return this.state.activeProfileId;
    }

    deleteProfile(id: string): boolean {
        const idx = this.state.profiles.findIndex((p) => p.id === id);
        if (idx < 0) return false;
        this.state.profiles.splice(idx, 1);
        if (this.state.activeProfileId === id) {
            this.state.activeProfileId =
                this.state.profiles.length > 0 ? this.state.profiles[0].id : null;
        }
        this.save();
        console.log(`[AccountSystem] Deleted profile: ${id}`);
        return true;
    }

    /**
     * Verify optional PIN for a profile. Profiles without pin always pass.
     */
    verifyPin(id: string, pin: string): boolean {
        const profile = this.state.profiles.find((p) => p.id === id);
        if (!profile) return false;
        if (!profile.pin) return true;
        return profile.pin === pin;
    }

    /**
     * Hydrate LevelSystem + UpgradeSystem from the active profile.
     */
    applyToSystems(systems: AccountSystemsRef): void {
        const profile = this.getActiveProfile();
        if (!profile) {
            console.warn('[AccountSystem] applyToSystems: no active profile');
            return;
        }

        systems.levelSystem.applyProgress(profile.levels);
        systems.upgradeSystem.applyProgress({
            currency: profile.pearls,
            upgrades: profile.upgrades ?? {},
        });
        console.log(
            `[AccountSystem] Applied systems for ${profile.displayName} ` +
                `(pearls=${profile.pearls}, levels=${profile.levels.length})`
        );
    }

    /**
     * Hydrate Zustand GameStore from the active profile.
     */
    applyToStore(): void {
        const profile = this.getActiveProfile();
        if (!profile) {
            console.warn('[AccountSystem] applyToStore: no active profile');
            return;
        }

        const conservationPoints = profile.conservationPoints ?? 0;
        applyStoreProgressSnapshot({
            gems: profile.gems,
            collectedFish: profile.collectedFish ?? [],
            quests: profile.quests ?? [],
            currentSkin: profile.currentSkin || 'default',
            ownedSkins: profile.ownedSkins?.length
                ? profile.ownedSkins
                : ['default'],
            helmetUpgrade: profile.helmetUpgrade ?? 0,
            netRange: profile.netRange ?? 5.0,
            conservationPoints,
            rangerRankId:
                profile.rangerRankId ||
                getRankForCp(conservationPoints).id ||
                DEFAULT_RANGER_RANK_ID,
            cleanups: profile.cleanups ?? 0,
            rescues: profile.rescues ?? 0,
            speciesDiscovered: profile.speciesDiscovered ?? [],
        });
        console.log(
            `[AccountSystem] Applied store for ${profile.displayName} ` +
                `(gems=${profile.gems}, fish=${profile.collectedFish?.length ?? 0}, ` +
                `cp=${conservationPoints})`
        );
    }

    /**
     * Convenience: apply systems + store in one call.
     */
    applyAll(systems: AccountSystemsRef): void {
        this.applyToSystems(systems);
        this.applyToStore();
    }

    /**
     * Write LevelSystem + UpgradeSystem state back into the active profile (in memory).
     */
    snapshotFromSystems(systems: AccountSystemsRef): void {
        const profile = this.getActiveProfile();
        if (!profile) {
            console.warn('[AccountSystem] snapshotFromSystems: no active profile');
            return;
        }

        const levelProgress = systems.levelSystem.serializeProgress();
        profile.levels = this.mergeLevelProgress(profile.levels, levelProgress);

        const upgradeProgress = systems.upgradeSystem.serializeProgress();
        profile.pearls = upgradeProgress.currency;
        profile.upgrades = { ...upgradeProgress.upgrades };
        profile.lastPlayedAt = Date.now();
    }

    /**
     * Write GameStore state back into the active profile (in memory).
     */
    snapshotFromStore(): void {
        const profile = this.getActiveProfile();
        if (!profile) {
            console.warn('[AccountSystem] snapshotFromStore: no active profile');
            return;
        }

        const snap = getStoreProgressSnapshot();
        profile.gems = snap.gems;
        profile.collectedFish = snap.collectedFish;
        profile.quests = snap.quests;
        profile.currentSkin = snap.currentSkin;
        profile.ownedSkins = snap.ownedSkins;
        profile.helmetUpgrade = snap.helmetUpgrade;
        profile.netRange = snap.netRange;
        profile.conservationPoints = snap.conservationPoints ?? 0;
        profile.rangerRankId =
            snap.rangerRankId ||
            getRankForCp(profile.conservationPoints).id ||
            DEFAULT_RANGER_RANK_ID;
        profile.cleanups = snap.cleanups ?? 0;
        profile.rescues = snap.rescues ?? 0;
        profile.speciesDiscovered = snap.speciesDiscovered ?? [];
        profile.lastPlayedAt = Date.now();
    }

    /**
     * Snapshot systems + store, then persist.
     */
    autoSave(systems?: AccountSystemsRef): void {
        if (systems) {
            this.snapshotFromSystems(systems);
        }
        this.snapshotFromStore();
        this.save();
    }

    /** Full in-memory account state (debug / UI). */
    getState(): AccountState {
        return this.state;
    }

    // ── internals ──────────────────────────────────────────────

    private normalizeProfile(raw: Partial<RowblocksProfile>): RowblocksProfile {
        const conservationPoints = raw.conservationPoints ?? 0;
        const base = createEmptyProfile(
            raw.displayName || 'Diver',
            raw.pin,
            {
                pearls: raw.pearls ?? 0,
                gems: raw.gems ?? 0,
                conservationPoints,
            }
        );
        return {
            ...base,
            id: raw.id || base.id,
            displayName: raw.displayName || base.displayName,
            pin: raw.pin,
            createdAt: raw.createdAt ?? base.createdAt,
            lastPlayedAt: raw.lastPlayedAt ?? base.lastPlayedAt,
            pearls: raw.pearls ?? 0,
            gems: raw.gems ?? 0,
            levels:
                raw.levels && raw.levels.length > 0
                    ? this.mergeLevelProgress(createDefaultLevels(), raw.levels)
                    : createDefaultLevels(),
            collectedFish: Array.isArray(raw.collectedFish) ? raw.collectedFish : [],
            quests: Array.isArray(raw.quests) ? raw.quests : [],
            currentSkin: raw.currentSkin || 'default',
            ownedSkins:
                raw.ownedSkins && raw.ownedSkins.length > 0
                    ? raw.ownedSkins
                    : ['default'],
            helmetUpgrade: raw.helmetUpgrade ?? 0,
            netRange: raw.netRange ?? 5.0,
            upgrades: raw.upgrades && typeof raw.upgrades === 'object' ? raw.upgrades : {},
            conservationPoints,
            rangerRankId:
                raw.rangerRankId ||
                getRankForCp(conservationPoints).id ||
                DEFAULT_RANGER_RANK_ID,
            cleanups: raw.cleanups ?? 0,
            rescues: raw.rescues ?? 0,
            speciesDiscovered: Array.isArray(raw.speciesDiscovered)
                ? raw.speciesDiscovered
                : [],
        };
    }

    /** Prefer higher stars / scores; OR unlock flags. */
    private mergeLevelProgress(
        base: LevelProgress[],
        incoming: LevelProgress[]
    ): LevelProgress[] {
        const byId = new Map(base.map((l) => [l.id, { ...l }]));
        for (const entry of incoming) {
            const prev = byId.get(entry.id);
            if (!prev) {
                byId.set(entry.id, { ...entry });
                continue;
            }
            byId.set(entry.id, {
                id: entry.id,
                unlocked: prev.unlocked || entry.unlocked,
                stars: Math.max(prev.stars, entry.stars ?? 0),
                bestScore: Math.max(prev.bestScore, entry.bestScore ?? 0),
            });
        }
        return Array.from(byId.values()).sort((a, b) => a.id - b.id);
    }
}

/** Singleton convenience for UI / main boot (optional). */
let _accountSingleton: AccountSystem | null = null;

export function getAccountSystem(): AccountSystem {
    if (!_accountSingleton) {
        _accountSingleton = new AccountSystem();
    }
    return _accountSingleton;
}

// Re-export store accessors for Agent C wiring convenience
export { useGameStore, getStoreProgressSnapshot, applyStoreProgressSnapshot };
