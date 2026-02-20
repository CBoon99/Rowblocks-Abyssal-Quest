import * as THREE from 'three';
// Note: These imports may need adjustment based on Three.js version
// For Three.js r165+, use: three/examples/jsm/postprocessing/
// For newer versions, use: three/addons/postprocessing/
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

// Caustics shader
const causticsShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2() },
        lightPosition: { value: new THREE.Vector3(0.5, 0.8, 0.5) },
        lightIntensity: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform vec2 resolution;
        uniform vec3 lightPosition;
        uniform float lightIntensity;
        varying vec2 vUv;
        
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        float caustics(vec2 uv, float time) {
            float scale = 2.0;
            float speed = 0.5;
            vec2 p = uv * scale + vec2(time * speed, time * speed * 0.7);
            float n = 0.0;
            n += smoothNoise(p) * 0.5;
            n += smoothNoise(p * 2.0) * 0.25;
            n += smoothNoise(p * 4.0) * 0.125;
            n += smoothNoise(p * 8.0) * 0.0625;
            float caustic = sin(n * 3.14159) * 0.5 + 0.5;
            caustic = pow(caustic, 2.0);
            return caustic;
        }
        
        void main() {
            vec2 uv = vUv;
            vec4 color = texture2D(tDiffuse, uv);
            float caustic = caustics(uv, time);
            vec3 causticColor = vec3(0.5, 0.8, 1.0) * caustic * lightIntensity * 0.3;
            color.rgb += causticColor;
            color.rgb = mix(color.rgb, vec3(0.2, 0.4, 0.6), 0.1);
            gl_FragColor = color;
        }
    `
};

export class PostProcessing {
    private composer: EffectComposer;
    private causticsPass: ShaderPass;
    private bloomPass: UnrealBloomPass;
    private outlinePass: OutlinePass | null = null;
    private selectedObjects: THREE.Object3D[] = [];
    private time: number = 0;
    
    constructor(
        private renderer: THREE.WebGLRenderer,
        private scene: THREE.Scene,
        private camera: THREE.PerspectiveCamera
    ) {
        // Create effect composer
        this.composer = new EffectComposer(renderer);
        
        // Base render pass
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);
        
        // Outline pass for cartoon cel shading (black outlines)
        try {
            this.outlinePass = new OutlinePass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                scene,
                camera
            );
            this.outlinePass.edgeStrength = 3.0;
            this.outlinePass.edgeGlow = 0.0;
            this.outlinePass.edgeThickness = 1.0;
            this.outlinePass.pulsePeriod = 0;
            this.outlinePass.visibleEdgeColor.set(0x000000); // Black outlines
            this.outlinePass.hiddenEdgeColor.set(0x000000);
            this.composer.addPass(this.outlinePass);
            console.log('✅ Toon shading (OutlinePass) applied');
        } catch (error) {
            console.warn('⚠️ Could not create OutlinePass:', error);
        }
        
        // Caustics pass
        this.causticsPass = new ShaderPass(causticsShader);
        this.causticsPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        this.composer.addPass(this.causticsPass);
        
        // Bloom pass for glowing effects
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        this.composer.addPass(this.bloomPass);
        
        // Update on resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    /**
     * Set objects to receive cartoon outlines
     */
    setOutlinedObjects(objects: THREE.Object3D[]): void {
        this.selectedObjects = objects;
        if (this.outlinePass) {
            this.outlinePass.selectedObjects = objects;
        }
    }
    
    private onResize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.composer.setSize(width, height);
        this.causticsPass.uniforms.resolution.value.set(width, height);
        if (this.outlinePass) {
            this.outlinePass.setSize(width, height);
        }
    }
    
    update(deltaTime: number, lightPosition?: THREE.Vector3): void {
        this.time += deltaTime;
        
        // Update caustics shader
        this.causticsPass.uniforms.time.value = this.time;
        if (lightPosition) {
            // Convert world position to screen space
            const vector = lightPosition.clone().project(this.camera);
            this.causticsPass.uniforms.lightPosition.value.set(
                (vector.x + 1) / 2,
                (vector.y + 1) / 2,
                vector.z
            );
        }
    }
    
    render(): void {
        this.composer.render();
    }
    
    setSize(width: number, height: number): void {
        this.composer.setSize(width, height);
        this.causticsPass.uniforms.resolution.value.set(width, height);
    }
}
