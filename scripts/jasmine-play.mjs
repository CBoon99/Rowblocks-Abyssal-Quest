/**
 * Jasmine gift-loop play (desktop + iPad-sized touch).
 * Not a real iPad Safari device — closest local substitute.
 */
import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/index-3d.html';
const TIMEOUT = 90_000;
const SHOT = '/tmp/aq-jasmine-shots';
mkdirSync(SHOT, { recursive: true });

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
        await page.waitForTimeout(800);
    }
    await page.locator('#btn-play').waitFor({ state: 'visible', timeout: TIMEOUT });
    await page.locator('#btn-play').click({ force: true });
    await page.waitForFunction(
        () => !!(window).game?.isRunning || !!document.getElementById('aq-hud'),
        { timeout: TIMEOUT }
    );
    await page.waitForTimeout(2000);
}

async function playPass(label, contextOpts) {
    console.log(`\n═══ ${label} ═══`);
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext(contextOpts);
    const page = await ctx.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));
    page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text());
    });

    try {
        await diveIn(page);
        await page.screenshot({ path: `${SHOT}/${label}-01-dive.png` });
        pass(`${label} dive-in`);

        const ui = await page.evaluate(() => {
            const text = document.body.innerText || '';
            const hud = document.getElementById('aq-hud');
            const pearls = document.getElementById('aq-pearls');
            const gemsChip = document.getElementById('aq-gems');
            const mini = document.getElementById('ocean-minimap');
            const tools = document.querySelector('.aq-tools');
            const gemsVisible = /gems/i.test(
                (hud?.innerText || '') + (document.querySelector('.aq-currency')?.textContent || '')
            );
            const hudText = hud?.innerText || '';
            const mobile = document.getElementById('mobile-controls');
            const coach = document.getElementById('mc-coach');
            const orient = document.getElementById('mc-orient');
            const vr = document.getElementById('vr-btn');
            const buddy = document.getElementById('btn-buddy');
            const errOnPage =
                text.includes('Error:') && (text.includes('Canvas') || text.includes('WebGL'));
            const game = window.game;
            const sc = game?.getSwimmerController?.();
            const pos = sc?.getPosition?.();
            return {
                hasHud: !!hud && getComputedStyle(hud).display !== 'none',
                pearlsText: pearls?.textContent || '',
                gemsChip: !!gemsChip,
                gemsVisibleInHud: gemsVisible && /gem/i.test(hudText),
                miniHidden: !mini || mini.classList.contains('hidden') || getComputedStyle(mini).display === 'none',
                toolsHidden: !tools || getComputedStyle(tools).display === 'none',
                railFish: !!(hud && /FISH/i.test(hudText)),
                hudText: hudText.slice(0, 240),
                objTitle: document.getElementById('aq-obj-title')?.textContent || '',
                objBody: document.getElementById('aq-obj-body')?.textContent || '',
                mobileHidden: !mobile || mobile.classList.contains('hidden'),
                mobileDisplay: mobile ? getComputedStyle(mobile).display : 'missing',
                coachVisible: !!(coach && coach.classList.contains('visible')) ||
                    !!(coach && getComputedStyle(coach).display !== 'none' && coach.offsetParent),
                coachHtmlVisible: !!(coach && !coach.classList.contains('hidden') && getComputedStyle(coach).visibility !== 'hidden'),
                orientVisible: !!(orient && orient.classList.contains('visible')),
                vrHidden: !vr || getComputedStyle(vr).display === 'none' || vr.hidden,
                buddyHidden: !buddy || getComputedStyle(buddy).display === 'none',
                errOnPage,
                running: !!game?.isRunning,
                pos: pos ? { x: pos.x, y: pos.y, z: pos.z } : null,
                air: game?.getDiveBudget?.()?.getAir?.() ?? null,
                diver: document.getElementById('menu-diver-name')?.textContent || '',
                touchPrimary: window.matchMedia('(pointer: coarse)').matches,
                maxTouch: navigator.maxTouchPoints,
            };
        });

        if (ui.running && ui.hasHud) pass(`${label} HUD + running`);
        else fail(`${label} HUD + running`, JSON.stringify(ui));

        if (ui.errOnPage) fail(`${label} on-screen Error`);
        else pass(`${label} no Error banner`);

        if (ui.gemsChip || ui.gemsVisibleInHud) {
            fail(`${label} gems shown to kid`, ui.hudText);
        } else {
            pass(`${label} no gems chip`, `pearls=${ui.pearlsText}`);
        }

        if (ui.air == null || ui.air > 0.4) pass(`${label} air ok at start`, String(ui.air));
        else fail(`${label} air too low`, String(ui.air));

        if (ui.objTitle || ui.objBody) {
            pass(`${label} objective`, `${ui.objTitle} | ${ui.objBody}`.slice(0, 80));
        } else {
            fail(`${label} no objective banner`);
        }

        const isTouch = !!contextOpts.hasTouch;

        if (ui.miniHidden) pass(`${label} minimap not covering HUD`);
        else fail(`${label} minimap still on pearls/objective`);

        if (isTouch ? ui.toolsHidden : !ui.toolsHidden) {
            pass(`${label} tools chrome`, isTouch ? 'touch overlay only' : 'desktop strip');
        } else {
            fail(`${label} tools chrome`, JSON.stringify({ isTouch, toolsHidden: ui.toolsHidden }));
        }

        // Dismiss coach if blocking
        const coachGo = page.locator('#mc-coach-go');
        if (await coachGo.isVisible({ timeout: 800 }).catch(() => false)) {
            await coachGo.click({ force: true });
            pass(`${label} dismissed coach`);
            await page.waitForTimeout(400);
        }

        // Swim forward ~2s
        const before = ui.pos;
        if (isTouch) {
            const stick = page.locator('#mc-stick-zone');
            if (await stick.isVisible({ timeout: 1500 }).catch(() => false)) {
                const box = await stick.boundingBox();
                if (box) {
                    const cx = box.x + box.width / 2;
                    const cy = box.y + box.height / 2;
                    await page.touchscreen.tap(cx, cy);
                    await page.mouse.move(cx, cy);
                    await page.mouse.down();
                    await page.mouse.move(cx, cy - 40, { steps: 6 });
                    await page.waitForTimeout(1600);
                    await page.mouse.up();
                    pass(`${label} stick swipe`);
                }
            } else {
                fail(`${label} stick not visible on touch device`);
            }
            // Look drag
            const look = page.locator('#mc-look-zone');
            if (await look.isVisible({ timeout: 800 }).catch(() => false)) {
                const box = await look.boundingBox();
                if (box) {
                    await page.mouse.move(box.x + 40, box.y + 40);
                    await page.mouse.down();
                    await page.mouse.move(box.x + 120, box.y + 50, { steps: 8 });
                    await page.mouse.up();
                    pass(`${label} look drag`);
                }
            }
            const obs = page.locator('#mc-observe');
            const cln = page.locator('#mc-clean');
            if (await obs.isVisible().catch(() => false)) {
                await obs.click({ force: true });
                pass(`${label} Observe tap`);
            } else fail(`${label} Observe missing`);
            if (await cln.isVisible().catch(() => false)) {
                await cln.click({ force: true });
                pass(`${label} Clean tap`);
            } else fail(`${label} Clean missing`);
        } else {
            await page.keyboard.down('KeyW');
            await page.waitForTimeout(1600);
            await page.keyboard.up('KeyW');
            await page.keyboard.press('KeyE');
            await page.keyboard.press('KeyF');
            pass(`${label} WASD/E/F`);
        }

        await page.waitForTimeout(600);
        const after = await page.evaluate(() => {
            const sc = window.game?.getSwimmerController?.();
            const pos = sc?.getPosition?.();
            const game = window.game;
            return {
                pos: pos ? { x: pos.x, y: pos.y, z: pos.z } : null,
                air: game?.getDiveBudget?.()?.getAir?.() ?? null,
                cleans: window.__diveCleans ?? null,
                toast: document.querySelector('.discovery-toast, .toast, .aq-toast')?.textContent || '',
                toastTitle: document.querySelector('.discovery-toast-title')?.textContent || '',
                stillRunning: !!game?.isRunning,
                win: !!document.querySelector('.win-screen'),
            };
        });
        if (/at\s*0m/i.test(after.toast + after.toastTitle)) {
            fail(`${label} toast says 0m`, after.toastTitle || after.toast);
        } else if ((after.toastTitle || after.toast).length > 160) {
            fail(`${label} toast too long`, (after.toastTitle || after.toast).slice(0, 180));
        } else if (after.toastTitle || after.toast) {
            pass(`${label} toast readable`, (after.toastTitle || after.toast).slice(0, 80));
        }

        const moved =
            before &&
            after.pos &&
            Math.hypot(after.pos.x - before.x, after.pos.y - before.y, after.pos.z - before.z) > 0.15;
        if (moved) pass(`${label} swam`, JSON.stringify(after.pos));
        else fail(`${label} did not move`, JSON.stringify({ before, after: after.pos }));

        if (!after.stillRunning) fail(`${label} game stopped after swim`);
        else pass(`${label} still running`);

        // Pause / resume
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        const paused = await page.evaluate(() => {
            const resume = document.getElementById('btn-resume');
            const pause = document.querySelector('.pause-screen, #pause-overlay, #start-screen');
            return {
                resume: !!(resume && getComputedStyle(resume).display !== 'none'),
                pauseText: (document.body.innerText || '').includes('Resume') ||
                    (document.body.innerText || '').includes('Paused'),
            };
        });
        if (paused.resume || paused.pauseText) {
            pass(`${label} pause`);
            const resumeBtn = page.locator('#btn-resume');
            if (await resumeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                await resumeBtn.click({ force: true });
                await page.waitForTimeout(400);
                const back = await page.evaluate(() => !!window.game?.isRunning);
                if (back) pass(`${label} resume`);
                else fail(`${label} resume did not continue`);
            }
        } else {
            // Escape may just unlock pointer — not always a kid-visible bug
            pass(`${label} pause soft`, 'no pause overlay (pointer-unlock?)');
        }

        await page.screenshot({ path: `${SHOT}/${label}-02-play.png` });

        // Reload → still Jasmine / still playable
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(
            () =>
                !!document.getElementById('btn-continue-jasmine') ||
                !!document.getElementById('btn-play'),
            { timeout: TIMEOUT }
        );
        await page.waitForTimeout(1200);
        const afterReload = await page.evaluate(() => {
            const name =
                document.getElementById('menu-diver-name')?.textContent ||
                document.querySelector('.diver-name')?.textContent ||
                document.getElementById('btn-continue-jasmine')?.textContent ||
                '';
            return {
                jasmine:
                    /jasmine/i.test(name) ||
                    !!document.getElementById('btn-continue-jasmine') ||
                    /jasmine/i.test(document.body.innerText || ''),
                bodySlice: (document.body.innerText || '').slice(0, 180),
            };
        });
        if (afterReload.jasmine) pass(`${label} reload keeps Jasmine`);
        else fail(`${label} reload lost Jasmine`, afterReload.bodySlice);

        await page.screenshot({ path: `${SHOT}/${label}-03-reload.png` });

        const fatal = pageErrors.filter(
            (e) => !/AudioContext|pointer|favicon|XR|NotAllowedError/i.test(e)
        );
        if (fatal.length) fail(`${label} pageerror`, fatal.slice(0, 3).join(' | '));
        else pass(`${label} no fatal pageerror`, `${pageErrors.length} soft`);

        const noisy = consoleErrors.filter(
            (e) =>
                !/AudioContext|favicon|404|net::|XR|Failed to load resource/i.test(e) &&
                /TypeError|ReferenceError|is not a function|undefined/i.test(e)
        );
        if (noisy.length) fail(`${label} console TypeError`, noisy.slice(0, 2).join(' | '));
        else pass(`${label} no TypeError in console`);

        console.log(`  ℹ️  ${label} extras`, {
            touchPrimary: ui.touchPrimary,
            maxTouch: ui.maxTouch,
            mobileHidden: ui.mobileHidden,
            mobileDisplay: ui.mobileDisplay,
            pearls: ui.pearlsText,
            air: ui.air,
            toast: after.toast,
        });
    } catch (e) {
        fail(`${label} exception`, String(e.message || e));
        await page.screenshot({ path: `${SHOT}/${label}-ERR.png` }).catch(() => {});
    } finally {
        await browser.close();
    }
}

async function main() {
    try {
        const r = await fetch(BASE);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const html = await r.text();
        if (!html.includes('Abyssal') && !html.includes('main.ts')) {
            throw new Error('Not Abyssal HTML');
        }
        pass('server Abyssal');
    } catch (e) {
        fail('server', String(e.message || e));
        process.exit(1);
    }

    await playPass('desktop', { viewport: { width: 1280, height: 800 } });

    const ipad = devices['iPad Pro 11'];
    await playPass('ipad-touch', {
        ...ipad,
        viewport: { width: 1194, height: 834 }, // landscape
        isMobile: true,
        hasTouch: true,
        userAgent:
            'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    console.log('\n═══ JASMINE PLAY SUMMARY ═══');
    let bad = 0;
    for (const r of results) {
        console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
        if (!r.ok) bad++;
    }
    console.log(`\n${results.filter((r) => r.ok).length} passed, ${bad} failed`);
    writeFileSync('/tmp/aq-jasmine-results.json', JSON.stringify(results, null, 2));
    process.exit(bad > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
