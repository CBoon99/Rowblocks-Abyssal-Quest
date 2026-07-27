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
        { id: 'default', name: "Jasmine's Dive", color: '#f07a28', cost: 0, description: 'Black suit + orange sleeves — her look' },
        { id: 'coral', name: 'Coral Sleeves', color: '#ff6b7a', cost: 50, description: 'Coral pink sleeve accent' },
        { id: 'emerald', name: 'Reef Sleeves', color: '#2ee59d', cost: 50, description: 'Healthy reef green sleeves' },
        { id: 'purple', name: 'Twilight Sleeves', color: '#9b7bff', cost: 50, description: 'Deep purple sleeve accent' },
        { id: 'gold', name: 'Guardian Gold', color: '#ffd166', cost: 100, description: 'Gold sleeves — Guardian of the Reef' },
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
    
    /** Gift day: single wallet — pearls (upgrades) + legacy gems treated as pearls */
    private pearlBalance(): number {
        const gems = useGameStore.getState().gems ?? 0;
        let pearls = 0;
        try {
            pearls = (window as any).game?.getUpgradeSystem?.()?.getCurrency?.() ?? 0;
        } catch {
            /* soft */
        }
        return gems + pearls;
    }

    /** Spend cost from store gems first, then upgrade pearls */
    private spendPearls(cost: number): boolean {
        if (cost <= 0) return true;
        if (this.pearlBalance() < cost) return false;
        const store = useGameStore.getState();
        let left = cost;
        const gems = store.gems ?? 0;
        if (gems > 0 && left > 0) {
            const take = Math.min(gems, left);
            if (store.spendGems(take)) left -= take;
        }
        if (left > 0) {
            try {
                const up = (window as any).game?.getUpgradeSystem?.();
                if (up && typeof up.getCurrency === 'function' && up.getCurrency() >= left) {
                    up.addCurrency(-left);
                    left = 0;
                }
            } catch {
                /* soft */
            }
        }
        return left === 0;
    }

    render(): void {
        const store = useGameStore.getState();
        const currentPearls = this.pearlBalance();
        const currentSkin = store.currentSkin;
        const helmetLevel = store.helmetUpgrade;
        const netLevel = Math.floor((store.netRange - 5) / 1); // Convert range to level
        
        this.container.innerHTML = `
            <div class="customization-shop-screen">
                <div class="shop-header">
                    <h2>Customization Shop</h2>
                    <button class="close-btn" id="shop-close">✕</button>
                </div>
                <div class="shop-currency">
                    <span class="currency-icon">◆</span>
                    <span class="currency-amount">${currentPearls} Pearls</span>
                </div>
                
                <div class="shop-section">
                    <h3>Skins</h3>
                    <div class="shop-items">
                        ${this.skins.map(skin => `
                            <div class="shop-item ${currentSkin === skin.id ? 'selected' : ''} ${skin.cost > currentPearls ? 'cant-afford' : ''}">
                                <div class="item-preview" style="background: ${skin.color}"></div>
                                <div class="item-info">
                                    <div class="item-name">${skin.name}</div>
                                    <div class="item-desc">${skin.description}</div>
                                    ${skin.cost > 0 ? `
                                        <div class="item-cost">
                                            <span class="cost-icon">◆</span>
                                            <span class="cost-amount">${skin.cost}</span>
                                        </div>
                                    ` : '<div class="item-cost">Owned</div>'}
                                </div>
                                ${skin.cost > 0 && currentSkin !== skin.id ? `
                                    <button class="btn-buy" ${skin.cost > currentPearls ? 'disabled' : ''} 
                                        data-skin-id="${skin.id}" data-cost="${skin.cost}">
                                        ${skin.cost > currentPearls ? 'Can\'t Afford' : 'Buy'}
                                    </button>
                                ` : currentSkin === skin.id ? '<div class="item-owned">Equipped</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="shop-section">
                    <h3>Upgrades</h3>
                    <div class="shop-items">
                        ${this.renderUpgrade('helmet', helmetLevel, currentPearls)}
                        ${this.renderUpgrade('net', netLevel, currentPearls)}
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
    
    private renderUpgrade(id: string, currentLevel: number, pearls: number): string {
        const upgrade = this.upgrades.find(u => u.id === id);
        if (!upgrade) return '';
        
        const isMaxLevel = currentLevel >= upgrade.maxLevel;
        const nextCost = upgrade.cost * (currentLevel + 1);
        const canAfford = pearls >= nextCost;
        
        return `
            <div class="shop-item ${isMaxLevel ? 'maxed' : ''}">
                <div class="item-icon">${id === 'helmet' ? '◇' : '◈'}</div>
                <div class="item-info">
                    <div class="item-name">${upgrade.name}</div>
                    <div class="item-desc">${upgrade.description}</div>
                    <div class="item-level">Level: ${currentLevel} / ${upgrade.maxLevel}</div>
                </div>
                ${!isMaxLevel ? `
                    <button class="btn-buy" ${!canAfford ? 'disabled' : ''}
                        data-upgrade-id="${id}" data-cost="${nextCost}">
                        ${!canAfford ? 'Can\'t Afford' : `Upgrade (◆${nextCost})`}
                    </button>
                ` : '<div class="item-owned">Max Level</div>'}
            </div>
        `;
    }
    
    private buySkin(skinId: string, cost: number): void {
        if (!this.spendPearls(cost)) {
            alert('Not enough pearls!');
            return;
        }
        useGameStore.setState((state) => {
            const owned = state.ownedSkins.includes(skinId)
                ? state.ownedSkins
                : [...state.ownedSkins, skinId];
            return { currentSkin: skinId, ownedSkins: owned };
        });
        this.render();
    }
    
    private buyUpgrade(upgradeId: string, cost: number): void {
        if (!this.spendPearls(cost)) {
            alert('Not enough pearls!');
            return;
        }
        if (upgradeId === 'helmet') {
            useGameStore.setState((s) => ({
                helmetUpgrade: (s.helmetUpgrade ?? 0) + 1,
            }));
        } else if (upgradeId === 'net') {
            useGameStore.setState((s) => ({
                netRange: (s.netRange ?? 5) + 1.0,
            }));
        }
        this.render();
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
