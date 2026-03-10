/**
 * BladeArray - Rotating blade array entity for Death Chase game
 * Implements the core rotating blade mechanics with orbiting blades
 */
export interface BladeConfig {
    bladeCount?: number;
    radius?: number;
    rotationSpeed?: number;
    clockwise?: boolean;
}

export class BladeArray extends Phaser.GameObjects.Container {
    private blades: Phaser.GameObjects.Sprite[] = [];
    private rotationSpeed: number;
    private radius: number;
    private bladeCount: number;
    private clockwise: boolean;

    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        config: BladeConfig
    ) {
        super(scene, x, y);
        scene.add.existing(this);

        this.rotationSpeed = config.rotationSpeed || 2.0;
        this.radius = config.radius || 150;
        this.bladeCount = config.bladeCount || 4;
        this.clockwise = config.clockwise !== undefined ? config.clockwise : true;

        // Create blades orbiting around the center point
        this.createBlades();
    }

    private createBlades() {
        for (let i = 0; i < this.bladeCount; i++) {
            const angle = (i / this.bladeCount) * Math.PI * 2;
            const bladeX = Math.cos(angle) * this.radius;
            const bladeY = Math.sin(angle) * this.radius;
            
            const blade = this.scene.add.sprite(bladeX, bladeY, 'blade');
            blade.setOrigin(0.5, 0.5);
            
            this.blades.push(blade);
            this.add(blade);
        }
    }

    update(delta: number) {
        // Frame-rate independent rotation using delta time
        const rotationDelta = this.rotationSpeed * (delta / 1000);
        this.rotation += this.clockwise ? rotationDelta : -rotationDelta;
    }

    // Public methods for game logic interaction
    public getBlades(): Phaser.GameObjects.Sprite[] {
        return this.blades;
    }

    public setRotationSpeed(speed: number) {
        this.rotationSpeed = speed;
    }

    public toggleDirection() {
        this.clockwise = !this.clockwise;
    }

    public getRadius(): number {
        return this.radius;
    }

    public getBladeCount(): number {
        return this.bladeCount;
    }
}