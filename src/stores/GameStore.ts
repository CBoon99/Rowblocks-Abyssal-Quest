import { create } from 'zustand';
import type { CollectedFish, QuestProgress, StoreProgressSnapshot } from '../types/Progress';
import { DEFAULT_RANGER_RANK_ID } from '../types/Progress';
import { getRankForCp } from '../content/ContentLoader';

export type { CollectedFish };

export interface Quest {
    id: string;
    title: string;
    description: string;
    objective: string;
    target: number;
    current: number;
    completed: boolean;
    reward: {
        gems: number;
        unlocks?: string[];
    };
    storyText?: string;
}

interface GameStore {
    // Inventory
    collectedFish: CollectedFish[];
    gems: number;

    // Quests
    quests: Quest[];
    activeQuest: Quest | null;

    // Customization
    currentSkin: string;
    ownedSkins: string[];
    helmetUpgrade: number;
    netRange: number;

    // Conservation / ranger
    conservationPoints: number;
    rangerRankId: string;
    cleanups: number;
    rescues: number;
    speciesDiscovered: string[];

    // Actions
    addFish: (fish: CollectedFish) => boolean;
    addGems: (amount: number) => void;
    spendGems: (amount: number) => boolean;
    updateQuestProgress: (questId: string, progress: number) => void;
    completeQuest: (questId: string) => void;
    setActiveQuest: (quest: Quest | null) => void;
    buySkin: (skinId: string, cost: number) => boolean;
    buyHelmetUpgrade: (cost: number) => boolean;
    buyNetUpgrade: (cost: number) => boolean;
    addConservationPoints: (amount: number, reason?: string) => void;
    discoverSpeciesId: (speciesId: string) => boolean;
    recordCleanup: (cpAward?: number) => void;
    recordRescue: (cpAward?: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial state
    collectedFish: [],
    gems: 0,
    quests: [],
    activeQuest: null,
    currentSkin: 'default',
    ownedSkins: ['default'],
    helmetUpgrade: 0,
    netRange: 5.0,
    conservationPoints: 0,
    rangerRankId: DEFAULT_RANGER_RANK_ID,
    cleanups: 0,
    rescues: 0,
    speciesDiscovered: [],

    // Add fish to collection
    addFish: (fish) => {
        const existing = get().collectedFish.find(f => f.type === fish.type);
        if (!existing) {
            set((state) => ({
                collectedFish: [...state.collectedFish, fish],
            }));
            // Mirror into speciesDiscovered when type is a species id
            if (fish.type) {
                get().discoverSpeciesId(fish.type);
            }
            console.log(`📚 New fish added to Marinepedia: ${fish.name}`);
            return true; // New entry
        }
        return false; // Already collected
    },

    // Add gems (from blocks, quests, etc.)
    addGems: (amount) => {
        set((state) => ({
            gems: state.gems + amount,
        }));
        console.log(`💎 Gems added: +${amount} (Total: ${get().gems})`);
    },

    // Spend gems (returns true if successful)
    spendGems: (amount) => {
        const current = get().gems;
        if (current >= amount) {
            set({ gems: current - amount });
            console.log(`💎 Gems spent: -${amount} (Remaining: ${get().gems})`);
            return true;
        }
        return false;
    },

    // Update quest progress
    updateQuestProgress: (questId, progress) => {
        set((state) => ({
            quests: state.quests.map((q) =>
                q.id === questId
                    ? { ...q, current: Math.min(q.target, progress) }
                    : q
            ),
        }));

        // Check if quest completed
        const quest = get().quests.find((q) => q.id === questId);
        if (quest && quest.current >= quest.target && !quest.completed) {
            get().completeQuest(questId);
        }
    },

    // Complete quest
    completeQuest: (questId) => {
        const quest = get().quests.find((q) => q.id === questId);
        if (quest && !quest.completed) {
            set((state) => ({
                quests: state.quests.map((q) =>
                    q.id === questId ? { ...q, completed: true } : q
                ),
            }));

            // Give rewards
            get().addGems(quest.reward.gems);
            console.log(`✅ Quest complete: ${quest.title}! Reward: ${quest.reward.gems} gems`);

            return quest;
        }
        return null;
    },

    // Set active quest
    setActiveQuest: (quest) => {
        set({ activeQuest: quest });
    },

    // Buy skin
    buySkin: (skinId, cost) => {
        if (get().spendGems(cost)) {
            set((state) => {
                const owned = state.ownedSkins.includes(skinId)
                    ? state.ownedSkins
                    : [...state.ownedSkins, skinId];
                return { currentSkin: skinId, ownedSkins: owned };
            });
            console.log(`🎨 Skin applied: ${skinId}`);
            return true;
        }
        return false;
    },

    // Buy helmet upgrade
    buyHelmetUpgrade: (cost) => {
        if (get().spendGems(cost)) {
            set((state) => ({
                helmetUpgrade: state.helmetUpgrade + 1,
            }));
            console.log(`💡 Helmet upgraded! Level: ${get().helmetUpgrade + 1}`);
            return true;
        }
        return false;
    },

    // Buy net upgrade
    buyNetUpgrade: (cost) => {
        if (get().spendGems(cost)) {
            set((state) => ({
                netRange: state.netRange + 1.0,
            }));
            console.log(`🎣 Net upgraded! Range: ${get().netRange + 1.0}m`);
            return true;
        }
        return false;
    },

    addConservationPoints: (amount, reason = 'award') => {
        const delta = Math.floor(amount);
        if (!Number.isFinite(delta) || delta === 0) return;
        set((state) => {
            const conservationPoints = Math.max(0, state.conservationPoints + delta);
            const rangerRankId = getRankForCp(conservationPoints).id;
            return { conservationPoints, rangerRankId };
        });
        console.log(
            `🌿 Store CP ${delta >= 0 ? '+' : ''}${delta} (${reason}) → ${get().conservationPoints}`
        );
    },

    /** Returns true if this species id is newly discovered. */
    discoverSpeciesId: (speciesId) => {
        if (!speciesId) return false;
        const existing = get().speciesDiscovered;
        if (existing.includes(speciesId)) return false;
        set({ speciesDiscovered: [...existing, speciesId] });
        console.log(`📖 Species discovered: ${speciesId}`);
        return true;
    },

    recordCleanup: (cpAward = 5) => {
        set((state) => ({ cleanups: state.cleanups + 1 }));
        get().addConservationPoints(cpAward, 'cleanup');
    },

    recordRescue: (cpAward = 10) => {
        set((state) => ({ rescues: state.rescues + 1 }));
        get().addConservationPoints(cpAward, 'rescue');
    },
}));

/**
 * Snapshot of progress fields for account persistence.
 * Safe to call outside React: useGameStore.getState() based.
 */
export function getStoreProgressSnapshot(): StoreProgressSnapshot {
    const state = useGameStore.getState();
    return {
        gems: state.gems,
        collectedFish: state.collectedFish.map((f) => ({ ...f })),
        quests: state.quests.map((q) => ({
            id: q.id,
            current: q.current,
            completed: q.completed,
        })),
        currentSkin: state.currentSkin,
        ownedSkins: [...state.ownedSkins],
        helmetUpgrade: state.helmetUpgrade,
        netRange: state.netRange,
        conservationPoints: state.conservationPoints ?? 0,
        rangerRankId: state.rangerRankId || DEFAULT_RANGER_RANK_ID,
        cleanups: state.cleanups ?? 0,
        rescues: state.rescues ?? 0,
        speciesDiscovered: [...(state.speciesDiscovered ?? [])],
    };
}

/**
 * Hydrate store progress from a profile snapshot.
 * Merges quest progress into existing quest definitions when present;
 * otherwise installs minimal progress records (QuestSystem may re-seed full defs).
 */
export function applyStoreProgressSnapshot(snapshot: StoreProgressSnapshot): void {
    if (!snapshot) return;

    const state = useGameStore.getState();
    const progressById = new Map(
        (snapshot.quests ?? []).map((q) => [q.id, q] as const)
    );

    let quests: Quest[];
    if (state.quests.length > 0) {
        quests = state.quests.map((q) => {
            const saved = progressById.get(q.id);
            if (!saved) return q;
            return {
                ...q,
                current: saved.current ?? q.current,
                completed: saved.completed ?? q.completed,
            };
        });
    } else {
        // Minimal stubs until QuestSystem initializes full definitions
        quests = (snapshot.quests ?? []).map((q) => ({
            id: q.id,
            title: q.id,
            description: '',
            objective: '',
            target: Math.max(q.current, 1),
            current: q.current,
            completed: q.completed,
            reward: { gems: 0 },
        }));
    }

    const ownedSkins =
        snapshot.ownedSkins && snapshot.ownedSkins.length > 0
            ? [...snapshot.ownedSkins]
            : ['default'];
    if (!ownedSkins.includes('default')) {
        ownedSkins.unshift('default');
    }

    const conservationPoints = snapshot.conservationPoints ?? 0;
    const rangerRankId =
        snapshot.rangerRankId || getRankForCp(conservationPoints).id || DEFAULT_RANGER_RANK_ID;

    useGameStore.setState({
        gems: snapshot.gems ?? 0,
        collectedFish: (snapshot.collectedFish ?? []).map((f) => ({ ...f })),
        quests,
        currentSkin: snapshot.currentSkin || 'default',
        ownedSkins,
        helmetUpgrade: snapshot.helmetUpgrade ?? 0,
        netRange: snapshot.netRange ?? 5.0,
        activeQuest: null,
        conservationPoints,
        rangerRankId,
        cleanups: snapshot.cleanups ?? 0,
        rescues: snapshot.rescues ?? 0,
        speciesDiscovered: [...(snapshot.speciesDiscovered ?? [])],
    });
}

/**
 * Merge quest progress after QuestSystem seeds full quest definitions.
 * Call from main after QuestSystem constructs if order is store-hydrate → quests-init.
 */
export function mergeQuestProgress(progress: QuestProgress[]): void {
    if (!progress || progress.length === 0) return;
    const byId = new Map(progress.map((q) => [q.id, q] as const));
    const state = useGameStore.getState();
    useGameStore.setState({
        quests: state.quests.map((q) => {
            const saved = byId.get(q.id);
            if (!saved) return q;
            return {
                ...q,
                current: saved.current ?? q.current,
                completed: saved.completed ?? q.completed,
            };
        }),
    });
}
