/**
 * Particle System for visual effects
 * Creates sparkles, bubbles, and other particle effects
 */
export class ParticleSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.canvasWidth = ctx.canvas ? ctx.canvas.width : 0;
        this.canvasHeight = ctx.canvas ? ctx.canvas.height : 0;
    }
    
    /**
     * Create a burst of particles at a location
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - 'sparkle', 'bubble', 'collect', 'sonar'
     * @param {number} count - Number of particles
     */
    createBurst(x, y, type = 'sparkle', count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            
            let particle;
            switch(type) {
                case 'sparkle':
                    particle = {
                        x, y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 3 + Math.random() * 4,
                        life: 1.0,
                        decay: 0.02 + Math.random() * 0.02,
                        color: this.getRandomSparkleColor(),
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.2,
                        type: 'sparkle'
                    };
                    break;
                case 'bubble':
                    particle = {
                        x, y,
                        vx: (Math.random() - 0.5) * 1,
                        vy: -2 - Math.random() * 2,
                        size: 5 + Math.random() * 10,
                        life: 1.0,
                        decay: 0.01,
                        color: 'rgba(255, 255, 255, 0.6)',
                        type: 'bubble'
                    };
                    break;
                case 'collect':
                    particle = {
                        x, y,
                        vx: Math.cos(angle) * speed * 0.5,
                        vy: Math.sin(angle) * speed * 0.5,
                        size: 4 + Math.random() * 3,
                        life: 1.0,
                        decay: 0.015,
                        color: this.getRandomSparkleColor(),
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.3,
                        type: 'star'
                    };
                    break;
                case 'sonar':
                    particle = {
                        x, y,
                        vx: Math.cos(angle) * speed * 0.3,
                        vy: Math.sin(angle) * speed * 0.3,
                        size: 2 + Math.random() * 2,
                        life: 1.0,
                        decay: 0.01,
                        color: 'rgba(0, 255, 255, 0.8)',
                        type: 'ring'
                    };
                    break;
            }
            
            this.particles.push(particle);
        }
    }
    
    getRandomSparkleColor() {
        const colors = [
            'rgba(255, 215, 0, 1)',   // Gold
            'rgba(255, 107, 157, 1)', // Pink
            'rgba(183, 148, 246, 1)', // Purple
            'rgba(0, 255, 255, 1)',   // Cyan
            'rgba(255, 255, 255, 1)'  // White
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Create a ripple effect (for sonar ping)
     */
    createRipple(x, y, maxRadius = 300) {
        this.particles.push({
            x, y,
            radius: 0,
            maxRadius,
            life: 1.0,
            decay: 0.02,
            color: 'rgba(0, 255, 255, 0.6)',
            type: 'ripple'
        });
    }
    
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position
            if (p.vx !== undefined) {
                p.x += p.vx;
                p.y += p.vy;
                
                // Apply gravity for bubbles
                if (p.type === 'bubble') {
                    p.vy -= 0.05;
                } else {
                    // Friction
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                }
            }
            
            // Update rotation
            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed;
            }
            
            // Update ripple radius
            if (p.type === 'ripple') {
                p.radius += deltaTime * 2;
            }
            
            // Update life
            p.life -= p.decay;
            
            // Remove dead particles
            if (p.life <= 0 || (p.type === 'ripple' && p.radius > p.maxRadius)) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            switch(p.type) {
                case 'sparkle':
                case 'star':
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillStyle = p.color;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = p.color;
                    
                    // Draw star shape
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                        const x = Math.cos(angle) * p.size;
                        const y = Math.sin(angle) * p.size;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    break;
                    
                case 'bubble':
                    ctx.fillStyle = p.color;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    
                    // Bubble highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.beginPath();
                    ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'ring':
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                    
                case 'ripple':
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        });
    }
    
    clear() {
        this.particles = [];
    }
}
