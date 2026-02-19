export class Litter {
    constructor(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.radius = 10;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.collected = false;
        this.type = Math.random() > 0.5 ? 'bag' : 'bottle';
    }
    
    update(deltaTime, player) {
        if (this.collected) return;
        
        // Drift
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary bounce
        const canvas = this.ctx.canvas;
        if (this.x < this.radius || this.x > canvas.width - this.radius) {
            this.vx *= -1;
        }
        if (this.y < this.radius || this.y > canvas.height - this.radius) {
            this.vy *= -1;
        }
        
        // Check if player collected it
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + this.radius) {
            this.collected = true;
            player.addConservationPoints(2);
            if (window.game && window.game.soundManager) {
                window.game.soundManager.playSound('collect');
            }
        }
    }
    
    render(ctx) {
        if (this.collected) return;
        
        ctx.save();
        ctx.globalAlpha = 0.8;
        
        if (this.type === 'bag') {
            // Draw plastic bag
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🛍️', this.x, this.y);
        } else {
            // Draw bottle
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.rect(this.x - this.radius, this.y - this.radius * 1.5, this.radius * 2, this.radius * 3);
            ctx.fill();
            ctx.strokeStyle = '#00cc00';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🍾', this.x, this.y);
        }
        
        ctx.restore();
    }
    
    isCompleted() {
        return this.collected;
    }
    
    getReward() {
        return 2; // Conservation points
    }
}

