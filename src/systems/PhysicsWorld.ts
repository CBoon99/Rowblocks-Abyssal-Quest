import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    private world: CANNON.World;
    
    constructor() {
        this.world = new CANNON.World();
        this.world.broadphase = new CANNON.NaiveBroadphase();
        // World.solver is typed as base Solver; default is GSSolver which has iterations
        (this.world.solver as CANNON.GSSolver).iterations = 8;

        // Near-neutral buoyancy — soft sink when idle, not a hard pull down
        this.world.gravity.set(0, -0.55, 0);
        // Slightly allow bodies to rest without jitter on soft contacts
        this.world.allowSleep = true;
    }
    
    update(deltaTime: number): void {
        this.world.step(1/60, deltaTime, 3);
    }
    
    addBody(body: CANNON.Body): void {
        this.world.addBody(body);
    }
    
    removeBody(body: CANNON.Body): void {
        this.world.removeBody(body);
    }
    
    getWorld(): CANNON.World {
        return this.world;
    }
}
