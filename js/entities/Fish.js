export class Fish {
    constructor(x, y, id, name, rarity, emoji, ctx) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.name = name;
        this.rarity = rarity;
        this.emoji = emoji;
        this.ctx = ctx;
        this.radius = 15 + (rarity === 'legendary' ? 10 : rarity === 'rare' ? 5 : 0);
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.state = 'idle'; // idle, fleeing, curious, attracted
        this.speed = 0.5 + (rarity === 'rare' ? 0.3 : 0);
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderChange = 0.05;
        this.lastStateChange = 0;
        this.animationTime = Math.random() * Math.PI * 2; // Random start for animation
        
        // Rarity colors (more vibrant)
        this.colors = {
            common: '#88d0ff',
            uncommon: '#90ee90',
            rare: '#87ceeb',
            legendary: '#ffd700'
        };
    }
    
    update(deltaTime, player) {
        // Update animation time
        this.animationTime += deltaTime * 0.003;
        
        // State machine
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // Determine state based on distance and player actions
        if (distanceToPlayer < 80 && this.state !== 'fleeing') {
            this.state = 'fleeing';
        } else if (distanceToPlayer > 150 && this.state === 'fleeing') {
            this.state = 'idle';
        }
        
        // Behavior based on state
        switch(this.state) {
            case 'idle':
                this.wander(deltaTime);
                break;
            case 'fleeing':
                this.flee(player, deltaTime);
                break;
            case 'curious':
                this.approach(player, deltaTime, 0.3);
                break;
            case 'attracted':
                this.approach(player, deltaTime, 0.5);
                break;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary bounce
        const canvas = this.ctx.canvas;
        if (this.x < this.radius || this.x > canvas.width - this.radius) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        }
        if (this.y < this.radius || this.y > canvas.height - this.radius) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }
        
        // Apply friction
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    wander(deltaTime) {
        this.wanderAngle += (Math.random() - 0.5) * this.wanderChange;
        this.vx += Math.cos(this.wanderAngle) * 0.02;
        this.vy += Math.sin(this.wanderAngle) * 0.02;
        
        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.speed) {
            this.vx = (this.vx / speed) * this.speed;
            this.vy = (this.vy / speed) * this.speed;
        }
    }
    
    flee(player, deltaTime) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            const fleeSpeed = this.speed * 1.5;
            this.vx = Math.cos(angle) * fleeSpeed;
            this.vy = Math.sin(angle) * fleeSpeed;
        }
    }
    
    approach(player, deltaTime, factor) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            this.vx += Math.cos(angle) * factor * 0.1;
            this.vy += Math.sin(angle) * factor * 0.1;
        }
    }
    
    onSonarDetected() {
        if (this.state === 'idle') {
            this.state = 'curious';
            setTimeout(() => {
                if (this.state === 'curious') {
                    this.state = 'idle';
                }
            }, 2000);
        }
    }
    
    onEchoAttracted() {
        if (this.state !== 'fleeing') {
            this.state = 'attracted';
            setTimeout(() => {
                if (this.state === 'attracted') {
                    this.state = 'idle';
                }
            }, 3000);
        }
    }
    
    onNudged() {
        // Fish reacts to nudge
        this.state = 'fleeing';
        setTimeout(() => {
            if (this.state === 'fleeing') {
                this.state = 'idle';
            }
        }, 1000);
    }
    
    render(ctx) {
        const time = this.animationTime;
        const angle = Math.atan2(this.vy, this.vx);
        
        // Draw fish shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 2, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Enhanced rarity glow with pulsing
        if (this.rarity === 'legendary') {
            const pulse = 1 + Math.sin(time * 2) * 0.2;
            const glowGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius * 2 * pulse
            );
            glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
            glowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
            glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2 * pulse, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.rarity === 'rare') {
            const glowGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius * 1.5
            );
            glowGradient.addColorStop(0, this.colors[this.rarity] + '40');
            glowGradient.addColorStop(1, this.colors[this.rarity] + '00');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw fish body with swimming animation
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        
        // Swimming undulation
        const swimOffset = Math.sin(time * 3) * 2;
        
        // Fish body shape with undulation
        ctx.fillStyle = this.colors[this.rarity] || '#88d0ff';
        ctx.beginPath();
        // Create wavy body shape
        for (let i = -this.radius; i <= this.radius; i += 2) {
            const wave = Math.sin((i / this.radius) * Math.PI + time * 3) * 2 + swimOffset;
            const y = wave;
            if (i === -this.radius) {
                ctx.moveTo(i, y);
            } else {
                ctx.lineTo(i, y);
            }
        }
        // Close the shape
        ctx.lineTo(this.radius, this.radius * 0.6);
        ctx.lineTo(-this.radius, this.radius * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Fish outline
        ctx.strokeStyle = this.colors[this.rarity] || '#88d0ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
        
        // Draw emoji with slight scale animation
        const emojiScale = 1 + Math.sin(time * 2) * 0.05;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(emojiScale, emojiScale);
        ctx.font = `${this.radius * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
        
        // Expression based on state
        if (this.state === 'fleeing') {
            // Wide eyes (scared)
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.x - 3, this.y - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 3, this.y - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(this.x - 3, this.y - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 3, this.y - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.state === 'curious' || this.state === 'attracted') {
            // Happy eyes
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x - 3, this.y - 1, 2, 0, Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x + 3, this.y - 1, 2, 0, Math.PI);
            ctx.stroke();
        }
        
        // Draw name tag for legendary/rare fish with glow
        if (this.rarity === 'legendary' || this.rarity === 'rare') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.colors[this.rarity] || '#88d0ff';
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(this.name, this.x, this.y - this.radius - 15);
            ctx.fillText(this.name, this.x, this.y - this.radius - 15);
            ctx.shadowBlur = 0;
        }
    }
}

