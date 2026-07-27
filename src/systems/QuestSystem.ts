import { useGameStore, Quest } from '../stores/GameStore';

/**
 * Soft ranger missions — Observe / Discover language (never "catch").
 * Aligned with Respect the Ocean + gift-day Home Reef loop.
 */
export class QuestSystem {
    private quests: Quest[] = [];
    private completedQuests: Set<string> = new Set();

    constructor() {
        this.initializeQuests();
    }

    private initializeQuests(): void {
        this.quests = [
            {
                id: 'first_observe',
                title: 'First Friend',
                description: 'Gently observe your first sea creature',
                objective: 'Observe 1 fish',
                target: 1,
                current: 0,
                completed: false,
                reward: { gems: 10 },
                storyText:
                    'She noticed you. Stay gentle — more friends are waiting on the reef.',
            },
            {
                id: 'observe_clownfish',
                title: 'Clownfish Friends',
                description: 'Observe 5 clownfish',
                objective: 'Observe 5 clownfish',
                target: 5,
                current: 0,
                completed: false,
                reward: { gems: 25 },
                storyText:
                    'These bright reef friends love anemones. Your Marinepedia is growing.',
            },
            {
                id: 'deep_dive',
                title: 'Deeper Blue',
                description: 'Reach 50 meters depth',
                objective: 'Reach 50m depth',
                target: 50,
                current: 0,
                completed: false,
                reward: { gems: 30 },
                storyText:
                    'You ventured deeper. Plan your air — and leave the wildlife plenty of space.',
            },
            {
                id: 'observe_angelfish',
                title: 'Angelfish Watcher',
                description: 'Observe 3 angelfish',
                objective: 'Observe 3 angelfish',
                target: 3,
                current: 0,
                completed: false,
                reward: { gems: 20 },
                storyText: 'Angelfish glide like living sails. Beautiful and calm.',
            },
            {
                id: 'master_observer',
                title: 'Ocean Observer',
                description: 'Observe 20 fish total',
                objective: 'Observe 20 fish',
                target: 20,
                current: 0,
                completed: false,
                reward: { gems: 50 },
                storyText:
                    'You are becoming a true Ocean Ranger. The Marinepedia grows with every gentle look.',
            },
            {
                id: 'first_cleanup',
                title: 'Reef Cleaner',
                description: 'Clean 3 pieces of trash',
                objective: 'Clean 3 trash',
                target: 3,
                current: 0,
                completed: false,
                reward: { gems: 15 },
                storyText: 'The path is clearer. Fish can breathe easier because of you.',
            },
        ];

        useGameStore.setState({ quests: this.quests });
    }

    /**
     * Update quest progress based on action.
     * Accepted actions: observe_fish, observe_clownfish, observe_angelfish,
     * depth, cleanup (also accepts legacy catch_* aliases).
     */
    updateQuestProgress(action: string, value: number = 1): void {
        const store = useGameStore.getState();
        // Map legacy catch_* → observe_* so Game.collectFish keep working
        const normalized =
            action === 'catch_fish'
                ? 'observe_fish'
                : action === 'catch_clownfish'
                  ? 'observe_clownfish'
                  : action === 'catch_angelfish'
                    ? 'observe_angelfish'
                    : action;

        this.quests.forEach((quest) => {
            if (quest.completed) return;

            let updated = false;

            if (quest.id === 'first_observe' && normalized === 'observe_fish') {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            } else if (
                quest.id === 'observe_clownfish' &&
                normalized === 'observe_clownfish'
            ) {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            } else if (
                quest.id === 'observe_angelfish' &&
                normalized === 'observe_angelfish'
            ) {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            } else if (
                quest.id === 'master_observer' &&
                normalized === 'observe_fish'
            ) {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            } else if (quest.id === 'deep_dive' && normalized === 'depth') {
                store.updateQuestProgress(quest.id, Math.max(quest.current, value));
                updated = true;
            } else if (quest.id === 'first_cleanup' && normalized === 'cleanup') {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            }

            if (updated) {
                const updatedQuest = store.quests.find((q) => q.id === quest.id);
                if (
                    updatedQuest &&
                    updatedQuest.current >= updatedQuest.target &&
                    !updatedQuest.completed
                ) {
                    this.completeQuest(quest.id);
                }
            }
        });
    }

    private completeQuest(questId: string): void {
        const quest = this.quests.find((q) => q.id === questId);
        if (!quest || this.completedQuests.has(questId)) return;

        this.completedQuests.add(questId);
        useGameStore.getState().completeQuest(questId);

        // Gift economy: also credit pearls (primary currency) when gems are awarded
        try {
            const pearls = quest.reward?.gems ?? 0;
            if (pearls > 0) {
                const game = (window as any).game;
                game?.getUpgradeSystem?.()?.addCurrency?.(pearls);
            }
        } catch {
            /* soft */
        }

        try {
            (window as any).DiscoveryToast?.show?.(quest.title, {
                icon: '★',
                subtitle: quest.storyText || 'Ranger mission complete!',
                durationMs: 4200,
            });
        } catch {
            /* soft */
        }

        console.log(`✅ Quest complete: ${quest.title}`);
    }

    getQuests(): Quest[] {
        return this.quests;
    }

    getActiveQuests(): Quest[] {
        return this.quests.filter((q) => !q.completed);
    }

    /** First incomplete quest (HUD / store helpers). */
    getActiveQuest(): Quest | null {
        return this.quests.find((q) => !q.completed) || null;
    }
}
