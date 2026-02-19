export class GameEngine {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.entities = [];
    }
    
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }
    
    update(deltaTime) {
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(deltaTime);
            }
        });
    }
    
    render() {
        this.entities.forEach(entity => {
            if (entity.render) {
                entity.render(this.ctx);
            }
        });
    }
    
    getEntitiesInRadius(x, y, radius) {
        return this.entities.filter(entity => {
            const dx = entity.x - x;
            const dy = entity.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    }
}

