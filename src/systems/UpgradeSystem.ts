export interface Upgrade {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: number;
    level: number;
    maxLevel: number;
    effect: (level: number) => number;
    category: 'ability' | 'powerup' | 'cosmetic';
}

export class UpgradeSystem {
    private upgrades: Map<string, Upgrade> = new Map();
    private currency: number = 0; // Pearls
    private ownedUpgrades: Map<string, number> = new Map();
    
    constructor() {
        this.initializeUpgrades();
    }
    
    private initializeUpgrades(): void {
        // Ability Upgrades
        this.upgrades.set('sonar_range', {
            id: 'sonar_range',
            name: 'Sonar Range',
            description: 'Increases sonar detection range',
            icon: '📡',
            cost: 50,
            level: 0,
            maxLevel: 5,
            effect: (level) => 200 + (level * 50), // Base 200, +50 per level
            category: 'ability'
        });
        
        this.upgrades.set('sonar_cooldown', {
            id: 'sonar_cooldown',
            name: 'Sonar Speed',
            description: 'Reduces sonar cooldown time',
            icon: '⚡',
            cost: 75,
            level: 0,
            maxLevel: 5,
            effect: (level) => 2000 - (level * 200), // Base 2000ms, -200ms per level
            category: 'ability'
        });
        
        this.upgrades.set('nudge_power', {
            id: 'nudge_power',
            name: 'Nudge Power',
            description: 'Increases nudge force and range',
            icon: '💨',
            cost: 60,
            level: 0,
            maxLevel: 5,
            effect: (level) => 3 + (level * 0.5), // Base 3, +0.5 per level
            category: 'ability'
        });
        
        this.upgrades.set('speed_burst', {
            id: 'speed_burst',
            name: 'Speed Burst',
            description: 'Increases speed burst duration',
            icon: '🚀',
            cost: 80,
            level: 0,
            maxLevel: 5,
            effect: (level) => 1000 + (level * 200), // Base 1000ms, +200ms per level
            category: 'ability'
        });
        
        this.upgrades.set('bioluminescence', {
            id: 'bioluminescence',
            name: 'Bioluminescence',
            description: 'Increases light radius and intensity',
            icon: '💡',
            cost: 70,
            level: 0,
            maxLevel: 5,
            effect: (level) => 100 + (level * 20), // Base 100, +20 per level
            category: 'ability'
        });
        
        // Power-up Upgrades
        this.upgrades.set('extra_moves', {
            id: 'extra_moves',
            name: 'Extra Moves',
            description: 'Start levels with bonus moves',
            icon: '➕',
            cost: 100,
            level: 0,
            maxLevel: 3,
            effect: (level) => level * 3, // +3 moves per level
            category: 'powerup'
        });
        
        this.upgrades.set('undo', {
            id: 'undo',
            name: 'Undo Power',
            description: 'Allows undoing moves',
            icon: '↩️',
            cost: 150,
            level: 0,
            maxLevel: 3,
            effect: (level) => level, // Number of undos
            category: 'powerup'
        });
        
        this.upgrades.set('hint', {
            id: 'hint',
            name: 'Hint System',
            description: 'Shows hints for puzzle solutions',
            icon: '💡',
            cost: 200,
            level: 0,
            maxLevel: 3,
            effect: (level) => level, // Number of hints per level
            category: 'powerup'
        });
        
        this.upgrades.set('time_bonus', {
            id: 'time_bonus',
            name: 'Time Bonus',
            description: 'Increases score multiplier for faster completion',
            icon: '⏱️',
            cost: 120,
            level: 0,
            maxLevel: 5,
            effect: (level) => 1 + (level * 0.2), // Score multiplier
            category: 'powerup'
        });
        
        // Cosmetic Upgrades
        this.upgrades.set('avatar_skin', {
            id: 'avatar_skin',
            name: 'Avatar Skin',
            description: 'Customize your Rowlock appearance',
            icon: '🎨',
            cost: 50,
            level: 0,
            maxLevel: 10,
            effect: (level) => level, // Skin ID
            category: 'cosmetic'
        });
        
        this.upgrades.set('particle_effect', {
            id: 'particle_effect',
            name: 'Particle Effects',
            description: 'Enhanced visual effects',
            icon: '✨',
            cost: 80,
            level: 0,
            maxLevel: 5,
            effect: (level) => level, // Effect intensity
            category: 'cosmetic'
        });
        
        this.upgrades.set('trail_effect', {
            id: 'trail_effect',
            name: 'Trail Effect',
            description: 'Adds a trail when moving',
            icon: '🌟',
            cost: 60,
            level: 0,
            maxLevel: 3,
            effect: (level) => level, // Trail style
            category: 'cosmetic'
        });
    }
    
    purchaseUpgrade(upgradeId: string): boolean {
        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade) return false;
        
        if (upgrade.level >= upgrade.maxLevel) return false;
        if (this.currency < upgrade.cost) return false;
        
        this.currency -= upgrade.cost;
        upgrade.level++;
        this.ownedUpgrades.set(upgradeId, upgrade.level);
        
        // Increase cost for next level
        upgrade.cost = Math.floor(upgrade.cost * 1.5);
        
        return true;
    }
    
    getUpgradeLevel(upgradeId: string): number {
        return this.ownedUpgrades.get(upgradeId) || 0;
    }
    
    getUpgradeEffect(upgradeId: string): number {
        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade) return 0;
        
        const level = this.getUpgradeLevel(upgradeId);
        return upgrade.effect(level);
    }
    
    getAllUpgrades(): Upgrade[] {
        return Array.from(this.upgrades.values());
    }
    
    getUpgradesByCategory(category: 'ability' | 'powerup' | 'cosmetic'): Upgrade[] {
        return Array.from(this.upgrades.values()).filter(u => u.category === category);
    }
    
    addCurrency(amount: number): void {
        this.currency += amount;
    }
    
    getCurrency(): number {
        return this.currency;
    }
    
    canAfford(upgradeId: string): boolean {
        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade) return false;
        return this.currency >= upgrade.cost && upgrade.level < upgrade.maxLevel;
    }
}
