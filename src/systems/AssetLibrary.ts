/**
 * Central art loader — textures + per-species hero GLBs (CC0 / open sources).
 * Drop files at public/models/creatures/{speciesId}.glb — auto-loaded.
 * See docs/ART_SOURCES.md
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type TextureSet = {
    map?: THREE.Texture;
    normalMap?: THREE.Texture;
    roughnessMap?: THREE.Texture;
    displacementMap?: THREE.Texture;
};

const texLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

/** Known species ids we try to load as GLB */
export const CREATURE_GLB_CANDIDATES = [
    'clownfish',
    'angelfish',
    'blue_tang',
    'parrotfish',
    'shark',
    'jellyfish',
    'seahorse',
    'seaturtle',
    'octopus',
    'manta',
    'lanternfish',
    'cleaner_shrimp',
    'giant_squid',
    'goldfish',
    'butterfly_fish',
    'mandarin_fish',
    'barramundi',
] as const;

function loadTex(url: string, colorSpace = true): Promise<THREE.Texture | null> {
    return new Promise((resolve) => {
        texLoader.load(
            url,
            (t) => {
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                t.anisotropy = 8;
                if (colorSpace) t.colorSpace = THREE.SRGBColorSpace;
                t.needsUpdate = true;
                resolve(t);
            },
            undefined,
            () => resolve(null)
        );
    });
}

async function loadGltf(url: string): Promise<THREE.Group | null> {
    try {
        const gltf = await gltfLoader.loadAsync(url);
        const root = gltf.scene;
        root.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
                const m = c as THREE.Mesh;
                m.castShadow = true;
                m.receiveShadow = true;
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                mats.forEach((mat) => {
                    if (!mat) return;
                    const sm = mat as THREE.MeshStandardMaterial;
                    if (sm.map) sm.map.colorSpace = THREE.SRGBColorSpace;
                    if ('envMapIntensity' in sm) sm.envMapIntensity = 0.75;
                    if ('roughness' in sm && sm.roughness == null) sm.roughness = 0.5;
                    sm.needsUpdate = true;
                });
            }
        });
        // Normalize to ~1 unit max dimension
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        root.scale.multiplyScalar(1.2 / maxDim);
        // Center
        box.setFromObject(root);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.sub(center);
        return root;
    } catch {
        return null;
    }
}

export class AssetLibrary {
    private static inst: AssetLibrary | null = null;
    sand: TextureSet = {};
    rock: TextureSet = {};
    coral: TextureSet = {};
    /** speciesId → template group */
    creatureTemplates = new Map<string, THREE.Group>();
    /** Barramundi fallback template */
    heroFishTemplate: THREE.Group | null = null;
    ready = false;

    static get(): AssetLibrary {
        if (!this.inst) this.inst = new AssetLibrary();
        return this.inst;
    }

    async loadAll(): Promise<void> {
        if (this.ready) return;
        console.log('🎨 AssetLibrary: loading full art pack…');

        const [sandDiff, sandNor, sandRough, sandDisp, sandDiff2, rockDiff, rockNor, coralDiff, coralNor] =
            await Promise.all([
                loadTex('/textures/sand/diff.jpg', true),
                loadTex('/textures/sand/nor.jpg', false),
                loadTex('/textures/sand/rough.jpg', false),
                loadTex('/textures/sand/disp.jpg', false),
                loadTex('/textures/sand/diff2.jpg', true),
                loadTex('/textures/rock/diff.jpg', true),
                loadTex('/textures/rock/nor.jpg', false),
                loadTex('/textures/coral/diff.jpg', true),
                loadTex('/textures/coral/nor.jpg', false),
            ]);

        if (sandDiff) {
            sandDiff.repeat.set(56, 56);
            this.sand.map = sandDiff;
        }
        if (sandDiff2 && !sandDiff) {
            sandDiff2.repeat.set(56, 56);
            this.sand.map = sandDiff2;
        }
        if (sandNor) {
            sandNor.repeat.set(56, 56);
            this.sand.normalMap = sandNor;
        }
        if (sandRough) {
            sandRough.repeat.set(56, 56);
            this.sand.roughnessMap = sandRough;
        }
        if (sandDisp) {
            sandDisp.repeat.set(56, 56);
            this.sand.displacementMap = sandDisp;
        }
        if (rockDiff) {
            rockDiff.repeat.set(2.5, 2.5);
            this.rock.map = rockDiff;
        }
        if (rockNor) {
            rockNor.repeat.set(2.5, 2.5);
            this.rock.normalMap = rockNor;
        }
        if (coralDiff) {
            coralDiff.repeat.set(2, 2);
            this.coral.map = coralDiff;
        }
        if (coralNor) {
            coralNor.repeat.set(2, 2);
            this.coral.normalMap = coralNor;
        }

        // Load all creature GLBs in parallel
        const loads = CREATURE_GLB_CANDIDATES.map(async (id) => {
            const g = await loadGltf(`/models/creatures/${id}.glb`);
            if (g) {
                this.creatureTemplates.set(id, g);
                console.log(`  ✅ creature GLB: ${id}`);
            }
        });
        // Also barramundi as generic hero fallback
        loads.push(
            (async () => {
                const g = await loadGltf('/models/creatures/barramundi.glb');
                if (g) {
                    this.heroFishTemplate = g;
                    this.creatureTemplates.set('barramundi', g);
                    console.log('  ✅ creature GLB: barramundi (hero fallback)');
                }
            })()
        );
        await Promise.all(loads);

        this.ready = true;
        console.log(
            `✅ AssetLibrary ready — ${this.creatureTemplates.size} creature meshes, sand=${!!this.sand.map}`
        );
    }

    /** Prefer exact species GLB, else aliases, else barramundi tint. */
    getCreatureTemplate(speciesId: string): THREE.Group | null {
        const key = speciesId.toLowerCase().replace(/\s+/g, '_');
        if (this.creatureTemplates.has(key)) {
            return this.creatureTemplates.get(key)!;
        }
        // aliases (same-family only — never shark→barramundi)
        const aliases: Record<string, string> = {
            reef_shark: 'shark',
            sea_turtle: 'seaturtle',
            manta_ray: 'manta',
            // stylized school fish may share GLBs when exact missing
            angelfish: 'butterfly_fish',
        };
        const a = aliases[key];
        if (a && this.creatureTemplates.has(a)) return this.creatureTemplates.get(a)!;

        // Heroes must use procedural FishModels if no exact GLB
        // (shark/manta/turtle/jelly/octopus never become barramundi)
        const neverFallback = new Set([
            'shark',
            'reef_shark',
            'manta',
            'manta_ray',
            'seaturtle',
            'sea_turtle',
            'jellyfish',
            'octopus',
            'seahorse',
            'giant_squid',
            'cleaner_shrimp',
        ]);
        if (neverFallback.has(key)) return null;

        // Exact GLB only for school fish — NEVER tint barramundi as clownfish/parrot/etc.
        // Missing GLB → FishModels procedural (species-true markings).
        return this.creatureTemplates.get(key) || null;
    }

    cloneCreature(
        speciesId: string,
        opts?: { scale?: number; tint?: number; emissive?: number; emisI?: number }
    ): THREE.Group | null {
        const tpl = this.getCreatureTemplate(speciesId);
        if (!tpl) return null;
        const g = tpl.clone(true);
        const scale = opts?.scale ?? 1;
        g.scale.multiplyScalar(scale);
        // Face +Z swim direction (adjust if models face -Z)
        g.rotation.y = Math.PI;

        if (opts?.tint != null || opts?.emissive != null) {
            g.traverse((c) => {
                if ((c as THREE.Mesh).isMesh) {
                    const m = c as THREE.Mesh;
                    const src = Array.isArray(m.material) ? m.material[0] : m.material;
                    if (!src) return;
                    const mat = (src as THREE.MeshStandardMaterial).clone();
                    if (opts.tint != null) {
                        // Soft multiply so textured models keep detail
                        if (mat.map) {
                            mat.color = new THREE.Color(opts.tint).lerp(new THREE.Color(0xffffff), 0.35);
                        } else {
                            mat.color = new THREE.Color(opts.tint);
                        }
                    }
                    if (opts.emissive != null) {
                        mat.emissive = new THREE.Color(opts.emissive);
                        mat.emissiveIntensity = opts.emisI ?? 0.15;
                    }
                    mat.envMapIntensity = 0.8;
                    mat.needsUpdate = true;
                    m.material = mat;
                    m.castShadow = true;
                    m.receiveShadow = true;
                }
            });
        } else {
            g.traverse((c) => {
                if ((c as THREE.Mesh).isMesh) {
                    (c as THREE.Mesh).castShadow = true;
                    (c as THREE.Mesh).receiveShadow = true;
                }
            });
        }
        return g;
    }

    /** @deprecated use cloneCreature */
    cloneHeroFish(tint: number, scale = 1, emissive = 0x000000, emisI = 0): THREE.Group | null {
        return this.cloneCreature('barramundi', { tint, scale, emissive, emisI });
    }
}
