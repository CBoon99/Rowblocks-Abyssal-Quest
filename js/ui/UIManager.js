export class UIManager {
    constructor(game) {
        this.game = game;
        this.lastPearls = 0;
        this.lastConservationPoints = 0;
        this.lastFishCount = 0;
    }
    
    update() {
        // Update HUD stats with animation
        if (this.game.player) {
            const pearlsEl = document.getElementById('pearls-count');
            const conservationEl = document.getElementById('conservation-points');
            const fishEl = document.getElementById('fish-count');
            
            // Animate counters when they change
            if (this.game.player.pearls !== this.lastPearls) {
                this.animateCounter(pearlsEl, this.lastPearls, this.game.player.pearls);
                this.lastPearls = this.game.player.pearls;
            }
            
            if (this.game.player.conservationPoints !== this.lastConservationPoints) {
                this.animateCounter(conservationEl, this.lastConservationPoints, this.game.player.conservationPoints);
                this.lastConservationPoints = this.game.player.conservationPoints;
            }
            
            if (this.game.player.collectedFish.size !== this.lastFishCount) {
                this.animateCounter(fishEl, this.lastFishCount, this.game.player.collectedFish.size);
                this.lastFishCount = this.game.player.collectedFish.size;
            }
        }
        
        // Update ability button cooldowns
        this.updateAbilityButtons();
    }
    
    animateCounter(element, startValue, targetValue, duration = 500) {
        if (!element) return;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
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
    
    updateAbilityButtons() {
        const player = this.game.player;
        if (!player) return;
        
        const buttons = {
            'sonar-btn': player.sonarCooldown,
            'echo-btn': player.echoCooldown,
            'nudge-btn': player.nudgeCooldown,
            'speed-btn': player.speedBurstCooldown
        };
        
        Object.entries(buttons).forEach(([id, cooldown]) => {
            const btn = document.getElementById(id);
            if (cooldown > 0) {
                btn.classList.add('cooldown');
                btn.title = `Cooldown: ${(cooldown / 1000).toFixed(1)}s`;
            } else {
                btn.classList.remove('cooldown');
                btn.title = '';
            }
        });
    }
    
    showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
    }
    
    hideStartScreen() {
        document.getElementById('start-screen').classList.add('hidden');
    }
    
    showPauseScreen() {
        document.getElementById('pause-screen').classList.remove('hidden');
    }
    
    hidePauseScreen() {
        document.getElementById('pause-screen').classList.add('hidden');
    }
    
    showMarinepedia() {
        const screen = document.getElementById('marinepedia-screen');
        screen.classList.remove('hidden');
        this.populateMarinepedia();
    }
    
    hideMarinepedia() {
        document.getElementById('marinepedia-screen').classList.add('hidden');
    }
    
    populateMarinepedia() {
        const grid = document.getElementById('fish-grid');
        grid.innerHTML = '';
        
        const fishData = this.game.fishManager.getAllFishData();
        const collectedFish = this.game.player.collectedFish;
        
        // Update collection progress
        const progressEl = document.getElementById('collection-progress');
        if (progressEl) {
            progressEl.textContent = `${collectedFish.size} / ${fishData.length}`;
        }
        
        fishData.forEach(fish => {
            const card = document.createElement('div');
            const isUnlocked = collectedFish.has(fish.id);
            card.className = `fish-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            // Build card content
            let cardContent = `
                <div class="fish-icon">${fish.emoji}</div>
                <div class="fish-name">${fish.name}</div>
                <div class="fish-rarity ${fish.rarity}">${fish.rarity.toUpperCase()}</div>
            `;
            
            if (!isUnlocked) {
                cardContent += '<div style="margin-top: 10px; font-size: 0.9rem; color: #888;">???</div>';
            } else {
                cardContent += '<div style="margin-top: 10px; font-size: 0.8rem; color: #88d0ff;">Click to learn more!</div>';
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => this.showFishDetail(fish), { once: false });
            }
            
            card.innerHTML = cardContent;
            grid.appendChild(card);
        });
    }
    
    showFishDetail(fish) {
        const modal = document.getElementById('fish-detail-modal');
        const content = document.getElementById('fish-detail-content');
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 6rem; margin-bottom: 1rem;">${fish.emoji}</div>
                <h2 style="color: #00d4ff; font-size: 2.5rem; margin-bottom: 0.5rem;">${fish.name}</h2>
                <div class="fish-rarity ${fish.rarity}" style="display: inline-block; margin-bottom: 1rem;">${fish.rarity.toUpperCase()}</div>
            </div>
            
            <div style="background: rgba(0, 50, 100, 0.6); padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
                <h3 style="color: #00d4ff; margin-bottom: 1rem;">📚 Fun Fact</h3>
                <p style="color: #fff; font-size: 1.1rem; line-height: 1.6;">${fish.funFact || 'This amazing creature has many secrets to discover!'}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div style="background: rgba(0, 50, 100, 0.6); padding: 1rem; border-radius: 10px;">
                    <h4 style="color: #00d4ff; margin-bottom: 0.5rem;">📏 Size</h4>
                    <p style="color: #fff;">${fish.size || 'Unknown'}</p>
                </div>
                <div style="background: rgba(0, 50, 100, 0.6); padding: 1rem; border-radius: 10px;">
                    <h4 style="color: #00d4ff; margin-bottom: 0.5rem;">🏠 Habitat</h4>
                    <p style="color: #fff;">${fish.habitat || 'Various ocean depths'}</p>
                </div>
                <div style="background: rgba(0, 50, 100, 0.6); padding: 1rem; border-radius: 10px;">
                    <h4 style="color: #00d4ff; margin-bottom: 0.5rem;">🍽️ Diet</h4>
                    <p style="color: #fff;">${fish.diet || 'Various marine life'}</p>
                </div>
                <div style="background: rgba(0, 50, 100, 0.6); padding: 1rem; border-radius: 10px;">
                    <h4 style="color: #00d4ff; margin-bottom: 0.5rem;">⏱️ Lifespan</h4>
                    <p style="color: #fff;">${fish.lifespan || 'Unknown'}</p>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        document.getElementById('close-fish-detail').addEventListener('click', () => {
            modal.classList.add('hidden');
        }, { once: true });
    }
    
    showDiscoveryCelebration(fish) {
        const celebration = document.getElementById('discovery-celebration');
        const nameEl = document.getElementById('discovered-fish-name');
        const messageEl = document.getElementById('discovery-message');
        
        nameEl.textContent = `${fish.emoji} ${fish.name}`;
        
        // Special messages based on rarity
        let message = '';
        if (fish.rarity === 'legendary') {
            message = '🌟 LEGENDARY FIND! 🌟\nYou\'ve discovered one of the ocean\'s greatest mysteries!';
        } else if (fish.rarity === 'rare') {
            message = '✨ Rare Discovery! ✨\nThis is a special find - not many explorers have seen this!';
        } else if (fish.rarity === 'uncommon') {
            message = '🎊 New Species! 🎊\nGreat job finding this unique creature!';
        } else {
            message = '🐠 New Discovery! 🐠\nYou\'ve added another friend to your collection!';
        }
        
        messageEl.textContent = message;
        
        celebration.classList.remove('hidden');
        
        // Add particle burst effect
        if (this.game.particleSystem) {
            this.game.particleSystem.createBurst(
                this.game.canvas.width / 2, 
                this.game.canvas.height / 2, 
                'collect', 
                50
            );
        }
        
        document.getElementById('continue-discovery').addEventListener('click', () => {
            celebration.classList.add('hidden');
        }, { once: true });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (!celebration.classList.contains('hidden')) {
                celebration.classList.add('hidden');
            }
        }, 5000);
    }
    
    showCollectiblePopup(name, reward) {
        const popup = document.createElement('div');
        popup.className = 'collectible-popup';
        popup.innerHTML = `<span style="font-size: 1.8rem;">✨</span> +${reward} 💎 <span style="color: #00ffff;">${name}</span>`;
        popup.style.left = (this.game.canvas.width / 2) + 'px';
        popup.style.top = (this.game.canvas.height / 2) + 'px';
        document.body.appendChild(popup);
        
        // Add bounce animation
        setTimeout(() => {
            popup.style.transform = 'scale(1.2)';
        }, 50);
        
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => {
                popup.remove();
            }, 500);
        }, 1500);
    }
    
    showMissionAlert(title, description) {
        const alert = document.getElementById('mission-alert');
        document.getElementById('mission-title').textContent = title;
        document.getElementById('mission-description').textContent = description;
        alert.classList.remove('hidden');
        
        setTimeout(() => {
            alert.classList.add('hidden');
        }, 5000);
    }
}

