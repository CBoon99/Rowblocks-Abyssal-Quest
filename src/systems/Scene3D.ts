import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';
import * as CANNON from 'cannon-es';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { WaterCaustics } from './WaterCaustics';
import { OceanEnvironment } from './OceanEnvironment';
import { REEF_ZONES, reefInfluence } from './WorldMap';
import { AssetLibrary } from './AssetLibrary';

/** Deep seafloor world Y — physics plane matches visual base. */
const FLOOR_Y = -12;
/** Legacy home shelf (home reef). */
const SHELF_Y = -2.5;
const SHELF_RADIUS = 11;
/** Water surface plane. */
const SURFACE_Y = 15;

export class Scene3D {
    private oceanFloor: THREE.Mesh | null = null;
    private waterSurface: THREE.Mesh | null = null;
    private ambientLight: THREE.HemisphereLight;
    private directionalLight: THREE.DirectionalLight;
    private fillLight: THREE.DirectionalLight;
    private pointLights: THREE.PointLight[] = [];
    private particles: THREE.Points | null = null;
    private particleVelocities: Float32Array | null = null;
    private time: number = 0;
    private waterCaustics!: WaterCaustics;
    private causticsProjector: THREE.SpotLight | null = null;
    private causticsTexture: THREE.Texture | null = null;
    private oceanEnv: OceanEnvironment | null = null;
    private floorBody: CANNON.Body | null = null;
    private underwaterFills: THREE.PointLight[] = [];
    private sandMaterial: THREE.MeshStandardMaterial | null = null;
    private envMap: THREE.Texture | null = null;

    constructor(
        private scene: THREE.Scene,
        private physicsWorld: PhysicsWorld
    ) {
        // Warm-sky / cool-floor — coral stays saturated, heroes read
        this.ambientLight = new THREE.HemisphereLight(
            0xb8e8ff,
            0x0a3548,
            0.78
        );
        this.scene.add(this.ambientLight);

        const qc =
            typeof window !== 'undefined' ? (window as any).qualityConfig : null;
        const shadowMapSize =
            qc && typeof qc.shadowMapSize === 'number' ? qc.shadowMapSize : 2048;
        const shadowsEnabled = qc ? !!qc.shadows : true;

        // Warm key sun (gold path + coral)
        this.directionalLight = new THREE.DirectionalLight(0xfff0dd, 1.55);
        this.directionalLight.position.set(18, 70, 35);
        this.directionalLight.castShadow = shadowsEnabled;
        this.directionalLight.shadow.mapSize.width = shadowMapSize;
        this.directionalLight.shadow.mapSize.height = shadowMapSize;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 400;
        this.directionalLight.shadow.camera.left = -80;
        this.directionalLight.shadow.camera.right = 80;
        this.directionalLight.shadow.camera.top = 80;
        this.directionalLight.shadow.camera.bottom = -80;
        this.directionalLight.shadow.bias = -0.0003;
        this.scene.add(this.directionalLight);

        // Cool side fill + slight rim for silhouettes
        this.fillLight = new THREE.DirectionalLight(0x5ec8ef, 0.55);
        this.fillLight.position.set(-40, 22, -20);
        this.scene.add(this.fillLight);
    }

    async init(): Promise<void> {
        console.log('🌊 Scene3D.init() started — vertical slice Pass 1 palette');
        try {
            // Clear navy — midground heroes must read
            // Clear mid-water so heroes read; open ocean still softens with depth
            this.scene.background = new THREE.Color(0x0a5c82);
            this.scene.fog = new THREE.FogExp2(0x0c6290, 0.0054);

            console.log('💧 Initializing water caustics...');
            this.waterCaustics = new WaterCaustics();

            console.log('🏔️ Creating ocean floor + reef shelf...');
            await this.createOceanFloor();
            console.log('✅ Ocean floor created');

            console.log('🪸 Building reef environment (rocks, coral, kelp, god rays)...');
            this.oceanEnv = new OceanEnvironment(this.scene);
            this.oceanEnv.build(SHELF_Y, SHELF_RADIUS);
            console.log('✅ Reef environment created');

            console.log('🌊 Creating water surface...');
            this.createWaterSurface();
            console.log('✅ Water surface created');

            console.log('✨ Creating marine snow / plankton...');
            this.createParticles();
            console.log('✅ Particles created');

            console.log('💡 Creating lights...');
            this.createBioluminescentLights();
            this.createUnderwaterFillLights();
            console.log('✅ Lights created');

            console.log('💧 Creating caustics projector...');
            this.createCausticsProjector();
            console.log('✅ Caustics projector created');

            console.log('🌅 Loading env HDR (CC0 Poly Haven)…');
            await this.loadEnvironmentMap();
            console.log('✅ Scene3D initialized successfully');
        } catch (error) {
            console.error('❌ Scene3D initialization failed:', error);
            throw error;
        }
    }

    /** Soft HDR fill for PBR materials — not a visible skybox underwater */
    private async loadEnvironmentMap(): Promise<void> {
        try {
            const rgbe = new RGBELoader();
            const hdr = await rgbe.loadAsync('/textures/env/sky_1k.hdr');
            hdr.mapping = THREE.EquirectangularReflectionMapping;
            this.envMap = hdr;
            this.scene.environment = hdr;
            // Do not set scene.background — keep fog/color underwater look
            console.log('  ✅ HDR env map applied (reflections only)');
        } catch (e) {
            console.warn('  ⚠️ HDR env skipped', e);
        }
    }

    /**
     * Procedural sand grain albedo map.
     */
    private createSandTexture(): THREE.CanvasTexture {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Base sand
        ctx.fillStyle = '#c9b896';
        ctx.fillRect(0, 0, size, size);

        // Grain noise
        const img = ctx.getImageData(0, 0, size, size);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            const n = (Math.random() - 0.5) * 48;
            d[i] = Math.min(255, Math.max(0, d[i] + n));
            d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n * 0.9));
            d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n * 0.7));
        }
        ctx.putImageData(img, 0, 0);

        // Speckles / shell flecks
        for (let i = 0; i < 1200; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 0.5 + Math.random() * 2.2;
            const shade = 160 + Math.floor(Math.random() * 70);
            ctx.fillStyle = `rgba(${shade}, ${shade - 20}, ${shade - 40}, ${0.15 + Math.random() * 0.35})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Subtle darker patches
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 20 + Math.random() * 60;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(90, 70, 45, 0.12)');
            g.addColorStop(1, 'rgba(90, 70, 45, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(24, 24);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
    }

    private smoothstep(edge0: number, edge1: number, x: number): number {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    private async createOceanFloor(): Promise<void> {
        // Terrain resolution from quality tier
        const qc =
            typeof window !== 'undefined' ? (window as any).qualityConfig : null;
        const segs =
            qc && typeof qc.terrainSegments === 'number' ? qc.terrainSegments : 256;
        const size = 420; // bigger world for birthday archipelago
        const geometry = new THREE.PlaneGeometry(size, size, segs, segs);

        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const dist = Math.sqrt(x * x + y * y);

            // Multi-octave deep sand dunes (open ocean is quieter)
            const n1 = Math.sin(x * 0.028) * Math.cos(y * 0.028) * 1.6;
            const n2 = Math.sin(x * 0.09 + 1.7) * Math.cos(y * 0.08) * 0.7;
            const n3 = Math.sin(x * 0.22) * Math.cos(y * 0.24 + 0.5) * 0.28;
            let h = n1 + n2 + n3;

            // Discrete reef islands only (open water between stays deep)
            let reefH = 0;
            let reefW = 0;
            for (const reef of REEF_ZONES) {
                const dx = x - reef.x;
                const dy = y - reef.z; // plane local Y is world Z
                const d = Math.sqrt(dx * dx + dy * dy);
                const inner = reef.radius * 0.75;
                const outer = reef.radius * 1.4;
                let w = 0;
                if (d <= inner) w = 1;
                else if (d < outer) {
                    const t = (d - inner) / (outer - inner);
                    w = 1 - t * t * (3 - 2 * t);
                }
                if (w > 0) {
                    const target = reef.shelfY - FLOOR_Y;
                    const micro =
                        Math.sin(dx * 0.25) * Math.cos(dy * 0.22) * 0.3;
                    reefH += (target + micro) * w;
                    reefW += w;
                }
            }
            if (reefW > 0) {
                const nw = Math.min(1, reefW);
                h = h * (1 - nw * 0.9) + (reefH / reefW) * nw;
            }

            // Pass 1: sandy swim corridor on Home Reef (mock composition path)
            // Flatten + slightly raise a lane along +Z for clear framing
            {
                const pathX = Math.abs(x - 0);
                const pathZ = y; // plane local Y = world Z
                if (pathX < 4.5 && pathZ > -2 && pathZ < 22) {
                    const edge = this.smoothstep(4.5, 1.2, pathX);
                    const shelf = SHELF_Y - FLOOR_Y + 0.15;
                    h = h * (1 - edge * 0.92) + shelf * edge * 0.92;
                }
            }

            positions.setZ(i, h);
        }
        geometry.computeVertexNormals();

        // Prefer Poly Haven coast sand (CC0); fallback procedural canvas
        await AssetLibrary.get().loadAll();
        const art = AssetLibrary.get().sand;
        const sandMap = art.map || this.createSandTexture();
        const causticsMap = this.waterCaustics.getTexture();

        this.sandMaterial = new THREE.MeshStandardMaterial({
            // Golden swim lane (reference)
            color: art.map ? 0xffe8c8 : 0xe8d4a8,
            map: sandMap,
            normalMap: art.normalMap || undefined,
            normalScale: new THREE.Vector2(1.15, 1.15),
            roughnessMap: art.roughnessMap || undefined,
            roughness: art.roughnessMap ? 1.0 : 0.88,
            metalness: 0.02,
            emissive: new THREE.Color(0x1a4a55),
            emissiveMap: causticsMap,
            emissiveIntensity: 0.16,
            envMapIntensity: 0.5,
        });

        this.oceanFloor = new THREE.Mesh(geometry, this.sandMaterial);
        this.oceanFloor.rotation.x = -Math.PI / 2;
        this.oceanFloor.position.y = FLOOR_Y;
        this.oceanFloor.receiveShadow = true;
        this.oceanFloor.castShadow = false;
        this.oceanFloor.name = 'OceanFloor';
        this.scene.add(this.oceanFloor);

        // Physics plane at visual base height
        const floorShape = new CANNON.Plane();
        this.floorBody = new CANNON.Body({ mass: 0 });
        this.floorBody.addShape(floorShape);
        this.floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.floorBody.position.set(0, FLOOR_Y, 0);
        this.physicsWorld.addBody(this.floorBody);

        console.log(
            `✅ Seafloor: ${segs}x${segs} segs, base Y=${FLOOR_Y}, reef shelf ~Y=${SHELF_Y} r=${SHELF_RADIUS}`
        );
    }

    private createWaterSurface(): void {
        const geo = new THREE.PlaneGeometry(480, 480, 64, 64);
        const mat = new THREE.MeshPhysicalMaterial({
            color: 0x1a6a8a,
            transparent: true,
            opacity: 0.35,
            roughness: 0.15,
            metalness: 0.1,
            transmission: 0.55,
            thickness: 1.5,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.waterSurface = new THREE.Mesh(geo, mat);
        this.waterSurface.rotation.x = -Math.PI / 2;
        this.waterSurface.position.y = SURFACE_Y;
        this.waterSurface.renderOrder = 2;
        this.waterSurface.name = 'WaterSurface';
        // Store base positions for ripple animation
        const pos = geo.attributes.position;
        const base = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
            base[i * 3] = pos.getX(i);
            base[i * 3 + 1] = pos.getY(i);
            base[i * 3 + 2] = pos.getZ(i);
        }
        (geo as any).userData.basePositions = base;
        this.scene.add(this.waterSurface);
    }

    private createParticles(): void {
        const qc =
            typeof window !== 'undefined' ? (window as any).qualityConfig : null;
        // Memory Pass: cut snow ~70% — was confetti killing every moment
        const raw =
            qc && typeof qc.marineSnow === 'number' ? qc.marineSnow : 800;
        const particleCount = Math.max(40, Math.floor(raw * 0.28));
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        this.particleVelocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 80;
            positions[i3 + 1] = FLOOR_Y + 2 + Math.random() * (SURFACE_Y - FLOOR_Y - 4);
            positions[i3 + 2] = (Math.random() - 0.5) * 80;

            this.particleVelocities[i3] = (Math.random() - 0.5) * 0.12;
            this.particleVelocities[i3 + 1] = 0.04 + Math.random() * 0.08;
            this.particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.12;

            // Soft cyan dust — never pure white squares
            colors[i3] = 0.55 + Math.random() * 0.2;
            colors[i3 + 1] = 0.75 + Math.random() * 0.15;
            colors[i3 + 2] = 0.9 + Math.random() * 0.1;
            sizes[i] = 0.04 + Math.random() * 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.12,
            vertexColors: true,
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false,
        });

        this.particles = new THREE.Points(geometry, material);
        this.particles.name = 'MarineSnow';
        this.scene.add(this.particles);
    }

    private createBioluminescentLights(): void {
        // Gift day: 3 soft accents, not a disco
        for (let i = 0; i < 3; i++) {
            const light = new THREE.PointLight(0x66e0ff, 0.18, 22);
            const a = (i / 3) * Math.PI * 2 + 0.4;
            const r = 12 + i * 6;
            light.position.set(
                Math.cos(a) * r,
                SHELF_Y + 2 + i * 1.5,
                Math.sin(a) * r
            );
            this.scene.add(light);
            this.pointLights.push(light);
            (light as any).audioPosition = light.position.clone();
        }
    }

    private createUnderwaterFillLights(): void {
        // Sparse path fills only — heroes still readable, no light soup
        const fills: Array<[number, number, number, number]> = [
            [0, 5, 8, 0.32], // golden path centre
            [-6, 4, 10, 0.22], // turtle stage
            [5, 5, 9, 0.2], // mid path
        ];
        for (const [x, y, z, intensity] of fills) {
            const l = new THREE.PointLight(0x55ccee, intensity, 38);
            l.position.set(x, y, z);
            this.scene.add(l);
            this.underwaterFills.push(l);
        }
    }

    getBioluminescentPositions(): THREE.Vector3[] {
        return this.pointLights.map((light) => light.position.clone());
    }

    /**
     * Animate caustics, kelp, particles, surface ripples, fog by depth.
     * @param cameraPosition optional — when provided, fog density scales with depth
     */
    update(deltaTime: number, cameraPosition?: THREE.Vector3): void {
        this.time += deltaTime;

        // Marine snow drift
        if (this.particles && this.particleVelocities) {
            const positions = this.particles.geometry.attributes.position;
            const vel = this.particleVelocities;
            for (let i = 0; i < positions.count; i++) {
                const i3 = i * 3;
                positions.array[i3] += vel[i3] * deltaTime;
                positions.array[i3 + 1] +=
                    vel[i3 + 1] * deltaTime + Math.sin(this.time * 0.4 + i * 0.01) * 0.004;
                positions.array[i3 + 2] += vel[i3 + 2] * deltaTime;

                // Wrap volume
                if (positions.array[i3] > 50) positions.array[i3] = -50;
                if (positions.array[i3] < -50) positions.array[i3] = 50;
                if (positions.array[i3 + 2] > 50) positions.array[i3 + 2] = -50;
                if (positions.array[i3 + 2] < -50) positions.array[i3 + 2] = 50;
                if (positions.array[i3 + 1] > SURFACE_Y - 1) {
                    positions.array[i3 + 1] = FLOOR_Y + 1;
                }
                if (positions.array[i3 + 1] < FLOOR_Y + 0.5) {
                    positions.array[i3 + 1] = SURFACE_Y - 2;
                }
            }
            positions.needsUpdate = true;
        }

        // Bioluminescent pulse
        this.pointLights.forEach((light, i) => {
            const pulse = Math.sin(this.time * 1.6 + i) * 0.25 + 0.75;
            light.intensity = 0.35 * pulse;
            light.position.y += Math.sin(this.time * 0.8 + i) * 0.01;
        });

        // Slow sun drift
        this.directionalLight.position.x = 40 + Math.sin(this.time * 0.05) * 12;
        this.directionalLight.position.z = 30 + Math.cos(this.time * 0.05) * 12;

        // Caustics texture scroll
        this.waterCaustics.update(deltaTime);

        // Caustics projector orbit
        if (this.causticsProjector) {
            const radius = 18;
            this.causticsProjector.position.x = Math.sin(this.time * 0.08) * radius;
            this.causticsProjector.position.z = Math.cos(this.time * 0.08) * radius;
            this.causticsProjector.position.y = SURFACE_Y - 2;
            this.causticsProjector.target.position.set(0, SHELF_Y, 0);
            this.causticsProjector.target.updateMatrixWorld();

            if (this.causticsTexture) {
                this.causticsTexture.offset.x += deltaTime * 0.08;
                this.causticsTexture.offset.y += deltaTime * 0.04;
                if (this.causticsTexture.offset.x > 1) this.causticsTexture.offset.x -= 1;
                if (this.causticsTexture.offset.y > 1) this.causticsTexture.offset.y -= 1;
            }
        }

        // Water surface ripples
        if (this.waterSurface) {
            const geo = this.waterSurface.geometry as THREE.PlaneGeometry;
            const pos = geo.attributes.position;
            const base: Float32Array | undefined = (geo as any).userData.basePositions;
            if (base) {
                for (let i = 0; i < pos.count; i++) {
                    const bx = base[i * 3];
                    const by = base[i * 3 + 1];
                    const wave =
                        Math.sin(bx * 0.08 + this.time * 1.2) * 0.15 +
                        Math.cos(by * 0.1 + this.time * 0.9) * 0.12 +
                        Math.sin((bx + by) * 0.05 + this.time * 0.6) * 0.08;
                    pos.setZ(i, base[i * 3 + 2] + wave);
                }
                pos.needsUpdate = true;
                geo.computeVertexNormals();
            }
        }

        // Kelp / god rays
        this.oceanEnv?.update(deltaTime);

        // Memory Pass fog: clear on reef (moments readable), deeper open blue
        if (cameraPosition && this.scene.fog instanceof THREE.FogExp2) {
            const depth = Math.max(0, SURFACE_Y - cameraPosition.y);
            const inf = reefInfluence(cameraPosition.x, cameraPosition.z);
            const open = 1 - inf;
            // Light shelf so turtle/manta/shark read; open blue still has depth
            const baseDensity = 0.0036 + open * 0.0095 + (depth / 80) * 0.0065;
            this.scene.fog.density = baseDensity;
            // Slightly warmer teal on reef, cooler open water
            const r = 0.035 * inf + 0.018 * open;
            const g = 0.32 * inf + 0.12 * open;
            const b = 0.52 * inf + 0.3 * open;
            this.scene.fog.color.setRGB(r, g, b);
            if (this.scene.background instanceof THREE.Color) {
                this.scene.background.setRGB(
                    Math.min(1, r * 1.05),
                    Math.min(1, g * 1.02),
                    Math.min(1, b * 1.02)
                );
            }
        }

        // Subtle caustics — don't bleach sand
        if (this.sandMaterial) {
            let e = 0.14 + Math.sin(this.time * 0.7) * 0.04;
            // Memory: reef thanks you — warm pulse after clean
            try {
                const pulse = (window as any).__reefThanksPulse;
                if (pulse && performance.now() - pulse.t < 4000) {
                    const u = 1 - (performance.now() - pulse.t) / 4000;
                    e += 0.2 * u;
                    this.sandMaterial.emissive = new THREE.Color(0x3a8a6a).lerp(
                        new THREE.Color(0x1a4a55),
                        1 - u
                    );
                } else {
                    this.sandMaterial.emissive = new THREE.Color(0x1a4a55);
                }
            } catch {
                /* soft */
            }
            this.sandMaterial.emissiveIntensity = Math.min(0.35, e);
        }

        // Home reef brighter fill when thriving
        try {
            const h =
                (window as any).__reefThanksPulse?.health ??
                60;
            if (this.ambientLight) {
                this.ambientLight.intensity = 0.68 + Math.min(0.2, (h - 50) / 200);
            }
        } catch {
            /* soft */
        }
    }

    private createCausticsProjector(): void {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        const imageData = ctx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor(i / 4 / size);
            const n1 = Math.sin(x * 0.08) * Math.cos(y * 0.09);
            const n2 = Math.sin(x * 0.15 + y * 0.12) * 0.5;
            const noise = Math.pow(Math.max(0, (n1 + n2) * 0.5 + 0.5), 2.2);
            imageData.data[i] = noise * 200;
            imageData.data[i + 1] = noise * 230;
            imageData.data[i + 2] = noise * 255;
            imageData.data[i + 3] = noise * 220;
        }
        ctx.putImageData(imageData, 0, 0);

        this.causticsTexture = new THREE.CanvasTexture(canvas);
        this.causticsTexture.wrapS = THREE.RepeatWrapping;
        this.causticsTexture.wrapT = THREE.RepeatWrapping;
        this.causticsTexture.repeat.set(3, 3);

        this.causticsProjector = new THREE.SpotLight(0xaad4ff, 2.2, 120, Math.PI / 3.2, 0.45, 1.2);
        this.causticsProjector.position.set(0, SURFACE_Y - 2, 0);
        this.causticsProjector.target.position.set(0, SHELF_Y, 0);
        this.causticsProjector.castShadow = true;
        this.causticsProjector.shadow.mapSize.width = 1024;
        this.causticsProjector.shadow.mapSize.height = 1024;
        (this.causticsProjector as any).map = this.causticsTexture;

        this.scene.add(this.causticsProjector);
        this.scene.add(this.causticsProjector.target);
    }

    getLightPosition(): THREE.Vector3 {
        return this.directionalLight.position.clone();
    }

    /** Exposed for systems that need floor height alignment. */
    getFloorY(): number {
        return FLOOR_Y;
    }

    getShelfY(): number {
        return SHELF_Y;
    }
}
