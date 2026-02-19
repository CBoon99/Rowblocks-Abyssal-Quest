import { Game } from '../systems/Game';

export class UIManager {
    constructor(private game: Game) {
        this.setupUI();
    }
    
    private setupUI(): void {
        // Update HUD elements
        setInterval(() => {
            this.updateHUD();
        }, 100);
    }
    
    private updateHUD(): void {
        // Update UI elements based on game state
        const pearlsEl = document.getElementById('pearls');
        const levelEl = document.getElementById('level');
        const movesEl = document.getElementById('moves');
        
        // TODO: Update from game state
        if (pearlsEl) pearlsEl.textContent = '0';
        if (levelEl) levelEl.textContent = 'Level 1';
        if (movesEl) movesEl.textContent = '0';
    }
}
