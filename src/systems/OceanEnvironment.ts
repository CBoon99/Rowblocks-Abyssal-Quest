import * as THREE from 'three';
import { REEF_ZONES, randomInReef, type ReefZone } from './WorldMap';
import { AssetLibrary } from './AssetLibrary';

/**
 * Reef props ONLY on discrete reef islands — open water stays clear (deep blue).
 */
export class OceanEnvironment {
    private root: THREE.Group;
    private kelpBlades: Array<{
        mesh: THREE.Object3D;
        phase: number;
        speed: number;
        amp: number;
        baseRotZ: number;
        baseRotX: number;
    }> = [];
    private godRays: THREE.Mesh[] = [];
    private time = 0;

    constructor(private scene: THREE.Scene) {
        this.root = new THREE.Group();
        this.root.name = 'OceanEnvironment';
        this.scene.add(this.root);
    }

    /**
     * @param _shelfY ignored — each reef has its own shelfY from WorldMap
     * @param _shelfRadius ignored — use REEF_ZONES
     */
    build(_shelfY: number = -2.5, _shelfRadius: number = 25): void {
        // Clear previous
        while (this.root.children.length) {
            this.root.remove(this.root.children[0]);
        }
        this.kelpBlades = [];
        this.godRays = [];

        const qc =
            typeof window !== 'undefined' ? (window as any).qualityConfig : null;
        const rockF = qc?.rockFactor ?? 1;
        const coralF = qc?.coralFactor ?? 1;
        const kelpF = qc?.kelpFactor ?? 1;

        for (const reef of REEF_ZONES) {
            // Home reef = densest "wow" pocket; others lighter
            // Mock plate #1: denser, colourful reefs (home + wreck especially)
            const scale =
                reef.id === 'home_reef'
                    ? 2.1
                    : reef.id === 'east_garden'
                      ? 1.45
                      : reef.id === 'wreck_cove'
                        ? 1.5
                        : 1.0;
            this.createRocks(reef, Math.floor(14 * rockF * scale));
            this.createCoral(reef, Math.floor(22 * coralF * scale));
            this.createKelp(reef, Math.floor(16 * kelpF * scale));
            if (reef.id === 'home_reef') {
                this.createHeroAnemoneGarden(reef);
                // Stronger god rays on home (still soft — no white-out); scale with rockF as light-fx proxy
                this.createGodRays(reef, Math.max(6, Math.floor(10 * rockF)), 0.055);
                this.createSandPathMarkers(reef);
                this.createPathFramingCoral(reef, coralF); // Pass 1: dense sides of swim lane
            } else if (reef.id === 'east_garden') {
                this.createGodRays(reef, Math.max(2, Math.floor(3 * rockF)));
            } else if (reef.id === 'wreck_cove') {
                this.createGodRays(reef, Math.max(2, Math.floor(3 * rockF)));
                this.createShipWreck(reef);
            }
        }
        // Always place a readable wreck near home for mock composition (if no wreck_cove trip yet)
        const home = REEF_ZONES.find((r) => r.id === 'home_reef');
        if (home) this.createDistantWreckLandmark(home);
        console.log(
            `🏝️ OceanEnvironment: mock-plate denser reefs on ${REEF_ZONES.length} zones`
        );
    }

    /** Bright multicolour coral palette — mock plate */
    private coralPalette(): number[] {
        // Punchier jewel colours — read against navy water (Memory Pass)
        return [
            0xff2d7a, 0xff4d9a, 0xd42bff, 0x8b3dff, 0xff7a1a, 0xff3d6b,
            0x22d44a, 0x00e89a, 0xff5c2e, 0xffb020, 0x6a3dff, 0xff1a6e,
        ];
    }

    /**
     * Pass 1: dense colourful coral walls framing the sandy corridor
     * (mock plate left/right garden). Density scales with quality coralFactor.
     */
    private createPathFramingCoral(reef: ReefZone, coralFactor: number = 1): void {
        const colors = this.coralPalette();
        const sides = [-1, 1];
        // Slight density bump vs baseline 18 — still iPad-safe; multiply by quality
        const perSide = Math.max(10, Math.floor(22 * coralFactor));
        const step = 20 / Math.max(1, perSide - 1); // span ~20m along +Z
        for (const side of sides) {
            for (let i = 0; i < perSide; i++) {
                const z = reef.z + 0.4 + i * step;
                // Stagger depth so walls read as gardens, not a single fence line
                const depthJitter = (i % 2 === 0 ? 0.35 : -0.15) + Math.random() * 0.4;
                const x =
                    reef.x +
                    side * (4.4 + (i % 3) * 0.7 + Math.random() * 0.4 + depthJitter);
                const color = colors[(i + (side > 0 ? 4 : 0)) % colors.length];
                // Punchier emissive so gardens read against navy water
                const mat = new THREE.MeshStandardMaterial({
                    color,
                    roughness: 0.48,
                    metalness: 0.07,
                    emissive: new THREE.Color(color).multiplyScalar(0.36),
                    flatShading: true,
                });
                const y = reef.shelfY + 0.05;
                if (i % 3 === 0) this.addBranchingCoral(x, y, z, mat);
                else if (i % 3 === 1) this.addBoulderCoral(x, y, z, mat);
                else this.addPlateCoral(x, y, z, mat);
                const last = this.root.children[this.root.children.length - 1];
                if (last) last.scale.multiplyScalar(1.35 + (i % 4) * 0.06);
                // Occasional secondary accent coral slightly inward for garden depth
                if (i % 4 === 1) {
                    const accentColor = colors[(i + 5) % colors.length];
                    const accentMat = new THREE.MeshStandardMaterial({
                        color: accentColor,
                        roughness: 0.5,
                        metalness: 0.06,
                        emissive: new THREE.Color(accentColor).multiplyScalar(0.32),
                        flatShading: true,
                    });
                    const ax = reef.x + side * (3.6 + Math.random() * 0.35);
                    const az = z + (Math.random() - 0.5) * 0.6;
                    this.addBoulderCoral(ax, y, az, accentMat);
                    const accent = this.root.children[this.root.children.length - 1];
                    if (accent) accent.scale.multiplyScalar(0.85);
                }
            }
        }
        console.log('🪸 Path-framing coral walls (jewel gardens)');
    }

    /**
     * Golden swim lane — continuous strip so the eye has somewhere to go.
     * (Reference: warm sand corridor between coral walls.)
     * Soft emissive pads + shell/stone guides make the +Z path obvious from spawn.
     */
    private createSandPathMarkers(reef: ReefZone): void {
        const gold = new THREE.MeshStandardMaterial({
            color: 0xffe8b5,
            roughness: 0.74,
            metalness: 0.08,
            emissive: 0x8a6028,
            emissiveIntensity: 0.32,
        });
        const edge = new THREE.MeshStandardMaterial({
            color: 0xd8bc8c,
            roughness: 0.86,
            metalness: 0.03,
            emissive: 0x4a3214,
            emissiveIntensity: 0.14,
        });
        const shellMat = new THREE.MeshStandardMaterial({
            color: 0xfff0d8,
            roughness: 0.45,
            metalness: 0.12,
            emissive: 0x6a5030,
            emissiveIntensity: 0.22,
        });
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0xc9b090,
            roughness: 0.9,
            metalness: 0.04,
            emissive: 0x3a2a14,
            emissiveIntensity: 0.1,
        });
        // Main lane along +Z (spawn looks down this) — warmer invitation
        const lane = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.1, 26), gold);
        lane.position.set(reef.x, reef.shelfY + 0.14, reef.z + 12);
        lane.receiveShadow = true;
        lane.name = 'GoldPath';
        this.root.add(lane);
        // Soft edge lips
        for (const side of [-1, 1]) {
            const lip = new THREE.Mesh(
                new THREE.BoxGeometry(1.0, 0.14, 24),
                edge
            );
            lip.position.set(reef.x + side * 3.0, reef.shelfY + 0.14, reef.z + 11);
            lip.receiveShadow = true;
            this.root.add(lip);
        }
        // Stepping stones + soft path lights toward wreck (forward invitation)
        for (let i = 0; i < 10; i++) {
            const pad = new THREE.Mesh(
                new THREE.CylinderGeometry(0.7 + Math.random() * 0.25, 0.78, 0.1, 10),
                gold
            );
            const pz = reef.z + 2.5 + i * 2.4;
            pad.position.set(
                reef.x + (Math.random() - 0.5) * 0.85,
                reef.shelfY + 0.17,
                pz
            );
            pad.receiveShadow = true;
            this.root.add(pad);
            // Soft glow disk under pad — reads as sand light, not harsh spotlight
            if (i % 2 === 0) {
                const glow = new THREE.Mesh(
                    new THREE.CircleGeometry(0.95, 12),
                    new THREE.MeshBasicMaterial({
                        color: 0xffd88a,
                        transparent: true,
                        opacity: 0.18,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending,
                        side: THREE.DoubleSide,
                    })
                );
                glow.rotation.x = -Math.PI / 2;
                glow.position.set(pad.position.x, reef.shelfY + 0.16, pz);
                this.root.add(glow);
            }
            // Alternating shells / stones along edges as breadcrumb markers
            const guideSide = i % 2 === 0 ? -1 : 1;
            if (i % 2 === 0) {
                const shell = new THREE.Mesh(
                    new THREE.SphereGeometry(0.14 + Math.random() * 0.06, 8, 6),
                    shellMat
                );
                shell.scale.set(1.2, 0.45, 1.0);
                shell.position.set(
                    reef.x + guideSide * (2.15 + Math.random() * 0.25),
                    reef.shelfY + 0.2,
                    pz + (Math.random() - 0.5) * 0.4
                );
                shell.rotation.y = Math.random() * Math.PI;
                shell.castShadow = true;
                this.root.add(shell);
            } else {
                const stone = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.08, 0),
                    stoneMat
                );
                stone.position.set(
                    reef.x + guideSide * (2.2 + Math.random() * 0.2),
                    reef.shelfY + 0.2,
                    pz
                );
                stone.rotation.set(Math.random(), Math.random(), Math.random());
                stone.castShadow = true;
                this.root.add(stone);
            }
        }
        // Soft distance beacons — path end + mid-lane (not overpowering)
        const beacon = new THREE.PointLight(0xffd166, 1.05, 20);
        beacon.position.set(reef.x + 2, reef.shelfY + 4, reef.z + 24);
        this.root.add(beacon);
        const midGlow = new THREE.PointLight(0xffe0a0, 0.45, 12);
        midGlow.position.set(reef.x, reef.shelfY + 2.2, reef.z + 12);
        this.root.add(midGlow);
    }

    /** Distant wreck silhouette — readable from spawn along golden path */
    private createDistantWreckLandmark(home: ReefZone): void {
        const g = new THREE.Group();
        g.name = 'DistantWreck';
        // Cooler dark hull so it silhouettes against water + path glow
        const hullMat = new THREE.MeshStandardMaterial({
            color: 0x3a4540,
            roughness: 0.88,
            metalness: 0.18,
            emissive: 0x081210,
            emissiveIntensity: 0.18,
        });
        const rustMat = new THREE.MeshStandardMaterial({
            color: 0x6a4a38,
            roughness: 0.9,
            metalness: 0.12,
            emissive: 0x1a1008,
            emissiveIntensity: 0.1,
        });
        // Larger hull for readable silhouette at ~26m
        const hull = new THREE.Mesh(
            new THREE.BoxGeometry(10, 2.8, 3.0),
            hullMat
        );
        hull.position.y = 1.35;
        const bow = new THREE.Mesh(
            new THREE.ConeGeometry(1.7, 4.2, 6),
            hullMat
        );
        bow.rotation.z = Math.PI / 2;
        bow.position.set(6.4, 1.4, 0);
        // Tall mast — primary skyline cue from spawn
        const mast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.22, 7.5, 6),
            hullMat
        );
        mast.position.set(-1.2, 5.0, 0);
        // Cross-yard for more distinctive profile
        const yard = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 3.2, 5),
            hullMat
        );
        yard.rotation.z = Math.PI / 2;
        yard.position.set(-1.2, 6.8, 0);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 2.1), rustMat);
        cabin.position.set(-2.4, 2.9, 0);
        // Funnel / second vertical for broken-ship read
        const funnel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8),
            rustMat
        );
        funnel.position.set(1.5, 3.6, 0);
        g.add(hull, bow, mast, yard, cabin, funnel);
        // End of golden path (+Z) so swim direction has a landmark
        g.position.set(home.x + 2, home.shelfY + 0.35, home.z + 26);
        g.rotation.y = -0.55;
        g.rotation.z = 0.12;
        g.scale.setScalar(1.35);
        g.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
                (c as THREE.Mesh).castShadow = true;
                (c as THREE.Mesh).receiveShadow = true;
            }
        });
        this.root.add(g);
    }

    private createShipWreck(reef: ReefZone): void {
        this.createDistantWreckLandmark({ ...reef, x: reef.x, z: reef.z });
    }

    private createRocks(reef: ReefZone, count: number): void {
        const rockTex = AssetLibrary.get().rock.map;
        const rockMats = [
            new THREE.MeshStandardMaterial({
                color: rockTex ? 0xddd0c0 : 0x8a7a68,
                map: rockTex || undefined,
                roughness: 0.92,
                metalness: 0.05,
                flatShading: !rockTex,
            }),
            new THREE.MeshStandardMaterial({
                color: rockTex ? 0xc8b8a8 : 0x6b6054,
                map: rockTex || undefined,
                roughness: 0.95,
                metalness: 0.04,
                flatShading: !rockTex,
            }),
            new THREE.MeshStandardMaterial({
                color: rockTex ? 0xeee4d4 : 0xa89880,
                map: rockTex || undefined,
                roughness: 0.88,
                metalness: 0.03,
                flatShading: !rockTex,
            }),
        ];

        for (let i = 0; i < count; i++) {
            const pos = randomInReef(reef, 0.12, 0.95);
            const geoChoice = Math.random();
            let geo: THREE.BufferGeometry;
            if (geoChoice < 0.4) geo = new THREE.DodecahedronGeometry(1, 0);
            else if (geoChoice < 0.75) geo = new THREE.IcosahedronGeometry(1, 0);
            else geo = new THREE.OctahedronGeometry(1, 0);

            const mesh = new THREE.Mesh(geo, rockMats[i % rockMats.length]);
            const sx = 0.5 + Math.random() * 1.8;
            const sy = 0.35 + Math.random() * 1.4;
            const sz = 0.5 + Math.random() * 1.7;
            mesh.scale.set(sx, sy, sz);
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            mesh.position.set(
                pos.x,
                reef.shelfY - 0.15 + Math.random() * 0.5 + sy * 0.3,
                pos.z
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.root.add(mesh);
        }
    }

    private createCoral(reef: ReefZone, clusters: number): void {
        const coralColors = this.coralPalette();

        for (let c = 0; c < clusters; c++) {
            const pos = randomInReef(reef, 0.08, 0.92);
            const baseY = reef.shelfY + Math.random() * 0.35;
            const color = coralColors[c % coralColors.length];
            const coralArt = AssetLibrary.get().coral;
            const mat = new THREE.MeshStandardMaterial({
                color,
                map: coralArt.map || undefined,
                normalMap: coralArt.normalMap || undefined,
                roughness: 0.62,
                metalness: 0.08,
                emissive: new THREE.Color(color).multiplyScalar(0.14),
                flatShading: !coralArt.map,
            });
            const type = Math.random();
            if (type < 0.45) this.addBranchingCoral(pos.x, baseY, pos.z, mat);
            else if (type < 0.75) this.addBoulderCoral(pos.x, baseY, pos.z, mat);
            else this.addPlateCoral(pos.x, baseY, pos.z, mat);
        }
    }

    private addBranchingCoral(
        x: number,
        y: number,
        z: number,
        mat: THREE.MeshStandardMaterial
    ): void {
        const group = new THREE.Group();
        const stemH = 0.7 + Math.random() * 1.4;
        const stemR = 0.07 + Math.random() * 0.1;
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(stemR * 0.7, stemR * 1.2, stemH, 6),
            mat
        );
        stem.position.y = stemH * 0.5;
        stem.castShadow = true;
        group.add(stem);
        const branches = 3 + Math.floor(Math.random() * 3);
        for (let b = 0; b < branches; b++) {
            const bh = 0.35 + Math.random() * 0.75;
            const br = stemR * (0.5 + Math.random() * 0.4);
            const branch = new THREE.Mesh(
                new THREE.CylinderGeometry(br * 0.6, br, bh, 5),
                mat
            );
            const angle = (b / branches) * Math.PI * 2 + Math.random() * 0.4;
            const elev = 0.3 + Math.random() * 0.45;
            branch.position.set(
                Math.cos(angle) * stemR * 2.5,
                stemH * (0.45 + Math.random() * 0.4),
                Math.sin(angle) * stemR * 2.5
            );
            branch.rotation.z = elev * Math.cos(angle);
            branch.rotation.x = -elev * Math.sin(angle);
            branch.castShadow = true;
            group.add(branch);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(br * 1.3, 6, 5), mat);
            tip.position.copy(branch.position);
            tip.position.y += bh * 0.45;
            group.add(tip);
        }
        group.position.set(x, y, z);
        group.rotation.y = Math.random() * Math.PI * 2;
        this.root.add(group);
    }

    private addBoulderCoral(
        x: number,
        y: number,
        z: number,
        mat: THREE.MeshStandardMaterial
    ): void {
        const group = new THREE.Group();
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
            const r = 0.22 + Math.random() * 0.45;
            const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat);
            s.position.set(
                (Math.random() - 0.5) * 0.5,
                r * 0.7 + i * 0.1,
                (Math.random() - 0.5) * 0.5
            );
            s.scale.y = 0.7 + Math.random() * 0.35;
            s.castShadow = true;
            s.receiveShadow = true;
            group.add(s);
        }
        group.position.set(x, y, z);
        this.root.add(group);
    }

    private addPlateCoral(
        x: number,
        y: number,
        z: number,
        mat: THREE.MeshStandardMaterial
    ): void {
        const group = new THREE.Group();
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.1, 0.45, 6),
            mat
        );
        stem.position.y = 0.22;
        group.add(stem);
        const plate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55 + Math.random() * 0.45, 0.4, 0.1, 8),
            mat
        );
        plate.position.y = 0.48;
        plate.castShadow = true;
        plate.receiveShadow = true;
        group.add(plate);
        group.position.set(x, y, z);
        this.root.add(group);
    }

    private createKelp(reef: ReefZone, count: number): void {
        // Kelp meadow reef gets more blades
        const n = reef.id === 'west_meadow' ? Math.floor(count * 1.6) : count;
        const kelpColors = [0x2d8a4e, 0x1f6b3a, 0x3aa35c, 0x246b42];

        for (let i = 0; i < n; i++) {
            const pos = randomInReef(reef, 0.15, 0.95);
            const segs = 4 + Math.floor(Math.random() * 3);
            const group = new THREE.Group();
            const color = kelpColors[i % kelpColors.length];
            const mat = new THREE.MeshStandardMaterial({
                color,
                roughness: 0.8,
                metalness: 0.02,
                side: THREE.DoubleSide,
            });
            let y = 0;
            for (let s = 0; s < segs; s++) {
                const h = 0.45 + Math.random() * 0.35;
                const blade = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.18 + Math.random() * 0.12, h),
                    mat
                );
                blade.position.y = y + h * 0.5;
                y += h * 0.85;
                group.add(blade);
                this.kelpBlades.push({
                    mesh: blade,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.8 + Math.random() * 1.2,
                    amp: 0.08 + Math.random() * 0.12,
                    baseRotZ: 0,
                    baseRotX: 0,
                });
            }
            group.position.set(pos.x, reef.shelfY, pos.z);
            group.rotation.y = Math.random() * Math.PI * 2;
            this.root.add(group);
        }
    }

    /** Home reef set-piece: anemone garden for clownfish wow moment */
    private createHeroAnemoneGarden(reef: ReefZone): void {
        const coralArt = AssetLibrary.get().coral;
        // Base stalk colours + tentacle accent palette for variety
        const stalkCols = [
            0xff6b9d, 0xff8fab, 0xffb3c6, 0xff5c8a, 0xff7a5c, 0xe85cff, 0xff4d6d,
            0xff9a6c, 0xd46bff,
        ];
        const tentacleCols = [
            0xff8fab, 0xffc2d4, 0xff6b9d, 0xffd6a5, 0xff9ecd, 0xe0aaff, 0xffb380,
            0xff5c8a, 0xc77dff, 0xffe0b0, 0xff99c8, 0xb8f2e6,
        ];
        // Slight presence bump (10 vs 8) — still light for iPad
        for (let i = 0; i < 10; i++) {
            const p = randomInReef(reef, 0.05, 0.48);
            const group = new THREE.Group();
            const baseCol = stalkCols[i % stalkCols.length];
            const mat = new THREE.MeshStandardMaterial({
                color: baseCol,
                map: coralArt.map || undefined,
                emissive: new THREE.Color(baseCol).multiplyScalar(0.26),
                roughness: 0.52,
                metalness: 0.05,
            });
            // Stalk
            const stalk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.45, 0.7, 10),
                mat
            );
            stalk.position.y = 0.35;
            stalk.castShadow = true;
            group.add(stalk);
            // Tentacle crown — mixed colours per tentacle for garden pop
            const tentCount = 14;
            for (let t = 0; t < tentCount; t++) {
                const ang = (t / tentCount) * Math.PI * 2;
                const tentCol = tentacleCols[(i * 3 + t) % tentacleCols.length];
                const tentMat = new THREE.MeshStandardMaterial({
                    color: tentCol,
                    map: coralArt.map || undefined,
                    emissive: new THREE.Color(tentCol).multiplyScalar(0.28),
                    roughness: 0.5,
                    metalness: 0.04,
                });
                const tent = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.045, 0.09, 0.8 + Math.random() * 0.45, 5),
                    tentMat
                );
                tent.position.set(Math.cos(ang) * 0.32, 0.95, Math.sin(ang) * 0.32);
                tent.rotation.z = Math.cos(ang) * 0.55;
                tent.rotation.x = -Math.sin(ang) * 0.55;
                group.add(tent);
                this.kelpBlades.push({
                    mesh: tent,
                    phase: t * 0.4 + i * 0.15,
                    speed: 1.2 + Math.random(),
                    amp: 0.13,
                    baseRotZ: tent.rotation.z,
                    baseRotX: tent.rotation.x,
                });
            }
            // Slight scale variety — heroes read as a garden, not clones
            const s = 1.05 + (i % 3) * 0.12 + Math.random() * 0.08;
            group.scale.setScalar(s);
            group.position.set(p.x, reef.shelfY, p.z);
            this.root.add(group);
        }
        // Giant table coral centerpiece near origin of home reef
        const tableMat = new THREE.MeshStandardMaterial({
            color: 0xff9f68,
            map: coralArt.map || undefined,
            normalMap: coralArt.normalMap || undefined,
            emissive: 0x442211,
            emissiveIntensity: 0.18,
            roughness: 0.6,
        });
        const table = new THREE.Group();
        const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.55, 1.4, 10),
            tableMat
        );
        pillar.position.y = 0.7;
        const top = new THREE.Mesh(
            new THREE.CylinderGeometry(2.2, 1.6, 0.35, 12),
            tableMat
        );
        top.position.y = 1.5;
        table.add(pillar, top);
        table.position.set(reef.x + 3, reef.shelfY, reef.z - 2);
        table.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
                (c as THREE.Mesh).castShadow = true;
                (c as THREE.Mesh).receiveShadow = true;
            }
        });
        this.root.add(table);
        console.log('🪸 Home reef hero anemone garden + table coral placed');
    }

    /**
     * Volumetric-ish god rays. baseOpacity higher on home reef; update() pulses softly.
     * Stored userData.baseOpacity so home stays stronger without bleaching.
     */
    private createGodRays(
        reef: ReefZone,
        count: number,
        baseOpacity: number = 0.035
    ): void {
        for (let i = 0; i < count; i++) {
            const pos = randomInReef(reef, 0.15, 0.75);
            // Slightly wider beams on home (higher baseOpacity) for presence
            const topR = baseOpacity > 0.04 ? 0.32 : 0.25;
            const botR = baseOpacity > 0.04 ? 2.8 : 2.4;
            const geo = new THREE.CylinderGeometry(topR, botR, 16, 8, 1, true);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xc4e4f8,
                transparent: true,
                opacity: baseOpacity,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.userData.baseOpacity = baseOpacity;
            mesh.position.set(pos.x, reef.shelfY + 6, pos.z);
            mesh.rotation.z = (Math.random() - 0.5) * 0.12;
            this.root.add(mesh);
            this.godRays.push(mesh);
        }
    }

    update(deltaTime: number): void {
        this.time += deltaTime;
        for (const k of this.kelpBlades) {
            k.mesh.rotation.z =
                k.baseRotZ + Math.sin(this.time * k.speed + k.phase) * k.amp;
            k.mesh.rotation.x =
                k.baseRotX + Math.cos(this.time * k.speed * 0.7 + k.phase) * k.amp * 0.5;
        }
        for (let i = 0; i < this.godRays.length; i++) {
            const g = this.godRays[i];
            const m = g.material as THREE.MeshBasicMaterial;
            const base = (g.userData.baseOpacity as number) ?? 0.035;
            // Soft pulse around each ray's base — home stronger, never white-out
            const amp = Math.min(0.02, base * 0.35);
            m.opacity = base * 0.75 + Math.sin(this.time * 0.4 + i) * amp;
        }
    }
}
