import Phaser from 'phaser';
import { WeaponType } from '../entities/Blade';

export interface MenuSettings {
    selectedStage: number;
    selectedWeapon: WeaponType;
    musicEnabled: boolean;
}

export class MenuScene extends Phaser.Scene {
    private selectedStage: number = 1;
    private selectedWeapon: WeaponType = WeaponType.SWORD;
    private musicEnabled: boolean = true;
    
    private stageText!: Phaser.GameObjects.Text;
    private weaponText!: Phaser.GameObjects.Text;
    private musicText!: Phaser.GameObjects.Text;
    
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        const title = this.add.text(centerX, 80, '死亡追逐', {
            fontSize: '48px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.add.text(centerX, 140, 'DEATH CHASE', {
            fontSize: '24px',
            color: '#888888'
        }).setOrigin(0.5);
        
        const stageLabel = this.add.text(centerX - 150, centerY - 120, '关卡:', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        
        this.stageText = this.add.text(centerX + 50, centerY - 120, `第 ${this.selectedStage} 关`, {
            fontSize: '24px',
            color: '#ffff00'
        }).setOrigin(0, 0.5);
        
        const stageLeftBtn = this.createButton(centerX - 80, centerY - 120, '<', () => {
            if (this.selectedStage > 1) {
                this.selectedStage--;
                this.stageText.setText(`第 ${this.selectedStage} 关`);
            }
        });
        
        const stageRightBtn = this.createButton(centerX + 150, centerY - 120, '>', () => {
            if (this.selectedStage < 10) {
                this.selectedStage++;
                this.stageText.setText(`第 ${this.selectedStage} 关`);
            }
        });
        
        const weaponLabel = this.add.text(centerX - 150, centerY - 40, '武器:', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        
        const weaponNames: Record<WeaponType, string> = {
            [WeaponType.SWORD]: '剑',
            [WeaponType.AXE]: '斧',
            [WeaponType.SPEAR]: '矛',
            [WeaponType.HAMMER]: '锤',
            [WeaponType.DAGGER]: '匕首'
        };
        
        this.weaponText = this.add.text(centerX + 50, centerY - 40, weaponNames[this.selectedWeapon], {
            fontSize: '24px',
            color: '#00ff00'
        }).setOrigin(0, 0.5);
        
        const weaponLeftBtn = this.createButton(centerX - 80, centerY - 40, '<', () => {
            const weapons: WeaponType[] = [WeaponType.SWORD, WeaponType.AXE, WeaponType.SPEAR, WeaponType.HAMMER, WeaponType.DAGGER];
            const currentIndex = weapons.indexOf(this.selectedWeapon);
            const newIndex = (currentIndex - 1 + weapons.length) % weapons.length;
            this.selectedWeapon = weapons[newIndex];
            this.weaponText.setText(weaponNames[this.selectedWeapon]);
        });
        
        const weaponRightBtn = this.createButton(centerX + 150, centerY - 40, '>', () => {
            const weapons: WeaponType[] = [WeaponType.SWORD, WeaponType.AXE, WeaponType.SPEAR, WeaponType.HAMMER, WeaponType.DAGGER];
            const currentIndex = weapons.indexOf(this.selectedWeapon);
            const newIndex = (currentIndex + 1) % weapons.length;
            this.selectedWeapon = weapons[newIndex];
            this.weaponText.setText(weaponNames[this.selectedWeapon]);
        });
        
        const musicLabel = this.add.text(centerX - 150, centerY + 40, '音乐:', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        
        this.musicText = this.add.text(centerX + 50, centerY + 40, this.musicEnabled ? '开启' : '关闭', {
            fontSize: '24px',
            color: this.musicEnabled ? '#00ff00' : '#ff0000'
        }).setOrigin(0, 0.5);
        
        const musicBtn = this.createButton(centerX + 150, centerY + 40, '切换', () => {
            this.musicEnabled = !this.musicEnabled;
            this.musicText.setText(this.musicEnabled ? '开启' : '关闭');
            this.musicText.setColor(this.musicEnabled ? '#00ff00' : '#ff0000');
        });
        
        const startBtn = this.createStartButton(centerX, centerY + 140, '开始游戏', () => {
            const settings: MenuSettings = {
                selectedStage: this.selectedStage,
                selectedWeapon: this.selectedWeapon,
                musicEnabled: this.musicEnabled
            };
            this.scene.start('BootScene', settings);
        });
        
        this.add.text(centerX, centerY + 220, 'WASD/方向键 移动  |  拾取武器增强战力', {
            fontSize: '16px',
            color: '#666666'
        }).setOrigin(0.5);
        
        this.add.text(centerX, centerY + 250, '击败所有敌人和Boss过关', {
            fontSize: '16px',
            color: '#666666'
        }).setOrigin(0.5);
    }
    
    private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 40, 40, 0x444444);
        bg.setStrokeStyle(2, 0x666666);
        
        const label = this.add.text(0, 0, text, {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        container.add([bg, label]);
        
        bg.setInteractive({ useHandCursor: true });
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x666666);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x444444);
        });
        
        bg.on('pointerdown', () => {
            bg.setFillStyle(0x888888);
            callback();
        });
        
        bg.on('pointerup', () => {
            bg.setFillStyle(0x666666);
        });
        
        return container;
    }
    
    private createStartButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 200, 50, 0xff4444);
        bg.setStrokeStyle(2, 0xff6666);
        
        const label = this.add.text(0, 0, text, {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([bg, label]);
        
        bg.setInteractive({ useHandCursor: true });
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0xff6666);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xff4444);
        });
        
        bg.on('pointerdown', () => {
            bg.setFillStyle(0xff8888);
            callback();
        });
        
        bg.on('pointerup', () => {
            bg.setFillStyle(0xff6666);
        });
        
        return container;
    }
}
