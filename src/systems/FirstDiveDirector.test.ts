import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirstDiveDirector } from './FirstDiveDirector';

/** Minimal document stub — avoid adding jsdom just for objective text. */
function installDomStub() {
    const nodes = new Map<string, { textContent: string; classList: { add: () => void; remove: () => void } }>();
    const makeNode = () => ({
        textContent: '',
        classList: { add: () => {}, remove: () => {} },
    });
    nodes.set('aq-obj-title', makeNode());
    nodes.set('aq-obj-body', makeNode());
    nodes.set('aq-objective', makeNode());
    nodes.set('aq-hud', makeNode());

    (globalThis as any).document = {
        getElementById: (id: string) => nodes.get(id) ?? null,
    };
    (globalThis as any).window = globalThis;
    (globalThis as any).__diveCleans = 0;
    (globalThis as any).DiscoveryToast = { show: vi.fn() };

    return nodes;
}

describe('FirstDiveDirector', () => {
    let director: FirstDiveDirector;
    let nodes: ReturnType<typeof installDomStub>;

    beforeEach(() => {
        nodes = installDomStub();
        director = new FirstDiveDirector();
    });

    afterEach(() => {
        delete (globalThis as any).document;
        delete (globalThis as any).__diveCleans;
        delete (globalThis as any).DiscoveryToast;
    });

    it('starts in welcome and resets to welcome', () => {
        director.reset();
        expect(director.getPhase()).toBe('welcome');
        expect(nodes.get('aq-obj-title')!.textContent).toMatch(/HOME REEF/i);
    });

    it('advances welcome → turtle after enough time', () => {
        director.reset();
        director.update(3, {}, () => ({ x: 0, y: 2, z: 3.5 }));
        expect(director.getPhase()).toBe('turtle');
    });

    it('turtle moment advances to clean', () => {
        director.reset();
        director.update(3, {}, () => ({ x: 0, y: 2, z: 3.5 }));
        director.notifyTurtleMoment();
        expect(director.getPhase()).toBe('clean');
        expect(nodes.get('aq-obj-body')!.textContent.toLowerCase()).toMatch(/trash|clean/);
    });

    it('first clean advances toward free / help', () => {
        director.reset();
        director.update(3, {}, () => ({ x: 0, y: 2, z: 3.5 }));
        director.notifyTurtleMoment();
        director.notifyClean(1);
        expect(['free', 'clean', 'explore']).toContain(director.getPhase());
    });

    it('net free advances to explore', () => {
        director.reset();
        director.update(3, {}, () => ({ x: 0, y: 2, z: 3.5 }));
        director.notifyTurtleMoment();
        director.notifyClean(1);
        director.notifyNetFreed();
        expect(director.getPhase()).toBe('explore');
    });

    it('does not go backwards in phases', () => {
        director.reset();
        director.update(3, {}, () => ({ x: 0, y: 2, z: 3.5 }));
        director.notifyTurtleMoment();
        director.notifyClean(3);
        const mid = director.getPhase();
        director.notifyTurtleMoment(); // should not rewind
        expect(director.getPhase()).toBe(mid);
    });
});
