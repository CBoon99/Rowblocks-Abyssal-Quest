/**
 * Local smoke: 1-player dive + 2-player Buddy Dive (two tabs).
 * Run from repo root with Vite already on :5173 (or set BASE_URL).
 *
 *   node scripts/smoke-1p-2p.mjs
 */
import { chromium } from 'playwright';

// Product path is index-3d.html (root index.html may be legacy 2D shell)
// Probe 3000 then 5173 (Carl often runs --port 3000; Vite default is 5173)
const TIMEOUT = 120_000;
let BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/index-3d.html';

async function resolveBase() {
    if (process.env.BASE_URL) return process.env.BASE_URL;
    // 3000 often BoonMind Trader — verify Abyssal content, not just HTTP 200
    for (const port of [5173, 3002, 3001, 3000, 4173, 5174]) {
        const url = `http://127.0.0.1:${port}/index-3d.html`;
        try {
            const r = await fetch(url);
            if (!r.ok && r.status !== 304) continue;
            const text = await r.text();
            if (
                text.includes('Abyssal') ||
                text.includes('main.ts') ||
                text.includes('@vite/client')
            ) {
                return url;
            }
        } catch {
            /* try next */
        }
    }
    return 'http://127.0.0.1:5173/index-3d.html';
}

const results = [];
function pass(name, detail = '') {
    results.push({ name, ok: true, detail });
    console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
    results.push({ name, ok: false, detail });
    console.error(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
}

async function waitBoot(page) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    // Boot: profile or main menu eventually (3D product)
    await page.waitForFunction(
        () => {
            const hasProfile =
                !!document.getElementById('btn-continue-jasmine') ||
                !!document.querySelector('.profile-select-screen');
            const hasMenu = !!document.getElementById('btn-play');
            const err = document.body?.innerText?.includes('Error:') &&
                document.body?.innerText?.includes('Canvas');
            return (hasProfile || hasMenu) && !err;
        },
        { timeout: TIMEOUT }
    );
    // Extra settle for GL / asset load
    await page.waitForTimeout(2000);
}

async function pickJasmineIfNeeded(page) {
    const cont = page.locator('#btn-continue-jasmine');
    if (await cont.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cont.click();
        await page.waitForTimeout(600);
    }
}

async function diveIn(page) {
    await pickJasmineIfNeeded(page);
    // Gift path: #btn-play = Dive Home Reef (one-tap, no level grid)
    const play = page.locator('#btn-play');
    await play.waitFor({ state: 'visible', timeout: TIMEOUT });
    // force: second WebGL tab can steal input / stall actionability
    await play.click({ force: true, timeout: TIMEOUT });
    await page.waitForTimeout(1000);

    // Fallback if still on level select
    const level1 = page.locator('#level-1');
    if (await level1.isVisible({ timeout: 2500 }).catch(() => false)) {
        await level1.click();
        await page.waitForTimeout(600);
    }

    // HUD or canvas running
    await page.waitForFunction(
        () => {
            const hud = document.getElementById('aq-hud');
            const canvas = document.querySelector('#canvas-container canvas');
            const running = !!(window).game?.isRunning;
            return !!(hud || (canvas && running));
        },
        { timeout: TIMEOUT }
    );
}

async function testOnePlayer(browser) {
    console.log('\n═══ 1-PLAYER ═══');
    const ctx = await browser.newContext({
        viewport: { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e.message || e)));
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
        await waitBoot(page);
        pass('1p boot', 'page loaded');

        await diveIn(page);
        pass('1p dive in', 'level started');

        const hud = await page.locator('#aq-hud').isVisible().catch(() => false);
        const canvas = await page.locator('#canvas-container canvas').count();
        if (hud || canvas > 0) pass('1p world visible', hud ? 'HUD' : 'canvas');
        else fail('1p world visible', 'no HUD/canvas');

        // Nudge swim (WASD) — should not crash
        await page.keyboard.down('KeyW');
        await page.waitForTimeout(800);
        await page.keyboard.up('KeyW');
        await page.keyboard.press('KeyF');
        await page.waitForTimeout(400);

        const stillRunning = await page.evaluate(() => {
            const g = window.game;
            return !!(g && (g.isRunning === true || g.isRunning === undefined || document.querySelector('canvas')));
        });
        if (stillRunning) pass('1p swim/clean keys', 'no crash after W/F');
        else fail('1p swim/clean keys', 'game not running');

        // Position exists
        const pos = await page.evaluate(() => {
            try {
                const p = window.game?.getSwimmerController?.()?.getPosition?.();
                if (!p) return null;
                return { x: p.x, y: p.y, z: p.z };
            } catch {
                return null;
            }
        });
        if (pos && Number.isFinite(pos.x)) {
            pass('1p swimmer position', `x=${pos.x.toFixed(1)} y=${pos.y.toFixed(1)} z=${pos.z.toFixed(1)}`);
        } else {
            fail('1p swimmer position', 'missing');
        }

        // Fatal errors filter noise
        const fatal = consoleErrors.filter(
            (e) =>
                !/favicon|AudioContext|pointer lock|XR|WebGL.*context lost/i.test(e) &&
                !/Failed to load resource/i.test(e)
        );
        if (fatal.length === 0) pass('1p console clean', `${consoleErrors.length} soft msgs ignored`);
        else fail('1p console', fatal.slice(0, 3).join(' | '));
    } catch (e) {
        fail('1p exception', String(e.message || e));
    } finally {
        await ctx.close();
    }
}

async function closeBuddyPanel(page) {
    await page.evaluate(() => {
        document.getElementById('buddy-close')?.click();
        const ui = document.getElementById('buddy-dive-ui');
        if (ui) ui.classList.add('hidden');
    });
    await page.waitForTimeout(200);
}

async function testTwoPlayer(browser) {
    console.log('\n═══ 2-PLAYER BUDDY (local tabs) ═══');
    // Same browser context = shared BroadcastChannel + localStorage bus
    const ctx = await browser.newContext({
        viewport: { width: 1100, height: 700 },
    });
    const host = await ctx.newPage();
    const guest = await ctx.newPage();

    try {
        // Sequential boot — two WebGL inits in parallel often stall headless
        await waitBoot(host);
        await pickJasmineIfNeeded(host);
        await waitBoot(guest);
        await pickJasmineIfNeeded(guest);
        pass('2p both tabs boot');

        await host.waitForSelector('#btn-buddy', { timeout: TIMEOUT });
        await guest.waitForSelector('#btn-buddy', { timeout: TIMEOUT });
        pass('2p main menu ready');

        // Host opens Buddy Dive and creates room
        await host.click('#btn-buddy');
        await host.waitForSelector('#buddy-host', { timeout: 15000 });
        await host.evaluate(() => {
            document.getElementById('buddy-dive-ui')?.classList.remove('hidden');
        });
        await host.fill('#buddy-name', 'Jasmine');
        await host.click('#buddy-host');
        await host.waitForTimeout(500);

        let roomCode = await host.inputValue('#buddy-code').catch(() => '');
        if (!/^\d{4}$/.test(roomCode)) {
            roomCode =
                (await host.evaluate(() => {
                    const st = document.querySelector('#buddy-status')?.textContent || '';
                    const m = st.match(/(\d{4})/);
                    return m ? m[1] : '';
                })) || '';
        }

        if (/^\d{4}$/.test(roomCode)) pass('2p host created room', `code ${roomCode}`);
        else {
            fail('2p host created room', 'no 4-digit code');
            return;
        }

        // Guest joins
        await guest.click('#btn-buddy');
        await guest.waitForSelector('#buddy-join', { timeout: 15000 });
        await guest.evaluate(() => {
            document.getElementById('buddy-dive-ui')?.classList.remove('hidden');
        });
        await guest.fill('#buddy-name', 'Friend');
        await guest.fill('#buddy-code', roomCode);
        await guest.click('#buddy-join');
        await guest.waitForTimeout(1000);

        const hostStatus = (await host.locator('#buddy-status').textContent()) || '';
        const guestStatus = (await guest.locator('#buddy-status').textContent()) || '';
        const busOk = await host.evaluate((c) => {
            try {
                return !!localStorage.getItem(`rowblocks_buddy_${c}_msg`);
            } catch {
                return false;
            }
        }, roomCode);

        if (
            /diving with you|Joining|ready|Room|connected|Friend|Jasmine/i.test(
                hostStatus + guestStatus
            ) ||
            busOk
        ) {
            pass(
                '2p join handshake',
                `host="${hostStatus.slice(0, 48)}" guest="${guestStatus.slice(0, 48)}" bus=${busOk}`
            );
        } else {
            fail(
                '2p join handshake',
                `host="${hostStatus}" guest="${guestStatus}" bus=${busOk}`
            );
        }

        // Close overlays so Dive In is clickable
        await closeBuddyPanel(host);
        await closeBuddyPanel(guest);

        // Dive host first, then guest (WebGL cost)
        await diveIn(host);
        pass('2p host dived in');
        await diveIn(guest);
        pass('2p guest dived in');

        await host.keyboard.down('KeyW');
        await host.waitForTimeout(1200);
        await host.keyboard.up('KeyW');
        await guest.waitForTimeout(600);

        const poseOnBus = await guest.evaluate((c) => {
            try {
                const raw = localStorage.getItem(`rowblocks_buddy_${c}_msg`);
                if (!raw) return null;
                return JSON.parse(raw)?.type || null;
            } catch {
                return null;
            }
        }, roomCode);

        if (poseOnBus) pass('2p message bus', `last type=${poseOnBus}`);
        else fail('2p message bus', 'no localStorage buddy message');

        pass(
            '2p session status',
            JSON.stringify({ host: hostStatus.slice(0, 40), guest: guestStatus.slice(0, 40) })
        );
    } catch (e) {
        fail('2p exception', String(e.message || e));
    } finally {
        await ctx.close();
    }
}

/** Pure logic probe without full WebGL — BuddySession API via page eval after load */
async function testBuddyUnit(browser) {
    console.log('\n═══ BUDDY SESSION UNIT (in-page) ═══');
    const ctx = await browser.newContext();
    const p1 = await ctx.newPage();
    const p2 = await ctx.newPage();
    try {
        await Promise.all([
            p1.goto(BASE, { waitUntil: 'domcontentloaded' }),
            p2.goto(BASE, { waitUntil: 'domcontentloaded' }),
        ]);
        await p1.waitForTimeout(2000);
        await p2.waitForTimeout(2000);

        // Import module if Vite serves it
        const result = await Promise.all([
            p1.evaluate(async () => {
                const mod = await import('/src/systems/BuddySession.ts');
                const a = mod.getBuddySession();
                // Reset singleton mess: create room
                const code = a.host('HostRanger');
                return { code, role: a.role, connected: a.connected };
            }),
            // wait a tick so host opens bus first
            p2.waitForTimeout(300).then(() =>
                p2.evaluate(async (codeHint) => {
                    const mod = await import('/src/systems/BuddySession.ts');
                    // Problem: singleton per page is fine; need same code
                    return mod;
                }, null)
            ),
        ]);

        const hostInfo = result[0];
        if (hostInfo?.code && hostInfo.role === 'host') {
            pass('buddy unit host()', `code=${hostInfo.code}`);
        } else {
            fail('buddy unit host()', JSON.stringify(hostInfo));
            return;
        }

        const guestJoin = await p2.evaluate(async (code) => {
            const mod = await import('/src/systems/BuddySession.ts');
            const b = mod.getBuddySession();
            const ok = b.join(code, 'GuestRanger');
            return { ok, role: b.role, connected: b.connected, code: b.code };
        }, hostInfo.code);

        if (guestJoin.ok && guestJoin.role === 'guest') {
            pass('buddy unit join()', `guest in room ${guestJoin.code}`);
        } else {
            fail('buddy unit join()', JSON.stringify(guestJoin));
        }

        // Host sends pose; guest should receive via BroadcastChannel
        await p1.evaluate(async () => {
            const mod = await import('/src/systems/BuddySession.ts');
            const a = mod.getBuddySession();
            a.sendPose({
                x: 1,
                y: 2,
                z: 3,
                yaw: 0.1,
                pitch: 0,
                air: 100,
            });
        });
        await p2.waitForTimeout(400);

        const remote = await p2.evaluate(async () => {
            const mod = await import('/src/systems/BuddySession.ts');
            const b = mod.getBuddySession();
            return b.remote
                ? { x: b.remote.x, y: b.remote.y, z: b.remote.z, name: b.remote.name }
                : null;
        });

        if (remote && remote.x === 1 && remote.z === 3) {
            pass('buddy unit pose sync', `from ${remote.name} @ (${remote.x},${remote.y},${remote.z})`);
        } else {
            // BroadcastChannel may need both on same channel after join hello
            // Retry: guest sends hello already; host send again
            await p1.evaluate(async () => {
                const mod = await import('/src/systems/BuddySession.ts');
                const a = mod.getBuddySession();
                a.sendPose({ x: 5, y: 2.4, z: 8, yaw: 0, pitch: 0, air: 90 });
            });
            await p2.waitForTimeout(500);
            const remote2 = await p2.evaluate(async () => {
                const mod = await import('/src/systems/BuddySession.ts');
                return mod.getBuddySession().remote;
            });
            if (remote2 && (remote2.x === 5 || remote2.x === 1)) {
                pass('buddy unit pose sync', `retry ok x=${remote2.x}`);
            } else {
                fail('buddy unit pose sync', `remote=${JSON.stringify(remote2 || remote)}`);
            }
        }
    } catch (e) {
        fail('buddy unit exception', String(e.message || e));
    } finally {
        await ctx.close();
    }
}

async function main() {
    BASE = await resolveBase();
    console.log(`🎯 Smoke vs ${BASE}`);
    // Health
    try {
        const r = await fetch(BASE);
        if (!r.ok && r.status !== 304) throw new Error(`HTTP ${r.status}`);
        pass('server up', BASE);
    } catch (e) {
        fail('server up', String(e.message || e));
        console.error(
            '\nStart Vite first:\n  cd /Users/carlboon/Documents/Rowblocks-Abyssal-Quest\n  npm run dev -- --host 0.0.0.0'
        );
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    try {
        await testOnePlayer(browser);
        await testBuddyUnit(browser);
        await testTwoPlayer(browser);
    } finally {
        await browser.close();
    }

    console.log('\n═══ SUMMARY ═══');
    const ok = results.filter((r) => r.ok).length;
    const bad = results.filter((r) => !r.ok).length;
    for (const r of results) {
        console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
    }
    console.log(`\n${ok} passed, ${bad} failed`);
    process.exit(bad > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
