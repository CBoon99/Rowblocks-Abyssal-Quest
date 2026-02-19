import * as CANNON from 'cannon-es';
export class PhysicsWorld {
    constructor() {
        Object.defineProperty(this, "world", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Gravity (will be modified for underwater)
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        // Underwater physics: reduce gravity effect, add buoyancy
        this.world.gravity.set(0, -2, 0); // Reduced gravity for underwater feel
    }
    update(deltaTime) {
        this.world.step(1 / 60, deltaTime, 3);
    }
    addBody(body) {
        this.world.addBody(body);
    }
    removeBody(body) {
        this.world.removeBody(body);
    }
    getWorld() {
        return this.world;
    }
}
