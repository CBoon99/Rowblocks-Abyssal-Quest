/**
 * Species-true fish / sea-creature meshes for Rowblocks Abyssal Quest.
 * LOCKED bar: must read as the actual animal — no cone placeholders.
 *
 * Each builder returns a Group facing +Z (swim forward = +Z).
 * Materials: MeshStandardMaterial for realistic underwater shading.
 */

import * as THREE from 'three';
import { AssetLibrary } from './AssetLibrary';

export interface CreatureBuild {
    group: THREE.Group;
    /** Primary body mesh (raycast / legacy) */
    mesh: THREE.Mesh;
    /** Animated parts (tail, fins, tentacles) */
    animParts: THREE.Object3D[];
    size: number;
    swimSpeed: number;
    /** 'fish' | 'pulse' | 'glide' | 'crawl' for animation mode */
    animMode: 'fish' | 'pulse' | 'glide' | 'undulate';
}

const _grad = (() => {
    const data = new Uint8Array([40, 40, 40, 120, 120, 120, 220, 220, 220]);
    const t = new THREE.DataTexture(data, 3, 1, THREE.RGBFormat);
    t.needsUpdate = true;
    return t;
})();

function mat(
    color: number,
    opts: {
        roughness?: number;
        metalness?: number;
        emissive?: number;
        emissiveIntensity?: number;
        transparent?: boolean;
        opacity?: number;
        map?: THREE.Texture;
    } = {}
): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: opts.roughness ?? 0.55,
        metalness: opts.metalness ?? 0.05,
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        transparent: opts.transparent ?? false,
        opacity: opts.opacity ?? 1,
        map: opts.map,
    });
}

function eye(size = 0.06, pupil = 0.035): THREE.Group {
    const g = new THREE.Group();
    const white = new THREE.Mesh(
        new THREE.SphereGeometry(size, 10, 10),
        mat(0xfffaf0, { roughness: 0.3 })
    );
    const pupilM = new THREE.Mesh(
        new THREE.SphereGeometry(pupil, 8, 8),
        mat(0x111111, { roughness: 0.2, metalness: 0.1 })
    );
    pupilM.position.z = size * 0.55;
    const gloss = new THREE.Mesh(
        new THREE.SphereGeometry(pupil * 0.35, 6, 6),
        mat(0xffffff, { roughness: 0.1, metalness: 0.4 })
    );
    gloss.position.set(pupil * 0.25, pupil * 0.25, size * 0.75);
    g.add(white, pupilM, gloss);
    return g;
}

/** Soft fish body via scaled sphere + tapered rear using multi-sphere hull */
function fishBody(
    length: number,
    height: number,
    width: number,
    material: THREE.Material
): THREE.Mesh {
    // Lathe a side-profile for a true fish silhouette
    const points: THREE.Vector2[] = [];
    const segs = 16;
    for (let i = 0; i <= segs; i++) {
        const t = i / segs; // 0 nose → 1 tail
        // Nose blunt, belly fuller mid, taper to tail peduncle
        const profile =
            Math.sin(t * Math.PI) * 0.92 +
            Math.sin(t * Math.PI * 2) * 0.08;
        const r = Math.max(0.02, profile * (height / 2) * (t < 0.12 ? t / 0.12 : 1));
        // Slightly fatter mid-body
        const fat = 1 + Math.sin(t * Math.PI) * 0.15;
        points.push(new THREE.Vector2(r * fat, (t - 0.5) * length));
    }
    const geo = new THREE.LatheGeometry(points, 14);
    geo.rotateZ(-Math.PI / 2); // length along Z
    geo.scale(1, height / width, 1);
    // Re-scale width: lathe is circular — squash Y vs X
    geo.scale(width / height, 1, 1);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function fin(
    w: number,
    h: number,
    material: THREE.Material,
    shape: 'triangle' | 'sail' | 'fork' | 'round' = 'triangle'
): THREE.Mesh {
    let geo: THREE.BufferGeometry;
    if (shape === 'sail') {
        const shape2 = new THREE.Shape();
        shape2.moveTo(0, 0);
        shape2.quadraticCurveTo(w * 0.3, h * 0.9, w, h);
        shape2.lineTo(w * 0.15, 0);
        shape2.lineTo(0, 0);
        geo = new THREE.ShapeGeometry(shape2);
    } else if (shape === 'fork') {
        const shape2 = new THREE.Shape();
        shape2.moveTo(0, 0);
        shape2.lineTo(w * 0.35, h * 0.55);
        shape2.lineTo(w * 0.1, h * 0.15);
        shape2.lineTo(w * 0.35, -h * 0.55);
        shape2.lineTo(0, 0);
        geo = new THREE.ShapeGeometry(shape2);
    } else if (shape === 'round') {
        geo = new THREE.CircleGeometry(Math.max(w, h) * 0.5, 10);
        geo.scale(w / Math.max(w, h), h / Math.max(w, h), 1);
    } else {
        const shape2 = new THREE.Shape();
        shape2.moveTo(0, 0);
        shape2.lineTo(w, h * 0.5);
        shape2.lineTo(w * 0.2, 0);
        shape2.lineTo(w, -h * 0.5);
        shape2.lineTo(0, 0);
        geo = new THREE.ShapeGeometry(shape2);
    }
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    return m;
}

function stripeTexture(
    base: string,
    stripe: string,
    count: number,
    vertical = true
): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = stripe;
    for (let i = 0; i < count; i++) {
        if (vertical) {
            const x = ((i + 0.5) / count) * c.width;
            const bw = c.width / (count * 2.2);
            ctx.fillRect(x - bw / 2, 0, bw, c.height);
        } else {
            const y = ((i + 0.5) / count) * c.height;
            const bh = c.height / (count * 2.2);
            ctx.fillRect(0, y - bh / 2, c.width, bh);
        }
    }
    // Soft edge black outlines for clownfish-style
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
}

function clownfishTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    // Orange base
    ctx.fillStyle = '#ff6a00';
    ctx.fillRect(0, 0, 256, 128);
    // White bands with black borders (classic ocellaris)
    const bands = [0.22, 0.5, 0.78];
    for (const t of bands) {
        const x = t * 256;
        ctx.fillStyle = '#111111';
        ctx.fillRect(x - 14, 0, 28, 128);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 9, 0, 18, 128);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function blueTangTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, '#1a6cff');
    g.addColorStop(0.75, '#1e90ff');
    g.addColorStop(0.82, '#ffd000');
    g.addColorStop(1, '#ffcc00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
    // Black palette mark
    ctx.fillStyle = '#0a0a12';
    ctx.beginPath();
    ctx.ellipse(90, 64, 28, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function parrotfishTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 256, 128);
    g.addColorStop(0, '#2ecc71');
    g.addColorStop(0.35, '#3498db');
    g.addColorStop(0.65, '#9b59b6');
    g.addColorStop(1, '#f1c40f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
    // Scale suggestion
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    for (let y = 0; y < 128; y += 8) {
        for (let x = 0; x < 256; x += 10) {
            ctx.beginPath();
            ctx.arc(x + (y % 16 === 0 ? 0 : 5), y, 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// ── Species builders ─────────────────────────────────────────────

function buildClownfish(): CreatureBuild {
    const group = new THREE.Group();
    // Ocellaris: bright orange + 3 white rings with black edges (readable at 8m)
    const orange = mat(0xff6a00, {
        roughness: 0.42,
        emissive: 0x441800,
        emissiveIntensity: 0.22,
    });
    const white = mat(0xfffaf5, { roughness: 0.55, emissive: 0x444433, emissiveIntensity: 0.08 });
    const black = mat(0x111111, { roughness: 0.7 });

    const body = fishBody(1.15, 0.58, 0.4, orange);
    group.add(body);

    // 3 classic vertical white bands (mesh rings — not only texture)
    for (const z of [0.28, 0.0, -0.28]) {
        const edge = new THREE.Mesh(
            new THREE.TorusGeometry(0.22, 0.045, 8, 16),
            black
        );
        edge.rotation.y = Math.PI / 2;
        edge.position.set(0, 0.02, z);
        edge.scale.set(1, 1.15, 0.85);
        group.add(edge);
        const band = new THREE.Mesh(
            new THREE.TorusGeometry(0.22, 0.028, 8, 16),
            white
        );
        band.rotation.y = Math.PI / 2;
        band.position.set(0, 0.02, z);
        band.scale.set(1, 1.15, 0.85);
        group.add(band);
    }

    const finMat = mat(0xff7a10, { roughness: 0.48, emissive: 0x331100, emissiveIntensity: 0.12 });
    const tail = fin(0.38, 0.48, finMat, 'fork');
    tail.position.set(0, 0, -0.58);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const dorsal = fin(0.42, 0.3, finMat, 'sail');
    dorsal.position.set(0, 0.24, 0.05);
    dorsal.rotation.x = -Math.PI / 2;
    dorsal.rotation.z = Math.PI / 2;
    group.add(dorsal);

    const pecL = fin(0.24, 0.18, white, 'round');
    pecL.position.set(0.22, 0, 0.15);
    pecL.rotation.y = Math.PI / 2;
    pecL.rotation.z = 0.4;
    const pecR = pecL.clone();
    pecR.position.x = -0.22;
    pecR.rotation.z = -0.4;
    group.add(pecL, pecR);

    const eL = eye(0.06, 0.032);
    eL.position.set(0.13, 0.07, 0.44);
    const eR = eye(0.06, 0.032);
    eR.position.set(-0.13, 0.07, 0.44);
    group.add(eL, eR);

    const mouth = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        mat(0x222222, { roughness: 0.8 })
    );
    mouth.position.set(0, -0.05, 0.54);
    mouth.scale.set(1, 0.6, 0.5);
    group.add(mouth);

    group.scale.setScalar(1.35);
    return {
        group,
        mesh: body,
        animParts: [tail, pecL, pecR, dorsal],
        size: 1.15,
        swimSpeed: 1.5,
        animMode: 'fish',
    };
}

function buildAngelfish(): CreatureBuild {
    const group = new THREE.Group();
    // Emperor/queen-style: tall blue disc + bold yellow vertical bars
    const blue = mat(0x1a5cff, {
        roughness: 0.38,
        emissive: 0x001a44,
        emissiveIntensity: 0.28,
    });
    const gold = mat(0xffd000, {
        roughness: 0.4,
        emissive: 0x664400,
        emissiveIntensity: 0.25,
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 22, 18), blue);
    body.scale.set(0.32, 1.25, 1.0);
    body.castShadow = true;
    group.add(body);

    // Vertical gold bars across disc (species silhouette cue)
    for (const z of [0.22, 0.05, -0.12, -0.28]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.06), gold);
        bar.position.set(0, 0.02, z);
        group.add(bar);
    }

    const finMat = mat(0x2a70ff, { roughness: 0.42, emissive: 0x001133, emissiveIntensity: 0.15 });
    const dorsal = fin(0.6, 0.75, finMat, 'sail');
    dorsal.position.set(0, 0.62, 0);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    group.add(dorsal);

    const anal = fin(0.5, 0.6, finMat, 'sail');
    anal.position.set(0, -0.55, 0);
    anal.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    group.add(anal);

    const tail = fin(0.42, 0.58, gold, 'fork');
    tail.position.set(0, 0, -0.58);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    // Face mask
    const mask = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), gold);
    mask.scale.set(0.7, 0.9, 0.55);
    mask.position.set(0, 0.05, 0.38);
    group.add(mask);

    const eL = eye(0.055, 0.03);
    eL.position.set(0.12, 0.1, 0.38);
    const eR = eye(0.055, 0.03);
    eR.position.set(-0.12, 0.1, 0.38);
    group.add(eL, eR);

    group.scale.setScalar(1.4);
    return {
        group,
        mesh: body,
        animParts: [tail, dorsal, anal],
        size: 1.35,
        swimSpeed: 1.2,
        animMode: 'fish',
    };
}

function buildBlueTang(): CreatureBuild {
    const group = new THREE.Group();
    // Dory / palette surgeonfish: royal blue body, yellow tail, black face palette
    const blue = mat(0x1a6cff, {
        roughness: 0.38,
        emissive: 0x002266,
        emissiveIntensity: 0.32,
    });
    const yellow = mat(0xffcc00, {
        roughness: 0.4,
        emissive: 0x664400,
        emissiveIntensity: 0.28,
    });
    const black = mat(0x0a0a14, { roughness: 0.55 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 22, 16), blue);
    body.scale.set(0.3, 1.05, 1.15);
    body.castShadow = true;
    group.add(body);

    // Black “palette” face disc (species cue)
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), black);
    face.scale.set(0.75, 1.1, 0.7);
    face.position.set(0, 0.06, 0.32);
    group.add(face);

    // Bright yellow caudal
    const tail = fin(0.42, 0.48, yellow, 'fork');
    tail.position.set(0, 0, -0.58);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const dorsal = fin(0.52, 0.38, blue, 'sail');
    dorsal.position.set(0, 0.42, 0.02);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    group.add(dorsal);

    // Yellow anal fin tip
    const anal = fin(0.35, 0.22, yellow, 'sail');
    anal.position.set(0, -0.38, 0.05);
    anal.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    group.add(anal);

    // Surgeon spine (white/yellow scalpel mark)
    const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.1, 0.14),
        mat(0xffee88, { roughness: 0.25, emissive: 0x886600, emissiveIntensity: 0.2 })
    );
    spine.position.set(0.14, 0, -0.38);
    group.add(spine);

    const eL = eye(0.05, 0.028);
    eL.position.set(0.1, 0.12, 0.38);
    const eR = eye(0.05, 0.028);
    eR.position.set(-0.1, 0.12, 0.38);
    group.add(eL, eR);

    group.scale.setScalar(1.4);
    return {
        group,
        mesh: body,
        animParts: [tail, dorsal, anal],
        size: 1.25,
        swimSpeed: 1.35,
        animMode: 'fish',
    };
}

function buildParrotfish(): CreatureBuild {
    const group = new THREE.Group();
    // Big parrot: green body, blue head, purple fins, obvious fused beak
    const green = mat(0x2ecc71, {
        roughness: 0.48,
        emissive: 0x0a3318,
        emissiveIntensity: 0.18,
    });
    const blue = mat(0x3498db, {
        roughness: 0.45,
        emissive: 0x002244,
        emissiveIntensity: 0.2,
    });
    const purple = mat(0x9b59b6, {
        roughness: 0.48,
        emissive: 0x2a1040,
        emissiveIntensity: 0.18,
    });
    const beakMat = mat(0xf5d76e, {
        roughness: 0.32,
        metalness: 0.2,
        emissive: 0x554400,
        emissiveIntensity: 0.15,
    });

    const body = fishBody(1.5, 0.6, 0.52, green);
    group.add(body);

    // Blue head plate
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), blue);
    head.scale.set(0.95, 0.95, 1.15);
    head.position.set(0, 0.02, 0.48);
    group.add(head);

    // Fused “parrot” beak — unmistakeable
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 10), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.04, 0.72);
    group.add(beak);
    const lower = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 8), beakMat);
    lower.rotation.x = -Math.PI / 2;
    lower.position.set(0, -0.1, 0.68);
    group.add(lower);

    const tail = fin(0.45, 0.45, purple, 'round');
    tail.position.set(0, 0, -0.75);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const dorsal = fin(0.6, 0.28, purple, 'sail');
    dorsal.position.set(0, 0.32, 0);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    group.add(dorsal);

    const eL = eye(0.055, 0.03);
    eL.position.set(0.16, 0.1, 0.52);
    const eR = eye(0.055, 0.03);
    eR.position.set(-0.16, 0.1, 0.52);
    group.add(eL, eR);

    group.scale.setScalar(1.45);
    return {
        group,
        mesh: body,
        animParts: [tail, dorsal],
        size: 1.45,
        swimSpeed: 1.1,
        animMode: 'fish',
    };
}

function buildShark(): CreatureBuild {
    const group = new THREE.Group();
    // Grey reef shark — sleek fusiform, countershaded, heterocercal tail
    const bodyMat = mat(0x5a6570, { roughness: 0.52, metalness: 0.14 });
    const darkMat = mat(0x3a4450, { roughness: 0.55, metalness: 0.12 });
    const bellyMat = mat(0xe8ecf0, { roughness: 0.68 });
    const gillMat = mat(0x2a3038, { roughness: 0.85 });

    // Custom sleek lathe: pointed snout, slim mid, taper to peduncle (not fat fish)
    const pts: THREE.Vector2[] = [];
    const segs = 20;
    for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        // Torpedo profile — max girth ~35% from nose, slim tail stock
        const nose = t < 0.08 ? t / 0.08 : 1;
        const profile =
            Math.pow(Math.sin(t * Math.PI), 0.85) * 0.88 +
            Math.sin(t * Math.PI * 1.6) * 0.04;
        const r = Math.max(0.018, profile * 0.26 * nose * (t > 0.82 ? 0.55 + (1 - t) * 2.5 : 1));
        pts.push(new THREE.Vector2(r, (t - 0.5) * 2.55));
    }
    const bodyGeo = new THREE.LatheGeometry(pts, 16);
    bodyGeo.rotateZ(-Math.PI / 2);
    bodyGeo.scale(1.05, 0.92, 1); // slightly taller than wide (fusiform)
    bodyGeo.computeVertexNormals();
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // White belly countershading strip
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), bellyMat);
    belly.scale.set(0.62, 0.38, 1.85);
    belly.position.set(0, -0.1, 0.08);
    group.add(belly);

    // Head / snout blunt-cone (grey reef has moderately pointed snout)
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 12), bodyMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0.01, 1.22);
    snout.scale.set(1, 1, 0.9);
    group.add(snout);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), bellyMat);
    jaw.scale.set(0.9, 0.55, 1.1);
    jaw.position.set(0, -0.06, 1.05);
    group.add(jaw);

    // Tall triangular first dorsal (classic shark silhouette)
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0, 0);
    dorsalShape.lineTo(0.08, 0.52);
    dorsalShape.lineTo(0.42, 0.08);
    dorsalShape.lineTo(0.28, 0);
    dorsalShape.lineTo(0, 0);
    const dorsal = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape), darkMat);
    dorsal.position.set(0, 0.22, 0.12);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    dorsal.castShadow = true;
    group.add(dorsal);

    // Small second dorsal
    const d2 = fin(0.14, 0.16, darkMat, 'triangle');
    d2.position.set(0, 0.16, -0.55);
    d2.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    d2.scale.set(0.7, 0.7, 0.7);
    group.add(d2);

    // Heterocercal caudal — upper lobe longer
    const tailGroup = new THREE.Group();
    const upperLobe = new THREE.Mesh(
        (() => {
            const s = new THREE.Shape();
            s.moveTo(0, 0);
            s.lineTo(0.55, 0.38);
            s.lineTo(0.48, 0.12);
            s.lineTo(0.12, 0);
            s.lineTo(0, 0);
            return new THREE.ShapeGeometry(s);
        })(),
        darkMat
    );
    upperLobe.rotation.y = Math.PI / 2;
    const lowerLobe = new THREE.Mesh(
        (() => {
            const s = new THREE.Shape();
            s.moveTo(0, 0);
            s.lineTo(0.32, -0.22);
            s.lineTo(0.28, -0.06);
            s.lineTo(0.1, 0);
            s.lineTo(0, 0);
            return new THREE.ShapeGeometry(s);
        })(),
        darkMat
    );
    lowerLobe.rotation.y = Math.PI / 2;
    tailGroup.add(upperLobe, lowerLobe);
    tailGroup.position.set(0, 0.02, -1.22);
    group.add(tailGroup);

    // Pectoral fins — broad, swept slightly back/down
    const pecGeo = (() => {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.lineTo(0.55, 0.08);
        s.lineTo(0.62, -0.06);
        s.lineTo(0.15, -0.14);
        s.lineTo(0, 0);
        return new THREE.ShapeGeometry(s);
    })();
    const pecL = new THREE.Mesh(pecGeo, darkMat);
    pecL.position.set(0.18, -0.06, 0.25);
    pecL.rotation.set(0.55, 0.15, -0.85);
    const pecR = pecL.clone();
    pecR.position.x = -0.18;
    pecR.rotation.set(-0.55, -0.15, 0.85);
    group.add(pecL, pecR);

    // Pelvic fins
    const pel = fin(0.18, 0.1, darkMat, 'triangle');
    const pelL = pel.clone();
    pelL.position.set(0.1, -0.12, -0.25);
    pelL.rotation.set(0.6, Math.PI / 2, 0.4);
    pelL.scale.setScalar(0.7);
    const pelR = pelL.clone();
    pelR.position.x = -0.1;
    pelR.rotation.z = -0.4;
    group.add(pelL, pelR);

    // Anal fin
    const anal = fin(0.12, 0.1, darkMat, 'triangle');
    anal.position.set(0, -0.12, -0.55);
    anal.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    anal.scale.setScalar(0.65);
    group.add(anal);

    // Dark lateral eyes (sharks — small, no big sclera)
    const eL = eye(0.032, 0.02);
    eL.position.set(0.14, 0.05, 0.88);
    eL.scale.setScalar(0.85);
    const eR = eye(0.032, 0.02);
    eR.position.set(-0.14, 0.05, 0.88);
    eR.scale.setScalar(0.85);
    group.add(eL, eR);

    // Five gill slits each side
    for (let i = 0; i < 5; i++) {
        const gill = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14 - i * 0.008, 0.018), gillMat);
        gill.position.set(0.2, 0.01, 0.58 - i * 0.07);
        gill.rotation.z = 0.15;
        group.add(gill);
        const gill2 = gill.clone();
        gill2.position.x = -0.2;
        gill2.rotation.z = -0.15;
        group.add(gill2);
    }

    // Subtle dark dorsal ridge for countershading read
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 1.4), darkMat);
    ridge.position.set(0, 0.18, 0.05);
    group.add(ridge);

    group.scale.setScalar(1.4);
    return {
        group,
        mesh: body,
        animParts: [tailGroup, pecL, pecR, dorsal],
        size: 2.2,
        swimSpeed: 2.2,
        animMode: 'fish',
    };
}

function buildJellyfish(): CreatureBuild {
    const group = new THREE.Group();
    // Lantern jellyfish — translucent dome, pink/cyan biolum, oral arms + fringe tentacles
    const bellMat = mat(0xb8e4ff, {
        roughness: 0.12,
        metalness: 0.02,
        transparent: true,
        opacity: 0.42,
        emissive: 0x44bbff,
        emissiveIntensity: 0.85,
    });
    const rimMat = mat(0x88d4ff, {
        roughness: 0.2,
        transparent: true,
        opacity: 0.55,
        emissive: 0x66ccff,
        emissiveIntensity: 0.6,
    });
    const gonadMat = mat(0xff88cc, {
        roughness: 0.25,
        transparent: true,
        opacity: 0.8,
        emissive: 0xff55aa,
        emissiveIntensity: 1.05,
    });
    const armMat = mat(0xffb0d8, {
        roughness: 0.3,
        transparent: true,
        opacity: 0.7,
        emissive: 0xff66bb,
        emissiveIntensity: 0.7,
    });
    const tentMat = mat(0xd0f0ff, {
        roughness: 0.25,
        transparent: true,
        opacity: 0.5,
        emissive: 0x77ddff,
        emissiveIntensity: 0.55,
    });

    // Outer bell dome (half-sphere, slightly flattened)
    const bell = new THREE.Mesh(
        new THREE.SphereGeometry(0.58, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
        bellMat
    );
    bell.scale.set(1.05, 0.72, 1.05);
    bell.castShadow = true;
    group.add(bell);

    // Bell rim / lappet ring
    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.045, 8, 28),
        rimMat
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.12;
    rim.scale.set(1, 1, 0.55);
    group.add(rim);

    // Inner subumbrella glow layer
    const inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
        mat(0xffccee, {
            transparent: true,
            opacity: 0.35,
            emissive: 0xff88cc,
            emissiveIntensity: 0.55,
        })
    );
    inner.scale.set(1, 0.65, 1);
    inner.position.y = -0.02;
    group.add(inner);

    // Four gonads / radial canals (lantern pink lobes)
    for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const gonad = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gonadMat);
        gonad.scale.set(1.1, 0.7, 0.85);
        gonad.position.set(Math.cos(ang) * 0.18, -0.02, Math.sin(ang) * 0.18);
        group.add(gonad);
    }

    // Manubrium (central mouth stalk)
    const manubrium = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.1, 0.22, 10),
        armMat
    );
    manubrium.position.y = -0.18;
    group.add(manubrium);

    // Soft point light — living lantern
    const glow = new THREE.PointLight(0xaaddff, 0.85, 7);
    glow.position.set(0, -0.05, 0);
    group.add(glow);
    const pinkGlow = new THREE.PointLight(0xff88cc, 0.35, 4);
    pinkGlow.position.set(0, -0.15, 0);
    group.add(pinkGlow);

    const tentacles: THREE.Object3D[] = [];

    // Thick oral arms (4) — frilly, longer, multi-segment for silhouette
    for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + 0.15;
        const arm = new THREE.Group();
        const upper = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.04, 0.45, 8),
            armMat
        );
        upper.position.y = -0.22;
        const mid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.055, 0.4, 8),
            armMat
        );
        mid.position.y = -0.62;
        // Frill knobs along arm
        for (let k = 0; k < 3; k++) {
            const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), armMat);
            knob.position.set(0.03, -0.25 - k * 0.2, 0);
            arm.add(knob);
        }
        arm.add(upper, mid);
        arm.position.set(Math.cos(ang) * 0.12, -0.15, Math.sin(ang) * 0.12);
        arm.userData.baseY = arm.position.y;
        arm.userData.phase = i * 0.9 + 0.3;
        group.add(arm);
        tentacles.push(arm);
    }

    // Outer fringe tentacles — many, thin, phase-varied
    for (let i = 0; i < 18; i++) {
        const ang = (i / 18) * Math.PI * 2;
        const len = 1.05 + (i % 3) * 0.12;
        const tent = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.006, len, 5),
            tentMat
        );
        const r = 0.38 + (i % 2) * 0.06;
        tent.position.set(Math.cos(ang) * r, -0.55 - len * 0.35, Math.sin(ang) * r);
        tent.userData.baseY = tent.position.y;
        tent.userData.phase = i * 0.37 + (i % 5) * 0.11;
        group.add(tent);
        tentacles.push(tent);
    }

    // Mid-ring secondary tentacles for density
    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + 0.2;
        const tent = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.005, 0.85, 5),
            tentMat
        );
        tent.position.set(Math.cos(ang) * 0.28, -0.58, Math.sin(ang) * 0.28);
        tent.userData.baseY = tent.position.y;
        tent.userData.phase = i * 0.55 + 1.2;
        group.add(tent);
        tentacles.push(tent);
    }

    group.scale.setScalar(1.15);
    return {
        group,
        mesh: bell,
        animParts: tentacles,
        size: 1.0,
        swimSpeed: 0.7,
        animMode: 'pulse',
    };
}

function buildSeahorse(): CreatureBuild {
    const group = new THREE.Group();
    const col = mat(0xd4a017, { roughness: 0.55, emissive: 0x442200, emissiveIntensity: 0.15 });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), col);
    head.position.set(0, 0.45, 0.15);
    head.scale.set(0.85, 1, 1.1);
    group.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.28, 8), col);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0.42, 0.38);
    group.add(snout);

    // Eye
    const e = eye(0.04, 0.022);
    e.position.set(0.1, 0.5, 0.22);
    group.add(e);
    const e2 = eye(0.04, 0.022);
    e2.position.set(-0.1, 0.5, 0.22);
    group.add(e2);

    // Segmented body (S-curve)
    const segments: THREE.Object3D[] = [];
    for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const seg = new THREE.Mesh(
            new THREE.SphereGeometry(0.14 - t * 0.06, 10, 8),
            col
        );
        const y = 0.25 - i * 0.12;
        const z = Math.sin(t * Math.PI) * 0.12;
        seg.position.set(0, y, z);
        group.add(seg);
        segments.push(seg);
    }

    // Curled tail
    for (let i = 0; i < 6; i++) {
        const a = i * 0.55;
        const r = 0.12;
        const seg = new THREE.Mesh(
            new THREE.SphereGeometry(0.06 - i * 0.006, 8, 6),
            col
        );
        seg.position.set(
            Math.sin(a) * r,
            -0.75 - i * 0.02,
            -0.05 + Math.cos(a) * r
        );
        group.add(seg);
        segments.push(seg);
    }

    // Dorsal fin
    const dorsal = fin(0.2, 0.15, mat(0xe8b923, { roughness: 0.5 }), 'sail');
    dorsal.position.set(0, 0.05, -0.05);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    group.add(dorsal);

    // Coronet
    const crown = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.12, 5),
        col
    );
    crown.position.set(0, 0.62, 0.12);
    group.add(crown);

    group.scale.setScalar(1.3);
    return {
        group,
        mesh: head,
        animParts: [dorsal, ...segments.slice(0, 3)],
        size: 0.9,
        swimSpeed: 0.55,
        animMode: 'undulate',
    };
}

function buildSeaTurtle(): CreatureBuild {
    const group = new THREE.Group();
    // Green sea turtle — olive/amber carapace scutes, cream plastron, paddle flippers, beaked head
    const shellMat = mat(0x4a7030, {
        roughness: 0.58,
        metalness: 0.04,
        emissive: 0x1a3010,
        emissiveIntensity: 0.12,
    });
    const scuteOlive = mat(0x6a8c38, {
        roughness: 0.52,
        emissive: 0x284018,
        emissiveIntensity: 0.1,
    });
    const scuteAmber = mat(0x8a9a40, {
        roughness: 0.5,
        emissive: 0x3a4818,
        emissiveIntensity: 0.1,
    });
    const scuteDark = mat(0x3d5a28, { roughness: 0.55, emissive: 0x1a2810, emissiveIntensity: 0.08 });
    const skinMat = mat(0x8a9a58, { roughness: 0.55 });
    const skinDark = mat(0x6a7a40, { roughness: 0.58 });
    const plastronMat = mat(0xf0e4c4, { roughness: 0.72 });
    const beakMat = mat(0xc8b878, { roughness: 0.4, metalness: 0.08 });

    // Domed carapace base
    const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.64, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58),
        shellMat
    );
    shell.scale.set(1.22, 0.75, 1.38);
    shell.position.y = 0.14;
    shell.castShadow = true;
    shell.receiveShadow = true;
    group.add(shell);

    // Central vertebral scutes (5 hex plates along spine) — green turtle pattern
    const centralZ = [-0.42, -0.2, 0.02, 0.24, 0.44];
    for (let i = 0; i < 5; i++) {
        const plate = new THREE.Mesh(
            new THREE.CircleGeometry(0.15 - Math.abs(i - 2) * 0.012, 6),
            i % 2 === 0 ? scuteOlive : scuteAmber
        );
        plate.rotation.x = -Math.PI / 2 + 0.08;
        plate.position.set(0, 0.48 + Math.sin((i / 4) * Math.PI) * 0.04, centralZ[i]);
        plate.scale.set(1.05, 1.15, 1);
        group.add(plate);
        // Raised hex volume for depth
        const bump = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.13, 0.04, 6),
            i % 2 === 0 ? scuteDark : scuteOlive
        );
        bump.position.copy(plate.position);
        bump.position.y -= 0.02;
        bump.rotation.y = Math.PI / 6;
        group.add(bump);
    }

    // Costal (lateral) scutes — 4 each side
    for (let side = -1; side <= 1; side += 2) {
        for (let j = 0; j < 4; j++) {
            const z = -0.35 + j * 0.22;
            const plate = new THREE.Mesh(
                new THREE.CircleGeometry(0.13, 6),
                (j + (side > 0 ? 1 : 0)) % 2 === 0 ? scuteAmber : scuteOlive
            );
            plate.rotation.x = -Math.PI / 2 + 0.12;
            plate.rotation.z = side * 0.15;
            plate.position.set(side * 0.32, 0.4, z);
            group.add(plate);
            const bump = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.11, 0.035, 6),
                scuteDark
            );
            bump.position.set(side * 0.32, 0.38, z);
            bump.rotation.y = Math.PI / 6;
            group.add(bump);
        }
    }

    // Marginal scute ring along shell edge
    for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.1), scuteDark);
        m.position.set(Math.sin(ang) * 0.68, 0.18, Math.cos(ang) * 0.78);
        m.rotation.y = ang;
        m.rotation.x = 0.35;
        group.add(m);
    }

    // Cream plastron (undershell)
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), plastronMat);
    belly.scale.set(1.1, 0.32, 1.25);
    belly.position.y = -0.05;
    group.add(belly);
    // Plastron seam lines
    for (let i = 0; i < 3; i++) {
        const seam = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.01, 0.015),
            mat(0xd8c8a0, { roughness: 0.75 })
        );
        seam.position.set(0, -0.12, -0.25 + i * 0.22);
        group.add(seam);
    }

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.22, 10), skinMat);
    neck.rotation.x = Math.PI / 2;
    neck.position.set(0, 0.06, 0.72);
    group.add(neck);
    // Neck scale rings
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.11 - i * 0.01, 0.018, 6, 12),
            skinDark
        );
        ring.position.set(0, 0.06, 0.65 + i * 0.07);
        ring.rotation.y = Math.PI / 2;
        group.add(ring);
    }

    // Head with distinct green-turtle beak
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), skinMat);
    head.scale.set(0.95, 0.88, 1.25);
    head.position.set(0, 0.1, 0.95);
    group.add(head);
    // Prefrontal scales on snout
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.12), skinDark);
    brow.position.set(0, 0.2, 1.0);
    group.add(brow);
    // Beak (pointed upper jaw)
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 8), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.04, 1.18);
    group.add(beak);
    const lowerJaw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), beakMat);
    lowerJaw.scale.set(0.9, 0.5, 1.2);
    lowerJaw.position.set(0, 0.0, 1.12);
    group.add(lowerJaw);

    const eL = eye(0.042, 0.024);
    eL.position.set(0.12, 0.14, 1.05);
    const eR = eye(0.042, 0.024);
    eR.position.set(-0.12, 0.14, 1.05);
    group.add(eL, eR);

    // Paddle flippers — front much larger, tapered like real green turtle
    const flippers: THREE.Object3D[] = [];
    const makePaddle = (
        x: number,
        z: number,
        len: number,
        width: number,
        isFront: boolean
    ) => {
        const f = new THREE.Group();
        // Main paddle blade
        const blade = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), skinMat);
        blade.scale.set(width, 0.12, len);
        blade.castShadow = true;
        f.add(blade);
        // Leading edge darker scale strip
        const edge = new THREE.Mesh(new THREE.BoxGeometry(width * 0.15, 0.04, len * 0.7), skinDark);
        edge.position.set(x > 0 ? 0.06 : -0.06, 0.02, 0.05);
        f.add(edge);
        // Scale plates on flipper
        for (let s = 0; s < (isFront ? 4 : 3); s++) {
            const sc = new THREE.Mesh(
                new THREE.CircleGeometry(0.05, 5),
                skinDark
            );
            sc.rotation.x = -Math.PI / 2;
            sc.position.set(0, 0.06, -0.12 + s * 0.12);
            f.add(sc);
        }
        f.position.set(x, isFront ? 0.0 : -0.04, z);
        f.rotation.z = x > 0 ? -0.4 : 0.4;
        f.rotation.y = x > 0 ? 0.25 : -0.25;
        if (!isFront) f.rotation.x = 0.15;
        group.add(f);
        flippers.push(f);
        return f;
    };
    makePaddle(0.78, 0.22, 1.45, 0.55, true);
    makePaddle(-0.78, 0.22, 1.45, 0.55, true);
    makePaddle(0.52, -0.58, 0.95, 0.38, false);
    makePaddle(-0.52, -0.58, 0.95, 0.38, false);

    // Short tail stub
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 6), skinDark);
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, -0.02, -0.85);
    group.add(tail);

    group.scale.setScalar(1.65);
    return {
        group,
        mesh: shell,
        animParts: flippers,
        size: 2.1,
        swimSpeed: 1.0,
        animMode: 'glide',
    };
}

function buildOctopus(): CreatureBuild {
    const group = new THREE.Group();
    const skin = mat(0xb84c7a, { roughness: 0.45, emissive: 0x3a1028, emissiveIntensity: 0.15 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), skin);
    head.scale.set(1, 1.1, 1.15);
    head.position.y = 0.15;
    head.castShadow = true;
    group.add(head);

    // Mantle bump
    const mantle = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), skin);
    mantle.position.set(0, 0.35, -0.15);
    group.add(mantle);

    const eL = eye(0.07, 0.04);
    eL.position.set(0.18, 0.2, 0.28);
    const eR = eye(0.07, 0.04);
    eR.position.set(-0.18, 0.2, 0.28);
    group.add(eL, eR);

    const tentacles: THREE.Object3D[] = [];
    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const chain = new THREE.Group();
        let parent: THREE.Object3D = chain;
        for (let s = 0; s < 5; s++) {
            const seg = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 - s * 0.012, 8, 6),
                skin
            );
            seg.position.set(0, -0.12, 0.08);
            if (s === 0) {
                chain.position.set(Math.cos(ang) * 0.25, -0.15, Math.sin(ang) * 0.25);
            }
            parent.add(seg);
            parent = seg;
            // suckers
            if (s < 3) {
                const suck = new THREE.Mesh(
                    new THREE.CircleGeometry(0.03, 6),
                    mat(0x884466, { roughness: 0.6 })
                );
                suck.position.set(0, -0.05, 0.08);
                suck.rotation.x = Math.PI / 2;
                seg.add(suck);
            }
        }
        chain.userData.phase = i * 0.7;
        group.add(chain);
        tentacles.push(chain);
    }

    group.scale.setScalar(1.2);
    return {
        group,
        mesh: head,
        animParts: tentacles,
        size: 1.3,
        swimSpeed: 0.9,
        animMode: 'undulate',
    };
}

function buildManta(): CreatureBuild {
    const group = new THREE.Group();
    // Reef/manta ray — black dorsal, white ventral, huge wings, cephalic lobes, whip tail
    const top = mat(0x141c28, {
        roughness: 0.48,
        metalness: 0.1,
        emissive: 0x060c14,
        emissiveIntensity: 0.1,
    });
    const topSoft = mat(0x1e2838, { roughness: 0.5, metalness: 0.08 });
    const belly = mat(0xf4f7fa, { roughness: 0.62 });
    const bellyMark = mat(0xe8ecf0, { roughness: 0.65 });
    const darkEdge = mat(0x0c1218, { roughness: 0.55 });

    // Central disc body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 22, 16), top);
    body.scale.set(1.35, 0.28, 1.2);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // White ventral disc
    const bellyM = new THREE.Mesh(new THREE.SphereGeometry(0.44, 18, 14), belly);
    bellyM.scale.set(1.25, 0.18, 1.1);
    bellyM.position.y = -0.07;
    group.add(bellyM);

    // Classic manta white shoulder patches on belly (species-true)
    for (const sx of [-1, 1]) {
        const patch = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), bellyMark);
        patch.scale.set(0.9, 0.25, 1.1);
        patch.position.set(sx * 0.35, -0.09, 0.15);
        group.add(patch);
    }

    // Wing panels — multi-segment for diamond manta silhouette
    const makeWing = (side: number) => {
        const wing = new THREE.Group();
        // Inner wing plate
        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), top);
        inner.scale.set(1.35, 0.16, 0.95);
        inner.position.set(side * 0.85, 0.01, -0.05);
        inner.rotation.z = side * 0.08;
        inner.castShadow = true;
        wing.add(inner);
        // Mid wing
        const mid = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), topSoft);
        mid.scale.set(1.2, 0.14, 0.75);
        mid.position.set(side * 1.45, 0.04, -0.08);
        mid.rotation.z = side * 0.18;
        wing.add(mid);
        // White underside of wing
        const wBelly = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 8), belly);
        wBelly.scale.set(1.3, 0.1, 0.85);
        wBelly.position.set(side * 0.95, -0.05, -0.05);
        wing.add(wBelly);
        // Leading edge dark rim
        const lead = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.08), darkEdge);
        lead.position.set(side * 1.0, 0.02, 0.35);
        lead.rotation.y = side * -0.2;
        lead.rotation.z = side * 0.1;
        wing.add(lead);
        group.add(wing);
        return wing;
    };
    makeWing(1);
    makeWing(-1);

    // Wing tips — curved slightly UP for classic manta silhouette against water
    const tipL = new THREE.Group();
    const tipMeshL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), top);
    tipMeshL.scale.set(1.15, 0.14, 0.5);
    tipMeshL.castShadow = true;
    tipL.add(tipMeshL);
    const tipCurlL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), darkEdge);
    tipCurlL.scale.set(0.7, 0.35, 0.9);
    tipCurlL.position.set(0.12, 0.08, -0.05);
    tipL.add(tipCurlL);
    tipL.position.set(1.95, 0.12, -0.12);
    tipL.rotation.z = 0.35; // tip up
    tipL.rotation.y = -0.15;

    const tipR = new THREE.Group();
    const tipMeshR = tipMeshL.clone();
    tipR.add(tipMeshR);
    const tipCurlR = tipCurlL.clone();
    tipCurlR.position.x = -0.12;
    tipR.add(tipCurlR);
    tipR.position.set(-1.95, 0.12, -0.12);
    tipR.rotation.z = -0.35;
    tipR.rotation.y = 0.15;
    group.add(tipL, tipR);

    // Cephalic lobes (horn-like, rollable feeding lobes)
    const makeLobe = (side: number) => {
        const lobe = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.28, 8), top);
        base.rotation.x = Math.PI / 2;
        base.position.set(0, 0, 0.1);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), topSoft);
        tip.scale.set(0.7, 0.9, 1.3);
        tip.position.set(0, -0.02, 0.28);
        // Slight inward curl
        const curl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), darkEdge);
        curl.position.set(side * -0.04, -0.04, 0.32);
        lobe.add(base, tip, curl);
        lobe.position.set(side * 0.38, -0.02, 0.72);
        lobe.rotation.x = 0.35;
        lobe.rotation.z = side * 0.25;
        lobe.rotation.y = side * -0.2;
        group.add(lobe);
        return lobe;
    };
    const lobeL = makeLobe(1);
    const lobeR = makeLobe(-1);

    // Head / mouth region
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), top);
    head.scale.set(1.1, 0.45, 0.85);
    head.position.set(0, 0, 0.55);
    group.add(head);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.08), belly);
    mouth.position.set(0, -0.06, 0.72);
    group.add(mouth);

    // Thin whip tail (manta has long filamentous tail, no spine barb like stingray)
    const tailBase = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 8), top);
    tailBase.rotation.x = -Math.PI / 2;
    tailBase.position.set(0, 0, -0.7);
    group.add(tailBase);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.008, 1.55, 6), top);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, -0.02, -1.45);
    group.add(tail);
    // Tiny dorsal finlet at tail base
    const finlet = fin(0.1, 0.08, top, 'triangle');
    finlet.position.set(0, 0.08, -0.75);
    finlet.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    finlet.scale.setScalar(0.6);
    group.add(finlet);

    // Eyes on sides of head
    const eL = eye(0.04, 0.02);
    eL.position.set(0.32, 0.06, 0.55);
    eL.scale.setScalar(0.9);
    const eR = eye(0.04, 0.02);
    eR.position.set(-0.32, 0.06, 0.55);
    eR.scale.setScalar(0.9);
    group.add(eL, eR);

    // Subtle gill slits on ventral (5 each side — filter feeder cue)
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 5; i++) {
            const g = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.008, 0.015),
                mat(0xc8d0d8, { roughness: 0.7 })
            );
            g.position.set(side * (0.15 + i * 0.02), -0.11, 0.2 - i * 0.08);
            group.add(g);
        }
    }

    group.scale.setScalar(1.85);
    return {
        group,
        mesh: body,
        animParts: [tipL, tipR, lobeL, lobeR],
        size: 3.2,
        swimSpeed: 1.4,
        animMode: 'glide',
    };
}

function buildLanternfish(): CreatureBuild {
    const group = new THREE.Group();
    const bodyMat = mat(0x3a4a5c, {
        roughness: 0.4,
        metalness: 0.2,
        emissive: 0x113344,
        emissiveIntensity: 0.2,
    });
    const body = fishBody(0.9, 0.28, 0.22, bodyMat);
    group.add(body);

    // Photophores (light organs)
    for (let i = 0; i < 6; i++) {
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 6, 6),
            mat(0xaaffff, {
                emissive: 0x66ffff,
                emissiveIntensity: 1.2,
                roughness: 0.2,
            })
        );
        light.position.set(0.08, -0.06, 0.25 - i * 0.1);
        group.add(light);
        const light2 = light.clone();
        light2.position.x = -0.08;
        group.add(light2);
    }

    const glow = new THREE.PointLight(0x66ffff, 0.6, 3);
    glow.position.set(0, 0, 0.2);
    group.add(glow);

    const tail = fin(0.22, 0.2, bodyMat, 'fork');
    tail.position.set(0, 0, -0.45);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const eL = eye(0.045, 0.025);
    eL.position.set(0.08, 0.04, 0.35);
    const eR = eye(0.045, 0.025);
    eR.position.set(-0.08, 0.04, 0.35);
    group.add(eL, eR);

    group.scale.setScalar(0.95);
    return {
        group,
        mesh: body,
        animParts: [tail],
        size: 0.7,
        swimSpeed: 1.6,
        animMode: 'fish',
    };
}

function buildCleanerShrimp(): CreatureBuild {
    const group = new THREE.Group();
    const map = stripeTexture('#f5f5f5', '#c0392b', 6, false);
    const bodyMat = mat(0xf5f5f5, { map, roughness: 0.45 });

    // Elongated abdomen segments
    for (let i = 0; i < 5; i++) {
        const seg = new THREE.Mesh(
            new THREE.SphereGeometry(0.1 - i * 0.008, 10, 8),
            bodyMat
        );
        seg.scale.set(0.7, 0.7, 1.1);
        seg.position.set(0, 0, 0.25 - i * 0.14);
        group.add(seg);
    }

    // Head / carapace
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), bodyMat);
    head.position.set(0, 0.04, 0.4);
    group.add(head);

    // Long antennae
    const antMat = mat(0xffffff, { roughness: 0.4 });
    const antL = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.008, 0.7, 4), antMat);
    antL.rotation.z = 0.6;
    antL.rotation.x = 0.5;
    antL.position.set(0.08, 0.25, 0.55);
    const antR = antL.clone();
    antR.rotation.z = -0.6;
    antR.position.x = -0.08;
    group.add(antL, antR);

    // Eyes on stalks
    const stalkL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), bodyMat);
    stalkL.position.set(0.08, 0.14, 0.48);
    const stalkR = stalkL.clone();
    stalkR.position.x = -0.08;
    group.add(stalkL, stalkR);
    const eL = eye(0.035, 0.02);
    eL.position.set(0.08, 0.2, 0.48);
    const eR = eye(0.035, 0.02);
    eR.position.set(-0.08, 0.2, 0.48);
    group.add(eL, eR);

    // Walking legs
    const legs: THREE.Object3D[] = [];
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.01, 0.2, 4),
            bodyMat
        );
        leg.position.set(0.1, -0.12, 0.3 - i * 0.1);
        leg.rotation.z = 0.8;
        group.add(leg);
        legs.push(leg);
        const leg2 = leg.clone();
        leg2.position.x = -0.1;
        leg2.rotation.z = -0.8;
        group.add(leg2);
        legs.push(leg2);
    }

    // Tail fan
    const fan = fin(0.15, 0.18, bodyMat, 'round');
    fan.position.set(0, 0, -0.4);
    fan.rotation.y = Math.PI / 2;
    group.add(fan);

    group.scale.setScalar(0.85);
    return {
        group,
        mesh: head,
        animParts: [antL, antR, ...legs, fan],
        size: 0.5,
        swimSpeed: 0.8,
        animMode: 'undulate',
    };
}

function buildGiantSquid(): CreatureBuild {
    const group = new THREE.Group();
    const skin = mat(0x8b4513, { roughness: 0.5, emissive: 0x221100, emissiveIntensity: 0.1 });
    const pale = mat(0xc4a574, { roughness: 0.55 });

    // Mantle
    const mantle = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 1.8, 14),
        skin
    );
    mantle.rotation.x = Math.PI;
    mantle.position.set(0, 0, -0.2);
    mantle.castShadow = true;
    group.add(mantle);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), pale);
    head.position.set(0, 0, 0.7);
    group.add(head);

    // Huge eyes
    const eL = eye(0.12, 0.07);
    eL.position.set(0.2, 0.05, 0.75);
    const eR = eye(0.12, 0.07);
    eR.position.set(-0.2, 0.05, 0.75);
    group.add(eL, eR);

    // Fins on mantle
    const finL = fin(0.4, 0.25, skin, 'triangle');
    finL.position.set(0.3, 0, -0.5);
    finL.rotation.y = Math.PI / 2;
    const finR = finL.clone();
    finR.position.x = -0.3;
    group.add(finL, finR);

    const arms: THREE.Object3D[] = [];
    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.015, 1.4, 6),
            pale
        );
        arm.position.set(Math.cos(ang) * 0.15, Math.sin(ang) * 0.15, 1.3);
        arm.rotation.x = Math.PI / 2;
        arm.userData.phase = i;
        group.add(arm);
        arms.push(arm);
    }
    // Two long feeding tentacles
    for (let i = 0; i < 2; i++) {
        const t = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.02, 2.2, 6),
            pale
        );
        t.position.set(i === 0 ? 0.08 : -0.08, 0, 1.5);
        t.rotation.x = Math.PI / 2;
        t.userData.phase = i + 10;
        group.add(t);
        arms.push(t);
    }

    group.scale.setScalar(1.3);
    return {
        group,
        mesh: mantle,
        animParts: [...arms, finL, finR],
        size: 2.0,
        swimSpeed: 1.3,
        animMode: 'undulate',
    };
}

/** Map species id → builder */
const BUILDERS: Record<string, () => CreatureBuild> = {
    clownfish: buildClownfish,
    angelfish: buildAngelfish,
    jellyfish: buildJellyfish,
    shark: buildShark,
    reef_shark: buildShark,
    seahorse: buildSeahorse,
    seaturtle: buildSeaTurtle,
    sea_turtle: buildSeaTurtle,
    octopus: buildOctopus,
    manta: buildManta,
    manta_ray: buildManta,
    parrotfish: buildParrotfish,
    blue_tang: buildBlueTang,
    lanternfish: buildLanternfish,
    cleaner_shrimp: buildCleanerShrimp,
    giant_squid: buildGiantSquid,
};

/** Scale / swim / anim per species when using GLB */
const GLB_META: Record<
    string,
    { scale: number; swimSpeed: number; animMode: CreatureBuild['animMode']; tint?: number; emis?: number; emisI?: number }
> = {
    clownfish: { scale: 1.05, swimSpeed: 1.5, animMode: 'fish', tint: 0xff7722, emis: 0x331100, emisI: 0.12 },
    angelfish: { scale: 1.15, swimSpeed: 1.2, animMode: 'fish', tint: 0x4488ff, emis: 0x001144, emisI: 0.12 },
    blue_tang: { scale: 1.1, swimSpeed: 1.35, animMode: 'fish', tint: 0x1e90ff, emis: 0x002255, emisI: 0.15 },
    parrotfish: { scale: 1.25, swimSpeed: 1.1, animMode: 'fish', tint: 0x3dcc7a, emis: 0x113311, emisI: 0.1 },
    shark: { scale: 2.0, swimSpeed: 2.2, animMode: 'fish', tint: 0x7a8490 },
    reef_shark: { scale: 2.0, swimSpeed: 2.2, animMode: 'fish', tint: 0x7a8490 },
    lanternfish: { scale: 0.75, swimSpeed: 1.6, animMode: 'fish', tint: 0x4a5a6c, emis: 0x226666, emisI: 0.5 },
    goldfish: { scale: 1.0, swimSpeed: 1.4, animMode: 'fish' },
    butterfly_fish: { scale: 1.1, swimSpeed: 1.3, animMode: 'fish' },
    mandarin_fish: { scale: 1.05, swimSpeed: 1.25, animMode: 'fish' },
    barramundi: { scale: 1.3, swimSpeed: 1.5, animMode: 'fish' },
    jellyfish: { scale: 1.2, swimSpeed: 0.7, animMode: 'pulse' },
    seahorse: { scale: 0.95, swimSpeed: 0.55, animMode: 'undulate' },
    seaturtle: { scale: 1.6, swimSpeed: 1.0, animMode: 'glide' },
    octopus: { scale: 1.3, swimSpeed: 0.9, animMode: 'undulate' },
    manta: { scale: 2.2, swimSpeed: 1.4, animMode: 'glide' },
    cleaner_shrimp: { scale: 0.7, swimSpeed: 0.8, animMode: 'undulate' },
    giant_squid: { scale: 1.8, swimSpeed: 1.3, animMode: 'undulate' },
};

/**
 * Prefer species-true procedural builders (readable markings).
 * Use exact GLB only when present and species is not a “must read” hero.
 * Never use barramundi tint as a wrong species.
 */
export function buildCreature(speciesId: string): CreatureBuild {
    const key = speciesId.toLowerCase().replace(/\s+/g, '_');
    const meta = GLB_META[key] || {
        scale: 1.1,
        swimSpeed: 1.3,
        animMode: 'fish' as const,
    };

    // Always use procedural for key gift species (clear silhouette/pattern)
    const preferProcedural = new Set([
        'clownfish',
        'blue_tang',
        'angelfish',
        'parrotfish',
        'butterfly_fish',
        'mandarin_fish',
        'shark',
        'reef_shark',
        'seaturtle',
        'sea_turtle',
        'manta',
        'manta_ray',
        'jellyfish',
        'octopus',
        'seahorse',
        'lanternfish',
        'cleaner_shrimp',
        'giant_squid',
    ]);

    if (!preferProcedural.has(key)) {
        const lib = AssetLibrary.get();
        const group = lib.cloneCreature(key, {
            scale: meta.scale,
            tint: meta.tint,
            emissive: meta.emis,
            emisI: meta.emisI,
        });

        if (group) {
            let mesh: THREE.Mesh | null = null;
            group.traverse((c) => {
                if (!mesh && (c as THREE.Mesh).isMesh) mesh = c as THREE.Mesh;
            });
            group.name = `creature_${speciesId}_glb`;
            group.userData.speciesId = speciesId;
            group.userData.art = 'hero_glb';
            return {
                group,
                mesh: mesh || new THREE.Mesh(),
                animParts: [group],
                size: meta.scale,
                swimSpeed: meta.swimSpeed,
                animMode: meta.animMode,
            };
        }
    }

    const builder = BUILDERS[key] || BUILDERS[speciesId] || buildClownfish;
    const result = builder();
    result.group.name = `creature_${speciesId}`;
    result.group.userData.speciesId = speciesId;
    result.group.userData.art = 'procedural';
    result.group.traverse((c) => {
        if (c instanceof THREE.Mesh) {
            c.castShadow = true;
            c.receiveShadow = true;
        }
    });
    return result;
}

export function getKnownSpeciesIds(): string[] {
    return Object.keys(BUILDERS);
}

/**
 * Animate creature parts each frame.
 */
export function animateCreature(
    build: { animParts: THREE.Object3D[]; animMode: string; group: THREE.Group },
    phase: number,
    delta: number
): void {
    const mode = build.animMode;
    if (mode === 'fish') {
        build.animParts.forEach((p, i) => {
            if (!p) return;
            // Tail wag strongest on first part
            const amp = i === 0 ? 0.45 : 0.15;
            p.rotation.y = Math.sin(phase + i * 0.5) * amp;
        });
    } else if (mode === 'pulse') {
        const s = 1 + Math.sin(phase * 2) * 0.08;
        build.group.scale.setScalar((build.group.userData.baseScale as number) || 1);
        if (!build.group.userData.baseScale) {
            build.group.userData.baseScale = build.group.scale.x;
        }
        const b = build.group.userData.baseScale as number;
        build.group.scale.setScalar(b * s);
        build.animParts.forEach((p) => {
            if (p.userData.phase != null) {
                p.rotation.x = Math.sin(phase * 2 + p.userData.phase) * 0.2;
                p.position.y =
                    (p.userData.baseY ?? p.position.y) +
                    Math.sin(phase * 3 + p.userData.phase) * 0.03;
            }
        });
    } else if (mode === 'glide') {
        build.animParts.forEach((p, i) => {
            p.rotation.z = Math.sin(phase * 0.8 + i) * 0.25;
            p.rotation.x = Math.sin(phase * 0.6 + i * 0.3) * 0.1;
        });
    } else if (mode === 'undulate') {
        build.animParts.forEach((p, i) => {
            p.rotation.x = Math.sin(phase * 1.5 + i * 0.6) * 0.35;
            p.rotation.z = Math.cos(phase + i * 0.4) * 0.2;
        });
    }
}
