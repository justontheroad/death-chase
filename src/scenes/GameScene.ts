import { BladeArray, WeaponType } from '../entities/Blade';
import { Character } from '../entities/Character';

interface EnemyData {
    character: Character;
    blades: BladeArray[];
    level: number;
    moveTargetX: number;
    moveTargetY: number;
    isMoving: boolean;
}

interface BossData {
    character: Character;
    blades: BladeArray[];
    level: number;
    maxHealth: number;
    currentHealth: number;
    isAlive: boolean;
}

export interface WeaponPowerUp {
    sprite: Phaser.GameObjects.Sprite;
    isActive: boolean;
    weaponType: WeaponType;
    weaponLevel: number;
}

export class GameScene extends Phaser.Scene {
    public player: Character | null = null;
    public playerBlades: BladeArray[] = [];
    public playerLevel: number = 1;
    public playerExp: number = 0;
    public expToNextLevel: number = 100;
    
    private enemies: EnemyData[] = [];
    private boss: BossData | null = null;
    private totalEnemySlots: number = 15;
    private weaponPowerUps: WeaponPowerUp[] = [];
    private maxPowerUps: number = 5;
    
    private worldWidth: number = 8000;
    private worldHeight: number = 6000;
    private background!: Phaser.GameObjects.Image;
    
    // UI
    private levelText!: Phaser.GameObjects.Text;
    private expText!: Phaser.GameObjects.Text;
    private enemyCountText!: Phaser.GameObjects.Text;
    private bossHealthText!: Phaser.GameObjects.Text;
    private victoryText!: Phaser.GameObjects.Text;
    
    // Movement
    private playerTargetX: number = 400;
    private playerTargetY: number = 300;
    private isMoving: boolean = false;
    
    // Game state
    private isGameOver: boolean = false;
    private isVictory: boolean = false;
    private currentStage: number = 1;

    constructor() {
        super('GameScene');
    }

    create() {
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.background = this.add.image(this.worldWidth / 2, this.worldHeight / 2, 'bamboo_forest');
        this.background.setDisplaySize(this.worldWidth, this.worldHeight);
        this.background.setDepth(-10);

        this.createPlayer();
        this.setupCamera();
        this.createUI();
        this.createWeaponPowerUps();

        this.time.delayedCall(1000, () => {
            this.initializeEnemies();
        });

        this.input.on('pointerdown', this.handlePointerDown, this);

        this.time.addEvent({
            delay: 16,
            callback: this.updateCombat,
            callbackScope: this,
            loop: true
        });
    }

    update(time: number, delta: number) {
        if (this.isGameOver || !this.player) return;

        if (this.isMoving) {
            this.updatePlayerMovement(delta);
        }

        this.playerBlades.forEach(bladeArray => {
            bladeArray.update(delta);
            bladeArray.setPosition(this.player!.x, this.player!.y);
        });

        this.updateEnemies(delta);
        this.updateBoss(delta);
        this.updateWeaponPowerUps(delta);
    }

    private createPlayer() {
        this.player = new Character(this, 400, 300, {
            name: 'Player',
            attackRange: 70,
            speed: 250,
            abilities: []
        });
        
        this.player.setTexture('character');
        this.createPlayerBlades();
    }

    private createPlayerBlades() {
        this.playerBlades.forEach(bladeArray => bladeArray.destroy());
        this.playerBlades = [];
        
        if (!this.player) return;
        
        // 为玩家选择武器类型（可以根据玩家等级或其他因素决定）
        const weaponType = this.getRandomWeaponType();
        const weaponLevel = Math.min(Math.floor(this.playerLevel / 2) + 1, 5);
        
        const bladeArray = new BladeArray(
            this,
            this.player.x,
            this.player.y,
            {
                bladeCount: this.playerLevel + 2,
                radius: 120,
                rotationSpeed: 3.0,
                clockwise: true,
                weaponType: weaponType,
                weaponLevel: weaponLevel
            }
        );
        
        this.playerBlades.push(bladeArray);
    }

    private getRandomWeaponType(): WeaponType {
        const types = [WeaponType.SWORD, WeaponType.AXE, WeaponType.SPEAR, WeaponType.HAMMER, WeaponType.DAGGER];
        return types[Math.floor(Math.random() * types.length)];
    }

    private setupCamera() {
        if (!this.player) return;
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(0.6);
    }

    private createUI() {
        this.levelText = this.add.text(20, 20, `Level: ${this.playerLevel}`, {
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.levelText.setScrollFactor(0);

        this.expText = this.add.text(20, 55, `EXP: ${this.playerExp}/${this.expToNextLevel}`, {
            fontSize: '22px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.expText.setScrollFactor(0);

        this.enemyCountText = this.add.text(20, 90, `Enemies: ${this.totalEnemySlots}`, {
            fontSize: '20px',
            color: '#ff6666',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.enemyCountText.setScrollFactor(0);

        this.bossHealthText = this.add.text(20, 120, '', {
            fontSize: '24px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.bossHealthText.setScrollFactor(0);
        this.bossHealthText.setVisible(false);

        this.victoryText = this.add.text(400, 300, '', {
            fontSize: '48px',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.victoryText.setOrigin(0.5);
        this.victoryText.setScrollFactor(0);
        this.victoryText.setVisible(false);
    }

    private initializeEnemies() {
        for (let i = 0; i < this.totalEnemySlots; i++) {
            this.spawnEnemyWithDelay(i * 300);
        }
        
        this.time.delayedCall(this.totalEnemySlots * 300 + 1000, () => {
            this.spawnBoss();
        });
    }

    private spawnEnemyWithDelay(delay: number) {
        this.time.delayedCall(delay, () => {
            this.spawnSingleEnemy();
        });
    }

    private spawnSingleEnemy() {
        if (!this.player) return;
        
        let x, y;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(300, this.worldWidth - 300);
            y = Phaser.Math.Between(300, this.worldHeight - 300);
            attempts++;
        } while (
            Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 1000 && 
            attempts < 30
        );

        const enemyLevel = Math.max(1, this.playerLevel - Phaser.Math.Between(1, 3));
        
        const enemy = new Character(this, x, y, {
            name: `Enemy_Lv${enemyLevel}`,
            attackRange: 40,
            speed: 30 + Math.random() * 40,
            abilities: []
        });
        
        enemy.setTexture('enemy_warrior');
        enemy.setAlpha(0);
        
        this.tweens.add({
            targets: enemy,
            alpha: 1,
            duration: 500,
            ease: 'Linear'
        });
        
        const blades: BladeArray[] = [];
        const weaponType = this.getRandomWeaponType();
        const weaponLevel = Math.min(enemyLevel, 5);
        const bladeArray = new BladeArray(this, x, y, {
            bladeCount: enemyLevel + 1,
            radius: 80,
            rotationSpeed: 2.0 + Math.random() * 2.0,
            clockwise: Math.random() > 0.5,
            weaponType: weaponType,
            weaponLevel: weaponLevel
        });
        blades.push(bladeArray);
        
        const moveTargetX = Phaser.Math.Between(200, this.worldWidth - 200);
        const moveTargetY = Phaser.Math.Between(200, this.worldHeight - 200);
        
        const enemyData: EnemyData = {
            character: enemy,
            blades: blades,
            level: enemyLevel,
            moveTargetX,
            moveTargetY,
            isMoving: true
        };
        
        this.enemies.push(enemyData);
    }

    private spawnBoss() {
        if (!this.player) return;
        
        let x, y;
        do {
            x = Phaser.Math.Between(500, this.worldWidth - 500);
            y = Phaser.Math.Between(500, this.worldHeight - 500);
        } while (
            Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 2000
        );

        const bossLevel = this.playerLevel + 2;
        
        const boss = new Character(this, x, y, {
            name: `BOSS Lv${bossLevel}`,
            attackRange: 60,
            speed: 40,
            abilities: []
        });
        
        boss.setTexture('enemy_archer');
        boss.setTint(0xff00ff);
        boss.setScale(1.5);
        
        boss.setAlpha(0);
        this.tweens.add({
            targets: boss,
            alpha: 1,
            duration: 1000,
            ease: 'Linear'
        });
        
        const blades: BladeArray[] = [];
        const weaponType = this.getRandomWeaponType();
        const weaponLevel = Math.min(bossLevel, 5);
        const bladeArray = new BladeArray(this, x, y, {
            bladeCount: bossLevel + 3,
            radius: 150,
            rotationSpeed: 4.0,
            clockwise: true,
            weaponType: weaponType,
            weaponLevel: weaponLevel
        });
        blades.push(bladeArray);
        
        this.boss = {
            character: boss,
            blades: blades,
            level: bossLevel,
            maxHealth: bossLevel * 100,
            currentHealth: bossLevel * 100,
            isAlive: true
        };
        
        this.bossHealthText.setText(`BOSS HP: ${this.boss.currentHealth}/${this.boss.maxHealth}`);
        this.bossHealthText.setVisible(true);
    }

    private updateEnemies(delta: number) {
        this.enemies.forEach(enemyData => {
            if (!enemyData.character.active) return;
            
            const enemy = enemyData.character;
            
            if (enemyData.isMoving) {
                const dx = enemyData.moveTargetX - enemy.x;
                const dy = enemyData.moveTargetY - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 10) {
                    enemyData.moveTargetX = Phaser.Math.Between(200, this.worldWidth - 200);
                    enemyData.moveTargetY = Phaser.Math.Between(200, this.worldHeight - 200);
                } else {
                    const speed = enemy.getSpeed() * (delta / 1000);
                    enemy.x += (dx / distance) * speed;
                    enemy.y += (dy / distance) * speed;
                }
            }
            
            enemyData.blades.forEach(bladeArray => {
                bladeArray.update(delta);
                bladeArray.setPosition(enemy.x, enemy.y);
            });
        });
        
        const aliveEnemies = this.enemies.filter(e => e.character.active).length;
        this.enemyCountText.setText(`Enemies: ${aliveEnemies}/${this.totalEnemySlots}`);
    }

    private updateBoss(delta: number) {
        if (!this.boss || !this.boss.isAlive) return;
        
        const boss = this.boss.character;
        
        this.boss.blades.forEach(bladeArray => {
            bladeArray.update(delta);
            bladeArray.setPosition(boss.x, boss.y);
        });
        
        this.bossHealthText.setText(`BOSS HP: ${this.boss.currentHealth}/${this.boss.maxHealth}`);
    }

    private updateCombat() {
        if (this.isGameOver || !this.player) return;
        
        this.checkPlayerVsEnemies();
        this.checkPlayerVsBoss();
        this.checkEnemiesVsPlayer();
    }

    private checkPlayerVsEnemies() {
        if (!this.player) return;
        
        this.playerBlades.forEach(playerBladeArray => {
            const playerBlades = playerBladeArray.getBlades();
            
            playerBlades.forEach(playerBlade => {
                const bladeMatrix = playerBlade.getWorldTransformMatrix();
                const bladeX = bladeMatrix.tx;
                const bladeY = bladeMatrix.ty;
                
                this.enemies.forEach((enemyData, index) => {
                    if (!enemyData.character.active) return;
                    
                    const distance = Phaser.Math.Distance.Between(bladeX, bladeY, 
                        enemyData.character.x, enemyData.character.y);
                    
                    if (distance < 50) {
                        if (this.playerLevel > enemyData.level) {
                            this.defeatEnemy(index);
                        } else if (this.playerLevel < enemyData.level) {
                            this.gameOver();
                        }
                    }
                });
            });
        });
    }

    private checkPlayerVsBoss() {
        if (!this.player || !this.boss || !this.boss.isAlive) return;
        
        this.playerBlades.forEach(playerBladeArray => {
            const playerBlades = playerBladeArray.getBlades();
            
            playerBlades.forEach(playerBlade => {
                const bladeMatrix = playerBlade.getWorldTransformMatrix();
                const bladeX = bladeMatrix.tx;
                const bladeY = bladeMatrix.ty;
                
                const distance = Phaser.Math.Distance.Between(bladeX, bladeY, 
                    this.boss!.character.x, this.boss!.character.y);
                
                if (distance < 60) {
                    if (this.boss && this.playerLevel > this.boss.level) {
                        this.damageBoss(10);
                    } else if (this.boss && this.playerLevel < this.boss.level) {
                        this.gameOver();
                    }
                }
            });
        });
    }
    private checkEnemiesVsPlayer() {
        if (!this.player) return;
        
        this.enemies.forEach(enemyData => {
            if (!enemyData.character.active) return;
            
            enemyData.blades.forEach(enemyBladeArray => {
                const blades = enemyBladeArray.getBlades();
                
                blades.forEach(blade => {
                    const bladeMatrix = blade.getWorldTransformMatrix();
                    const bladeX = bladeMatrix.tx;
                    const bladeY = bladeMatrix.ty;
                    
                    const distance = Phaser.Math.Distance.Between(bladeX, bladeY, 
                        this.player!.x, this.player!.y);
                    
                    if (distance < 50) {
                        if (enemyData.level > this.playerLevel) {
                            this.gameOver();
                        }
                    }
                });
            });
        });
        
        if (this.boss && this.boss.isAlive) {
            this.boss.blades.forEach(bossBladeArray => {
                const blades = bossBladeArray.getBlades();
                
                blades.forEach(blade => {
                    const bladeMatrix = blade.getWorldTransformMatrix();
                    const bladeX = bladeMatrix.tx;
                    const bladeY = bladeMatrix.ty;
                    
                    const distance = Phaser.Math.Distance.Between(bladeX, bladeY, 
                        this.player!.x, this.player!.y);
                    
                    if (distance < 60) {
                        if (this.boss!.level > this.playerLevel) {
                            this.gameOver();
                        }
                    }
                });
            });
        }
    }

    private defeatEnemy(index: number) {
        const enemyData = this.enemies[index];
        
        enemyData.blades.forEach(bladeArray => bladeArray.destroy());
        
        this.tweens.add({
            targets: enemyData.character,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => {
                enemyData.character.destroy();
            }
        });
        
        this.playerExp += enemyData.level * 20;
        this.checkLevelUp();
        this.expText.setText(`EXP: ${this.playerExp}/${this.expToNextLevel}`);
        
        this.enemies.splice(index, 1);
        
        this.time.delayedCall(5000, () => {
            if (!this.isGameOver && this.enemies.length < this.totalEnemySlots) {
                this.spawnSingleEnemy();
            }
        });
    }

    private damageBoss(damage: number) {
        if (!this.boss || !this.boss.isAlive) return;
        
        this.boss.currentHealth -= damage;
        
        this.boss.character.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (this.boss) this.boss.character.setTint(0xff00ff);
        });
        
        if (this.boss.currentHealth <= 0) {
            this.defeatBoss();
        }
    }

    private defeatBoss() {
        if (!this.boss) return;
        
        this.boss.isAlive = false;
        
        this.tweens.add({
            targets: this.boss.character,
            alpha: 0,
            scale: 2,
            duration: 1000,
            onComplete: () => {
                this.boss!.character.destroy();
            }
        });
        
        this.boss.blades.forEach(bladeArray => bladeArray.destroy());
        
        this.victory();
    }

    private victory() {
        this.isVictory = true;
        
        this.victoryText.setText(`VICTORY! Stage ${this.currentStage} Complete!`);
        this.victoryText.setVisible(true);
        
        this.isMoving = false;
        
        this.time.delayedCall(3000, () => {
            this.nextStage();
        });
    }

    private nextStage() {
        this.currentStage++;
        this.playerLevel = 1;
        this.playerExp = 0;
        this.expToNextLevel = 100 * this.currentStage;
        this.isVictory = false;
        this.victoryText.setVisible(false);
        
        this.enemies.forEach(enemyData => {
            enemyData.blades.forEach(bladeArray => bladeArray.destroy());
            enemyData.character.destroy();
        });
        this.enemies = [];
        
        if (this.boss) {
            this.boss.blades.forEach(bladeArray => bladeArray.destroy());
            this.boss.character.destroy();
            this.boss = null;
        }
        
        this.initializeEnemies();
        this.createPlayerBlades();
    }

    private checkLevelUp() {
        if (this.playerExp >= this.expToNextLevel) {
            this.playerLevel++;
            this.playerExp = 0;
            this.expToNextLevel = Math.floor(this.expToNextLevel * 1.3);
            
            this.createPlayerBlades();
            
            if (this.player) {
                this.player.setTint(0x00ff00);
                this.time.delayedCall(300, () => {
                    if (this.player) this.player.clearTint();
                });
            }
            
            // 更新UI显示
            this.levelText.setText(`Level: ${this.playerLevel}`);
            this.expText.setText(`EXP: ${this.playerExp}/${this.expToNextLevel}`);
        }
    }

    private gameOver() {
        this.isGameOver = true;
        
        this.victoryText.setText('GAME OVER');
        this.victoryText.setColor('#ff0000');
        this.victoryText.setVisible(true);
        
        this.isMoving = false;
        
        this.time.delayedCall(3000, () => {
            this.scene.restart();
        });
    }

    private updatePlayerMovement(delta: number) {
        if (!this.player) return;
        
        const dx = this.playerTargetX - this.player.x;
        const dy = this.playerTargetY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            this.isMoving = false;
            return;
        }
        
        const speed = this.player.getSpeed() * (delta / 1000);
        this.player.x += (dx / distance) * Math.min(speed, distance);
        this.player.y += (dy / distance) * Math.min(speed, distance);
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer): void {
        if (this.isGameOver || this.isVictory || !this.player) return;
        
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        this.playerTargetX = worldPoint.x;
        this.playerTargetY = worldPoint.y;
        this.isMoving = true;
    }

    private createWeaponPowerUps() {
        for (let i = 0; i < this.maxPowerUps; i++) {
            this.spawnWeaponPowerUp();
        }
    }

    private spawnWeaponPowerUp() {
        if (!this.player) return;
        
        let x, y;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(200, this.worldWidth - 200);
            y = Phaser.Math.Between(200, this.worldHeight - 200);
            attempts++;
        } while (
            Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 500 && 
            attempts < 30
        );

        // 生成随机武器类型和等级
        const weaponType = this.getRandomWeaponType();
        const weaponLevel = this.getRandomWeaponLevel();

        const powerUp = this.add.sprite(x, y, 'blade');
        
        // 根据武器等级设置颜色
        const levelTints = [
            0xffffff, // Level 1 - White
            0xffd700, // Level 2 - Gold
            0x00ff00, // Level 3 - Green
            0x0000ff, // Level 4 - Blue
            0xff00ff  // Level 5 - Purple
        ];
        powerUp.setTint(levelTints[Math.min(weaponLevel - 1, levelTints.length - 1)]);
        
        // 根据武器类型设置缩放
        const typeScales = {
            [WeaponType.SWORD]: 1.0,
            [WeaponType.AXE]: 1.2,
            [WeaponType.SPEAR]: 1.3,
            [WeaponType.HAMMER]: 1.4,
            [WeaponType.DAGGER]: 0.8
        };
        powerUp.setScale(typeScales[weaponType] * (1 + (weaponLevel - 1) * 0.1));
        
        powerUp.setDepth(5);

        // 添加浮动动画
        this.tweens.add({
            targets: powerUp,
            y: y - 10,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        this.weaponPowerUps.push({
            sprite: powerUp,
            isActive: true,
            weaponType: weaponType,
            weaponLevel: weaponLevel
        });
    }

    private getRandomWeaponLevel(): number {
        // 概率分布：等级1 (50%), 等级2 (30%), 等级3 (15%), 等级4 (4%), 等级5 (1%)
        const rand = Math.random();
        if (rand < 0.5) return 1;
        if (rand < 0.8) return 2;
        if (rand < 0.95) return 3;
        if (rand < 0.99) return 4;
        return 5;
    }

    private updateWeaponPowerUps(delta: number) {
        if (!this.player) return;
        
        this.weaponPowerUps.forEach((powerUp, index) => {
            if (!powerUp.isActive) return;
            
            const distance = Phaser.Math.Distance.Between(
                powerUp.sprite.x, powerUp.sprite.y,
                this.player!.x, this.player!.y
            );
            
            if (distance < 60) {
                this.collectWeaponPowerUp(index);
            }
        });
    }

    private collectWeaponPowerUp(index: number) {
        const powerUp = this.weaponPowerUps[index];
        if (!powerUp.isActive) return;
        
        powerUp.isActive = false;
        powerUp.sprite.destroy();
        
        this.weaponPowerUps.splice(index, 1);
        
        // 立即升级武器
        this.playerLevel++;
        
        // 创建新的武器数组，使用拾取的武器类型和等级
        this.playerBlades.forEach(bladeArray => bladeArray.destroy());
        this.playerBlades = [];
        
        if (this.player) {
            const bladeArray = new BladeArray(
                this,
                this.player.x,
                this.player.y,
                {
                    bladeCount: this.playerLevel + 2,
                    radius: 120,
                    rotationSpeed: 3.0,
                    clockwise: true,
                    weaponType: powerUp.weaponType,
                    weaponLevel: powerUp.weaponLevel
                }
            );
            
            this.playerBlades.push(bladeArray);
            
            // 设置玩家颜色为武器等级对应的颜色
            const levelTints = [
                0xffffff, // Level 1 - White
                0xffd700, // Level 2 - Gold
                0x00ff00, // Level 3 - Green
                0x0000ff, // Level 4 - Blue
                0xff00ff  // Level 5 - Purple
            ];
            const tint = levelTints[Math.min(powerUp.weaponLevel - 1, levelTints.length - 1)];
            this.player.setTint(tint);
            this.time.delayedCall(300, () => {
                if (this.player) this.player.clearTint();
            });
        }
        
        // 延迟生成新的武器道具
        this.time.delayedCall(5000, () => {
            if (!this.isGameOver && this.weaponPowerUps.length < this.maxPowerUps) {
                this.spawnWeaponPowerUp();
            }
        });
    }
}