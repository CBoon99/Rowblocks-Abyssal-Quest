import { create } from 'zustand';

export interface CollectedFish {
    type: string;
    name: string;
    depth: number;
    timestamp: number;
    description: string;
}

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
    helmetUpgrade: number;
    netRange: number;
    
    // Actions
    addFish: (fish: CollectedFish) => void;
    addGems: (amount: number) => void;
    spendGems: (amount: number) => boolean;
    updateQuestProgress: (questId: string, progress: number) => void;
    completeQuest: (questId: string) => void;
    setActiveQuest: (quest: Quest | null) => void;
    buySkin: (skinId: string, cost: number) => boolean;
    buyHelmetUpgrade: (cost: number) => boolean;
    buyNetUpgrade: (cost: number) => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial state
    collectedFish: [],
    gems: 0,
    quests: [],
    activeQuest: null,
    currentSkin: 'default',
    helmetUpgrade: 0,
    netRange: 5.0,
    
    // Add fish to collection
    addFish: (fish) => {
        const existing = get().collectedFish.find(f => f.type === fish.type);
        if (!existing) {
            set((state) => ({
                collectedFish: [...state.collectedFish, fish],
            }));
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
            set({ currentSkin: skinId });
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
}));
