/**
 * UIScene - User Interface overlay for Death Chase game
 * Handles rotation control zone, attack counter, and other UI elements
 */

import { CoreGameLogic } from '../core_logic';

export class UIScene extends Phaser.Scene {
    private gameLogic: CoreGameLogic | null = null;
    private attackCounterText: Phaser.GameObjects.Text | null = null;
    private rotationControlZone: Phaser.GameObjects.Graphics | null = null;
    private isRotationControlActive: boolean = false;
    private rotationAngle: number = 0;

    constructor() {
        super('UIScene');
    }

    init(data: any) {
        // Receive game logic reference from main scene
        if (data.gameLogic) {
            this.gameLogic = data.gameLogic;
        }
    }

    create() {
        // Create UI camera that doesn't move with the game world
        this.cameras.main.setScroll(0, 0);
        
        // Create attack counter display
        this.createAttackCounter();
        
        // Create rotation control zone
        this.createRotationControlZone();
        
        // Listen for attack counter updates from game logic
        if (this.scene.get('GameScene')) {
            this.scene.get('GameScene').events.on('attack-counter-updated', this.updateAttackCounter, this);
        }
    }

    update(time: number, delta: number) {
        // Update rotation control visualization if active
        if (this.isRotationControlActive) {
            this.updateRotationControlVisual();
        }
    }

    private createAttackCounter() {
        const x = this.scale.width - 100;
        const y = 50;
        
        this.attackCounterText = this.add.text(x, y, '攻击: 0', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'right'
        }).setOrigin(0.5, 0.5);
    }

    private updateAttackCounter(count: number) {
        if (this.attackCounterText) {
            this.attackCounterText.setText(`攻击: ${count}`);
        }
    }

    private createRotationControlZone() {
        const centerX = 100;
        const centerY = this.scale.height - 100;
        const radius = 60;
        
        // Create circular control zone
        this.rotationControlZone = this.add.graphics();
        this.rotationControlZone.fillStyle(0x444444, 0.7);
        this.rotationControlZone.fillCircle(centerX, centerY, radius);
        
        // Add visual indicator for the control zone
        this.rotationControlZone.lineStyle(3, 0xffffff, 1);
        this.rotationControlZone.strokeCircle(centerX, centerY, radius);
        
        // Add label
        this.add.text(centerX, centerY + radius + 20, '旋转控制', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Set up input for the rotation control zone
        this.setupRotationControlInput(centerX, centerY, radius);
    }

    private setupRotationControlInput(centerX: number, centerY: number, radius: number) {
        // Create an invisible button for the control zone
        const controlButton = this.add.zone(centerX, centerY, radius * 2, radius * 2);
        controlButton.setOrigin(0.5, 0.5);
        controlButton.setInteractive({ useHandCursor: true });
        
        controlButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.handleRotationControlDown(pointer, centerX, centerY);
        });
        
        controlButton.on('pointerup', () => {
            this.handleRotationControlUp();
        });
        
        controlButton.on('pointerout', () => {
            this.handleRotationControlUp();
        });
        
        // Also listen for global pointer movement when control is active
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isRotationControlActive) {
                this.handleRotationControlMove(pointer, centerX, centerY);
            }
        });
    }

    private handleRotationControlDown(pointer: Phaser.Input.Pointer, centerX: number, centerY: number) {
        this.isRotationControlActive = true;
        this.handleRotationControlMove(pointer, centerX, centerY);
        
        // Send input to game logic
        if (this.gameLogic) {
            this.gameLogic.handlePlayerInput({
                rotationControlActive: true,
                rotationAngle: this.rotationAngle
            });
        }
    }

    private handleRotationControlUp() {
        this.isRotationControlActive = false;
        
        // Send input to game logic
        if (this.gameLogic) {
            this.gameLogic.handlePlayerInput({
                rotationControlActive: false,
                rotationAngle: this.rotationAngle
            });
        }
    }

    private handleRotationControlMove(pointer: Phaser.Input.Pointer, centerX: number, centerY: number) {
        if (!this.isRotationControlActive) return;
        
        // Calculate angle from center to pointer position
        const dx = pointer.x - centerX;
        const dy = pointer.y - centerY;
        this.rotationAngle = Math.atan2(dy, dx);
        
        // Send updated angle to game logic
        if (this.gameLogic) {
            this.gameLogic.handlePlayerInput({
                rotationControlActive: true,
                rotationAngle: this.rotationAngle
            });
        }
    }

    private updateRotationControlVisual() {
        if (!this.rotationControlZone) return;
        
        const centerX = 100;
        const centerY = this.scale.height - 100;
        const radius = 60;
        
        // Clear and redraw with active state
        this.rotationControlZone.clear();
        this.rotationControlZone.fillStyle(0x6666ff, 0.8); // Active color
        this.rotationControlZone.fillCircle(centerX, centerY, radius);
        this.rotationControlZone.lineStyle(3, 0xffffff, 1);
        this.rotationControlZone.strokeCircle(centerX, centerY, radius);
        
        // Draw direction indicator
        const indicatorLength = radius * 0.7;
        const endX = centerX + Math.cos(this.rotationAngle) * indicatorLength;
        const endY = centerY + Math.sin(this.rotationAngle) * indicatorLength;
        
        this.rotationControlZone.lineStyle(4, 0xff0000, 1);
        this.rotationControlZone.moveTo(centerX, centerY);
        this.rotationControlZone.lineTo(endX, endY);
        this.rotationControlZone.strokePath();
    }

    // Public methods for external control
    public setAttackCounter(count: number) {
        this.updateAttackCounter(count);
    }

    public show() {
        this.scene.setVisible(true);
    }

    public hide() {
        this.scene.setVisible(false);
    }
}