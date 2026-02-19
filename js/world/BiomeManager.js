export class BiomeManager {
    constructor(ctx, canvasWidth, canvasHeight) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.currentBiomeIndex = 0;
        this.biomes = this.initializeBiomes();
        this.particles = [];
        this.animationTime = 0;
        this.generateParticles();
    }
    
    initializeBiomes() {
        return [
            {
                name: 'Sun-Kissed Shallows',
                color: '#005f8c',
                gradient: ['#00a8cc', '#005f8c', '#003d5c'],
                particles: { type: 'bubbles', density: 20 },
                description: 'Vibrant coral reefs and clear water'
            },
            {
                name: 'The Kelp Forest',
                color: '#004d66',
                gradient: ['#006680', '#004d66', '#003344'],
                particles: { type: 'kelp', density: 15 },
                description: 'A towering, maze-like forest'
            },
            {
                name: 'The Abyssal Plain',
                color: '#001a2e',
                gradient: ['#002d4a', '#001a2e', '#000a14'],
                particles: { type: 'bioluminescent', density: 30 },
                description: 'Dark depths with bioluminescent life'
            },
            {
                name: 'Hydrothermal Vent Fields',
                color: '#2d1a1a',
                gradient: ['#4d2d2d', '#2d1a1a', '#1a0a0a'],
                particles: { type: 'steam', density: 25 },
                description: 'Volcanic and dangerous'
            },
            {
                name: 'The Blue Dystopia',
                color: '#003366',
                gradient: ['#004d80', '#003366', '#001a33'],
                particles: { type: 'plankton', density: 40 },
                description: 'Vast open water'
            },
            {
                name: 'The Plastic Gyre',
                color: '#2d3d2d',
                gradient: ['#4d5d4d', '#2d3d2d', '#1a2a1a'],
                particles: { type: 'debris', density: 10 },
                description: 'Polluted area requiring rescue missions'
            },
            {
                name: 'The Sunken City',
                color: '#1a1a2e',
                gradient: ['#2d2d4a', '#1a1a2e', '#0a0a1a'],
                particles: { type: 'ancient', density: 15 },
                description: 'Ancient mysterious city'
            }
        ];
    }
    
    getCurrentBiome() {
        return this.biomes[this.currentBiomeIndex];
    }
    
    generateParticles() {
        const biome = this.getCurrentBiome();
        this.particles = [];
        
        for (let i = 0; i < biome.particles.density; i++) {
            this.particles.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                type: biome.particles.type,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime * 0.001;
        const canvas = this.ctx.canvas;
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;
        });
    }
    
    render() {
        const biome = this.getCurrentBiome();
        const ctx = this.ctx;
        const time = this.animationTime;
        
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        biome.gradient.forEach((color, index) => {
            gradient.addColorStop(index / (biome.gradient.length - 1), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw caustics (light patterns from surface) for shallower biomes
        if (biome.name === 'Sun-Kissed Shallows' || biome.name === 'The Kelp Forest') {
            ctx.save();
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 5; i++) {
                const x = (this.canvasWidth / 5) * i + Math.sin(time + i) * 50;
                const y = Math.sin(time * 0.5 + i) * 100 + 100;
                const radius = 150 + Math.sin(time + i) * 50;
                
                const causticGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                causticGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                causticGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = causticGradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        
        // Draw particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.opacity;
            
            switch(particle.type) {
                case 'bubbles':
                    // Enhanced bubbles with highlight
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    // Bubble highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.beginPath();
                    ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'bioluminescent':
                    // Pulsing bioluminescent particles
                    const pulse = 0.7 + Math.sin(time * 2 + particle.x * 0.01) * 0.3;
                    ctx.globalAlpha = particle.opacity * pulse;
                    ctx.fillStyle = '#00ffff';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#00ffff';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    break;
                case 'plankton':
                    ctx.fillStyle = '#88ff88';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'debris':
                    ctx.fillStyle = '#888888';
                    ctx.fillRect(particle.x, particle.y, particle.size * 2, particle.size * 2);
                    break;
                case 'kelp':
                    // Animated swaying kelp
                    const sway = Math.sin(time + particle.x * 0.01) * 10;
                    ctx.strokeStyle = '#004d33';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    // Curved kelp with sway
                    for (let i = 0; i <= particle.size * 20; i += 5) {
                        const y = particle.y + i;
                        const x = particle.x + Math.sin(time + particle.x * 0.01 + i * 0.05) * (sway * (i / (particle.size * 20)));
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        });
    }
    
    changeBiome(index) {
        if (index >= 0 && index < this.biomes.length) {
            this.currentBiomeIndex = index;
            this.generateParticles();
        }
    }
}

