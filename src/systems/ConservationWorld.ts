import * as THREE from 'three';
import type { PhysicsWorld } from './PhysicsWorld';
import { pickReefWeighted, randomInReef } from './WorldMap';

export type LitterCollectResult = { collected: number; ids: string[] };

export type ConservationCollectEvent = {
    kind: 'litter';
    ids: string[];
    position: THREE.Vector3;
};

export type ConservationFreeEvent = {
    kind: 'ghost_net';
    id: string;
    position: THREE.Vector3;
};

interface LitterProp {
    id: string;
    mesh: THREE.Object3D;
    position: THREE.Vector3;
    /** Golden-path demo trash — stronger pulse so first-clean is obvious */
    homePath?: boolean;
    /** Rest scale for pulse animation (home-path only) */
    baseScale?: number;
}

/** Short-lived collect flash (light + ring) so clean feels rewarding mid-frame */
interface CollectFlash {
    group: THREE.Group;
    life: number;
    maxLife: number;
}

interface TrappedFish {
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    free: boolean;
    life: number;
}

interface GhostNetProp {
    id: string;
    group: THREE.Group;
    position: THREE.Vector3;
    freed: boolean;
    freeAnim: number; // 0..1 while dissolving
    trappedFish: TrappedFish[];
}

/**
 * Stylized (Roblox-readable) ocean conservation props:
 * neon litter near the floor + ghost nets trapping small dummy fish.
 *
 * Main / Education can award CP via:
 *   world.onCollect = (e) => { award CP per e.ids }
 *   world.onFree    = (e) => { award CP for freed net }
 * or by reading tryCollectLitter / tryFreeNet return values.
 */
export class ConservationWorld {
    private scene: THREE.Scene;
    private physicsWorld?: PhysicsWorld;
    private litter: LitterProp[] = [];
    private nets: GhostNetProp[] = [];
    private collectFlashes: CollectFlash[] = [];
    private root: THREE.Group;
    private time = 0;
    private idSeq = 0;

    /** Optional: particle / bubble burst when litter is collected */
    onCollect?: (event: ConservationCollectEvent) => void;
    /** Optional: when a ghost net is freed */
    onFree?: (event: ConservationFreeEvent) => void;

    constructor(scene: THREE.Scene, physicsWorld?: PhysicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.root = new THREE.Group();
        this.root.name = 'ConservationWorld';
    }

    async init(): Promise<void> {
        this.scene.add(this.root);
        // Mock plate: visible trash near home + scattered
        this.spawnLitter(10 + Math.floor(Math.random() * 4));
        this.spawnGhostNets(3);
        this.spawnHomeReefDemoTrash();
        console.log(
            `♻️ ConservationWorld ready: ${this.litter.length} litter, ${this.nets.length} ghost nets`
        );
    }

    /**
     * Gift Try Again — clear home-path litter/nets and re-place demo trash.
     * Distant reef litter is left alone.
     */
    respawnHomeReefGiftTrash(): void {
        const keepLitter: LitterProp[] = [];
        for (const item of this.litter) {
            if (item.homePath) {
                try {
                    this.root.remove(item.mesh);
                } catch {
                    /* soft */
                }
            } else {
                keepLitter.push(item);
            }
        }
        this.litter = keepLitter;

        // Remove path-area nets (demo net ~4.5,10) so spawn can place a fresh one
        const keepNets: GhostNetProp[] = [];
        for (const net of this.nets) {
            const nearPath = Math.hypot(net.position.x - 4.5, net.position.z - 10) < 4;
            if (nearPath) {
                try {
                    this.root.remove(net.group);
                } catch {
                    /* soft */
                }
            } else {
                keepNets.push(net);
            }
        }
        this.nets = keepNets;
        this.spawnHomeReefDemoTrash();
        console.log(
            `♻️ Home Reef gift trash respawned: litter=${this.litter.length} nets=${this.nets.length}`
        );
    }

    update(dt: number): void {
        this.time += dt;

        // Gentle bob on remaining litter; home-path items pulse (scale + light) to "call" player
        for (const item of this.litter) {
            const phase = this.time * 2.4 + item.position.x * 0.7 + item.position.z * 0.3;
            const bobAmp = item.homePath ? 0.14 : 0.05;
            const bob = Math.sin(this.time * 1.5 + item.position.x) * bobAmp;
            item.mesh.position.y = item.position.y + bob;
            item.mesh.rotation.y += dt * (item.homePath ? 0.55 : 0.3);

            if (item.homePath) {
                const base = item.baseScale ?? 1;
                const pulse = 1 + Math.sin(phase) * 0.14;
                item.mesh.scale.setScalar(base * pulse);

                // Bob PointLight intensity so trash reads from SPAWN corridor
                const lightPulse = 0.5 + 0.5 * Math.sin(phase * 1.15);
                item.mesh.traverse((obj) => {
                    const light = obj as THREE.PointLight;
                    if (light.isPointLight) {
                        const baseI = (light.userData.baseIntensity as number) ?? 1.1;
                        light.intensity = baseI * (0.75 + 0.45 * lightPulse);
                    }
                });
            }
        }

        // Collect flash juice fade-out
        for (let i = this.collectFlashes.length - 1; i >= 0; i--) {
            const flash = this.collectFlashes[i];
            flash.life += dt;
            const t = flash.life / flash.maxLife;
            const s = 1 + t * 2.2;
            flash.group.scale.setScalar(s);
            flash.group.traverse((obj) => {
                const light = obj as THREE.PointLight;
                if (light.isPointLight) {
                    light.intensity = ((light.userData.baseIntensity as number) ?? 2) * (1 - t);
                }
                const mesh = obj as THREE.Mesh;
                if (mesh.isMesh && mesh.material) {
                    const mat = mesh.material as THREE.MeshBasicMaterial;
                    if ('opacity' in mat) {
                        mat.opacity = Math.max(0, 0.85 * (1 - t));
                    }
                }
            });
            if (flash.life >= flash.maxLife) {
                this.root.remove(flash.group);
                this.disposeObject(flash.group);
                this.collectFlashes.splice(i, 1);
            }
        }

        // Ghost net idle sway + free animation
        for (const net of this.nets) {
            if (!net.freed) {
                net.group.rotation.y = Math.sin(this.time * 0.4 + net.position.x) * 0.08;
                // Trapped fish wiggle in place
                for (const fish of net.trappedFish) {
                    if (!fish.free) {
                        fish.mesh.position.x =
                            Math.sin(this.time * 3 + fish.life) * 0.15;
                        fish.mesh.position.y =
                            Math.cos(this.time * 2.5 + fish.life) * 0.1;
                        fish.mesh.rotation.y += dt * 2;
                    }
                }
            } else {
                // Dissolve: scale down + fade materials
                net.freeAnim = Math.min(1, net.freeAnim + dt * 0.8);
                const s = 1 - net.freeAnim;
                net.group.scale.setScalar(Math.max(0.01, s));
                net.group.traverse((obj) => {
                    const mesh = obj as THREE.Mesh;
                    if (mesh.isMesh && mesh.material) {
                        const mats = Array.isArray(mesh.material)
                            ? mesh.material
                            : [mesh.material];
                        for (const m of mats) {
                            const mat = m as THREE.MeshStandardMaterial;
                            if ('opacity' in mat) {
                                mat.transparent = true;
                                mat.opacity = Math.max(0, 1 - net.freeAnim);
                                mat.needsUpdate = true;
                            }
                        }
                    }
                });

                // Released fish swim outward
                for (const fish of net.trappedFish) {
                    if (fish.free) {
                        fish.life += dt;
                        fish.mesh.position.addScaledVector(fish.velocity, dt);
                        fish.mesh.rotation.y += dt * 4;
                        // Fade out dummy fish after a few seconds
                        if (fish.life > 4) {
                            fish.mesh.visible = false;
                        }
                    }
                }

                if (net.freeAnim >= 1) {
                    // Keep group scaled tiny; hide completely once done
                    net.group.visible = false;
                }
            }
        }
    }

    /**
     * Proximity collect litter near position. Removes meshes and fires onCollect.
     */
    tryCollectLitter(position: THREE.Vector3, range: number): LitterCollectResult {
        const ids: string[] = [];
        const remaining: LitterProp[] = [];
        // Use first collected item world pos for bubble burst (caller still gets player pos too via event)
        let burstPos: THREE.Vector3 | null = null;

        for (const item of this.litter) {
            const dist = item.mesh.position.distanceTo(position);
            if (dist <= range) {
                ids.push(item.id);
                const worldPos = new THREE.Vector3();
                item.mesh.getWorldPosition(worldPos);
                if (!burstPos) burstPos = worldPos.clone();

                // Brief emissive pop before remove (visible as flash + lingering light)
                this.boostEmissiveFlash(item.mesh);
                this.spawnCollectFlash(worldPos, item.homePath ? 1.35 : 1);

                this.root.remove(item.mesh);
                this.disposeObject(item.mesh);
            } else {
                remaining.push(item);
            }
        }

        this.litter = remaining;

        if (ids.length > 0) {
            try {
                this.onCollect?.({
                    kind: 'litter',
                    ids: [...ids],
                    // Prefer litter world pos so bubbles pop on the trash, not only at player
                    position: (burstPos ?? position).clone(),
                });
            } catch (e) {
                console.warn('ConservationWorld onCollect callback failed:', e);
            }
        }

        return { collected: ids.length, ids };
    }

    /**
     * Free nearest unfreed ghost net in range. Starts dissolve + releases dummy fish.
     */
    tryFreeNet(position: THREE.Vector3, range: number): boolean {
        let best: GhostNetProp | null = null;
        let bestDist = Infinity;

        for (const net of this.nets) {
            if (net.freed) continue;
            const dist = net.group.position.distanceTo(position);
            if (dist <= range && dist < bestDist) {
                bestDist = dist;
                best = net;
            }
        }

        if (!best) return false;

        best.freed = true;
        best.freeAnim = 0;
        best.group.userData.freed = true;

        // Release trapped fish outward
        for (const fish of best.trappedFish) {
            fish.free = true;
            fish.life = 0;
            const outward = fish.mesh.position
                .clone()
                .sub(new THREE.Vector3(0, 0, 0))
                .normalize();
            if (outward.lengthSq() < 0.01) {
                outward.set(
                    Math.random() - 0.5,
                    Math.random() * 0.5 + 0.2,
                    Math.random() - 0.5
                ).normalize();
            }
            fish.velocity
                .copy(outward)
                .multiplyScalar(1.5 + Math.random() * 1.5)
                .add(new THREE.Vector3(0, 0.8 + Math.random(), 0));
            // Reparent to root so they keep swimming after net fades
            const worldPos = new THREE.Vector3();
            fish.mesh.getWorldPosition(worldPos);
            best.group.remove(fish.mesh);
            this.root.add(fish.mesh);
            fish.mesh.position.copy(worldPos);
        }

        try {
            this.onFree?.({
                kind: 'ghost_net',
                id: best.id,
                position: best.position.clone(),
            });
        } catch (e) {
            console.warn('ConservationWorld onFree callback failed:', e);
        }

        return true;
    }

    getLitterRemaining(): number {
        return this.litter.length;
    }

    getNetsRemaining(): number {
        return this.nets.filter((n) => !n.freed).length;
    }

    // ─── Spawn helpers ───────────────────────────────────────────────

    private nextId(prefix: string): string {
        this.idSeq += 1;
        return `${prefix}_${this.idSeq}`;
    }

    private randomFloorPosition(_minR: number, _maxR: number): THREE.Vector3 {
        // Litter/nets only on reef islands — keep open ocean clean/blue
        const reef = pickReefWeighted();
        const p = randomInReef(reef, 0.2, 0.9);
        const y = reef.shelfY + 0.4 + Math.random() * 1.5;
        return new THREE.Vector3(p.x, y, p.z);
    }

    private spawnLitter(count: number): void {
        const neonColors = [0xffee00, 0xffffff, 0xff2244, 0xff9900, 0xeeff33];

        for (let i = 0; i < count; i++) {
            const kindRoll = Math.random();
            let mesh: THREE.Object3D;
            const color = neonColors[Math.floor(Math.random() * neonColors.length)];

            if (kindRoll < 0.4) {
                mesh = this.makeBottle(color);
            } else if (kindRoll < 0.7) {
                mesh = this.makeBag(color);
            } else {
                mesh = this.makeCan(color);
            }

            const id = this.nextId('litter');
            const pos = this.randomFloorPosition(8, 20);
            mesh.position.copy(pos);
            mesh.rotation.set(
                Math.random() * 0.4,
                Math.random() * Math.PI * 2,
                Math.random() * 0.4
            );
            mesh.userData = { kind: 'litter', id };

            this.root.add(mesh);
            this.litter.push({ id, mesh, position: pos.clone() });
        }
    }

    /** Guaranteed trash near spawn — mock plate “first clean” moment */
    private spawnHomeReefDemoTrash(): void {
        // Swim corridor (SPAWN ~y=2.4): litter sits readable mid-water, slightly above sand (~-2.5)
        // Y range ~0.4–1.2 so trash is on the golden path, not buried below camera
        const spots: [number, number, number][] = [
            [1.8, 0.55, 5.5],
            [-1.5, 0.85, 6.5],
            [2.2, 0.45, 8],
            [-2.0, 1.05, 9],
            [1.2, 0.65, 11],
            [-1.8, 1.15, 12.5],
            [2.5, 0.5, 14],
            [0.5, 0.75, 7.2],
        ];
        const colors = [0xffee00, 0xffffff, 0xff2244, 0x33ccff];
        spots.forEach((pos, i) => {
            const color = colors[i % colors.length];
            const mesh =
                i % 3 === 0
                    ? this.makeCan(color)
                    : i % 3 === 1
                      ? this.makeBottle(color)
                      : this.makeBag(color);
            mesh.position.set(pos[0], pos[1], pos[2]);
            // Large + readable on first swim (scale ~1.8–2.2)
            const scaleMul = 1.85 + (i % 4) * 0.1;
            mesh.scale.multiplyScalar(scaleMul);
            this.boostLitterEmissive(mesh, 0.72);

            const id = this.nextId('litter');
            mesh.userData = { kind: 'litter', id, homePath: true };

            // Strong glow so trash “calls” from SPAWN corridor
            const lightIntensity = 0.95 + (i % 3) * 0.15; // 0.95–1.25
            const lightDist = 5.5 + (i % 3) * 0.5; // 5.5–6.5
            const glow = new THREE.PointLight(color, lightIntensity, lightDist);
            glow.position.set(0, 0.3, 0);
            glow.userData.baseIntensity = lightIntensity;
            mesh.add(glow);

            // Ground ring (under item, slightly larger for path readability)
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.42, 0.62, 20),
                new THREE.MeshBasicMaterial({
                    color: 0xffd166,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = -0.35;
            mesh.add(ring);

            this.root.add(mesh);
            this.litter.push({
                id,
                mesh,
                position: new THREE.Vector3(pos[0], pos[1], pos[2]),
                homePath: true,
                baseScale: mesh.scale.x,
            });
        });

        // Ghost net on path right — swimmable Y, larger, slightly emissive
        const netId = this.nextId('net');
        const net = this.makeNetStructure();
        this.boostLitterEmissive(net, 0.45);
        // Tint net materials a bit brighter so it reads mid-water
        net.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.isMesh && mesh.material) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                for (const m of mats) {
                    const mat = m as THREE.MeshStandardMaterial;
                    if ('emissive' in mat) {
                        mat.emissive = new THREE.Color(0x445566);
                        mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, 0.4);
                        mat.needsUpdate = true;
                    }
                }
            }
        });
        net.scale.multiplyScalar(2.0);
        net.position.set(4.5, 2.0, 10); // ~1.5–2.5 swim band
        const netGlow = new THREE.PointLight(0x88aacc, 0.85, 6);
        netGlow.position.set(0, 0.2, 0);
        net.add(netGlow);
        net.userData = { kind: 'ghost_net', id: netId, freed: false };
        this.root.add(net);
        this.nets.push({
            id: netId,
            group: net,
            position: net.position.clone(),
            trappedFish: [],
            freed: false,
            freeAnim: 0,
        });
    }

    /** Raise emissive on litter meshes (home path only — multi-reef factories unchanged) */
    private boostLitterEmissive(root: THREE.Object3D, minIntensity: number): void {
        root.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (!mesh.isMesh || !mesh.material) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
                const mat = m as THREE.MeshStandardMaterial;
                if ('emissiveIntensity' in mat) {
                    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, minIntensity);
                    mat.needsUpdate = true;
                }
            }
        });
    }

    /** Instant material pop used the frame litter is collected */
    private boostEmissiveFlash(root: THREE.Object3D): void {
        root.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (!mesh.isMesh || !mesh.material) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
                const mat = m as THREE.MeshStandardMaterial;
                if ('emissiveIntensity' in mat) {
                    mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, 1.6);
                    mat.needsUpdate = true;
                }
            }
        });
    }

    /** Expanding ring + point light that fades in update() */
    private spawnCollectFlash(worldPos: THREE.Vector3, sizeMul = 1): void {
        const group = new THREE.Group();
        group.position.copy(worldPos);

        const light = new THREE.PointLight(0xaaffff, 2.4 * sizeMul, 7 * sizeMul);
        light.userData.baseIntensity = 2.4 * sizeMul;
        group.add(light);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.45, 24),
            new THREE.MeshBasicMaterial({
                color: 0x88ffee,
                transparent: true,
                opacity: 0.85,
                side: THREE.DoubleSide,
                depthWrite: false,
            })
        );
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.12 * sizeMul, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
            })
        );
        group.add(core);

        this.root.add(group);
        this.collectFlashes.push({ group, life: 0, maxLife: 0.45 });
    }

    private makeBottle(color: number): THREE.Group {
        // Clear plastic water bottle — unmistakable silhouette
        const g = new THREE.Group();
        const plastic = new THREE.MeshStandardMaterial({
            color: 0xa8e0ff,
            emissive: 0x4488aa,
            emissiveIntensity: 0.35,
            metalness: 0.05,
            roughness: 0.25,
            transparent: true,
            opacity: 0.72,
        });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.62, 12), plastic);
        body.position.y = 0.05;
        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), plastic);
        shoulder.scale.set(1, 0.55, 1);
        shoulder.position.y = 0.38;
        const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.07, 0.16, 8),
            plastic
        );
        neck.position.y = 0.52;
        // Bright cap (species of trash cue)
        const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.055, 0.06, 10),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.65,
                roughness: 0.4,
            })
        );
        cap.position.y = 0.62;
        // Label wrap
        const label = new THREE.Mesh(
            new THREE.CylinderGeometry(0.152, 0.152, 0.22, 12, 1, true),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.5,
                roughness: 0.55,
                side: THREE.DoubleSide,
            })
        );
        label.position.y = 0.05;
        g.add(body, shoulder, neck, cap, label);
        g.scale.setScalar(1.35);
        return g;
    }

    private makeBag(color: number): THREE.Group {
        // Crumpled plastic shopping bag — floating open form
        const g = new THREE.Group();
        const bagMat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.45,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.88,
            roughness: 0.65,
            metalness: 0.0,
        });
        // Bag body (flattened box)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.08), bagMat);
        body.position.y = 0.1;
        // Handles
        const handleMat = bagMat.clone();
        const hL = new THREE.Mesh(
            new THREE.TorusGeometry(0.12, 0.025, 6, 12, Math.PI),
            handleMat
        );
        hL.position.set(-0.12, 0.48, 0);
        hL.rotation.z = Math.PI;
        const hR = hL.clone();
        hR.position.x = 0.12;
        // Crumple ridges
        for (let i = 0; i < 3; i++) {
            const ridge = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.04, 0.02),
                bagMat
            );
            ridge.position.set(0, -0.05 + i * 0.18, 0.05);
            g.add(ridge);
        }
        g.add(body, hL, hR);
        g.rotation.x = -0.25 + Math.random() * 0.2;
        g.scale.setScalar(1.4);
        return g;
    }

    private makeCan(color: number): THREE.Group {
        // Soft-drink can with ring-pull
        const g = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.38, 14),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.55,
                metalness: 0.75,
                roughness: 0.28,
            })
        );
        // Silver top/bottom
        const lid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.152, 0.152, 0.03, 14),
            new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                metalness: 0.9,
                roughness: 0.2,
                emissive: 0x666666,
                emissiveIntensity: 0.2,
            })
        );
        lid.position.y = 0.2;
        const base = lid.clone();
        base.position.y = -0.2;
        // Pull tab
        const tab = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.012, 6, 10),
            new THREE.MeshStandardMaterial({
                color: 0xdddddd,
                metalness: 0.85,
                roughness: 0.25,
            })
        );
        tab.position.set(0.04, 0.22, 0);
        tab.rotation.x = Math.PI / 2;
        // Brand stripe
        const stripe = new THREE.Mesh(
            new THREE.CylinderGeometry(0.155, 0.155, 0.1, 14, 1, true),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.25,
                side: THREE.DoubleSide,
            })
        );
        g.add(body, lid, base, tab, stripe);
        g.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.35;
        g.scale.setScalar(1.35);
        return g;
    }

    private spawnGhostNets(count: number): void {
        for (let i = 0; i < count; i++) {
            const id = this.nextId('net');
            // Place nets a bit further out so litter and nets don't all stack
            const pos = this.randomFloorPosition(10, 18);
            pos.y = 1 + Math.random() * 3;

            const group = this.makeNetStructure();
            group.position.copy(pos);
            group.userData = { kind: 'ghost_net', id, freed: false };

            const trappedFish: TrappedFish[] = [];
            const fishCount = 1 + Math.floor(Math.random() * 2); // 1–2
            for (let f = 0; f < fishCount; f++) {
                const fishMesh = this.makeDummyFish();
                fishMesh.position.set(
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.6
                );
                group.add(fishMesh);
                trappedFish.push({
                    mesh: fishMesh,
                    velocity: new THREE.Vector3(),
                    free: false,
                    life: Math.random() * 10,
                });
            }

            this.root.add(group);
            this.nets.push({
                id,
                group,
                position: pos.clone(),
                freed: false,
                freeAnim: 0,
                trappedFish,
            });
        }
    }

    /** Grid of thin cylinders + semi-transparent wireframe plane */
    private makeNetStructure(): THREE.Group {
        const group = new THREE.Group();
        const netColor = 0x8899aa;
        const mat = new THREE.MeshStandardMaterial({
            color: netColor,
            emissive: 0x223344,
            emissiveIntensity: 0.2,
            metalness: 0.1,
            roughness: 0.8,
            transparent: true,
            opacity: 0.75,
        });

        const size = 2.4;
        const half = size / 2;
        const lines = 6;
        const radius = 0.025;

        // Horizontal bars (X)
        for (let i = 0; i <= lines; i++) {
            const t = (i / lines) * size - half;
            const bar = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, size, 4),
                mat
            );
            bar.rotation.z = Math.PI / 2;
            bar.position.set(0, t * 0.6, 0);
            group.add(bar);

            const barZ = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, size, 4),
                mat
            );
            barZ.rotation.x = Math.PI / 2;
            barZ.position.set(t, 0, 0);
            group.add(barZ);
        }

        // Vertical bars (Y)
        for (let i = 0; i <= lines; i++) {
            const t = (i / lines) * size - half;
            const bar = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, size * 0.7, 4),
                mat
            );
            bar.position.set(t, 0, 0);
            group.add(bar);

            const bar2 = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, size * 0.7, 4),
                mat
            );
            bar2.position.set(0, 0, t);
            group.add(bar2);
        }

        // Semi-transparent wireframe plane for readable net look
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size * 0.7),
            new THREE.MeshBasicMaterial({
                color: 0xaabbcc,
                wireframe: true,
                transparent: true,
                opacity: 0.45,
                side: THREE.DoubleSide,
            })
        );
        group.add(plane);

        // Slight random tilt
        group.rotation.y = Math.random() * Math.PI;
        group.rotation.x = (Math.random() - 0.5) * 0.3;
        group.rotation.z = (Math.random() - 0.5) * 0.2;

        return group;
    }

    private makeDummyFish(): THREE.Group {
        // Tiny fish silhouette trapped in net (readable, not a cone only)
        const g = new THREE.Group();
        const colors = [0xff6a00, 0x1e90ff, 0xff66aa, 0x2ecc71];
        const c = colors[Math.floor(Math.random() * colors.length)];
        const matB = new THREE.MeshStandardMaterial({
            color: c,
            emissive: c,
            emissiveIntensity: 0.55,
            roughness: 0.45,
        });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), matB);
        body.scale.set(0.7, 0.85, 1.4);
        const tail = new THREE.Mesh(
            new THREE.ConeGeometry(0.08, 0.14, 6),
            matB
        );
        tail.rotation.x = -Math.PI / 2;
        tail.position.z = -0.18;
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        eye.position.set(0.04, 0.03, 0.1);
        g.add(body, tail, eye);
        g.scale.setScalar(0.95 + Math.random() * 0.25);
        return g;
    }

    private disposeObject(obj: THREE.Object3D): void {
        obj.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) {
                mesh.geometry?.dispose();
                const mats = Array.isArray(mesh.material)
                    ? mesh.material
                    : mesh.material
                      ? [mesh.material]
                      : [];
                for (const m of mats) m.dispose();
            }
        });
    }
}
