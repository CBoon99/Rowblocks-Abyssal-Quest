import { InputManager } from '../input/InputManager.js';

export class Player {
    constructor(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.radius = 20;
        this.speed = 2;
        this.vx = 0;
        this.vy = 0;
        this.color = '#00d4ff';
        this.glowColor = '#00ffff';
        
        // Abilities
        this.sonarCooldown = 0;
        this.echoCooldown = 0;
        this.nudgeCooldown = 0;
        this.speedBurstCooldown = 0;
        this.speedBurstActive = false;
        this.speedBurstDuration = 0;
        this.bioluminescenceActive = false;
        this.bioluminescenceRadius = 100;
        this.lastNudgeTime = 0;
        
        // Stats
        this.pearls = 0;
        this.conservationPoints = 0;
        this.collectedFish = new Set();
        
        this.inputManager = new InputManager();
        this.animationTime = 0;
    }
    
    update(deltaTime) {
        // Update animation time
        this.animationTime += deltaTime * 0.001;
        
        // Update cooldowns
        if (this.sonarCooldown > 0) this.sonarCooldown -= deltaTime;
        if (this.echoCooldown > 0) this.echoCooldown -= deltaTime;
        if (this.nudgeCooldown > 0) this.nudgeCooldown -= deltaTime;
        if (this.speedBurstCooldown > 0) this.speedBurstCooldown -= deltaTime;
        
        // Speed burst active duration
        if (this.speedBurstActive) {
            this.speedBurstDuration -= deltaTime;
            if (this.speedBurstDuration <= 0) {
                this.speedBurstActive = false;
            }
        }
        
        // Handle input
        this.handleMovement();
        
        // Boundary check
        const canvas = this.ctx.canvas;
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }
    
    handleMovement() {
        const keys = this.inputManager.keys;
        let speed = this.speed;
        
        if (this.speedBurstActive) {
            speed *= 2;
        }
        
        this.vx = 0;
        this.vy = 0;
        
        if (keys['w'] || keys['ArrowUp']) this.vy = -speed;
        if (keys['s'] || keys['ArrowDown']) this.vy = speed;
        if (keys['a'] || keys['ArrowLeft']) this.vx = -speed;
        if (keys['d'] || keys['ArrowRight']) this.vx = speed;
        
        // Normalize diagonal movement
        if (this.vx !== 0 && this.vy !== 0) {
            this.vx *= 0.707;
            this.vy *= 0.707;
        }
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    useSonar() {
        if (this.sonarCooldown > 0) return;
        
        this.sonarCooldown = 2000; // 2 seconds
        
        // Create canvas-based sonar ping visual effect
        if (window.game && window.game.particleSystem) {
            window.game.particleSystem.createRipple(this.x, this.y, 300);
            window.game.particleSystem.createBurst(this.x, this.y, 'sonar', 30);
        }
        
        // Emit sonar event
        if (window.game && window.game.fishManager) {
            window.game.fishManager.onSonarPing(this.x, this.y);
        }
        
        if (window.game && window.game.soundManager) {
            window.game.soundManager.playSound('sonar');
        }
    }
    
    useEcho() {
        if (this.echoCooldown > 0) return;
        
        this.echoCooldown = 3000; // 3 seconds
        
        // Create echo visual effect
        if (window.game && window.game.particleSystem) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (window.game && window.game.particleSystem) {
                        window.game.particleSystem.createRipple(this.x, this.y, 200 - i * 50);
                    }
                }, i * 200);
            }
        }
        
        // Emit echo event
        if (window.game && window.game.fishManager) {
            window.game.fishManager.onEchoCall(this.x, this.y);
        }
        
        if (window.game && window.game.soundManager) {
            window.game.soundManager.playSound('echo');
        }
    }
    
    useNudge() {
        if (this.nudgeCooldown > 0) return;
        
        this.nudgeCooldown = 1000; // 1 second
        this.lastNudgeTime = Date.now();
        
        // Create nudge visual effect
        if (window.game && window.game.particleSystem) {
            window.game.particleSystem.createBurst(this.x, this.y, 'bubble', 15);
        }
        
        // Emit nudge event
        if (window.game && window.game.fishManager) {
            window.game.fishManager.onNudge(this.x, this.y);
        }
        
        // Also nudge mission objects
        if (window.game && window.game.missionManager) {
            window.game.missionManager.missionObjects.forEach(obj => {
                if (obj.update) {
                    obj.update(0, this);
                }
            });
        }
        
        if (window.game && window.game.soundManager) {
            window.game.soundManager.playSound('nudge');
        }
    }
    
    useSpeedBurst() {
        if (this.speedBurstCooldown > 0) return;
        
        this.speedBurstCooldown = 5000; // 5 seconds
        this.speedBurstActive = true;
        this.speedBurstDuration = 1000; // Active for 1 second
        
        if (window.game && window.game.soundManager) {
            window.game.soundManager.playSound('speed');
        }
    }
    
    toggleBioluminescence() {
        this.bioluminescenceActive = !this.bioluminescenceActive;
        
        const btn = document.getElementById('light-btn');
        if (this.bioluminescenceActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        if (window.game && window.game.soundManager) {
            window.game.soundManager.playSound('light');
        }
    }
    
    
    collectFish(fish) {
        const isNewDiscovery = !this.collectedFish.has(fish.id);
        if (isNewDiscovery) {
            this.collectedFish.add(fish.id);
            
            // Reward based on rarity
            let reward = 1;
            if (fish.rarity === 'uncommon') reward = 2;
            else if (fish.rarity === 'rare') reward = 5;
            else if (fish.rarity === 'legendary') reward = 10;
            
            this.pearls += reward;
            
            // Create collection particle effect
            if (window.game && window.game.particleSystem) {
                window.game.particleSystem.createBurst(fish.x, fish.y, 'collect', 30);
            }
            
            if (window.game && window.game.uiManager) {
                window.game.uiManager.showCollectiblePopup(fish.name, reward);
                
                // Show discovery celebration for new finds!
                if (isNewDiscovery) {
                    // Get full fish data
                    const fishData = window.game.fishManager.getAllFishData().find(f => f.id === fish.id);
                    if (fishData) {
                        setTimeout(() => {
                            window.game.uiManager.showDiscoveryCelebration(fishData);
                        }, 500);
                    }
                }
            }
            
            if (window.game && window.game.soundManager) {
                window.game.soundManager.playSound('collect');
            }
            
            return true;
        }
        return false;
    }
    
    addConservationPoints(amount) {
        this.conservationPoints += amount;
    }
    
    render(ctx) {
        const time = this.animationTime;
        const angle = Math.atan2(this.vy || -1, this.vx || 0);
        const isMoving = Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1;
        
        // Trail effect when moving fast
        if (isMoving && (this.speedBurstActive || Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1)) {
            for (let i = 0; i < 3; i++) {
                const trailX = this.x - this.vx * i * 3;
                const trailY = this.y - this.vy * i * 3;
                const alpha = 0.3 - i * 0.1;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.glowColor;
                ctx.beginPath();
                ctx.arc(trailX, trailY, this.radius * (1 - i * 0.2), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // Enhanced bioluminescence glow with pulsing
        if (this.bioluminescenceActive) {
            const pulse = 1 + Math.sin(time * 2) * 0.1;
            const glowRadius = this.bioluminescenceRadius * pulse;
            
            // Multiple glow layers for depth
            for (let i = 3; i > 0; i--) {
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, glowRadius * (i / 3)
                );
                gradient.addColorStop(0, `rgba(0, 212, 255, ${0.4 / i})`);
                gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, glowRadius * (i / 3), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Enhanced body shape (teardrop)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        
        // Body gradient (more vibrant)
        const bodyGradient = ctx.createLinearGradient(
            -this.radius, -this.radius * 0.5,
            this.radius, this.radius * 0.5
        );
        bodyGradient.addColorStop(0, '#00E5FF'); // Bright cyan
        bodyGradient.addColorStop(0.5, '#00B8D4'); // Teal
        bodyGradient.addColorStop(1, '#0097A7'); // Darker teal
        
        // Draw teardrop body (wider at top)
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow outline
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.glowColor;
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Animated fins
        const finFlap = Math.sin(time * 4 + Math.abs(this.vx + this.vy) * 2) * 0.3;
        
        // Side fins
        ctx.fillStyle = '#00B8D4';
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.7, 0, this.radius * 0.3, this.radius * 0.5, finFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.radius * 0.7, 0, this.radius * 0.3, this.radius * 0.5, -finFlap, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail fin
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.8, 0);
        ctx.lineTo(-this.radius * 1.2, -this.radius * 0.4);
        ctx.lineTo(-this.radius * 1.4, 0);
        ctx.lineTo(-this.radius * 1.2, this.radius * 0.4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Expressive eyes with blinking
        const blinkCycle = Math.sin(time * 0.5);
        const eyeOpen = blinkCycle > -0.7 ? 1 : 0.1; // Blink occasionally
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 6, 4 * eyeOpen, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y - 6, 4 * eyeOpen, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupils (look in direction of movement)
        const pupilOffsetX = Math.cos(angle) * 1;
        const pupilOffsetY = Math.sin(angle) * 1;
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x - 6 + pupilOffsetX, this.y - 6 + pupilOffsetY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 6 + pupilOffsetX, this.y - 6 + pupilOffsetY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye sparkle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 7, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 7, this.y - 7, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Bioluminescent patterns (glowing spots)
        const spots = [
            { x: -this.radius * 0.3, y: -this.radius * 0.2 },
            { x: this.radius * 0.3, y: this.radius * 0.2 },
            { x: 0, y: this.radius * 0.4 }
        ];
        
        spots.forEach(spot => {
            const glow = 0.5 + Math.sin(time * 3 + spot.x) * 0.3;
            ctx.fillStyle = `rgba(183, 148, 246, ${glow})`; // Purple glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(183, 148, 246, 1)';
            ctx.beginPath();
            ctx.arc(this.x + spot.x, this.y + spot.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        // Speed burst visual effect
        if (this.speedBurstActive) {
            // Motion blur lines
            for (let i = 0; i < 5; i++) {
                const lineX = this.x - Math.cos(angle) * this.radius * (i + 1);
                const lineY = this.y - Math.sin(angle) * this.radius * (i + 1);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 - i * 0.05})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(lineX, lineY);
                ctx.lineTo(lineX - Math.cos(angle) * 10, lineY - Math.sin(angle) * 10);
                ctx.stroke();
            }
        }
    }
}

