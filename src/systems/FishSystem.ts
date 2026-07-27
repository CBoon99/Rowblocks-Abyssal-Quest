/**
 * FishSystem — living ocean creatures with species-true meshes.
 * Uses FishModels builders (LOCKED quality bar: no cone placeholders).
 */

import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';
import {
    buildCreature,
    animateCreature,
    type CreatureBuild,
} from './FishModels';
import {
    pickReefWeighted,
    randomInReef,
    randomOpenWater,
    nearestReef,
} from './WorldMap';
import { AssetLibrary } from './AssetLibrary';
import {
    getPersonality,
    trustToState,
    type TrustState,
    type SpeciesPersonality,
} from './SpeciesPersonality';
import { getReefHealthSystem } from './ReefHealthSystem';
import {
    MEMORY_HEROES,
    PATH_RIBBON,
    MANTA_TRIGGER_Z,
    TURTLE_NOTICE_DIST,
} from './HomeReefStage';

/** Trust language for kids — never "annoyance meters" */
export type FishMood = TrustState;

export type WildlifeEvent =
    | { type: 'shark_respect'; strength: number; dir: THREE.Vector3; line: string }
    | { type: 'jelly_tingle'; amount: number }
    | { type: 'comic_boop' }
    | { type: 'ink_puff'; x: number; y: number; z: number }
    | { type: 'thrash_local'; x: number; z: number }
    | { type: 'trust_toast'; line: string; icon: string }
    | { type: 'birthday_pearl'; message: string }
    | { type: 'remembers_you'; line: string; icon: string }
    | { type: 'reef_gathers'; reefName: string }
    | { type: 'memory_moment'; id: string; line: string };

export interface Fish {
    mesh: THREE.Mesh;
    tailFin?: THREE.Mesh;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    type: string;
    speciesId: string;
    size: number;
    swimSpeed: number;
    swimPhase: number;
    group: THREE.Group;
    build: CreatureBuild;
    /** Kid-facing trust state */
    mood: TrustState;
    moodTimer: number;
    /** 0–1 continuous trust this dive (memory) */
    trust: number;
    homeReefX: number;
    homeReefZ: number;
    /** Elder turtle — birthday secret */
    isElder?: boolean;
    pearlDropped?: boolean;
    /** Seconds spent watching the diver this approach */
    watchTimer?: number;
    /** Peak trust this dive — for "she remembers me" on return */
    peakTrust?: number;
    /** Once per fish: recognition toast fired */
    rememberedToast?: boolean;
    /** Was far this dive after being close (enables recognition) */
    wasFarAfterMeet?: boolean;
    /** Soft gather-orbit angle when reef accepts you */
    gatherAngle?: number;
    /** Memory Pass: staged emotional hero */
    memoryRole?: 'friend_turtle' | 'sky_manta' | 'respect_shark' | 'lantern_jelly';
    memoryPhase?: string;
    memoryTimer?: number;
    memoryDone?: boolean;
    baseScale?: number;
}

const SPECIES_SPAWN: { id: string; weight: number }[] = [
    { id: 'clownfish', weight: 4 },
    { id: 'angelfish', weight: 3 },
    { id: 'blue_tang', weight: 3 },
    { id: 'goldfish', weight: 2 },
    { id: 'butterfly_fish', weight: 2 },
    { id: 'mandarin_fish', weight: 2 },
    { id: 'parrotfish', weight: 2 },
    { id: 'barramundi', weight: 1.5 },
    { id: 'jellyfish', weight: 2 },
    { id: 'seahorse', weight: 2 },
    { id: 'cleaner_shrimp', weight: 1 },
    { id: 'seaturtle', weight: 1 },
    { id: 'octopus', weight: 1 },
    { id: 'manta', weight: 1 },
    { id: 'shark', weight: 1 },
    { id: 'lanternfish', weight: 1 },
    { id: 'giant_squid', weight: 0.4 },
];

export class FishSystem {
    private fishes: Fish[] = [];
    private scene: THREE.Scene;
    private physicsWorld: PhysicsWorld;
    private time: number = 0;
    private events: WildlifeEvent[] = [];
    private lastBoop = 0;
    private lastSting = 0;
    /** Reefs that already fired the emotional gather climax this dive */
    private gatherFired = new Set<string>();
    private gatherActive: { reefId: string; until: number } | null = null;
    /** Soft disc shadow under sky manta during glide */
    private mantaShadow: THREE.Mesh | null = null;

    constructor(scene: THREE.Scene, physicsWorld: PhysicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
    }

    /** Drain wildlife events for Game (shark push, jelly sting, etc.) */
    drainEvents(): WildlifeEvent[] {
        const e = this.events;
        this.events = [];
        return e;
    }

    getNearestFishMood(cameraPos: THREE.Vector3, maxDist = 6): {
        fish: Fish | null;
        mood: TrustState;
        dist: number;
        trust: number;
        trait: string;
    } {
        let best: Fish | null = null;
        let bestD = maxDist;
        for (const f of this.fishes) {
            const d = f.position.distanceTo(cameraPos);
            if (d < bestD) {
                bestD = d;
                best = f;
            }
        }
        const p = best ? getPersonality(best.speciesId) : null;
        return {
            fish: best,
            mood: best?.mood ?? 'calm',
            dist: bestD,
            trust: best?.trust ?? 0.4,
            trait: p?.trait ?? 'Wild',
        };
    }

    /** Record a gentle Observe — builds dive memory trust */
    recordGentleObserve(fish: Fish, quality: number): void {
        const p = getPersonality(fish.speciesId);
        fish.trust = Math.min(1, fish.trust + p.trustGain * (0.5 + quality));
        fish.mood = trustToState(fish.trust, false, false);
    }

    async init(): Promise<void> {
        console.log('🐟 FishSystem.init() — hero GLB + species-true creatures');
        try {
            await AssetLibrary.get().loadAll();
            const count =
                (typeof window !== 'undefined' &&
                    (window as any).qualityConfig?.fishCount) ??
                40;
            this.createFishSchool(count);
            let glb = 0;
            const counts: Record<string, number> = {};
            for (const f of this.fishes) {
                counts[f.speciesId] = (counts[f.speciesId] || 0) + 1;
                if (f.build?.group?.userData?.art === 'hero_glb') glb++;
            }
            // Birthday secret: elderly sea turtle (max trust → pearl)
            this.spawnElderTurtle();
            // Pass 1: composition heroes at Home Reef (mock plate silhouettes)
            this.spawnCompositionHeroes();
            console.log(
                `✅ Spawned ${this.fishes.length} (hero_glb=${glb}) quality=${count}`,
                counts
            );
        } catch (error) {
            console.error('❌ FishSystem initialization failed:', error);
            throw error;
        }
    }

    private spawnElderTurtle(): void {
        const fish = this.createFish('seaturtle');
        fish.isElder = true;
        fish.speciesId = 'seaturtle';
        fish.type = 'seaturtle';
        // Warm start — she has lived a long time and is almost ready
        fish.trust = 0.42;
        fish.mood = 'calm';
        // Quiet right-side pocket off golden path (findable after friend turtle)
        fish.position.set(7.2, 2.1, 16.5);
        fish.homeReefX = 7;
        fish.homeReefZ = 16;
        fish.group.scale.multiplyScalar(1.35);
        fish.group.position.copy(fish.position);
        fish.group.userData.isElder = true;
        try {
            const glow = new THREE.PointLight(0xffe8a0, 0.35, 5);
            glow.position.set(0, 0.3, 0);
            fish.group.add(glow);
        } catch {
            /* soft */
        }
        this.fishes.push(fish);
        this.scene.add(fish.group);
        console.log('Elder turtle placed (birthday secret — gentle trust → pearl)');
    }

    /**
     * MEMORY IMPLEMENTATION PASS 1 — staged emotional heroes only.
     * One friend turtle · one sky manta · one respect shark · two lantern jellies.
     * Plus a thin ribbon of school fish on the path (not a carpet).
     */
    private spawnCompositionHeroes(): void {
        const place = (
            id: string,
            x: number,
            y: number,
            z: number,
            scale: number,
            trust: number,
            role?: Fish['memoryRole']
        ): Fish => {
            const fish = this.createFish(id);
            fish.position.set(x, y, z);
            fish.homeReefX = x;
            fish.homeReefZ = z;
            fish.trust = trust;
            fish.peakTrust = trust;
            fish.mood = trustToState(trust, false, false);
            fish.baseScale = scale;
            fish.group.scale.setScalar(scale);
            fish.group.position.copy(fish.position);
            fish.velocity.set(0.05, 0, 0.05);
            if (role) {
                fish.memoryRole = role;
                fish.memoryPhase = 'wait';
                fish.memoryTimer = 0;
                fish.memoryDone = false;
            }
            this.fishes.push(fish);
            this.scene.add(fish.group);
            return fish;
        };

        // Stage marks from HomeReefStage bones (single source of truth)
        const heroes = [
            MEMORY_HEROES.friendTurtle,
            MEMORY_HEROES.skyManta,
            MEMORY_HEROES.respectShark,
            MEMORY_HEROES.lanternJellyA,
            MEMORY_HEROES.lanternJellyB,
        ];
        for (const h of heroes) {
            place(h.speciesId, h.x, h.y, h.z, h.scale, h.trust, h.role);
        }
        for (const r of PATH_RIBBON) {
            place(r.speciesId, r.x, r.y, r.z, r.scale, 0.4);
        }
        console.log('🎬 MEMORY heroes from HomeReefStage bones');
    }

    private ensureMantaShadow(): void {
        if (this.mantaShadow) return;
        const geo = new THREE.CircleGeometry(3.2, 24);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
        });
        const m = new THREE.Mesh(geo, mat);
        m.rotation.x = -Math.PI / 2;
        m.visible = false;
        m.name = 'MantaShadow';
        this.scene.add(m);
        this.mantaShadow = m;
    }

    /**
     * Film-style moment director — runs every frame for memory heroes only.
     * Obvious. Slow. Once.
     */
    private updateMemoryMoments(
        deltaTime: number,
        cameraPosition: THREE.Vector3,
        gentleness: number
    ): void {
        const calm = gentleness > 0.55;
        for (const fish of this.fishes) {
            if (!fish.memoryRole || fish.memoryDone) continue;
            fish.memoryTimer = (fish.memoryTimer || 0) + deltaTime;
            const dist = fish.position.distanceTo(cameraPosition);
            const phase = fish.memoryPhase || 'wait';

            // ── FRIEND TURTLE: notices → approaches → circles → leaves ──
            if (fish.memoryRole === 'friend_turtle') {
                if (phase === 'wait') {
                    // Idle gentle drift
                    fish.velocity.set(
                        Math.sin(this.time * 0.3) * 0.15,
                        0,
                        Math.cos(this.time * 0.25) * 0.12
                    );
                    // Notice when Jasmine is near and calm (obvious beat)
                    // Quicker notice — first 30s should not hunt forever
                    if (dist < TURTLE_NOTICE_DIST && calm && fish.memoryTimer > 0.8) {
                        fish.memoryPhase = 'notice';
                        fish.memoryTimer = 0;
                        this.events.push({
                            type: 'memory_moment',
                            id: 'turtle_notice',
                            line: 'She sees you…',
                        });
                    }
                } else if (phase === 'notice') {
                    // Face Jasmine, almost still
                    const toward = cameraPosition.clone().sub(fish.position);
                    toward.y = 0;
                    if (toward.lengthSq() > 0.01) {
                        fish.velocity.copy(toward.normalize().multiplyScalar(0.08));
                    }
                    if (fish.memoryTimer > 1.6) {
                        fish.memoryPhase = 'approach';
                        fish.memoryTimer = 0;
                        this.events.push({
                            type: 'memory_moment',
                            id: 'turtle_come',
                            line: 'The turtle is coming to see you.',
                        });
                    }
                } else if (phase === 'approach') {
                    const toward = cameraPosition.clone().sub(fish.position);
                    toward.y *= 0.3;
                    if (toward.length() > 3.2) {
                        fish.velocity.copy(toward.normalize().multiplyScalar(0.85));
                    } else {
                        fish.memoryPhase = 'circle';
                        fish.memoryTimer = 0;
                        fish.gatherAngle = Math.atan2(
                            fish.position.z - cameraPosition.z,
                            fish.position.x - cameraPosition.x
                        );
                        this.events.push({
                            type: 'memory_moment',
                            id: 'turtle_circle',
                            line: 'She came to see you.',
                        });
                    }
                } else if (phase === 'circle') {
                    fish.gatherAngle = (fish.gatherAngle || 0) + deltaTime * 0.45;
                    const r = 3.4;
                    const tx =
                        cameraPosition.x + Math.cos(fish.gatherAngle) * r;
                    const tz =
                        cameraPosition.z + Math.sin(fish.gatherAngle) * r;
                    const ty = cameraPosition.y + 0.1;
                    const to = new THREE.Vector3(
                        tx - fish.position.x,
                        ty - fish.position.y,
                        tz - fish.position.z
                    );
                    if (to.lengthSq() > 0.01) {
                        fish.velocity.copy(to.normalize().multiplyScalar(0.9));
                    }
                    if (fish.memoryTimer > 9) {
                        fish.memoryPhase = 'leave';
                        fish.memoryTimer = 0;
                    }
                } else if (phase === 'leave') {
                    // Continue journey — she remains “your” turtle in memory
                    fish.velocity.set(-0.9, 0.05, 0.55);
                    if (fish.memoryTimer > 6) {
                        fish.memoryDone = true;
                        fish.memoryPhase = 'done';
                        fish.trust = Math.min(1, fish.trust + 0.25);
                    }
                }
                // Override generic mood motion for staged turtle
                continue;
            }

            // ── SKY MANTA: one silent overhead glide (wings over Jasmine) ──
            if (fish.memoryRole === 'sky_manta') {
                if (phase === 'wait') {
                    // Hold left-high of corridor — visible if she looks up early
                    fish.position.set(-7, 5.6, 6.5);
                    fish.velocity.set(0, 0, 0);
                    if (cameraPosition.z > MANTA_TRIGGER_Z && cameraPosition.y < 5.5) {
                        fish.memoryPhase = 'glide';
                        fish.memoryTimer = 0;
                        // Start just left of player so pass is overhead
                        fish.position.set(
                            cameraPosition.x - 6,
                            cameraPosition.y + 3.2,
                            cameraPosition.z + 1.5
                        );
                        this.ensureMantaShadow();
                        this.events.push({
                            type: 'memory_moment',
                            id: 'manta_sky',
                            line: 'Look up…',
                        });
                    }
                } else if (phase === 'glide') {
                    // Slow cross directly over path — dominate sky
                    fish.velocity.set(1.1, 0.01, 0.25);
                    if (fish.position.y < cameraPosition.y + 2.4) {
                        fish.velocity.y = 0.15;
                    }
                    // Shadow on sand under wings
                    if (this.mantaShadow) {
                        this.mantaShadow.visible = true;
                        this.mantaShadow.position.set(
                            fish.position.x,
                            -2.2,
                            fish.position.z
                        );
                        const pulse = 0.35 + Math.sin(this.time * 2) * 0.05;
                        (this.mantaShadow.material as THREE.MeshBasicMaterial).opacity =
                            pulse;
                    }
                    if (fish.position.x > cameraPosition.x + 10 || fish.memoryTimer > 16) {
                        fish.memoryDone = true;
                        fish.memoryPhase = 'done';
                        fish.velocity.set(0.35, 0, 0.15);
                        if (this.mantaShadow) this.mantaShadow.visible = false;
                    }
                }
                continue;
            }

            // ── RESPECT SHARK: slow side-on patrol — profile majesty ───
            if (fish.memoryRole === 'respect_shark') {
                const ang = this.time * 0.09;
                // Orbit keeps body roughly side-on to path centre
                const cx = 10;
                const cz = 13;
                const tx = cx + Math.cos(ang) * 4.5;
                const tz = cz + Math.sin(ang) * 2.2;
                const to = new THREE.Vector3(
                    tx - fish.position.x,
                    3.1 - fish.position.y,
                    tz - fish.position.z
                );
                if (to.lengthSq() > 0.01) {
                    fish.velocity.copy(to.normalize().multiplyScalar(0.42));
                }
                // Soft respect only if too close — calm ancient, not a shove
                if (dist < 5.2 && dist > 0.4) {
                    const away = cameraPosition.clone().sub(fish.position).normalize();
                    this.events.push({
                        type: 'shark_respect',
                        strength: (1 - dist / 5.2) * 1.9,
                        dir: away,
                        line: 'Too close. Give her space.',
                    });
                }
                continue;
            }

            // ── LANTERN JELLY: glow pulse, slow drift ────────────────
            if (fish.memoryRole === 'lantern_jelly') {
                fish.velocity.set(
                    Math.sin(this.time * 0.4 + fish.swimPhase) * 0.12,
                    Math.sin(this.time * 0.7) * 0.08,
                    Math.cos(this.time * 0.35) * 0.1
                );
                // Strong emissive pulse so children want to approach
                fish.group.traverse((obj) => {
                    if (
                        obj instanceof THREE.Mesh &&
                        obj.material instanceof THREE.MeshStandardMaterial
                    ) {
                        obj.material.emissive = new THREE.Color(0x88e0ff);
                        obj.material.emissiveIntensity =
                            0.45 + Math.sin(this.time * 2.2 + fish.swimPhase) * 0.25;
                    }
                });
                if (dist < 6 && !fish.memoryDone && fish.memoryTimer > 3) {
                    // One soft “beauty first” cue
                    if (fish.memoryPhase === 'wait') {
                        fish.memoryPhase = 'seen';
                        this.events.push({
                            type: 'memory_moment',
                            id: 'jelly_lantern',
                            line: 'Living lights…',
                        });
                    }
                }
            }
        }
    }

    private pickSpecies(): string {
        const total = SPECIES_SPAWN.reduce((s, x) => s + x.weight, 0);
        let r = Math.random() * total;
        for (const entry of SPECIES_SPAWN) {
            r -= entry.weight;
            if (r <= 0) return entry.id;
        }
        return 'clownfish';
    }

    private createFishSchool(count: number): void {
        for (let i = 0; i < count; i++) {
            const speciesId = this.pickSpecies();
            const fish = this.createFish(speciesId);

            // ~85% on reefs, ~15% sparse open-water travelers (breathing room)
            let x: number, z: number, y: number;
            if (Math.random() < 0.85) {
                const reef = pickReefWeighted();
                const p = randomInReef(reef, 0.1, 0.9);
                x = p.x;
                z = p.z;
                y = reef.shelfY + 1.2 + Math.random() * 5;
            } else {
                const p = randomOpenWater(20, 60);
                x = p.x;
                z = p.z;
                y = 2 + Math.random() * 6;
            }

            fish.position.set(x, y, z);
            fish.homeReefX = x;
            fish.homeReefZ = z;

            fish.velocity.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 2
            );
            if (fish.velocity.lengthSq() < 0.01) {
                fish.velocity.set(1, 0, 0);
            }
            fish.velocity.normalize().multiplyScalar(fish.swimSpeed);

            fish.swimPhase = Math.random() * Math.PI * 2;

            this.fishes.push(fish);
            this.scene.add(fish.group);
            fish.group.position.copy(fish.position);
        }
    }

    private createFish(speciesId: string): Fish {
        const build = buildCreature(speciesId);
        const p = getPersonality(speciesId);
        return {
            mesh: build.mesh,
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            type: speciesId,
            speciesId,
            size: build.size,
            swimSpeed: build.swimSpeed,
            swimPhase: 0,
            group: build.group,
            build,
            mood: 'calm',
            moodTimer: 0,
            trust: p.baseTrust,
            homeReefX: 0,
            homeReefZ: 0,
            watchTimer: 0,
            peakTrust: p.baseTrust,
            rememberedToast: false,
            wasFarAfterMeet: false,
            gatherAngle: Math.random() * Math.PI * 2,
        };
    }

    /**
     * @param gentleness 0 thrash … 1 calm from SwimmerController
     */
    update(
        deltaTime: number,
        cameraPosition: THREE.Vector3,
        currentForce?: THREE.Vector3,
        gentleness: number = 0.7
    ): void {
        this.time += deltaTime;
        const g = Math.max(0, Math.min(1, gentleness));
        const thrashing = g < 0.45;

        const separationDistance = 2.2;
        const alignmentDistance = 5.5;
        const cohesionDistance = 9.0;

        let thrashNearAny = false;

        // MEMORY PASS: stage emotional heroes before generic boids
        this.updateMemoryMoments(deltaTime, cameraPosition, g);

        for (const fish of this.fishes) {
            fish.swimPhase += deltaTime * fish.swimSpeed * 2.2;
            fish.moodTimer = Math.max(0, fish.moodTimer - deltaTime);

            const p = getPersonality(fish.speciesId);
            const isSolitary =
                p.role === 'confident' ||
                p.role === 'gentle_giant' ||
                p.role === 'shy' ||
                p.role === 'curious_smart' ||
                p.role === 'deep' ||
                fish.speciesId === 'giant_squid';

            const dist = fish.position.distanceTo(cameraPosition);
            const { reef } = nearestReef(fish.position.x, fish.position.z);
            const reefH = getReefHealthSystem().getHealth(reef.id) / 100;

            // Staged memory heroes: velocity already set — skip thrash/school AI
            const memoryActive =
                !!fish.memoryRole &&
                !fish.memoryDone &&
                fish.memoryPhase !== 'done';
            if (memoryActive) {
                // Soft thrash still scares friend turtle mid-approach
                if (
                    fish.memoryRole === 'friend_turtle' &&
                    thrashing &&
                    dist < 5 &&
                    (fish.memoryPhase === 'approach' || fish.memoryPhase === 'circle')
                ) {
                    fish.memoryPhase = 'leave';
                    fish.memoryTimer = 0;
                    fish.velocity.set(-1.5, 0.2, 0.8);
                    this.events.push({
                        type: 'memory_moment',
                        id: 'turtle_scared',
                        line: 'You scared it — sit still…',
                    });
                }
                // Integrate position only (below shared block)
                const maxSpeed =
                    fish.swimSpeed *
                    (fish.memoryRole === 'sky_manta' ? 1.2 : 1.6);
                if (fish.velocity.length() > maxSpeed) {
                    fish.velocity.normalize().multiplyScalar(maxSpeed);
                }
                fish.position.add(fish.velocity.clone().multiplyScalar(deltaTime));
                if (fish.position.y < -5) fish.position.y = -5;
                if (fish.position.y > 12) fish.position.y = 12;
                fish.group.position.copy(fish.position);
                if (fish.velocity.lengthSq() > 0.01) {
                    const target = fish.position
                        .clone()
                        .add(fish.velocity.clone().normalize());
                    fish.group.lookAt(target);
                    fish.group.rotateY(Math.PI);
                }
                // Face Jasmine during turtle notice/approach
                if (
                    fish.memoryRole === 'friend_turtle' &&
                    (fish.memoryPhase === 'notice' ||
                        fish.memoryPhase === 'approach' ||
                        fish.memoryPhase === 'circle')
                ) {
                    fish.group.lookAt(cameraPosition);
                    fish.group.rotateY(Math.PI);
                }
                const bs = fish.baseScale || 1;
                fish.group.scale.setScalar(bs);
                animateCreature(fish.build, fish.swimPhase, deltaTime);
                continue;
            }

            // ── Trust memory (this dive only) ─────────────────────────
            if (dist < 8) {
                if (thrashing) {
                    fish.trust = Math.max(0, fish.trust - p.trustLoss * deltaTime);
                    thrashNearAny = true;
                } else if (g > 0.65) {
                    let gain = p.trustGain * deltaTime * (0.4 + g);
                    if (p.lovesCleanReefs) gain *= 0.7 + reefH * 0.8;
                    // Clownfish prefer anemone garden (near home origin cluster)
                    if (p.role === 'protective') {
                        const nearAnemone = Math.hypot(fish.position.x, fish.position.z) < 12;
                        if (nearAnemone && g > 0.55) gain *= 1.4;
                        else gain *= 0.5;
                    }
                    // Elder birthday turtle: patient calm pays faster (gift reachable)
                    if (fish.isElder && g > 0.7 && dist < 6) gain *= 1.55;
                    fish.trust = Math.min(1, fish.trust + gain);
                }
            }

            // Peak trust this dive (memory for recognition)
            fish.peakTrust = Math.max(fish.peakTrust ?? 0, fish.trust);

            const tooCloseRespect =
                p.respectRadius > 0 && dist < p.respectRadius * 0.85;
            fish.mood = trustToState(fish.trust, thrashing && dist < 7, tooCloseRespect);

            // Dirty reef → more wary baseline
            if (reefH < 0.4 && fish.mood === 'calm' && p.lovesCleanReefs) {
                fish.mood = 'wary';
            }
            // Thriving reef → more curious
            if (reefH > 0.75 && g > 0.6 && dist < 6 && fish.trust > 0.4) {
                if (fish.mood === 'calm') fish.mood = 'curious';
            }

            // ── Animal memory: "She remembers me!" ────────────────────
            // Mark if we left after earning trust, then celebrate return
            if (dist > 11 && (fish.peakTrust ?? 0) >= 0.6) {
                fish.wasFarAfterMeet = true;
            }
            if (
                !fish.rememberedToast &&
                fish.wasFarAfterMeet &&
                (fish.peakTrust ?? 0) >= 0.65 &&
                fish.trust >= 0.5 &&
                dist < 5 &&
                g > 0.6 &&
                !thrashing
            ) {
                fish.rememberedToast = true;
                const who =
                    p.role === 'shy' || p.role === 'gentle_giant'
                        ? 'She remembers you!'
                        : p.role === 'confident'
                          ? 'Quiet recognition.'
                          : 'It remembers you!';
                this.events.push({
                    type: 'remembers_you',
                    line: who,
                    icon:
                        fish.speciesId === 'seaturtle'
                            ? '🐢'
                            : fish.speciesId === 'manta'
                              ? '🐋'
                              : '💙',
                });
                // Swim over immediately — kids interpret trust
                fish.trust = Math.min(1, fish.trust + 0.12);
            }

            // ── Personality events ────────────────────────────────────
            // Shark: confident — only "Back up" when space invaded
            if (p.role === 'confident' && p.respectRadius > 0 && dist < p.respectRadius && dist > 0.25) {
                const away = cameraPosition.clone().sub(fish.position).normalize();
                this.events.push({
                    type: 'shark_respect',
                    strength: (1 - dist / p.respectRadius) * 2.6,
                    dir: away,
                    line: p.kidLine.respect || 'Too close. Back up.',
                });
            }

            // Jelly: exists — tingle if you swim through tentacles
            if (p.role === 'jelly' && p.tingleRadius > 0 && dist < p.tingleRadius) {
                if (this.time - this.lastSting > 2.8) {
                    this.lastSting = this.time;
                    this.events.push({ type: 'jelly_tingle', amount: 0.04 });
                }
            }

            // Octopus ink when startled (thrash close)
            if (
                p.role === 'curious_smart' &&
                thrashing &&
                dist < 3.5 &&
                this.time - this.lastBoop > 8 &&
                Math.random() < 0.015
            ) {
                this.lastBoop = this.time;
                this.events.push({
                    type: 'ink_puff',
                    x: fish.position.x,
                    y: fish.position.y,
                    z: fish.position.z,
                });
                fish.trust = Math.max(0, fish.trust - 0.2);
            }

            // School comic boop when high trust (not "annoyed")
            if (
                (p.role === 'school' || p.role === 'protective') &&
                fish.mood === 'trusting' &&
                dist < 1.9 &&
                g > 0.72 &&
                this.time - this.lastBoop > 14 &&
                Math.random() < 0.003
            ) {
                this.lastBoop = this.time;
                this.events.push({ type: 'comic_boop' });
            }

            // Curiosity: THEY watch YOU (slow orbit / face diver)
            if (
                p.watchesDiver &&
                (fish.mood === 'curious' || fish.mood === 'trusting')
            ) {
                if (dist < 5.5 && g > 0.58) {
                    fish.watchTimer = (fish.watchTimer || 0) + deltaTime;
                } else if (dist > 9) {
                    fish.watchTimer = 0;
                } else {
                    fish.watchTimer = Math.max(0, (fish.watchTimer || 0) - deltaTime * 0.35);
                }
            } else if (dist > 10) {
                fish.watchTimer = 0;
            }

            // Elder turtle birthday pearl — patient calm + high trust (reachable gift)
            if (
                fish.isElder &&
                !fish.pearlDropped &&
                fish.trust >= 0.82 &&
                dist < 5.2 &&
                g > 0.62
            ) {
                fish.pearlDropped = true;
                this.events.push({
                    type: 'birthday_pearl',
                    message: 'Happy Birthday Jasmine — Guardian of the Reef',
                });
            }

            // ── Movement ──────────────────────────────────────────────
            if (!isSolitary && fish.mood !== 'scared') {
                const separation = this.computeSeparation(fish, separationDistance);
                const alignment = this.computeAlignment(fish, alignmentDistance);
                const cohesion = this.computeCohesion(fish, cohesionDistance);
                // Dirty reefs: tighter nervous schools, fewer wanderers
                const schoolPull = reefH < 0.45 ? 1.3 : 0.9;
                fish.velocity.add(separation.multiplyScalar(1.5 * schoolPull));
                fish.velocity.add(alignment.multiplyScalar(1.0));
                fish.velocity.add(cohesion.multiplyScalar(schoolPull));
            } else if (isSolitary && p.role !== 'confident') {
                fish.velocity.x += (Math.random() - 0.5) * 0.05;
                fish.velocity.z += (Math.random() - 0.5) * 0.05;
            }

            // Dirty reef: fewer animals hang in open — pull shy ones to cover
            if (p.lovesCleanReefs && reefH < 0.4 && !isSolitary) {
                fish.velocity.add(
                    new THREE.Vector3(
                        fish.homeReefX - fish.position.x,
                        0,
                        fish.homeReefZ - fish.position.z
                    )
                        .normalize()
                        .multiplyScalar(0.06)
                );
            }

            if (p.role === 'confident') {
                const ang = this.time * 0.15 + fish.swimPhase;
                const tx = fish.homeReefX + Math.cos(ang) * 12;
                const tz = fish.homeReefZ + Math.sin(ang) * 9;
                const to = new THREE.Vector3(tx - fish.position.x, 0, tz - fish.position.z);
                if (to.lengthSq() > 0.01) {
                    fish.velocity.add(to.normalize().multiplyScalar(0.08));
                }
            }

            if (currentForce) {
                fish.velocity.add(currentForce.clone().multiplyScalar(deltaTime * 0.45));
            }

            // Trust-based motion
            const watching =
                p.watchesDiver &&
                (fish.watchTimer ?? 0) > 1.2 &&
                (fish.mood === 'curious' || fish.mood === 'trusting') &&
                dist < 6 &&
                g > 0.55;

            if (fish.mood === 'scared' && dist < 12) {
                // Pass 5: scatter is obvious
                const away = fish.position.clone().sub(cameraPosition).normalize();
                fish.velocity.add(away.multiplyScalar(3.2));
            } else if (watching) {
                // Curiosity magic: slow circle + face Jasmine
                fish.gatherAngle = (fish.gatherAngle ?? 0) + deltaTime * 0.35;
                const orbitR = Math.max(2.2, Math.min(4.2, dist));
                const ox = cameraPosition.x + Math.cos(fish.gatherAngle) * orbitR;
                const oz = cameraPosition.z + Math.sin(fish.gatherAngle) * orbitR;
                const oy = cameraPosition.y + Math.sin(this.time * 0.8 + fish.swimPhase) * 0.15;
                const toOrbit = new THREE.Vector3(
                    ox - fish.position.x,
                    oy - fish.position.y,
                    oz - fish.position.z
                );
                if (toOrbit.lengthSq() > 0.01) {
                    fish.velocity.add(toOrbit.normalize().multiplyScalar(0.42));
                }
                // Soft head-tilt feel via slight vertical bob bias
                fish.velocity.y += Math.sin(this.time * 2.2 + fish.swimPhase) * 0.02;
            } else if (
                (fish.mood === 'curious' || fish.mood === 'trusting') &&
                dist > 1.4 &&
                dist < 7
            ) {
                const toward = cameraPosition.clone().sub(fish.position).normalize();
                const pull =
                    fish.mood === 'trusting' ? 0.55 : 0.32 * (0.5 + fish.trust);
                fish.velocity.add(toward.multiplyScalar(pull));
            } else if (fish.mood === 'wary' && dist < 4.5) {
                const away = fish.position.clone().sub(cameraPosition).normalize();
                fish.velocity.add(away.multiplyScalar(0.85));
            } else if (
                p.escortsWhenTrusted &&
                fish.trust > 0.7 &&
                dist < 8 &&
                dist > 2 &&
                g > 0.55
            ) {
                // Manta escorts trusted divers
                const side = new THREE.Vector3(
                    -(cameraPosition.z - fish.position.z),
                    0.05,
                    cameraPosition.x - fish.position.x
                ).normalize();
                fish.velocity.add(side.multiplyScalar(0.35));
                fish.velocity.add(
                    cameraPosition
                        .clone()
                        .sub(fish.position)
                        .normalize()
                        .multiplyScalar(0.12)
                );
            }

            // Reef gather climax — entire reef accepts you (no XP, no chest)
            if (
                this.gatherActive &&
                this.gatherActive.until > this.time &&
                nearestReef(fish.position.x, fish.position.z).reef.id ===
                    this.gatherActive.reefId &&
                fish.mood !== 'scared'
            ) {
                fish.gatherAngle = (fish.gatherAngle ?? 0) + deltaTime * 0.28;
                const ring =
                    3.5 +
                    (fish.speciesId === 'manta' ? 4 : fish.speciesId === 'shark' ? 6 : 0) +
                    (fish.size || 1) * 0.4;
                const gx =
                    cameraPosition.x + Math.cos(fish.gatherAngle) * ring;
                const gz =
                    cameraPosition.z + Math.sin(fish.gatherAngle) * ring;
                const gy = cameraPosition.y + (fish.speciesId === 'manta' ? 0.8 : 0);
                const toG = new THREE.Vector3(
                    gx - fish.position.x,
                    gy - fish.position.y,
                    gz - fish.position.z
                );
                if (toG.lengthSq() > 0.04) {
                    fish.velocity.add(toG.normalize().multiplyScalar(0.55));
                }
            }

            if (fish.speciesId === 'seahorse') {
                fish.velocity.y += (2.5 - fish.position.y) * 0.02;
                fish.velocity.multiplyScalar(0.98);
            }
            if (fish.speciesId === 'jellyfish') {
                fish.velocity.y += Math.sin(fish.swimPhase) * 0.02;
            }

            const maxSpeed =
                fish.swimSpeed *
                (fish.mood === 'scared' ? 2.4 : isSolitary ? 1.4 : 1.8);
            if (fish.velocity.length() > maxSpeed) {
                fish.velocity.normalize().multiplyScalar(maxSpeed);
            }
            if (fish.velocity.length() < 0.12) {
                fish.velocity.normalize().multiplyScalar(0.12);
            }

            fish.position.add(fish.velocity.clone().multiplyScalar(deltaTime));

            const distanceFromOrigin = Math.hypot(fish.position.x, fish.position.z);
            if (distanceFromOrigin > 140) {
                fish.position.x *= 0.94;
                fish.position.z *= 0.94;
                fish.velocity.x *= -0.4;
                fish.velocity.z *= -0.4;
            }
            if (!isSolitary && Math.random() < 0.002) {
                const { reef, dist: rd } = nearestReef(fish.position.x, fish.position.z);
                if (rd > reef.radius * 2.5) {
                    fish.velocity.add(
                        new THREE.Vector3(
                            reef.x - fish.position.x,
                            0,
                            reef.z - fish.position.z
                        )
                            .normalize()
                            .multiplyScalar(0.4)
                    );
                }
            }
            if (fish.position.y < -6) {
                fish.position.y = -6;
                fish.velocity.y = Math.abs(fish.velocity.y) * 0.3;
            }
            if (fish.position.y > 12) {
                fish.position.y = 12;
                fish.velocity.y = -Math.abs(fish.velocity.y) * 0.3;
            }

            fish.group.position.copy(fish.position);

            // Face swim direction — OR face Jasmine when watching / gathering
            const facePlayer =
                (watching && dist < 5.5) ||
                (this.gatherActive &&
                    this.gatherActive.until > this.time &&
                    dist < 10);
            if (facePlayer) {
                fish.group.lookAt(cameraPosition);
                fish.group.rotateY(Math.PI);
                // Tiny "tilt head" curiosity roll
                fish.group.rotation.z =
                    Math.sin(this.time * 1.4 + fish.swimPhase) * 0.08;
            } else if (fish.velocity.lengthSq() > 0.01) {
                const target = fish.position.clone().add(fish.velocity.clone().normalize());
                fish.group.lookAt(target);
                fish.group.rotateY(Math.PI);
                fish.group.rotation.z *= 0.9;
            }

            // Pass 5: mood readable without meters
            const baseScale = fish.baseScale || (fish.isElder ? 1.25 : 1);
            if (fish.mood === 'scared') {
                fish.group.scale.setScalar(
                    baseScale * (0.97 + Math.sin(this.time * 12) * 0.02)
                );
            } else if (fish.mood === 'curious' || fish.mood === 'trusting') {
                fish.group.scale.setScalar(
                    baseScale * (1 + Math.sin(this.time * 3.5) * 0.035)
                );
            } else if (p.role === 'jelly' && dist < 5) {
                fish.group.scale.setScalar(
                    baseScale * (1 + Math.sin(this.time * 4) * 0.06)
                );
                fish.group.traverse((obj) => {
                    if (
                        obj instanceof THREE.Mesh &&
                        obj.material instanceof THREE.MeshStandardMaterial &&
                        obj.material.emissive
                    ) {
                        obj.material.emissiveIntensity =
                            0.25 + Math.sin(this.time * 3) * 0.15;
                    }
                });
            } else {
                fish.group.scale.setScalar(baseScale);
            }

            animateCreature(fish.build, fish.swimPhase, deltaTime);
        }

        if (thrashNearAny) {
            this.events.push({
                type: 'thrash_local',
                x: cameraPosition.x,
                z: cameraPosition.z,
            });
        }

        // ── Reef accepts you ──────────────────────────────────────────
        // Thriving reef + gentle diver nearby → whole community gathers.
        // No dialogue. No reward chest. No XP explosion.
        this.tryReefGather(cameraPosition, g);
    }

    private tryReefGather(cameraPosition: THREE.Vector3, gentleness: number): void {
        if (gentleness < 0.55) return;
        const { reef, dist } = nearestReef(cameraPosition.x, cameraPosition.z);
        if (dist > reef.radius * 1.15) return;
        const h = getReefHealthSystem().getHealth(reef.id);
        if (h < 88) return;
        if (this.gatherFired.has(reef.id)) return;

        // Need enough calm animals nearby to feel like a community
        let calmNear = 0;
        for (const f of this.fishes) {
            if (f.position.distanceTo(cameraPosition) < 18 && f.mood !== 'scared') {
                calmNear++;
            }
        }
        if (calmNear < 8) return;

        this.gatherFired.add(reef.id);
        this.gatherActive = { reefId: reef.id, until: this.time + 22 };
        this.events.push({ type: 'reef_gathers', reefName: reef.name });
        // Soft trust gift to everyone in the circle
        for (const f of this.fishes) {
            if (f.position.distanceTo(cameraPosition) < 22) {
                f.trust = Math.min(1, f.trust + 0.18);
                f.mood = trustToState(f.trust, false, false);
            }
        }
    }

    private computeSeparation(fish: Fish, distance: number): THREE.Vector3 {
        const steer = new THREE.Vector3();
        let count = 0;
        for (const other of this.fishes) {
            if (other === fish) continue;
            const dist = fish.position.distanceTo(other.position);
            if (dist < distance && dist > 0) {
                const diff = fish.position.clone().sub(other.position).normalize().divideScalar(dist);
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) {
            steer.divideScalar(count).normalize().multiplyScalar(2.0);
        }
        return steer;
    }

    private computeAlignment(fish: Fish, distance: number): THREE.Vector3 {
        const steer = new THREE.Vector3();
        let count = 0;
        for (const other of this.fishes) {
            if (other === fish) continue;
            // Prefer same-species schooling
            if (other.speciesId !== fish.speciesId) continue;
            const dist = fish.position.distanceTo(other.position);
            if (dist < distance && dist > 0) {
                steer.add(other.velocity);
                count++;
            }
        }
        if (count > 0) {
            steer.divideScalar(count).normalize().multiplyScalar(1.5);
        }
        return steer;
    }

    private computeCohesion(fish: Fish, distance: number): THREE.Vector3 {
        const sum = new THREE.Vector3();
        let count = 0;
        for (const other of this.fishes) {
            if (other === fish) continue;
            if (other.speciesId !== fish.speciesId) continue;
            const dist = fish.position.distanceTo(other.position);
            if (dist < distance && dist > 0) {
                sum.add(other.position);
                count++;
            }
        }
        if (count > 0) {
            sum.divideScalar(count);
            return sum.sub(fish.position).normalize().multiplyScalar(1.0);
        }
        return new THREE.Vector3();
    }

    getFishes(): Fish[] {
        return this.fishes;
    }

    removeFish(fish: Fish): void {
        const index = this.fishes.indexOf(fish);
        if (index > -1) {
            this.scene.remove(fish.group);
            fish.group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                    const m = child.material;
                    if (Array.isArray(m)) m.forEach((x) => x.dispose());
                    else if (m instanceof THREE.Material) m.dispose();
                }
            });
            this.fishes.splice(index, 1);

            // Respawn same species elsewhere so ocean stays full
            try {
                const replacement = this.createFish(fish.speciesId);
                const theta = Math.random() * Math.PI * 2;
                const radius = 10 + Math.random() * 8;
                replacement.position.set(
                    Math.cos(theta) * radius,
                    1 + Math.random() * 6,
                    Math.sin(theta) * radius
                );
                replacement.velocity.set(
                    (Math.random() - 0.5) * 2,
                    0,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(replacement.swimSpeed);
                replacement.swimPhase = Math.random() * Math.PI * 2;
                this.fishes.push(replacement);
                this.scene.add(replacement.group);
            } catch (e) {
                console.warn('Respawn fish failed', e);
            }
        }
    }

    getFishAtPosition(position: THREE.Vector3, radius: number = 1.5): Fish | null {
        for (const fish of this.fishes) {
            if (fish.position.distanceTo(position) < radius * Math.max(1, fish.size * 0.5)) {
                return fish;
            }
        }
        return null;
    }

    raycastForFish(
        raycaster: THREE.Raycaster,
        maxDistance: number = 5,
        coneDot: number = 0.65
    ): Fish | null {
        let nearestFish: Fish | null = null;
        let nearestDistance = maxDistance;

        const origin = raycaster.ray.origin;
        const lookDir = raycaster.ray.direction.clone().normalize();
        const toFish = new THREE.Vector3();

        for (const fish of this.fishes) {
            toFish.copy(fish.position).sub(origin);
            const distance = toFish.length();
            const hitRadius = maxDistance + fish.size * 0.5;
            if (distance <= 0.001 || distance > hitRadius) continue;
            if (distance > nearestDistance + fish.size * 0.3) continue;

            toFish.multiplyScalar(1 / distance);
            if (lookDir.dot(toFish) < coneDot) continue;

            nearestFish = fish;
            nearestDistance = distance;
        }

        return nearestFish;
    }
}
