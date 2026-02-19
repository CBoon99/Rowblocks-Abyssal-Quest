export class FishingLine {
    constructor(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.length = 200;
        this.lineHealth = 100;
        this.isCompleted = false;
        this.hooked = false;
        this.hookY = y;
    }
    
    update(deltaTime, player) {
        // Check if player collides with line
        const dx = this.x - player.x;
        const dy = this.hookY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if player used speed burst and hit the line
        if (distance < 40 && player.speedBurstActive) {
            this.lineHealth -= 50;
            if (this.lineHealth <= 0) {
                this.isCompleted = true;
            }
        }
        
        // Line sways
        this.hookY = this.y + Math.sin(Date.now() / 500) * 20;
    }
    
    render(ctx) {
        // Draw fishing line
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, 0);
        ctx.lineTo(this.x, this.hookY);
        ctx.stroke();
        
        // Draw hook
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(this.x, this.hookY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bait
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(this.x, this.hookY + 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health indicator
        if (this.lineHealth < 100) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x - 25, this.hookY - 30, 50, 5);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x - 25, this.hookY - 30, (this.lineHealth / 100) * 50, 5);
        }
    }
    
    isCompleted() {
        return this.isCompleted;
    }
    
    getReward() {
        return 15; // Conservation points
    }
}

