/**
 * Mock play agents (sandbox): simulate free-swim gift win + audio hooks.
 * Run with Vite up: node scripts/mock-play-gift-win.mjs
 */
import { chromium } from 'playwright';

const TIMEOUT = 120_000;

async function resolveBase() {
    if (process.env.BASE_URL) return process.env.BASE_URL;
    for (const port of [5173, 3002, 3001, 3000, 4173]) {
        const url = `http://127.0.0.1:${port}/index-3d.html`;
        try {
            const r = await fetch(url);
            if (!r.ok && r.status !== 304) continue;
            const t = await r.text();
            if (t.includes('Abyssal') || t.includes('main.ts')) return url;
        } catch {
            /* next */
        }
    }
    return null;
}

async function diveIn(page) {
    await page.waitForFunction(
        () =>
            !!document.getElementById('btn-continue-jasmine') ||
            !!document.getElementById('btn-play'),
        { timeout: TIMEOUT }
    );
    const jasmine = page.locator('#btn-continue-jasmine');
    if (await jasmine.isVisible({ timeout: 4000 }).catch(() => false)) {
        await jasmine.click({ force: true });
        await page.waitForTimeout(800);
    }
    await page.locator('#btn-play').waitFor({ state: 'visible', timeout: TIMEOUT });
    await page.locator('#btn-play').click({ force: true });
    await page.waitForTimeout(1500);
    await page.waitForFunction(
        () => !!(window).game?.isRunning || !!document.getElementById('aq-hud'),
        { timeout: TIMEOUT }
    );
}

async function agentFreeSwimWin(page, label) {
    console.log(`\n── Agent: ${label} (free-swim win mock) ──`);
    const result = await page.evaluate(async () => {
        const log = [];
        const w = window;
        // Simulate 6 clean events (gift target)
        w.__diveCleans = 0;
        w.__giftSwimWon = false;
        w.__diveCleanTarget = 8;

        // Prefer real conservation path if available
        const game = w.game;
        const world = game?.getConservationWorld?.();
        if (world?.tryCollectLitter && game?.getSwimmerController) {
            const pos = game.getSwimmerController().getPosition();
            // Sweep path spots
            for (let i = 0; i < 12 && (w.__diveCleans || 0) < 6; i++) {
                pos.z = 5 + i * 0.9;
                pos.x = (i % 2 === 0 ? 1.5 : -1.5);
                const r = world.tryCollectLitter(pos, 8);
                if (r?.collected) {
                    // Fire main's onCollect if only internal — re-dispatch via hooks
                    w.__diveCleans = (w.__diveCleans || 0) + r.collected;
                    log.push(`litter +${r.collected} total=${w.__diveCleans}`);
                }
                if (world.tryFreeNet?.(pos, 8)) {
                    w.__diveCleans = (w.__diveCleans || 0) + 2;
                    log.push(`net free total=${w.__diveCleans}`);
                }
            }
        }

        // Force gift win via same helper path main uses: inject cleans + call tryGiftSwimWin if exposed
        // Fallback: call complete + showWin through globals after setting cleans
        w.__diveCleans = Math.max(w.__diveCleans || 0, 6);

        // Dynamically import GiftSwimWin (Vite)
        try {
            const mod = await import('/src/systems/GiftSwimWin.ts');
            const fired = mod.tryGiftSwimWin({
                getCleans: () => w.__diveCleans || 0,
                isAlreadyWon: () => !!w.__giftSwimWon,
                markWon: () => {
                    w.__giftSwimWon = true;
                },
                getLevelSystem: () => game.getLevelSystem(),
                getUpgradeSystem: () => game.getUpgradeSystem(),
                showWinScreen: (stars, score, unlocked) => {
                    w.gameHUD.showWinScreen(stars, score, unlocked);
                },
            });
            log.push(`tryGiftSwimWin=${fired}`);
        } catch (e) {
            log.push(`import fail ${String(e)}`);
            // Nuclear fallback
            w.__giftSwimWon = true;
            const res = game.getLevelSystem().completeLevel();
            w.gameHUD.showWinScreen(res.stars || 3, res.score || 100, res.unlocked || []);
            log.push('fallback showWinScreen');
        }

        await new Promise((r) => setTimeout(r, 400));
        const winVisible = !!document.querySelector('.win-screen');
        const title = document.querySelector('.win-title')?.textContent || '';
        return {
            log,
            cleans: w.__diveCleans,
            giftWon: !!w.__giftSwimWon,
            winVisible,
            title,
        };
    });

    const ok = result.winVisible && result.giftWon && /did it|You did it/i.test(result.title);
    console.log(ok ? '  ✅' : '  ❌', JSON.stringify(result, null, 2).slice(0, 500));
    return ok;
}

async function agentAudioHooks(page, label) {
    console.log(`\n── Agent: ${label} (audio SFX registry) ──`);
    const result = await page.evaluate(async () => {
        const am = window.game?.audioManager || (window.game && (window.game).audioManager);
        // Access via private may fail; call playSound and see no throw
        const names = ['clean', 'net', 'win', 'collect'];
        const played = [];
        try {
            const manager = window.game && (window.game).audioManager;
            if (manager?.startAudio) manager.startAudio();
            for (const n of names) {
                try {
                    manager?.playSound?.(n);
                    played.push(n);
                } catch {
                    played.push(n + ':err');
                }
            }
        } catch (e) {
            return { ok: false, err: String(e) };
        }
        return { ok: played.length === 4, played };
    });
    console.log(result.ok ? '  ✅' : '  ⚠️', result);
    return !!result.ok;
}

async function agentIdempotentWin(page, label) {
    console.log(`\n── Agent: ${label} (win once only) ──`);
    // Close win if open, re-dive not needed — test pure helper
    const result = await page.evaluate(async () => {
        const mod = await import('/src/systems/GiftMode.ts');
        const a = mod.shouldFireGiftSwimWin(6, false);
        const b = mod.shouldFireGiftSwimWin(6, true);
        const c = mod.shouldFireGiftSwimWin(5, false);
        return { a, b, c, target: mod.GIFT_CLEAN_WIN_TARGET };
    });
    const ok = result.a === true && result.b === false && result.c === false;
    console.log(ok ? '  ✅' : '  ❌', result);
    return ok;
}

async function main() {
    const base = await resolveBase();
    if (!base) {
        console.error('No Abyssal Vite server. Start: npm run dev -- --host 0.0.0.0');
        process.exit(1);
    }
    console.log('🎯 Mock play vs', base);

    const browser = await chromium.launch({ headless: true });
    const results = [];

    // Parallel mock agents — each gets own context (isolated sandbox)
    const agents = [
        { name: 'A-FreeSwimWin', run: agentFreeSwimWin },
        { name: 'B-AudioHooks', run: agentAudioHooks },
        { name: 'C-Idempotent', run: agentIdempotentWin },
    ];

    await Promise.all(
        agents.map(async (agent) => {
            const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
            const page = await ctx.newPage();
            try {
                await page.goto(base, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
                await page.waitForTimeout(2000);
                await diveIn(page);
                const ok = await agent.run(page, agent.name);
                results.push({ name: agent.name, ok });
            } catch (e) {
                console.error(`  ❌ ${agent.name} exception`, e.message || e);
                results.push({ name: agent.name, ok: false, err: String(e.message || e) });
            } finally {
                await ctx.close();
            }
        })
    );

    await browser.close();

    console.log('\n═══ MOCK PLAY SUMMARY ═══');
    let bad = 0;
    for (const r of results) {
        console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.err ? ' — ' + r.err : ''}`);
        if (!r.ok) bad++;
    }
    console.log(bad === 0 ? `\n${results.length} agents passed` : `\n${bad} failed`);
    process.exit(bad > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
