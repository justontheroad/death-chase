/**
 * BladeArray - Rotating blade array entity for Death Chase game
 * Implements the core rotating blade mechanics with orbiting blades
 */
export enum WeaponType {
    SWORD = 'sword',
    AXE = 'axe',
    SPEAR = 'spear',
    HAMMER = 'hammer',
    DAGGER = 'dagger'
}

export interface WeaponStats {
    damage: number;
    range: number;
    speed: number;
    health: number;
}

export interface BladeConfig {
    bladeCount?: number;
    radius?: number;
    rotationSpeed?: number;
    clockwise?: boolean;
    weaponType?: WeaponType;
    weaponLevel?: number;
}

interface BladeWithHealth {
    sprite: Phaser.GameObjects.Sprite;
    health: number;
}

export class BladeArray extends Phaser.GameObjects.Container {
    private blades: BladeWithHealth[] = [];
    private rotationSpeed: number;
    private radius: number;
    private bladeCount: number;
    private clockwise: boolean;
    private weaponType: WeaponType;
    private weaponLevel: number;
    private weaponStats: WeaponStats;

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
        this.weaponType = config.weaponType || WeaponType.SWORD;
        this.weaponLevel = config.weaponLevel || 1;
        this.weaponStats = this.calculateWeaponStats();

        // Create blades orbiting around the center point
        this.createBlades();
    }

    private calculateWeaponStats(): WeaponStats {
        const baseStats: Record<WeaponType, WeaponStats> = {
            [WeaponType.SWORD]: { damage: 10, range: 1.0, speed: 1.0, health: 100 },
            [WeaponType.AXE]: { damage: 15, range: 0.8, speed: 0.7, health: 120 },
            [WeaponType.SPEAR]: { damage: 8, range: 1.3, speed: 0.9, health: 80 },
            [WeaponType.HAMMER]: { damage: 20, range: 0.6, speed: 0.5, health: 150 },
            [WeaponType.DAGGER]: { damage: 6, range: 0.9, speed: 1.3, health: 60 }
        };

        const base = baseStats[this.weaponType];
        const levelMultiplier = 1 + (this.weaponLevel - 1) * 0.2;

        return {
            damage: Math.floor(base.damage * levelMultiplier),
            range: base.range,
            speed: base.speed,
            health: Math.floor(base.health * levelMultiplier)
        };
    }

    public upgradeWeapon() {
        this.weaponLevel++;
        this.weaponStats = this.calculateWeaponStats();
        this.updateBladeAppearance();
    }

    public setWeaponType(type: WeaponType) {
        this.weaponType = type;
        this.weaponStats = this.calculateWeaponStats();
        this.updateBladeAppearance();
    }

    private updateBladeAppearance() {
        // Update blade sprites based on weapon type and level
        this.blades.forEach((blade, index) => {
            // Set texture based on weapon type
            // Note: We'll use the same 'blade' texture for now, but can add different textures later
            
            // Set tint based on weapon level
            const tint = this.getWeaponTint();
            blade.sprite.setTint(tint);
            
            // Set scale based on weapon type and level
            const scale = this.getWeaponScale();
            blade.sprite.setScale(scale);
        });
    }

    private getWeaponTint(): number {
        const levelTints = [
            0xffffff, // Level 1 - White
            0xffd700, // Level 2 - Gold
            0x00ff00, // Level 3 - Green
            0x0000ff, // Level 4 - Blue
            0xff00ff  // Level 5 - Purple
        ];
        return levelTints[Math.min(this.weaponLevel - 1, levelTints.length - 1)];
    }

    private getWeaponScale(): number {
        const typeScales = {
            [WeaponType.SWORD]: 1.0,
            [WeaponType.AXE]: 1.2,
            [WeaponType.SPEAR]: 1.3,
            [WeaponType.HAMMER]: 1.4,
            [WeaponType.DAGGER]: 0.8
        };
        return typeScales[this.weaponType] * (1 + (this.weaponLevel - 1) * 0.1);
    }

    private createBlades() {
        for (let i = 0; i < this.bladeCount; i++) {
            const angle = (i / this.bladeCount) * Math.PI * 2;
            const bladeX = Math.cos(angle) * this.radius;
            const bladeY = Math.sin(angle) * this.radius;
            
            const blade = this.scene.add.sprite(bladeX, bladeY, 'blade');
            blade.setOrigin(0.5, 0.5);
            
            // Apply weapon appearance
            const tint = this.getWeaponTint();
            blade.setTint(tint);
            
            const scale = this.getWeaponScale();
            blade.setScale(scale);
            
            this.blades.push({
                sprite: blade,
                health: this.weaponStats.health
            });
            this.add(blade);
        }
    }

    update(delta: number) {
        // Frame-rate independent rotation using delta time
        const rotationDelta = this.rotationSpeed * this.weaponStats.speed * (delta / 1000);
        this.rotation += this.clockwise ? rotationDelta : -rotationDelta;
        
        // Update individual blade rotations to point in the direction of movement
        this.blades.forEach((blade, index) => {
            const angle = (index / this.bladeCount) * Math.PI * 2 + this.rotation;
            blade.sprite.rotation = angle + Math.PI / 2; // 调整武器朝向，使其尖端指向旋转方向
        });
    }

    // Public methods for game logic interaction
    public getBlades(): Phaser.GameObjects.Sprite[] {
        return this.blades.map(blade => blade.sprite);
    }

    public getBladeHealth(index: number): number {
        if (index >= 0 && index < this.blades.length) {
            return this.blades[index].health;
        }
        return 0;
    }

    public setBladeHealth(index: number, health: number): boolean {
        if (index >= 0 && index < this.blades.length) {
            this.blades[index].health = health;
            return true;
        }
        return false;
    }

    public removeBlade(index: number): boolean {
        if (index >= 0 && index < this.blades.length) {
            const blade = this.blades[index];
            blade.sprite.destroy();
            this.blades.splice(index, 1);
            this.bladeCount--;
            return true;
        }
        return false;
    }

    public isEmpty(): boolean {
        return this.blades.length === 0;
    }

    public getBladeCount(): number {
        return this.bladeCount;
    }

    public setRotationSpeed(speed: number) {
        this.rotationSpeed = speed;
    }

    public toggleDirection() {
        this.clockwise = !this.clockwise;
    }

    public getRadius(): number {
        return this.radius * this.weaponStats.range;
    }

    public getWeaponType(): WeaponType {
        return this.weaponType;
    }

    public getWeaponLevel(): number {
        return this.weaponLevel;
    }

    public getWeaponStats(): WeaponStats {
        return this.weaponStats;
    }

    public getEffectiveDamage(): number {
        return this.weaponStats.damage * this.bladeCount;
    }
}