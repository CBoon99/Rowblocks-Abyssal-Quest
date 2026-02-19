import { UpgradeSystem, Upgrade } from '../systems/UpgradeSystem';

export class UpgradeShopUI {
    private container: HTMLElement;
    private upgradeSystem: UpgradeSystem;
    private currentCategory: 'ability' | 'powerup' | 'cosmetic' = 'ability';
    
    constructor(
        container: HTMLElement,
        upgradeSystem: UpgradeSystem
    ) {
        this.container = container;
        this.upgradeSystem = upgradeSystem;
        this.render();
    }
    
    render(): void {
        const upgrades = this.upgradeSystem.getUpgradesByCategory(this.currentCategory);
        const currency = this.upgradeSystem.getCurrency();
        
        this.container.innerHTML = `
            <div class="upgrade-shop-screen">
                <div class="shop-header">
                    <h2>Upgrade Shop</h2>
                    <div class="currency-display">
                        <span class="currency-icon">💎</span>
                        <span id="shop-currency">${currency}</span>
                    </div>
                </div>
                <div class="category-tabs">
                    <button class="tab-btn ${this.currentCategory === 'ability' ? 'active' : ''}" data-category="ability">
                        Abilities
                    </button>
                    <button class="tab-btn ${this.currentCategory === 'powerup' ? 'active' : ''}" data-category="powerup">
                        Power-ups
                    </button>
                    <button class="tab-btn ${this.currentCategory === 'cosmetic' ? 'active' : ''}" data-category="cosmetic">
                        Cosmetics
                    </button>
                </div>
                <div class="upgrades-list" id="upgrades-list">
                    ${upgrades.map(upgrade => this.renderUpgrade(upgrade)).join('')}
                </div>
                <button class="btn-close" id="close-shop">Close</button>
            </div>
        `;
        
        // Category tab listeners
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = (e.target as HTMLElement).dataset.category as 'ability' | 'powerup' | 'cosmetic';
                if (category) {
                    this.currentCategory = category;
                    this.render();
                }
            });
        });
        
        // Purchase listeners
        upgrades.forEach(upgrade => {
            const buyBtn = document.getElementById(`buy-${upgrade.id}`);
            if (buyBtn) {
                buyBtn.addEventListener('click', () => {
                    if (this.upgradeSystem.purchaseUpgrade(upgrade.id)) {
                        this.render();
                        this.showPurchaseEffect(upgrade);
                    } else {
                        this.showError('Not enough pearls!');
                    }
                });
            }
        });
        
        document.getElementById('close-shop')?.addEventListener('click', () => {
            this.hide();
        });
    }
    
    private renderUpgrade(upgrade: Upgrade): string {
        const level = this.upgradeSystem.getUpgradeLevel(upgrade.id);
        const effect = this.upgradeSystem.getUpgradeEffect(upgrade.id);
        const canAfford = this.upgradeSystem.canAfford(upgrade.id);
        const maxed = level >= upgrade.maxLevel;
        
        return `
            <div class="upgrade-item ${maxed ? 'maxed' : ''} ${canAfford ? '' : 'cant-afford'}">
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                    <div class="upgrade-level">
                        Level: ${level}/${upgrade.maxLevel}
                        ${level > 0 ? `<span class="current-effect">Current: ${effect.toFixed(1)}</span>` : ''}
                    </div>
                </div>
                <div class="upgrade-purchase">
                    ${maxed ? (
                        '<div class="maxed-badge">MAX</div>'
                    ) : (
                        `<button class="btn-buy" id="buy-${upgrade.id}" ${canAfford ? '' : 'disabled'}>
                            💎 ${upgrade.cost}
                        </button>`
                    )}
                </div>
            </div>
        `;
    }
    
    private showPurchaseEffect(upgrade: Upgrade): void {
        // Show purchase animation
        const effect = document.createElement('div');
        effect.className = 'purchase-effect';
        effect.textContent = `✨ ${upgrade.name} Upgraded! ✨`;
        effect.style.position = 'fixed';
        effect.style.top = '50%';
        effect.style.left = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.zIndex = '10000';
        effect.style.background = 'rgba(0, 212, 255, 0.9)';
        effect.style.color = '#fff';
        effect.style.padding = '20px 40px';
        effect.style.borderRadius = '10px';
        effect.style.fontSize = '1.5rem';
        effect.style.fontWeight = 'bold';
        effect.style.animation = 'fadeInOut 2s ease-out';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 2000);
    }
    
    private showError(message: string): void {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        error.style.position = 'fixed';
        error.style.top = '20%';
        error.style.left = '50%';
        error.style.transform = 'translateX(-50%)';
        error.style.zIndex = '10000';
        error.style.background = 'rgba(255, 0, 0, 0.9)';
        error.style.color = '#fff';
        error.style.padding = '15px 30px';
        error.style.borderRadius = '10px';
        error.style.fontSize = '1.2rem';
        error.style.animation = 'shake 0.5s ease-out';
        
        document.body.appendChild(error);
        
        setTimeout(() => {
            error.remove();
        }, 2000);
    }
    
    show(): void {
        this.render();
        this.container.style.display = 'flex';
    }
    
    hide(): void {
        this.container.style.display = 'none';
    }
    
    update(): void {
        this.render();
    }
}
