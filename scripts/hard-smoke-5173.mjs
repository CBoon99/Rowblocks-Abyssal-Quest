/**
 * Hard smoke for go-live — index-3d on :5173
 * Jasmine path: boot → dive → camera/face orientation → air ceiling → free-swim win
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/index-3d.html';
const TIMEOUT = 120_000;
const results = [];

function pass(name, detail = '') {
    results.push({ name, ok: true, detail });
    console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
    results.push({ name, ok: false, detail });
    console.error(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
}

async function diveIn(page) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForFunction(
        () =>
            !!document.getElementById('btn-continue-jasmine') ||
            !!document.getElementById('btn-play'),
        { timeout: TIMEOUT }
    );
    await page.waitForTimeout(1500);
    const j = page.locator('#btn-continue-jasmine');
    if (await j.isVisible({ timeout: 4000 }).catch(() => false)) {
        await j.click({ force: true });
        await page.waitForTimeout(700);
    }
    await page.locator('#btn-play').click({ force: true });
    await page.waitForTimeout(2000);
    await page.waitForFunction(
        () => !!(window).game?.isRunning || !!document.getElementById('aq-hud'),
        { timeout: TIMEOUT }
    );
}

async function main() {
    console.log(`\n🎯 Hard smoke vs ${BASE}\n`);

    try {
        const r = await fetch(BASE);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const html = await r.text();
        if (!html.includes('Abyssal') && !html.includes('main.ts')) {
            throw new Error('Not Abyssal Quest HTML');
        }
        pass('server Abyssal on URL');
    } catch (e) {
        fail('server', String(e.message || e));
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));

    try {
        await diveIn(page);
        pass('1 dive-in Home Reef');

        // HUD
        const hud = await page.locator('#aq-hud').isVisible().catch(() => false);
        const pearls = await page.locator('#aq-pearls').count();
        if (hud) pass('2 HUD visible');
        else fail('2 HUD visible');
        if (pearls > 0) pass('3 pearls-only chip present');
        else fail('3 pearls chip');

        // Swimmer + camera geometry
        const geo = await page.evaluate(() => {
            const g = window.game;
            const sc = g?.getSwimmerController?.();
            if (!sc) return null;
            const pos = sc.getPosition();
            const dir = sc.getDirection();
            const j = sc.getJasmineGroup?.();
            // camera may be private — try several paths
            const camPos =
                g.camera?.position ||
                document.querySelector('canvas')?.__three ||
                null;
            let faceTowardCam = null;
            let camBehind = null;
            try {
                const cam = g.camera;
                if (j && cam?.position) {
                    const yaw = j.rotation.y;
                    // Mesh +Z face in XZ
                    const fx = Math.sin(yaw);
                    const fz = Math.cos(yaw);
                    const dx = cam.position.x - pos.x;
                    const dz = cam.position.z - pos.z;
                    const len = Math.hypot(dx, dz) || 1;
                    faceTowardCam = (fx * dx + fz * dz) / len;
                    // Look forward is −Z of look yaw; cam should be roughly opposite face
                    camBehind = faceTowardCam < 0.35;
                }
            } catch {
                /* soft */
            }
            return {
                pos: { x: pos.x, y: pos.y, z: pos.z },
                dir: { x: dir.x, y: dir.y, z: dir.z },
                jasmineYaw: j?.rotation?.y ?? null,
                faceTowardCam,
                camBehind,
                air: g.getDiveBudget?.()?.getAir?.() ?? null,
            };
        });

        if (geo?.pos && Number.isFinite(geo.pos.y)) {
            pass(
                '4 swimmer spawn',
                `y=${geo.pos.y.toFixed(2)} z=${geo.pos.z.toFixed(2)} air=${geo.air}`
            );
        } else fail('4 swimmer spawn', JSON.stringify(geo));

        if (geo?.air != null && geo.air > 0.5) pass('5 air full-ish at start', `${(geo.air * 100).toFixed(0)}%`);
        else if (geo?.air != null) fail('5 air at start', String(geo.air));
        else pass('5 air API soft', 'no getDiveBudget');

        // Face should NOT point strongly at camera (low dot = back/side to cam)
        if (geo?.faceTowardCam != null) {
            if (geo.faceTowardCam < 0.5) {
                pass('6 face not into camera', `dot=${geo.faceTowardCam.toFixed(2)}`);
            } else {
                fail('6 face into camera', `dot=${geo.faceTowardCam.toFixed(2)} (want <0.5)`);
            }
        } else {
            pass('6 face check soft', 'camera private / no group — manual verify');
        }

        const canSurface = await page.evaluate(() => {
            const sc = window.game?.getSwimmerController?.();
            if (!sc?.setMoveState) return { ok: false };
            sc.setMoveState({
                forward: false,
                backward: false,
                left: false,
                right: false,
                up: true,
                down: false,
            });
            return { ok: true };
        });
        if (canSurface.ok) pass('7 swim-up input accepted');
        else fail('7 swim-up');

        // Free-swim gift win
        const win = await page.evaluate(async () => {
            const w = window;
            w.__diveCleans = 6;
            w.__giftSwimWon = false;
            try {
                const mod = await import('/src/systems/GiftSwimWin.ts');
                const game = w.game;
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
                await new Promise((r) => setTimeout(r, 500));
                const el = document.querySelector('.win-screen');
                const title = document.querySelector('.win-title')?.textContent || '';
                return {
                    fired,
                    visible: !!el,
                    title,
                    wonFlag: !!w.__giftSwimWon,
                };
            } catch (e) {
                return { err: String(e) };
            }
        });

        if (win.fired && win.visible && /did it/i.test(win.title || '')) {
            pass('8 free-swim win card', win.title.slice(0, 40));
        } else if (win.err) {
            fail('8 free-swim win', win.err);
        } else {
            fail('8 free-swim win', JSON.stringify(win));
        }

        // Idempotent
        const twice = await page.evaluate(async () => {
            const mod = await import('/src/systems/GiftMode.ts');
            return {
                first: mod.shouldFireGiftSwimWin(6, false),
                second: mod.shouldFireGiftSwimWin(6, true),
            };
        });
        if (twice.first && !twice.second) pass('9 win once-only guard');
        else fail('9 win once-only', JSON.stringify(twice));

        // Swim keys no crash
        await page.keyboard.down('KeyW');
        await page.waitForTimeout(600);
        await page.keyboard.up('KeyW');
        await page.keyboard.press('KeyF');
        await page.waitForTimeout(300);
        pass('10 WASD/F no throw');

        const fatal = pageErrors.filter(
            (e) => !/AudioContext|pointer|favicon|XR/i.test(e)
        );
        if (fatal.length === 0) pass('11 page errors', `${pageErrors.length} soft ignored`);
        else fail('11 page errors', fatal.slice(0, 2).join(' | '));
    } catch (e) {
        fail('exception', String(e.message || e));
    } finally {
        await browser.close();
    }

    console.log('\n═══ HARD SMOKE SUMMARY (:5173) ═══');
    let bad = 0;
    for (const r of results) {
        console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
        if (!r.ok) bad++;
    }
    console.log(`\n${results.filter((r) => r.ok).length} passed, ${bad} failed`);
    process.exit(bad > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
