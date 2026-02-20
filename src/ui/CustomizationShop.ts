import { useGameStore } from '../stores/GameStore';

interface Skin {
    id: string;
    name: string;
    color: string;
    cost: number;
    description: string;
}

interface Upgrade {
    id: string;
    name: string;
    cost: number;
    description: string;
    currentLevel: number;
    maxLevel: number;
}

export class CustomizationShop {
    private container: HTMLElement;
    private isVisible: boolean = false;
    
    private skins: Skin[] = [
        { id: 'default', name: 'Default', color: '#00aaff', cost: 0, description: 'Standard blue diver suit' },
        { id: 'coral', name: 'Coral', color: '#ff6b6b', cost: 50, description: 'Vibrant coral-colored suit' },
        { id: 'emerald', name: 'Emerald', color: '#51cf66', cost: 50, description: 'Deep green emerald suit' },
        { id: 'purple', name: 'Purple', color: '#9775fa', cost: 50, description: 'Mysterious purple suit' },
        { id: 'gold', name: 'Gold', color: '#ffd43b', cost: 100, description: 'Luxurious gold suit' }
    ];
    
    private upgrades: Upgrade[] = [
        {
            id: 'helmet',
            name: 'Helmet Upgrade',
            cost: 75,
            description: 'Increases flashlight brightness',
            currentLevel: 0,
            maxLevel: 3
        },
        {
            id: 'net',
            name: 'Net Upgrade',
            cost: 100,
            description: 'Increases collection range',
            currentLevel: 0,
            maxLevel: 5
        }
    ];
    
    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
        
        // Subscribe to store changes
        useGameStore.subscribe((state) => {
            if (this.isVisible) {
                this.render();
            }
        });
    }
    
    render(): void {
        const store = useGameStore.getState();
        const currentGems = store.gems;
        const currentSkin = store.currentSkin;
        const helmetLevel = store.helmetUpgrade;
        const netLevel = Math.floor((store.netRange - 5) / 1); // Convert range to level
        
        this.container.innerHTML = `
            <div class="customization-shop-screen">
                <div class="shop-header">
                    <h2>🛍️ Customization Shop</h2>
                    <button class="close-btn" id="shop-close">✕</button>
                </div>
                <div class="shop-currency">
                    <span class="currency-icon">💎</span>
                    <span class="currency-amount">${currentGems} Gems</span>
                </div>
                
                <div class="shop-section">
                    <h3>Skins</h3>
                    <div class="shop-items">
                        ${this.skins.map(skin => `
                            <div class="shop-item ${currentSkin === skin.id ? 'selected' : ''} ${skin.cost > currentGems ? 'cant-afford' : ''}">
                                <div class="item-preview" style="background: ${skin.color}"></div>
                                <div class="item-info">
                                    <div class="item-name">${skin.name}</div>
                                    <div class="item-desc">${skin.description}</div>
                                    ${skin.cost > 0 ? `
                                        <div class="item-cost">
                                            <span class="cost-icon">💎</span>
                                            <span class="cost-amount">${skin.cost}</span>
                                        </div>
                                    ` : '<div class="item-cost">Owned</div>'}
                                </div>
                                ${skin.cost > 0 && currentSkin !== skin.id ? `
                                    <button class="btn-buy" ${skin.cost > currentGems ? 'disabled' : ''} 
                                        data-skin-id="${skin.id}" data-cost="${skin.cost}">
                                        ${skin.cost > currentGems ? 'Can\'t Afford' : 'Buy'}
                                    </button>
                                ` : currentSkin === skin.id ? '<div class="item-owned">Equipped</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="shop-section">
                    <h3>Upgrades</h3>
                    <div class="shop-items">
                        ${this.renderUpgrade('helmet', helmetLevel, currentGems)}
                        ${this.renderUpgrade('net', netLevel, currentGems)}
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.container.querySelectorAll('.btn-buy[data-skin-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skinId = (e.target as HTMLElement).getAttribute('data-skin-id');
                const cost = parseInt((e.target as HTMLElement).getAttribute('data-cost') || '0');
                if (skinId) this.buySkin(skinId, cost);
            });
        });
        
        this.container.querySelectorAll('.btn-buy[data-upgrade-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = (e.target as HTMLElement).getAttribute('data-upgrade-id');
                const cost = parseInt((e.target as HTMLElement).getAttribute('data-cost') || '0');
                if (upgradeId) this.buyUpgrade(upgradeId, cost);
            });
        });
        
        const closeBtn = this.container.querySelector('#shop-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Shop close button clicked');
                this.hide();
            });
        }
        
        // Also close on Escape key
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    private renderUpgrade(id: string, currentLevel: number, gems: number): string {
        const upgrade = this.upgrades.find(u => u.id === id);
        if (!upgrade) return '';
        
        const isMaxLevel = currentLevel >= upgrade.maxLevel;
        const nextCost = upgrade.cost * (currentLevel + 1);
        const canAfford = gems >= nextCost;
        
        return `
            <div class="shop-item ${isMaxLevel ? 'maxed' : ''}">
                <div class="item-icon">${id === 'helmet' ? '💡' : '🎣'}</div>
                <div class="item-info">
                    <div class="item-name">${upgrade.name}</div>
                    <div class="item-desc">${upgrade.description}</div>
                    <div class="item-level">Level: ${currentLevel} / ${upgrade.maxLevel}</div>
                </div>
                ${!isMaxLevel ? `
                    <button class="btn-buy" ${!canAfford ? 'disabled' : ''}
                        data-upgrade-id="${id}" data-cost="${nextCost}">
                        ${!canAfford ? 'Can\'t Afford' : `Upgrade (💎${nextCost})`}
                    </button>
                ` : '<div class="item-owned">Max Level</div>'}
            </div>
        `;
    }
    
    private buySkin(skinId: string, cost: number): void {
        const store = useGameStore.getState();
        if (store.buySkin(skinId, cost)) {
            // Apply skin to swimmer (will be handled by SwimmerController)
            this.render();
        } else {
            // Show error
            alert('Not enough gems!');
        }
    }
    
    private buyUpgrade(upgradeId: string, cost: number): void {
        const store = useGameStore.getState();
        let success = false;
        
        if (upgradeId === 'helmet') {
            success = store.buyHelmetUpgrade(cost);
        } else if (upgradeId === 'net') {
            success = store.buyNetUpgrade(cost);
        }
        
        if (success) {
            this.render();
        } else {
            alert('Not enough gems!');
        }
    }
    
    show(): void {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.render();
    }
    
    hide(): void {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
}
