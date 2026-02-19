import { GhostNet } from '../objects/GhostNet.js';
import { FishingLine } from '../objects/FishingLine.js';
import { Litter } from '../objects/Litter.js';

export class MissionManager {
    constructor(game) {
        this.game = game;
        this.activeMissions = [];
        this.missionObjects = [];
        this.missionSpawnTimer = 0;
        this.missionSpawnInterval = 30000; // 30 seconds
    }
    
    update(deltaTime) {
        this.missionSpawnTimer += deltaTime;
        
        // Spawn new missions periodically
        if (this.missionSpawnTimer >= this.missionSpawnInterval) {
            this.spawnRandomMission();
            this.missionSpawnTimer = 0;
        }
        
        // Update mission objects (iterate backwards to safely remove items)
        for (let i = this.missionObjects.length - 1; i >= 0; i--) {
            const obj = this.missionObjects[i];
            obj.update(deltaTime, this.game.player);
            
            // Check if mission is completed
            if (obj.isCompleted && obj.isCompleted()) {
                this.completeMission(obj);
                this.missionObjects.splice(i, 1);
                if (this.game.engine) {
                    this.game.engine.removeEntity(obj);
                }
            }
        }
    }
    
    spawnRandomMission() {
        const missionTypes = ['ghostNet', 'fishingLine', 'litter'];
        const type = missionTypes[Math.floor(Math.random() * missionTypes.length)];
        
        const canvas = this.game.canvas;
        const x = Math.random() * (canvas.width - 200) + 100;
        const y = Math.random() * (canvas.height - 200) + 100;
        
        let missionObj;
        
        switch(type) {
            case 'ghostNet':
                missionObj = new GhostNet(x, y, this.game.ctx);
                this.game.uiManager.showMissionAlert(
                    'Ghost Net Spotted!',
                    'A tangled net with trapped fish needs your help. Use Nudge to break the weak points!'
                );
                break;
            case 'fishingLine':
                missionObj = new FishingLine(x, y, this.game.ctx);
                this.game.uiManager.showMissionAlert(
                    'Fishing Line Detected!',
                    'A fishing line threatens marine life. Dash into it to break it!'
                );
                break;
            case 'litter':
                const litterCount = 3 + Math.floor(Math.random() * 3);
                for (let i = 0; i < litterCount; i++) {
                    const lx = x + (Math.random() - 0.5) * 200;
                    const ly = y + (Math.random() - 0.5) * 200;
                    const litter = new Litter(lx, ly, this.game.ctx);
                    this.missionObjects.push(litter);
                    if (this.game.engine) {
                        this.game.engine.addEntity(litter);
                    }
                }
                this.game.uiManager.showMissionAlert(
                    'Litter Cleanup Needed!',
                    'Collect floating plastic bags and bottles for Conservation Points!'
                );
                return;
        }
        
        if (missionObj) {
            this.missionObjects.push(missionObj);
            this.game.engine.addEntity(missionObj);
        }
    }
    
    completeMission(missionObj) {
        const reward = missionObj.getReward();
        this.game.player.addConservationPoints(reward);
        
        if (this.game.soundManager) {
            this.game.soundManager.playSound('success');
        }
    }
}

