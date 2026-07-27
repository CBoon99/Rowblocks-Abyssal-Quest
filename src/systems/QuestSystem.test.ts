import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestSystem } from './QuestSystem';
import { useGameStore } from '../stores/GameStore';

describe('QuestSystem', () => {
    beforeEach(() => {
        useGameStore.setState({
            quests: [],
            gems: 0,
            collectedFish: [],
            activeQuest: null,
            conservationPoints: 0,
            cleanups: 0,
            rescues: 0,
            speciesDiscovered: [],
        });
        (globalThis as any).DiscoveryToast = { show: vi.fn() };
        (globalThis as any).window = globalThis;
    });

    it('uses Observe language, not Catch', () => {
        const qs = new QuestSystem();
        const titles = qs.getQuests().map((q) => q.title + q.description + q.objective);
        expect(titles.join(' ').toLowerCase()).not.toMatch(/catch/);
        expect(titles.join(' ').toLowerCase()).toMatch(/observe|clean|depth|friend/);
    });

    it('accepts legacy catch_fish as observe_fish', () => {
        const qs = new QuestSystem();
        qs.updateQuestProgress('catch_fish', 1);
        const first = useGameStore.getState().quests.find((q) => q.id === 'first_observe');
        expect(first?.current).toBeGreaterThanOrEqual(1);
    });

    it('tracks cleanup quests', () => {
        const qs = new QuestSystem();
        qs.updateQuestProgress('cleanup', 3);
        const clean = useGameStore.getState().quests.find((q) => q.id === 'first_cleanup');
        expect(clean?.current).toBeGreaterThanOrEqual(3);
        expect(clean?.completed || qs.getActiveQuest()?.id !== 'first_cleanup').toBeTruthy();
    });

    it('getActiveQuest returns an incomplete quest', () => {
        const qs = new QuestSystem();
        const active = qs.getActiveQuest();
        expect(active).not.toBeNull();
        expect(active?.completed).toBe(false);
    });
});
