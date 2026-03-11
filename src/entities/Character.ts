export interface CharacterParams {
    name: string;
    attackRange: number;
    speed: number;
    abilities: string[];
}

export enum CharacterState {
    PREY = 'prey',
    HUNTER = 'hunter'
}

export class Character extends Phaser.GameObjects.Sprite {
    private params: CharacterParams;
    private characterState: CharacterState;
    private health: number;
    private maxHealth: number;

    constructor(scene: Phaser.Scene, x: number, y: number, params?: CharacterParams) {
        super(scene, x, y, 'character');
        scene.add.existing(this);
        
        this.params = params || {
            name: 'Default',
            attackRange: 50,
            speed: 200,
            abilities: []
        };

        this.characterState = CharacterState.PREY;
        this.maxHealth = 100;
        this.health = this.maxHealth;
    }

    public moveTowards(x: number, y: number): void {
        this.setPosition(x, y);
    }

    public stopMovement(): void {
        // Do nothing for now
    }

    public transformToHunter(): boolean {
        if (this.characterState === CharacterState.PREY) {
            this.characterState = CharacterState.HUNTER;
            this.setTint(0xff0000);
            return true;
        }
        return false;
    }

    public transformToPrey(): boolean {
        if (this.characterState === CharacterState.HUNTER) {
            this.characterState = CharacterState.PREY;
            this.clearTint();
            return true;
        }
        return false;
    }

    public getHealth(): number {
        return this.health;
    }

    public getSpeed(): number {
        return this.params.speed;
    }

    public setSpeed(speed: number): void {
        this.params.speed = speed;
    }

    public takeDamage(amount: number): boolean {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    public levelUp() {
        this.maxHealth += 20; // 每次升级增加20点最大生命值
        this.health = this.maxHealth; // 升级时生命值回满
    }

    public getMaxHealth(): number {
        return this.maxHealth;
    }

    public setHealth(health: number) {
        this.health = Math.min(health, this.maxHealth);
    }
}