/**
 * EXAMPLE: Enhanced Visual Improvements
 * 
 * This file shows how to upgrade the visual quality for a 10-year-old audience
 * and commercial viability. Copy these patterns into your existing code.
 */

// ============================================
// 1. ENHANCED PLAYER RENDERING
// ============================================

/**
 * Enhanced Player.render() method
 * Makes the Rowlock cute, expressive, and animated
 */
renderEnhanced(ctx) {
    const time = Date.now() * 0.001; // For animations
    
    // 1. TRAIL EFFECT (when moving fast)
    if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
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
    
    // 2. BIOLUMINESCENCE GLOW (enhanced)
    if (this.bioluminescenceActive) {
        // Pulsing glow
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
        
        // Caustics effect (light patterns on nearby objects)
        // This would affect fish rendering nearby
    }
    
    // 3. ENHANCED BODY SHAPE (teardrop instead of circle)
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Rotation based on movement
    const angle = Math.atan2(this.vy || -1, this.vx || 0);
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
    
    // 4. ANIMATED FINS
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
    
    // 5. EXPRESSIVE EYES (with blinking)
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
    
    // 6. BIOLUMINESCENT PATTERNS (glowing spots)
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
    
    // 7. SPEED BURST VISUAL EFFECT
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

// ============================================
// 2. ENHANCED SONAR PING (Canvas-based)
// ============================================

/**
 * Enhanced sonar ping effect
 * Replaces DOM-based ping with canvas rendering
 */
createSonarPingCanvas(x, y, particleSystem) {
    // Create ripple effect
    particleSystem.createRipple(x, y, 300);
    
    // Create ring particles
    particleSystem.createBurst(x, y, 'sonar', 30);
    
    // Highlight nearby fish (this would be handled in FishManager)
    // Fish would get a glow outline effect
}

// ============================================
// 3. ENHANCED FISH RENDERING
// ============================================

/**
 * Enhanced Fish.render() method
 * Makes fish more appealing and animated
 */
renderFishEnhanced(ctx, time) {
    // 1. SWIMMING ANIMATION (body undulation)
    const swimOffset = Math.sin(time * 3 + this.x * 0.01) * 2;
    
    // 2. RARITY GLOW (enhanced)
    if (this.rarity === 'legendary') {
        // Pulsing golden glow
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
        
        // Sparkle particles around legendary fish
        // (would use particle system)
    }
    
    // 3. EXPRESSION BASED ON STATE
    let expression = 'happy';
    if (this.state === 'fleeing') expression = 'scared';
    if (this.state === 'curious') expression = 'curious';
    
    // Draw expression (simplified - would use sprites in production)
    if (expression === 'scared') {
        // Wide eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 4. BODY UNDULATION (swimming motion)
    ctx.save();
    ctx.translate(this.x, this.y);
    const angle = Math.atan2(this.vy, this.vx);
    ctx.rotate(angle);
    
    // Wavy body shape
    ctx.beginPath();
    for (let i = -this.radius; i <= this.radius; i += 2) {
        const wave = Math.sin((i / this.radius) * Math.PI + time * 3) * 2;
        const y = wave;
        if (i === -this.radius) {
            ctx.moveTo(i, y);
        } else {
            ctx.lineTo(i, y);
        }
    }
    ctx.closePath();
    ctx.fillStyle = this.colors[this.rarity] || '#88d0ff';
    ctx.fill();
    
    ctx.restore();
}

// ============================================
// 4. COLLECTION EFFECT
// ============================================

/**
 * Enhanced collection effect
 * Makes collecting fish feel rewarding
 */
onFishCollected(fish, particleSystem) {
    // 1. Burst of sparkles
    particleSystem.createBurst(fish.x, fish.y, 'collect', 30);
    
    // 2. Fish transforms into light particles
    // (particles flow toward Marinepedia icon)
    
    // 3. Celebration animation
    // (confetti, stars, etc.)
    
    // 4. Score popup with bounce
    // (already implemented, but could be enhanced)
}

// ============================================
// 5. BACKGROUND ENHANCEMENTS
// ============================================

/**
 * Enhanced background rendering
 * Adds depth and atmosphere
 */
renderBackgroundEnhanced(ctx, canvasWidth, canvasHeight, biome, time) {
    // 1. CAUSTICS (light patterns from surface)
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 5; i++) {
        const x = (canvasWidth / 5) * i + Math.sin(time + i) * 50;
        const y = Math.sin(time * 0.5 + i) * 100 + 100;
        const radius = 150 + Math.sin(time + i) * 50;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    
    // 2. PARALLAX LAYERS
    // Far background (coral, rocks) - moves slowly
    // Mid background (kelp) - moves medium speed
    // Foreground (particles) - moves fast
    
    // 3. DEPTH FOG
    // Objects further away get more blue tint
}

// ============================================
// 6. UI ENHANCEMENTS
// ============================================

/**
 * Enhanced button hover effects
 */
enhanceButton(buttonId) {
    const btn = document.getElementById(buttonId);
    
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.1) rotate(5deg)';
        btn.style.boxShadow = '0 8px 25px rgba(0, 212, 255, 0.8)';
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1) rotate(0deg)';
        btn.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.4)';
    });
}

/**
 * Animated stat counter
 */
animateStatCounter(elementId, targetValue, duration = 1000) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = targetValue;
        }
    };
    
    animate();
}

// ============================================
// USAGE EXAMPLE:
// ============================================

/*
// In Player.js, replace render() with:
render(ctx) {
    const time = Date.now() * 0.001;
    this.renderEnhanced(ctx, time);
}

// In main.js gameLoop:
update(deltaTime) {
    // ... existing code ...
    this.particleSystem.update(deltaTime);
}

render() {
    // ... existing code ...
    this.particleSystem.render();
}

// When collecting fish:
if (player.collectFish(fish)) {
    game.particleSystem.createBurst(fish.x, fish.y, 'collect', 30);
    // ... rest of collection code ...
}
*/
