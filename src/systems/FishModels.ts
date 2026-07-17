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
    const map = clownfishTexture();
    const bodyMat = mat(0xff6a00, { map, roughness: 0.45, emissive: 0x331100, emissiveIntensity: 0.15 });
    const body = fishBody(1.1, 0.55, 0.38, bodyMat);
    group.add(body);

    const finMat = mat(0xff7a10, { roughness: 0.5, map });
    const tail = fin(0.35, 0.45, finMat, 'fork');
    tail.position.set(0, 0, -0.55);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const dorsal = fin(0.4, 0.28, finMat, 'sail');
    dorsal.position.set(0, 0.22, 0.05);
    dorsal.rotation.x = -Math.PI / 2;
    dorsal.rotation.z = Math.PI / 2;
    group.add(dorsal);

    const pecL = fin(0.22, 0.16, finMat, 'round');
    pecL.position.set(0.2, 0, 0.15);
    pecL.rotation.y = Math.PI / 2;
    pecL.rotation.z = 0.4;
    const pecR = pecL.clone();
    pecR.position.x = -0.2;
    pecR.rotation.z = -0.4;
    group.add(pecL, pecR);

    const eL = eye(0.055, 0.03);
    eL.position.set(0.12, 0.06, 0.42);
    const eR = eye(0.055, 0.03);
    eR.position.set(-0.12, 0.06, 0.42);
    group.add(eL, eR);

    // Mouth bump
    const mouth = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        mat(0x222222, { roughness: 0.8 })
    );
    mouth.position.set(0, -0.05, 0.52);
    mouth.scale.set(1, 0.6, 0.5);
    group.add(mouth);

    group.scale.setScalar(1.15);
    return {
        group,
        mesh: body,
        animParts: [tail, pecL, pecR, dorsal],
        size: 1.0,
        swimSpeed: 1.5,
        animMode: 'fish',
    };
}

function buildAngelfish(): CreatureBuild {
    const group = new THREE.Group();
    const map = stripeTexture('#1a4cff', '#ffd700', 5, false);
    const bodyMat = mat(0x1a6cff, { map, roughness: 0.4, emissive: 0x001133, emissiveIntensity: 0.2 });
    // Tall disc body
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 20, 16),
        bodyMat
    );
    body.scale.set(0.35, 1.15, 0.95);
    body.castShadow = true;
    group.add(body);

    const finMat = mat(0x2a7cff, { map, roughness: 0.45 });
    const dorsal = fin(0.55, 0.7, finMat, 'sail');
    dorsal.position.set(0, 0.55, 0);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    group.add(dorsal);

    const anal = fin(0.45, 0.55, finMat, 'sail');
    anal.position.set(0, -0.5, 0);
    anal.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    group.add(anal);

    const tail = fin(0.4, 0.55, finMat, 'fork');
    tail.position.set(0, 0, -0.55);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const eL = eye(0.05, 0.028);
    eL.position.set(0.12, 0.08, 0.32);
    const eR = eye(0.05, 0.028);
    eR.position.set(-0.12, 0.08, 0.32);
    group.add(eL, eR);

    group.scale.setScalar(1.2);
    return {
        group,
        mesh: body,
        animParts: [tail, dorsal, anal],
        size: 1.2,
        swimSpeed: 1.2,
        animMode: 'fish',
    };
}

function buildBlueTang(): CreatureBuild {
    const group = new THREE.Group();
    const map = blueTangTexture();
    const bodyMat = mat(0x1e90ff, { map, roughness: 0.4, emissive: 0x002244, emissiveIntensity: 0.25 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), bodyMat);
    body.scale.set(0.32, 1.0, 1.1);
    body.castShadow = true;
    group.add(body);

    const yellow = mat(0xffcc00, { roughness: 0.45, emissive: 0x553300, emissiveIntensity: 0.2 });
    const tail = fin(0.38, 0.42, yellow, 'fork');
    tail.position.set(0, 0, -0.55);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const dorsal = fin(0.5, 0.35, mat(0x1e90ff, { map }), 'sail');
    dorsal.position.set(0, 0.4, 0.05);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    group.add(dorsal);

    // Surgeon spine hint
    const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.08, 0.12),
        mat(0xffee88, { roughness: 0.3 })
    );
    spine.position.set(0.12, 0, -0.35);
    group.add(spine);

    const eL = eye(0.045, 0.025);
    eL.position.set(0.11, 0.1, 0.35);
    const eR = eye(0.045, 0.025);
    eR.position.set(-0.11, 0.1, 0.35);
    group.add(eL, eR);

    group.scale.setScalar(1.15);
    return {
        group,
        mesh: body,
        animParts: [tail, dorsal],
        size: 1.1,
        swimSpeed: 1.35,
        animMode: 'fish',
    };
}

function buildParrotfish(): CreatureBuild {
    const group = new THREE.Group();
    const map = parrotfishTexture();
    const bodyMat = mat(0x2ecc71, { map, roughness: 0.5, emissive: 0x113311, emissiveIntensity: 0.12 });
    const body = fishBody(1.4, 0.55, 0.48, bodyMat);
    group.add(body);

    // Beak
    const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.22, 8),
        mat(0xf5d76e, { roughness: 0.35, metalness: 0.15 })
    );
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.02, 0.62);
    group.add(beak);

    const finMat = mat(0x9b59b6, { map, roughness: 0.5 });
    const tail = fin(0.4, 0.4, finMat, 'round');
    tail.position.set(0, 0, -0.7);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const dorsal = fin(0.55, 0.25, finMat, 'sail');
    dorsal.position.set(0, 0.28, 0);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    group.add(dorsal);

    const eL = eye(0.05, 0.028);
    eL.position.set(0.16, 0.08, 0.4);
    const eR = eye(0.05, 0.028);
    eR.position.set(-0.16, 0.08, 0.4);
    group.add(eL, eR);

    group.scale.setScalar(1.25);
    return {
        group,
        mesh: body,
        animParts: [tail, dorsal],
        size: 1.3,
        swimSpeed: 1.1,
        animMode: 'fish',
    };
}

function buildShark(): CreatureBuild {
    const group = new THREE.Group();
    const bodyMat = mat(0x6a7580, { roughness: 0.65, metalness: 0.15 });
    const bellyMat = mat(0xd8dde2, { roughness: 0.7 });

    const body = fishBody(2.4, 0.55, 0.5, bodyMat);
    group.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), bellyMat);
    belly.scale.set(0.7, 0.45, 1.6);
    belly.position.set(0, -0.12, 0.1);
    group.add(belly);

    // Dorsal fin (classic triangle)
    const dorsal = fin(0.45, 0.55, bodyMat, 'triangle');
    dorsal.position.set(0, 0.35, 0.1);
    dorsal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    group.add(dorsal);

    // Heterocercal tail
    const tail = fin(0.55, 0.7, bodyMat, 'fork');
    tail.position.set(0, 0.05, -1.15);
    tail.rotation.y = Math.PI / 2;
    tail.scale.set(1, 1.2, 1);
    group.add(tail);

    // Pectorals
    const pec = fin(0.5, 0.22, bodyMat, 'triangle');
    const pecL = pec.clone();
    pecL.position.set(0.28, -0.05, 0.2);
    pecL.rotation.set(0.3, Math.PI / 2, 0.5);
    const pecR = pec.clone();
    pecR.position.set(-0.28, -0.05, 0.2);
    pecR.rotation.set(-0.3, Math.PI / 2, -0.5);
    group.add(pecL, pecR);

    // Snout
    const snout = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.45, 10),
        bodyMat
    );
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0, 1.15);
    group.add(snout);

    const eL = eye(0.04, 0.022);
    eL.position.set(0.16, 0.06, 0.85);
    const eR = eye(0.04, 0.022);
    eR.position.set(-0.16, 0.06, 0.85);
    group.add(eL, eR);

    // Gills
    for (let i = 0; i < 4; i++) {
        const gill = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.12, 0.02),
            mat(0x333840, { roughness: 0.8 })
        );
        gill.position.set(0.22, 0, 0.55 - i * 0.08);
        group.add(gill);
        const gill2 = gill.clone();
        gill2.position.x = -0.22;
        group.add(gill2);
    }

    group.scale.setScalar(1.4);
    return {
        group,
        mesh: body,
        animParts: [tail, pecL, pecR, dorsal],
        size: 2.2,
        swimSpeed: 2.2,
        animMode: 'fish',
    };
}

function buildJellyfish(): CreatureBuild {
    const group = new THREE.Group();
    const bellMat = mat(0xff99cc, {
        roughness: 0.2,
        metalness: 0.05,
        transparent: true,
        opacity: 0.55,
        emissive: 0xff44aa,
        emissiveIntensity: 0.35,
    });
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), bellMat);
    bell.scale.set(1, 0.7, 1);
    group.add(bell);

    const inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        mat(0xff66bb, { transparent: true, opacity: 0.7, emissive: 0xff2288, emissiveIntensity: 0.5 })
    );
    inner.position.y = -0.05;
    group.add(inner);

    const tentacles: THREE.Object3D[] = [];
    const tentMat = mat(0xffaadd, {
        transparent: true,
        opacity: 0.65,
        emissive: 0xff66aa,
        emissiveIntensity: 0.25,
    });
    for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const tent = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.01, 1.2, 6),
            tentMat
        );
        tent.position.set(Math.cos(ang) * 0.28, -0.7, Math.sin(ang) * 0.28);
        tent.userData.baseY = tent.position.y;
        tent.userData.phase = i * 0.4;
        group.add(tent);
        tentacles.push(tent);
    }

    // Oral arms (thicker center)
    for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + 0.2;
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.02, 0.7, 6),
            mat(0xff77bb, { transparent: true, opacity: 0.7, emissive: 0xff3399, emissiveIntensity: 0.3 })
        );
        arm.position.set(Math.cos(ang) * 0.1, -0.45, Math.sin(ang) * 0.1);
        arm.userData.phase = i;
        group.add(arm);
        tentacles.push(arm);
    }

    group.scale.setScalar(1.1);
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
    const shellMat = mat(0x3d5c3a, { roughness: 0.7, metalness: 0.05 });
    const plateMat = mat(0x5a7a40, { roughness: 0.65 });
    const skinMat = mat(0x6b8f5e, { roughness: 0.6 });

    // Domed shell
    const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
        shellMat
    );
    shell.scale.set(1.1, 0.65, 1.25);
    shell.position.y = 0.1;
    shell.castShadow = true;
    group.add(shell);

    // Scute pattern (plates)
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            const plate = new THREE.Mesh(
                new THREE.CircleGeometry(0.12, 6),
                plateMat
            );
            plate.rotation.x = -Math.PI / 2;
            plate.position.set((i - 2) * 0.18, 0.38, (j - 1) * 0.22);
            plate.position.y += 0.05;
            group.add(plate);
        }
    }

    // Plastron
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 10),
        mat(0xc4b896, { roughness: 0.75 })
    );
    belly.scale.set(1.0, 0.35, 1.15);
    belly.position.y = -0.05;
    group.add(belly);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skinMat);
    head.scale.set(0.9, 0.85, 1.3);
    head.position.set(0, 0.05, 0.7);
    group.add(head);

    const eL = eye(0.035, 0.02);
    eL.position.set(0.1, 0.1, 0.85);
    const eR = eye(0.035, 0.02);
    eR.position.set(-0.1, 0.1, 0.85);
    group.add(eL, eR);

    // Flippers
    const flippers: THREE.Object3D[] = [];
    const makeFlipper = (x: number, z: number, scale: number) => {
        const f = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 12, 8),
            skinMat
        );
        f.scale.set(scale * 0.35, 0.12, scale);
        f.position.set(x, -0.02, z);
        f.rotation.z = x > 0 ? -0.4 : 0.4;
        group.add(f);
        flippers.push(f);
        return f;
    };
    makeFlipper(0.55, 0.25, 1.1);
    makeFlipper(-0.55, 0.25, 1.1);
    makeFlipper(0.4, -0.45, 0.7);
    makeFlipper(-0.4, -0.45, 0.7);

    group.scale.setScalar(1.5);
    return {
        group,
        mesh: shell,
        animParts: flippers,
        size: 1.8,
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
    const top = mat(0x2c3e50, { roughness: 0.55, metalness: 0.08 });
    const belly = mat(0xecf0f1, { roughness: 0.65 });

    // Wide wing body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), top);
    body.scale.set(2.4, 0.25, 1.1);
    body.castShadow = true;
    group.add(body);

    const bellyM = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), belly);
    bellyM.scale.set(2.2, 0.18, 1.0);
    bellyM.position.y = -0.06;
    group.add(bellyM);

    // Cephalic fins
    const lobeL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), top);
    lobeL.rotation.x = Math.PI / 2;
    lobeL.position.set(0.35, 0, 0.65);
    const lobeR = lobeL.clone();
    lobeR.position.x = -0.35;
    group.add(lobeL, lobeR);

    // Wings tips
    const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), top);
    tipL.scale.set(0.8, 0.2, 0.5);
    tipL.position.set(1.3, 0, 0);
    const tipR = tipL.clone();
    tipR.position.x = -1.3;
    group.add(tipL, tipR);

    // Tail whip
    const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.01, 1.2, 6),
        top
    );
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0, -0.9);
    group.add(tail);

    const eL = eye(0.04, 0.02);
    eL.position.set(0.25, 0.08, 0.45);
    const eR = eye(0.04, 0.02);
    eR.position.set(-0.25, 0.08, 0.45);
    group.add(eL, eR);

    group.scale.setScalar(1.6);
    return {
        group,
        mesh: body,
        animParts: [tipL, tipR, lobeL, lobeR],
        size: 2.5,
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
 * Prefer per-species GLB from AssetLibrary; procedural only as last resort.
 */
export function buildCreature(speciesId: string): CreatureBuild {
    const key = speciesId.toLowerCase().replace(/\s+/g, '_');
    const meta = GLB_META[key] || {
        scale: 1.1,
        swimSpeed: 1.3,
        animMode: 'fish' as const,
    };

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
