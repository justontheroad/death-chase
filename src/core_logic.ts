import { GameScene } from './scenes/GameScene';
import { Character, CharacterParams } from './entities/Character';
import { BladeArray, BladeConfig } from './entities/Blade';

export interface GameConfig {
    player: CharacterParams;
    levels: LevelConfig[];
}

export interface LevelConfig {
    id: number;
    name: string;
    difficulty: '初阶' | '中阶' | '高阶';
    bladeArrays: BladeConfig[];
    enemies: EnemyConfig[];
    successRateTarget: number;
    isTutorial?: boolean;
}

export interface EnemyConfig {
    type: string;
    count: number;
    params: CharacterParams;
}

export interface PlayerInput {
    rotationControlActive: boolean;
    rotationAngle: number;
    targetX?: number;
    targetY?: number;
}

export class CoreGameLogic {
    private scene: GameScene;
    private config: GameConfig;
    private currentLevel: number = 0;

    constructor(scene: GameScene, config: GameConfig) {
        this.scene = scene;
        this.config = config;
        this.initializeLevel(1);
    }

    private initializeLevel(levelId: number): void {
        const levelConfig = this.config.levels.find(l => l.id === levelId);
        if (!levelConfig) {
            console.error(`Level ${levelId} not found in configuration`);
            return;
        }

        this.currentLevel = levelId;
        
        // Clear existing entities
        if (this.scene.player) {
            this.scene.player.destroy();
            this.scene.player = null;
        }

        // Create player first at center of screen
        this.scene.player = new Character(this.scene, 400, 300, this.config.player);

        // Handle tutorial level
        if (levelConfig.isTutorial) {
            this.startTutorial();
        }
    }

    private startTutorial(): void {
        console.log('Starting tutorial for level 1');
    }

    public handlePlayerInput(inputData: PlayerInput): void {
        if (!this.scene.player) return;

        // Handle movement input
        if (inputData.targetX !== undefined && inputData.targetY !== undefined) {
            this.scene.player.moveTowards(inputData.targetX, inputData.targetY);
        }
    }

    public checkGameOver(): boolean {
        if (this.scene.player && this.scene.player.getHealth() <= 0) {
            this.scene.events.emit('game-over');
            return true;
        }
        return false;
    }

    public restartCurrentLevel(): void {
        this.initializeLevel(this.currentLevel);
    }
}