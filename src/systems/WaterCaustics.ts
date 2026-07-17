import * as THREE from 'three';

/**
 * Animated underwater caustics — premium scrolling light patterns for seafloor.
 * Inspired by real-time caustics techniques (see docs/ART_SOURCES.md).
 */
export class WaterCaustics {
    private causticsTexture: THREE.CanvasTexture;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private time: number = 0;
    private regenAccum = 0;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 512;
        this.ctx = this.canvas.getContext('2d')!;
        this.generateCausticsPattern(0);
        this.causticsTexture = new THREE.CanvasTexture(this.canvas);
        this.causticsTexture.wrapS = THREE.RepeatWrapping;
        this.causticsTexture.wrapT = THREE.RepeatWrapping;
        this.causticsTexture.repeat.set(6, 6);
        this.causticsTexture.colorSpace = THREE.SRGBColorSpace;
    }

    private generateCausticsPattern(t: number): void {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.fillStyle = '#000810';
        ctx.fillRect(0, 0, w, h);

        // Multi-layer interference caustics (bright ridges)
        for (let layer = 0; layer < 3; layer++) {
            const scale = 0.04 + layer * 0.02;
            const speed = t * (0.6 + layer * 0.25);
            for (let i = 0; i < 18; i++) {
                const px = ((Math.sin(i * 12.9898 + speed) * 0.5 + 0.5) * w);
                const py = ((Math.cos(i * 78.233 + speed * 0.7) * 0.5 + 0.5) * h);
                const r = 40 + layer * 20 + (Math.sin(i + speed) * 25);
                const g = ctx.createRadialGradient(px, py, 0, px, py, r);
                const a = 0.12 - layer * 0.02;
                g.addColorStop(0, `rgba(200, 240, 255, ${a * 1.8})`);
                g.addColorStop(0.35, `rgba(120, 200, 255, ${a})`);
                g.addColorStop(1, 'rgba(0, 40, 80, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(px, py, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Sharp caustic lines
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 40; i++) {
            const x0 = Math.random() * w;
            const y0 = Math.random() * h;
            const x1 = x0 + (Math.random() - 0.5) * 80;
            const y1 = y0 + (Math.random() - 0.5) * 80;
            ctx.strokeStyle = `rgba(180, 230, 255, ${0.08 + Math.random() * 0.12})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo((x0 + x1) / 2 + 20, (y0 + y1) / 2, x1, y1);
            ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    update(deltaTime: number): void {
        this.time += deltaTime;
        this.causticsTexture.offset.x += deltaTime * 0.04;
        this.causticsTexture.offset.y += deltaTime * 0.025;
        this.regenAccum += deltaTime;
        // Soft regenerate pattern so caustics evolve
        if (this.regenAccum > 0.2) {
            this.regenAccum = 0;
            this.generateCausticsPattern(this.time);
            this.causticsTexture.needsUpdate = true;
        }
    }

    getTexture(): THREE.Texture {
        return this.causticsTexture;
    }

    applyToMaterial(material: THREE.MeshStandardMaterial | THREE.MeshToonMaterial): void {
        material.emissiveMap = this.causticsTexture;
        material.emissiveIntensity = Math.min(0.28, material.emissiveIntensity || 0.2);
    }
}
