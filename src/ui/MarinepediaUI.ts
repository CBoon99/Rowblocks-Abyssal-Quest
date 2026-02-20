import { useGameStore, CollectedFish } from '../stores/GameStore';

export class MarinepediaUI {
    private container: HTMLElement;
    private isVisible: boolean = false;
    private newFishNotification: HTMLElement | null = null;
    
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
        const collectedFish = useGameStore.getState().collectedFish;
        const totalFish = collectedFish.length;
        
        this.container.innerHTML = `
            <div class="marinepedia-screen">
                <div class="marinepedia-header">
                    <h2>📚 Marinepedia</h2>
                    <button class="close-btn" id="marinepedia-close">✕</button>
                </div>
                <div class="marinepedia-stats">
                    <div class="stat-item">
                        <span class="stat-label">Collected:</span>
                        <span class="stat-value">${totalFish} / 10</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Progress:</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(totalFish / 10) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="marinepedia-grid" id="marinepedia-grid">
                    ${this.renderFishEntries(collectedFish)}
                </div>
            </div>
        `;
        
        // Add close button handler
        const closeBtn = this.container.querySelector('#marinepedia-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Marinepedia close button clicked');
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
    
    private renderFishEntries(fish: CollectedFish[]): string {
        const fishTypes = [
            { type: 'clownfish', name: 'Clownfish', icon: '🐠', desc: 'Bright orange fish with white stripes. Common in shallow coral reefs.' },
            { type: 'angelfish', name: 'Angelfish', icon: '🐟', desc: 'Graceful blue fish with tall fins. Found in medium depths.' },
            { type: 'jellyfish', name: 'Jellyfish', icon: '🎐', desc: 'Transparent, pulsing creature. Glows with bioluminescence.' },
            { type: 'shark', name: 'Shark', icon: '🦈', desc: 'Large predator. Rare and dangerous. Found in deep waters.' }
        ];
        
        return fishTypes.map((fishType) => {
            const collected = fish.find((f) => f.type === fishType.type);
            const isNew = collected && (Date.now() - collected.timestamp) < 10000; // New if caught in last 10 seconds
            
            return `
                <div class="fish-entry ${collected ? 'collected' : 'locked'}" data-type="${fishType.type}">
                    ${isNew ? '<div class="new-badge">NEW!</div>' : ''}
                    <div class="fish-icon">${fishType.icon}</div>
                    <div class="fish-name">${fishType.name}</div>
                    ${collected ? `
                        <div class="fish-details">
                            <div class="fish-desc">${fishType.desc}</div>
                            <div class="fish-info">
                                <span>Depth: ${collected.depth.toFixed(0)}m</span>
                                <span>Found: ${new Date(collected.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ` : `
                        <div class="fish-locked">
                            <div class="locked-icon">🔒</div>
                            <div class="locked-text">Not discovered</div>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }
    
    show(): void {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.render();
        
        // Show "New!" notification if there are new fish
        const newFish = useGameStore.getState().collectedFish.filter(
            (f) => Date.now() - f.timestamp < 10000
        );
        if (newFish.length > 0) {
            this.showNewFishNotification(newFish);
        }
    }
    
    hide(): void {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
    
    private showNewFishNotification(fish: CollectedFish[]): void {
        // Remove existing notification
        if (this.newFishNotification) {
            this.newFishNotification.remove();
        }
        
        this.newFishNotification = document.createElement('div');
        this.newFishNotification.className = 'new-fish-notification';
        this.newFishNotification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🎉</span>
                <span class="notification-text">New fish discovered: ${fish.map(f => f.name).join(', ')}!</span>
            </div>
        `;
        
        document.body.appendChild(this.newFishNotification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (this.newFishNotification) {
                this.newFishNotification.remove();
                this.newFishNotification = null;
            }
        }, 3000);
    }
}
