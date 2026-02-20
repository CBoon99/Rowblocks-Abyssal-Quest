import { useGameStore, Quest } from '../stores/GameStore';

export class QuestSystem {
    private quests: Quest[] = [];
    private completedQuests: Set<string> = new Set();
    
    constructor() {
        this.initializeQuests();
    }
    
    /**
     * Initialize starting quests
     */
    private initializeQuests(): void {
        this.quests = [
            {
                id: 'first_catch',
                title: 'First Catch',
                description: 'Catch your first fish',
                objective: 'Catch 1 fish',
                target: 1,
                current: 0,
                completed: false,
                reward: { gems: 10 },
                storyText: 'The abyss whispers... You have caught your first creature. Many more await discovery.'
            },
            {
                id: 'collect_clownfish',
                title: 'Clownfish Collector',
                description: 'Catch 5 clownfish',
                objective: 'Catch 5 clownfish',
                target: 5,
                current: 0,
                completed: false,
                reward: { gems: 25 },
                storyText: 'These colorful fish are common in shallow waters. Your collection grows.'
            },
            {
                id: 'deep_dive',
                title: 'Deep Dive',
                description: 'Reach 50 meters depth',
                objective: 'Reach 50m depth',
                target: 50,
                current: 0,
                completed: false,
                reward: { gems: 30 },
                storyText: 'You venture deeper into the abyss. The pressure increases, but treasures await below.'
            },
            {
                id: 'collect_angelfish',
                title: 'Angelfish Enthusiast',
                description: 'Catch 3 angelfish',
                objective: 'Catch 3 angelfish',
                target: 3,
                current: 0,
                completed: false,
                reward: { gems: 20 },
                storyText: 'Angelfish are graceful swimmers. Their beauty adds to your collection.'
            },
            {
                id: 'master_collector',
                title: 'Master Collector',
                description: 'Catch 20 fish total',
                objective: 'Catch 20 fish',
                target: 20,
                current: 0,
                completed: false,
                reward: { gems: 50 },
                storyText: 'You are becoming a true abyssal explorer. The Marinepedia grows with your discoveries.'
            }
        ];
        
        // Load into Zustand store
        useGameStore.setState({ quests: this.quests });
    }
    
    /**
     * Update quest progress based on action
     */
    updateQuestProgress(action: string, value: number = 1): void {
        const store = useGameStore.getState();
        
        this.quests.forEach((quest) => {
            if (quest.completed) return;
            
            let updated = false;
            
            // Check quest objectives
            if (quest.id === 'first_catch' && action === 'catch_fish') {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            } else if (quest.id === 'collect_clownfish' && action === 'catch_clownfish') {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            } else if (quest.id === 'collect_angelfish' && action === 'catch_angelfish') {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            } else if (quest.id === 'master_collector' && action === 'catch_fish') {
                store.updateQuestProgress(quest.id, quest.current + value);
                updated = true;
            } else if (quest.id === 'deep_dive' && action === 'depth') {
                store.updateQuestProgress(quest.id, Math.max(quest.current, value));
                updated = true;
            }
            
            // Check if quest completed
            if (updated) {
                const updatedQuest = store.quests.find((q) => q.id === quest.id);
                if (updatedQuest && updatedQuest.current >= updatedQuest.target && !updatedQuest.completed) {
                    this.completeQuest(quest.id);
                }
            }
        });
    }
    
    /**
     * Complete a quest and show popup
     */
    private completeQuest(questId: string): void {
        const quest = this.quests.find((q) => q.id === questId);
        if (!quest || quest.completed) return;
        
        quest.completed = true;
        this.completedQuests.add(questId);
        
        const store = useGameStore.getState();
        store.completeQuest(questId);
        
        // Show quest complete popup
        this.showQuestCompletePopup(quest);
    }
    
    /**
     * Show quest complete popup
     */
    private showQuestCompletePopup(quest: Quest): void {
        const popup = document.createElement('div');
        popup.className = 'quest-complete-popup';
        popup.innerHTML = `
            <div class="quest-popup-content">
                <div class="quest-popup-title">Quest Complete!</div>
                <div class="quest-popup-quest-name">${quest.title}</div>
                ${quest.storyText ? `<div class="quest-popup-story">${quest.storyText}</div>` : ''}
                <div class="quest-popup-reward">
                    <span class="reward-icon">💎</span>
                    <span class="reward-amount">+${quest.reward.gems} Gems</span>
                </div>
                <button class="quest-popup-close">Continue</button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Auto-close after 5 seconds or on click
        const closeBtn = popup.querySelector('.quest-popup-close');
        const closePopup = () => {
            popup.remove();
        };
        
        closeBtn?.addEventListener('click', closePopup);
        setTimeout(closePopup, 5000);
    }
    
    /**
     * Get all quests
     */
    getQuests(): Quest[] {
        return this.quests;
    }
    
    /**
     * Get active quest
     */
    getActiveQuest(): Quest | null {
        return this.quests.find((q) => !q.completed) || null;
    }
}
