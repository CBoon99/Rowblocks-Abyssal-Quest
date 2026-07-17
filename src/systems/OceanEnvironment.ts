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
            const scale = reef.id === 'home_reef' ? 1.55 : reef.id === 'east_garden' ? 1.2 : 0.9;
            this.createRocks(reef, Math.floor(12 * rockF * scale));
            this.createCoral(reef, Math.floor(14 * coralF * scale));
            this.createKelp(reef, Math.floor(14 * kelpF * scale));
            if (reef.id === 'home_reef') {
                this.createHeroAnemoneGarden(reef);
                this.createGodRays(reef, 4);
            } else if (reef.id === 'east_garden' || reef.id === 'wreck_cove') {
                this.createGodRays(reef, 2);
            }
        }
        console.log(
            `🏝️ OceanEnvironment: props on ${REEF_ZONES.length} reefs (open water clear)`
        );
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
        const coralColors = [
            0xff6b8a, 0xff8c42, 0xc77dff, 0xff5e7a, 0xffa07a, 0xb388ff, 0xff7043,
        ];

        for (let c = 0; c < clusters; c++) {
            const pos = randomInReef(reef, 0.1, 0.88);
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
        for (let i = 0; i < 8; i++) {
            const p = randomInReef(reef, 0.05, 0.45);
            const group = new THREE.Group();
            const baseCol = [0xff6b9d, 0xff8fab, 0xffb3c6, 0xff5c8a][i % 4];
            const mat = new THREE.MeshStandardMaterial({
                color: baseCol,
                map: coralArt.map || undefined,
                emissive: new THREE.Color(baseCol).multiplyScalar(0.2),
                roughness: 0.55,
                metalness: 0.05,
            });
            // Stalk
            const stalk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.4, 0.6, 10),
                mat
            );
            stalk.position.y = 0.3;
            group.add(stalk);
            // Tentacle crown
            for (let t = 0; t < 12; t++) {
                const ang = (t / 12) * Math.PI * 2;
                const tent = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.08, 0.7 + Math.random() * 0.4, 5),
                    mat
                );
                tent.position.set(Math.cos(ang) * 0.28, 0.85, Math.sin(ang) * 0.28);
                tent.rotation.z = Math.cos(ang) * 0.5;
                tent.rotation.x = -Math.sin(ang) * 0.5;
                group.add(tent);
                this.kelpBlades.push({
                    mesh: tent,
                    phase: t * 0.4,
                    speed: 1.2 + Math.random(),
                    amp: 0.12,
                    baseRotZ: tent.rotation.z,
                    baseRotX: tent.rotation.x,
                });
            }
            group.position.set(p.x, reef.shelfY, p.z);
            this.root.add(group);
        }
        // Giant table coral centerpiece near origin of home reef
        const tableMat = new THREE.MeshStandardMaterial({
            color: 0xff9f68,
            map: coralArt.map || undefined,
            normalMap: coralArt.normalMap || undefined,
            emissive: 0x442211,
            emissiveIntensity: 0.15,
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

    private createGodRays(reef: ReefZone, count: number): void {
        for (let i = 0; i < count; i++) {
            const pos = randomInReef(reef, 0.2, 0.7);
            const geo = new THREE.CylinderGeometry(0.15, 1.8, 14, 8, 1, true);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xa8d8ff,
                transparent: true,
                opacity: 0.035,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(pos.x, reef.shelfY + 6, pos.z);
            mesh.rotation.z = (Math.random() - 0.5) * 0.15;
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
            m.opacity = 0.025 + Math.sin(this.time * 0.5 + i) * 0.012;
        }
    }
}
