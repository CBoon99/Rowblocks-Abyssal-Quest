/**
 * Ocean map: minimap (corner) + full-screen dive chart.
 * Shows reefs, player, open blue water.
 */

import {
    REEF_ZONES,
    WORLD_MAP_EXTENT,
    nearestReef,
    type ReefZone,
} from '../systems/WorldMap';
import { getReefHealthSystem } from '../systems/ReefHealthSystem';

export class OceanMapUI {
    private mini: HTMLElement;
    private full: HTMLElement | null = null;
    private miniCanvas: HTMLCanvasElement;
    private player = { x: 0, z: 0 };
    private visible = true;
    private fullOpen = false;
    private discovered = new Set<string>(['home_reef']);

    constructor() {
        this.mini = document.createElement('div');
        this.mini.id = 'ocean-minimap';
        this.mini.className = 'ocean-minimap';
        this.mini.innerHTML = `
      <div class="ocean-minimap-header">
        <span class="ocean-minimap-title">Map</span>
        <button type="button" class="ocean-minimap-expand" id="map-expand" aria-label="Open full map">⤢</button>
      </div>
      <canvas class="ocean-minimap-canvas" width="160" height="160"></canvas>
      <div class="ocean-minimap-loc" id="map-loc">Home Reef</div>
    `;
        document.body.appendChild(this.mini);
        this.miniCanvas = this.mini.querySelector('canvas')!;

        this.mini.querySelector('#map-expand')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFull();
        });
        this.mini.addEventListener('click', () => this.toggleFull());

        // Keyboard M was marinepedia — use N for map or double: we'll use key "n" / "N" and button
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' || e.key === 'N') {
                const t = e.target as HTMLElement;
                if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
                this.toggleFull();
            }
        });

        this.drawMini();
    }

    setPlayerPosition(x: number, z: number): void {
        this.player.x = x;
        this.player.z = z;
        // Discover reefs when near
        for (const reef of REEF_ZONES) {
            const d = Math.hypot(x - reef.x, z - reef.z);
            if (d < reef.radius * 1.2) this.discovered.add(reef.id);
        }
        this.drawMini();
        const loc = document.getElementById('map-loc');
        if (loc) {
            const { reef, dist } = nearestReef(x, z);
            if (dist < reef.radius * 1.15) {
                loc.textContent = reef.name;
            } else {
                loc.textContent = 'Open Ocean';
            }
        }
        if (this.fullOpen) this.drawFull();
    }

    show(): void {
        this.visible = true;
        this.mini.classList.remove('hidden');
    }

    hide(): void {
        this.visible = false;
        this.mini.classList.add('hidden');
        this.closeFull();
    }

    toggleFull(): void {
        if (this.fullOpen) this.closeFull();
        else this.openFull();
    }

    private openFull(): void {
        this.closeFull();
        this.fullOpen = true;
        this.full = document.createElement('div');
        this.full.className = 'ocean-map-full';
        this.full.innerHTML = `
      <div class="ocean-map-full-panel">
        <div class="ocean-map-full-head">
          <h2>Ocean Chart</h2>
          <button type="button" class="ocean-map-close" id="map-close">✕</button>
        </div>
        <p class="ocean-map-hint">Deep blue = open water. Bright rings = reefs. Swim the blue to find the next garden.</p>
        <canvas id="ocean-map-full-canvas" width="360" height="360"></canvas>
        <ul class="ocean-map-legend" id="ocean-map-legend"></ul>
      </div>
    `;
        document.body.appendChild(this.full);
        this.full.querySelector('#map-close')?.addEventListener('click', () => this.closeFull());
        this.full.addEventListener('click', (e) => {
            if (e.target === this.full) this.closeFull();
        });
        this.drawFull();
        this.renderLegend();
    }

    private closeFull(): void {
        this.fullOpen = false;
        this.full?.remove();
        this.full = null;
    }

    private renderLegend(): void {
        const ul = document.getElementById('ocean-map-legend');
        if (!ul) return;
        ul.innerHTML = REEF_ZONES.map((r) => {
            const known = this.discovered.has(r.id);
            return `<li style="--c:${r.color}">
        <span class="dot"></span>
        <strong>${known ? r.name : '???'}</strong>
        <span class="blurb">${known ? r.blurb : 'Keep exploring…'}</span>
      </li>`;
        }).join('');
    }

    private worldToCanvas(
        x: number,
        z: number,
        size: number
    ): { cx: number; cy: number } {
        const ext = WORLD_MAP_EXTENT;
        const cx = ((x + ext) / (ext * 2)) * size;
        const cy = ((z + ext) / (ext * 2)) * size;
        return { cx, cy };
    }

    private drawOceanBase(ctx: CanvasRenderingContext2D, size: number): void {
        // Deep open ocean
        const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.7);
        g.addColorStop(0, '#0a3a5c');
        g.addColorStop(0.5, '#062840');
        g.addColorStop(1, '#021520');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);

        // Soft open-water grain
        ctx.fillStyle = 'rgba(20,80,120,0.15)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, 8 + Math.random() * 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawReefs(ctx: CanvasRenderingContext2D, size: number, detailed: boolean): void {
        const ext = WORLD_MAP_EXTENT;
        for (const reef of REEF_ZONES) {
            const known = this.discovered.has(reef.id);
            const { cx, cy } = this.worldToCanvas(reef.x, reef.z, size);
            const pr = (reef.radius / (ext * 2)) * size;

            // Halo (approaching reef)
            ctx.beginPath();
            ctx.arc(cx, cy, pr * 1.35, 0, Math.PI * 2);
            ctx.fillStyle = known ? `${reef.color}22` : 'rgba(100,120,140,0.12)';
            ctx.fill();

            // Core — color brightness from reef health (clean = thrives)
            const h = getReefHealthSystem().getHealth01(reef.id);
            ctx.beginPath();
            ctx.arc(cx, cy, pr, 0, Math.PI * 2);
            if (known) {
                ctx.globalAlpha = 0.35 + h * 0.5;
                ctx.fillStyle = reef.color;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = h > 0.7 ? '#b8ffd0' : h > 0.4 ? reef.color : '#886655';
            } else {
                ctx.fillStyle = 'rgba(80,90,100,0.35)';
                ctx.fill();
                ctx.strokeStyle = '#556677';
            }
            ctx.lineWidth = detailed ? 2.5 : 1.5;
            ctx.stroke();

            if (detailed && known) {
                ctx.fillStyle = '#e8f7ff';
                ctx.font = 'bold 11px system-ui,sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(reef.name, cx, cy - pr - 6);
            }
        }
    }

    private drawPlayer(ctx: CanvasRenderingContext2D, size: number): void {
        const { cx, cy } = this.worldToCanvas(this.player.x, this.player.z, size);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        // Direction pip
        ctx.beginPath();
        ctx.moveTo(cx, cy - 9);
        ctx.lineTo(cx + 4, cy - 2);
        ctx.lineTo(cx - 4, cy - 2);
        ctx.closePath();
        ctx.fillStyle = '#00d4ff';
        ctx.fill();
    }

    private drawMini(): void {
        const ctx = this.miniCanvas.getContext('2d');
        if (!ctx) return;
        const size = this.miniCanvas.width;
        this.drawOceanBase(ctx, size);
        this.drawReefs(ctx, size, false);
        this.drawPlayer(ctx, size);
    }

    private drawFull(): void {
        const canvas = document.getElementById('ocean-map-full-canvas') as HTMLCanvasElement | null;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = canvas.width;
        this.drawOceanBase(ctx, size);
        this.drawReefs(ctx, size, true);
        this.drawPlayer(ctx, size);
        this.renderLegend();
    }
}
