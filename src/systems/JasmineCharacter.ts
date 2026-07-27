/**
 * Jasmine — Ocean Ranger (matched to her Roblox avatar).
 *
 * Signature look (refs):
 *  - Warm skin, freckles, rosy cheeks, big green eyes, soft smile
 *  - Medium brown hair + green flower clip
 *  - Black wetsuit + orange sleeves, yellow dive goggles
 *  - Blue air tank, black snorkel strap
 *  - Playful chocolate stick (her fun personality)
 *  - Slightly blocky proportions (Rowblocks / Roblox-friendly)
 */

import * as THREE from 'three';

export type JasmineSuitId =
    | 'default'
    | 'coral'
    | 'emerald'
    | 'purple'
    | 'gold'
    | 'buddy';

export interface JasmineBuild {
    group: THREE.Group;
    /** Accent meshes (sleeves / fins) recolour with shop */
    suitMeshes: THREE.Mesh[];
    finL: THREE.Object3D;
    finR: THREE.Object3D;
    armL: THREE.Object3D;
    armR: THREE.Object3D;
    ponytail: THREE.Object3D;
    head: THREE.Object3D;
    tank: THREE.Object3D;
    candy?: THREE.Object3D;
    flower?: THREE.Object3D;
    nameLabel?: THREE.Sprite;
}

/** Sleeve / accent colours for shop skins (body stays black like her dive suit) */
const ACCENT: Record<JasmineSuitId, number> = {
    default: 0xf07a28, // signature orange sleeves
    coral: 0xff6b7a,
    emerald: 0x2ee59d,
    purple: 0x9b7bff,
    gold: 0xffd166,
    buddy: 0x3dd6c6,
};

// Keep export for shop colour chips
const SUIT_COLORS: Record<JasmineSuitId, number> = {
    default: 0x1a1a1e, // black body
    coral: 0x1a1a1e,
    emerald: 0x1a1a1e,
    purple: 0x1a1a1e,
    gold: 0x1a1a1e,
    buddy: 0x1a2a2a,
};

function std(
    color: number,
    opts: {
        roughness?: number;
        metalness?: number;
        emissive?: number;
        emissiveIntensity?: number;
        transparent?: boolean;
        opacity?: number;
        flatShading?: boolean;
    } = {}
): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: opts.roughness ?? 0.55,
        metalness: opts.metalness ?? 0.08,
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        transparent: opts.transparent ?? false,
        opacity: opts.opacity ?? 1,
        flatShading: opts.flatShading ?? true, // Roblox-ish faceted look
    });
}

export function makeNameSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = 'rgba(2, 20, 36, 0.55)';
    roundRect(ctx, 48, 28, 416, 72, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.75)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8fbff';
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
    });
    const spr = new THREE.Sprite(mat);
    spr.scale.set(1.6, 0.4, 1);
    spr.position.set(0, 1.55, 0);
    return spr;
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/** 4-petal green flower clip (signature) */
function makeGreenFlower(): THREE.Group {
    const g = new THREE.Group();
    const petalMat = std(0x3dce4a, { roughness: 0.45 });
    const centerMat = std(0xffe066, { roughness: 0.4 });
    for (let i = 0; i < 4; i++) {
        const petal = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 8, 6),
            petalMat
        );
        const a = (i / 4) * Math.PI * 2;
        petal.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0);
        petal.scale.set(1.1, 1.1, 0.45);
        g.add(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), centerMat);
    g.add(center);
    return g;
}

/**
 * Build Jasmine matched to her Roblox dive avatar.
 * Group origin = chest / physics body center.
 * Mesh faces **+Z** (eyes/zip at +Z). SwimmerController adds π to yaw so she faces
 * movement forward (−Z look space) — otherwise she stares into the chase camera.
 */
export function buildJasmineDiver(opts: {
    suitId?: JasmineSuitId;
    displayName?: string;
    showName?: boolean;
} = {}): JasmineBuild {
    const suitId = opts.suitId ?? 'default';
    const accent = ACCENT[suitId] ?? ACCENT.default;
    const suitMeshes: THREE.Mesh[] = [];

    // Palette from refs
    const skin = 0xf0c4a0;
    const hair = 0x6b4428;
    const eyeGreen = 0x3db86a;
    const black = 0x1a1a1e;
    const yellow = 0xffe14a;
    const blush = 0xf0a090;
    const freckle = 0xc48a6a;
    const candy = 0x8b5a3c;
    const tankBlue = 0x3d8bff;
    const tankWhite = 0xf0f4f8;

    const group = new THREE.Group();
    group.name = opts.displayName || 'Jasmine';

    const blackMat = std(black, { roughness: 0.5 });
    const accentMat = std(accent, { roughness: 0.48 });
    const skinMat = std(skin, { roughness: 0.7, flatShading: true });
    const hairMat = std(hair, { roughness: 0.8 });
    const yellowMat = std(yellow, { roughness: 0.35, metalness: 0.15 });
    const glassMat = std(0xc8f0ff, {
        roughness: 0.08,
        metalness: 0.25,
        transparent: true,
        opacity: 0.28,
        flatShading: false,
    });

    // ── Blocky torso (black wetsuit) ─────────────────────────────
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.32), blackMat);
    torso.position.y = 0.05;
    torso.castShadow = true;
    group.add(torso);

    // White trim neckline (from her black dress / suit detail)
    const neckTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.018, 6, 16),
        std(0xf5f5f5, { roughness: 0.5 })
    );
    neckTrim.position.set(0, 0.32, 0.02);
    neckTrim.rotation.x = Math.PI / 2;
    neckTrim.scale.set(1.15, 1, 0.7);
    group.add(neckTrim);

    // Chest zipper line
    const zip = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.35, 0.02),
        std(0x2a2a30, { roughness: 0.4 })
    );
    zip.position.set(0, 0.08, 0.165);
    group.add(zip);

    // ── Hips + blocky legs ────────────────────────────────────────
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.28), blackMat);
    hips.position.y = -0.32;
    group.add(hips);

    function makeLeg(side: number): THREE.Group {
        const leg = new THREE.Group();
        const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.16), blackMat);
        thigh.position.y = -0.2;
        leg.add(thigh);
        const shin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.14), blackMat);
        shin.position.y = -0.48;
        leg.add(shin);
        leg.position.set(side * 0.14, -0.38, 0);
        return leg;
    }
    group.add(makeLeg(-1), makeLeg(1));

    // ── Orange fins ──────────────────────────────────────────────
    function makeFin(side: number): THREE.Group {
        const fin = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.36), accentMat);
        blade.position.set(0, 0, 0.12);
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.14), accentMat);
        tip.position.set(0, 0, 0.34);
        fin.add(blade, tip);
        suitMeshes.push(blade, tip);
        fin.position.set(side * 0.14, -0.95, 0.04);
        return fin;
    }
    const finL = makeFin(-1);
    const finR = makeFin(1);
    group.add(finL, finR);

    // ── Orange sleeve arms ───────────────────────────────────────
    function makeArm(side: number): THREE.Group {
        const arm = new THREE.Group();
        // Puffy shoulder (Roblox style)
        const shoulder = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.16, 0.18),
            accentMat
        );
        shoulder.position.y = 0.02;
        arm.add(shoulder);
        suitMeshes.push(shoulder);
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.14), accentMat);
        upper.position.y = -0.18;
        arm.add(upper);
        suitMeshes.push(upper);
        const lower = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.12), accentMat);
        lower.position.y = -0.42;
        arm.add(lower);
        suitMeshes.push(lower);
        // Hand (skin)
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), skinMat);
        hand.position.y = -0.58;
        arm.add(hand);
        arm.position.set(side * 0.38, 0.22, 0);
        arm.rotation.z = side * 0.12;
        return arm;
    }
    const armL = makeArm(-1);
    const armR = makeArm(1);
    group.add(armL, armR);

    // ── Head (blocky sphere-ish) ─────────────────────────────────
    const head = new THREE.Group();
    head.position.y = 0.58;

    const skull = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        skinMat
    );
    skull.scale.set(1, 1.05, 0.95);
    head.add(skull);

    // Cheeks / blush
    const cheekL = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        std(blush, { roughness: 0.75, transparent: true, opacity: 0.55, flatShading: false })
    );
    cheekL.position.set(-0.16, -0.04, 0.18);
    cheekL.scale.set(1.2, 0.7, 0.5);
    const cheekR = cheekL.clone();
    cheekR.position.x = 0.16;
    head.add(cheekL, cheekR);

    // Freckles
    for (const [x, y] of [
        [-0.08, -0.02],
        [-0.12, -0.06],
        [0.09, -0.03],
        [0.13, -0.07],
        [-0.04, -0.08],
        [0.05, -0.09],
    ] as [number, number][]) {
        const f = new THREE.Mesh(
            new THREE.SphereGeometry(0.012, 5, 5),
            std(freckle, { roughness: 0.8, flatShading: false })
        );
        f.position.set(x, y, 0.24);
        head.add(f);
    }

    // Big green eyes (her signature)
    function makeEye(side: number): THREE.Group {
        const e = new THREE.Group();
        const white = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 10, 10),
            std(0xfffaf5, { roughness: 0.25, flatShading: false })
        );
        white.scale.set(1, 1.15, 0.7);
        const iris = new THREE.Mesh(
            new THREE.SphereGeometry(0.038, 12, 10),
            std(eyeGreen, {
                roughness: 0.25,
                flatShading: false,
                emissive: 0x1a5a30,
                emissiveIntensity: 0.15,
            })
        );
        iris.position.z = 0.028;
        const pupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.018, 8, 8),
            std(0x111111, { roughness: 0.2, flatShading: false })
        );
        pupil.position.z = 0.048;
        const gloss = new THREE.Mesh(
            new THREE.SphereGeometry(0.012, 6, 6),
            std(0xffffff, { roughness: 0.05, metalness: 0.4, flatShading: false })
        );
        gloss.position.set(0.01, 0.012, 0.058);
        // Lashes / upper lid line
        const lash = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.012, 0.02),
            std(0x2a1810, { roughness: 0.5 })
        );
        lash.position.set(0, 0.05, 0.04);
        lash.rotation.z = side * 0.08;
        e.add(white, iris, pupil, gloss, lash);
        e.position.set(side * 0.09, 0.04, 0.22);
        return e;
    }
    head.add(makeEye(-1), makeEye(1));

    // Brows
    const browL = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.014, 0.02),
        std(0x4a3020, { roughness: 0.6 })
    );
    browL.position.set(-0.09, 0.12, 0.22);
    browL.rotation.z = 0.12;
    const browR = browL.clone();
    browR.position.x = 0.09;
    browR.rotation.z = -0.12;
    head.add(browL, browR);

    // Soft smile
    const smile = new THREE.Mesh(
        new THREE.TorusGeometry(0.055, 0.01, 6, 12, Math.PI),
        std(0xc07070, { roughness: 0.55, flatShading: false })
    );
    smile.position.set(0, -0.08, 0.24);
    smile.rotation.set(Math.PI, 0, Math.PI);
    head.add(smile);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 8, 6),
        skinMat
    );
    nose.position.set(0, -0.01, 0.26);
    nose.scale.set(0.75, 0.9, 0.9);
    head.add(nose);

    // ── Brown hair (shoulder length, bangs) ──────────────────────
    // Cap / crown
    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.29, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        hairMat
    );
    crown.position.y = 0.06;
    crown.rotation.x = -0.08;
    head.add(crown);

    // Bangs
    const bangs = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.1, 0.12),
        hairMat
    );
    bangs.position.set(0, 0.12, 0.2);
    bangs.rotation.x = -0.35;
    head.add(bangs);

    // Side + back hair on sway root (animates gently while swimming)
    const ponytail = new THREE.Group();
    const hairL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.14), hairMat);
    hairL.position.set(-0.24, -0.08, 0.02);
    hairL.rotation.z = 0.12;
    const hairR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.14), hairMat);
    hairR.position.set(0.24, -0.08, 0.02);
    hairR.rotation.z = -0.12;
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.12), hairMat);
    hairBack.position.set(0, -0.08, -0.2);
    ponytail.add(hairL, hairR, hairBack);
    head.add(ponytail);

    // Green flower clip — left side (her signature)
    const flower = makeGreenFlower();
    flower.position.set(-0.26, 0.16, 0.08);
    flower.rotation.y = 0.5;
    flower.scale.setScalar(1.15);
    head.add(flower);

    // ── Yellow dive goggles (ref #2) ──────────────────────────────
    const goggleFrame = new THREE.Group();
    // Two yellow ovals joined
    const gL = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.022, 8, 16),
        yellowMat
    );
    gL.position.set(-0.09, 0.04, 0.22);
    gL.scale.set(1, 0.85, 1);
    const gR = gL.clone();
    gR.position.x = 0.09;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.03), yellowMat);
    bridge.position.set(0, 0.04, 0.24);
    // Glass panes
    const glassL = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), glassMat);
    glassL.position.set(-0.09, 0.04, 0.235);
    glassL.scale.set(1, 0.85, 1);
    const glassR = glassL.clone();
    glassR.position.x = 0.09;
    goggleFrame.add(gL, gR, bridge, glassL, glassR);
    head.add(goggleFrame);

    // Black snorkel strap + mouthpiece tube
    const strap = new THREE.Mesh(
        new THREE.TorusGeometry(0.27, 0.018, 6, 16, Math.PI * 1.2),
        blackMat
    );
    strap.position.set(0, 0.02, 0);
    strap.rotation.x = 0.3;
    strap.rotation.y = Math.PI;
    head.add(strap);

    // Green snorkel tube on left (matches flower side accent)
    const snorkel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8),
        std(0x3dce4a, { roughness: 0.4 })
    );
    snorkel.position.set(-0.22, 0.18, 0.05);
    snorkel.rotation.z = 0.35;
    head.add(snorkel);

    // ── Chocolate stick (her fun face accessory) ─────────────────
    const candyGroup = new THREE.Group();
    const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.032, 0.28, 8),
        std(candy, { roughness: 0.75 })
    );
    stick.rotation.x = Math.PI / 2;
    stick.position.set(0, -0.1, 0.32);
    // Hook tip
    const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.018, 6, 10, Math.PI),
        std(candy, { roughness: 0.75 })
    );
    hook.position.set(0, -0.22, 0.32);
    hook.rotation.z = Math.PI / 2;
    candyGroup.add(stick, hook);
    head.add(candyGroup);

    group.add(head);

    // ── Blue / white air tank ─────────────────────────────────────
    const tank = new THREE.Group();
    const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.45, 12),
        std(tankBlue, { roughness: 0.35, metalness: 0.35 })
    );
    cyl.position.y = 0.05;
    const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.08, 12),
        std(tankWhite, { roughness: 0.4 })
    );
    band.position.y = 0.08;
    const valve = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        std(0xdddddd, { roughness: 0.3, metalness: 0.5 })
    );
    valve.position.y = 0.32;
    tank.add(cyl, band, valve);
    tank.position.set(0, 0.1, -0.28);
    group.add(tank);

    // Soft rim light for underwater readability
    const rim = new THREE.PointLight(0xffaa66, 0.4, 3.5);
    rim.position.set(0.2, 0.3, 0.3);
    group.add(rim);

    let nameLabel: THREE.Sprite | undefined;
    if (opts.showName !== false) {
        nameLabel = makeNameSprite(opts.displayName || 'Jasmine');
        group.add(nameLabel);
    }

    group.scale.setScalar(1.0);

    return {
        group,
        suitMeshes,
        finL,
        finR,
        armL,
        armR,
        ponytail,
        head,
        tank,
        candy: candyGroup,
        flower,
        nameLabel,
    };
}

/** Recolour sleeve / fin accents from shop skin */
export function applyJasmineSuit(build: JasmineBuild, suitId: string): void {
    const id = (suitId in ACCENT ? suitId : 'default') as JasmineSuitId;
    const accent = ACCENT[id];
    for (const mesh of build.suitMeshes) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(accent);
    }
    build.finL.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
            obj.material.color.setHex(accent);
        }
    });
    build.finR.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
            obj.material.color.setHex(accent);
        }
    });
}

export function animateJasmine(
    build: JasmineBuild,
    time: number,
    speed: number,
    gentleness: number
): void {
    const kick = 0.2 + Math.min(1.5, speed) * 0.95;
    const phase = time * (4.5 + kick * 3.2);

    // Stronger fin kick — readable from behind (Pass 2)
    build.finL.rotation.x = Math.sin(phase) * 0.7 * kick;
    build.finR.rotation.x = Math.sin(phase + Math.PI) * 0.7 * kick;
    build.finL.rotation.z = -0.08 + Math.sin(phase * 0.5) * 0.06;
    build.finR.rotation.z = 0.08 - Math.sin(phase * 0.5) * 0.06;

    const armA = Math.sin(phase * 0.85) * 0.45 * kick;
    build.armL.rotation.x = armA + 0.25; // forward swim arms
    build.armR.rotation.x = -armA * 0.9 + 0.25;
    build.armL.rotation.z = -0.18 + Math.sin(phase * 0.5) * 0.1;
    build.armR.rotation.z = 0.18 - Math.sin(phase * 0.5) * 0.1;

    // Hair sway
    build.ponytail.rotation.x = 0.15 + Math.sin(time * 2.2) * 0.12 + kick * 0.12;
    build.ponytail.rotation.z = Math.sin(time * 1.7) * 0.1;

    // Head tracks slightly with gentleness (still mostly back view)
    build.head.rotation.x = Math.sin(time * 1.1) * 0.04;
    build.head.rotation.y = Math.sin(time * 0.7) * 0.05 * (1 - gentleness * 0.25);

    build.tank.rotation.x = Math.sin(time * 1.5) * 0.02;

    if (build.flower) {
        build.flower.rotation.z = Math.sin(time * 2.5) * 0.12;
    }
    if (build.candy) {
        build.candy.rotation.z = Math.sin(time * 3) * 0.05 * kick;
    }
}

export function suitIdFromStore(skin: string | undefined): JasmineSuitId {
    if (skin && skin in ACCENT) return skin as JasmineSuitId;
    return 'default';
}

export { SUIT_COLORS, ACCENT };
