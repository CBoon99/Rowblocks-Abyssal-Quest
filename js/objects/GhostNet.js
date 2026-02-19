export class GhostNet {
    constructor(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.width = 150;
        this.height = 150;
        this.weakPoints = [];
        this.health = 100;
        this.isCompleted = false;
        
        // Generate weak points
        for (let i = 0; i < 5; i++) {
            this.weakPoints.push({
                x: x + (Math.random() - 0.5) * this.width,
                y: y + (Math.random() - 0.5) * this.height,
                broken: false
            });
        }
    }
    
    update(deltaTime, player) {
        // Check if player is nudging weak points
        const nudgeDistance = 80;
        
        this.weakPoints.forEach(point => {
            if (point.broken) return;
            
            const dx = point.x - player.x;
            const dy = point.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if player recently used nudge (within last 200ms)
            const timeSinceNudge = Date.now() - (player.lastNudgeTime || 0);
            if (distance < nudgeDistance && timeSinceNudge < 200) {
                point.broken = true;
                this.health -= 20;
            }
        });
        
        if (this.health <= 0) {
            this.isCompleted = true;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw net mesh
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        
        for (let i = 0; i < 10; i++) {
            const x1 = this.x - this.width / 2;
            const y1 = this.y - this.height / 2 + (i * this.height / 10);
            const x2 = this.x + this.width / 2;
            const y2 = y1;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        for (let i = 0; i < 10; i++) {
            const x1 = this.x - this.width / 2 + (i * this.width / 10);
            const y1 = this.y - this.height / 2;
            const x2 = x1;
            const y2 = this.y + this.height / 2;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Draw weak points
        this.weakPoints.forEach(point => {
            if (!point.broken) {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Pulse effect
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        // Draw trapped fish
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐟', this.x, this.y);
    }
    
    isCompleted() {
        return this.isCompleted;
    }
    
    getReward() {
        return 10; // Conservation points
    }
}

