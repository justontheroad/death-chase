import { BladeArray, WeaponType } from '../entities/Blade';
import { Character } from '../entities/Character';

interface EnemyData {
    character: Character;
    blades: BladeArray[];
    level: number;
    moveTargetX: number;
    moveTargetY: number;
    isMoving: boolean;
    lastHitTime: number; // 上次被击中的时间
}

// 碰撞冷却时间（毫秒）
const HIT_COOLDOWN = 500;

interface BossData {
    character: Character;
    blades: BladeArray[];
    level: number;
    maxHealth: number;
    currentHealth: number;
    isAlive: boolean;
    lastHitTime: number; // 上次被击中的时间
}

export interface WeaponPowerUp {
    sprite: Phaser.GameObjects.Sprite;
    isActive: boolean;
    weaponType: WeaponType;
    weaponLevel: number;
    bladeCount: number;
}

export interface HealthPotion {
    sprite: Phaser.GameObjects.Sprite;
    isActive: boolean;
    healAmount: number;
}

export class GameScene extends Phaser.Scene {
    public player: Character | null = null;
    public playerBlades: BladeArray[] = [];
    public playerLevel: number = 1;
    public playerExp: number = 0;
    public expToNextLevel: number = 100;
    private playerLastHitTime: number = 0; // 玩家上次被击中的时间
    
    private enemies: EnemyData[] = [];
    private boss: BossData | null = null;
    private totalEnemySlots: number = 15;
    private weaponPowerUps: WeaponPowerUp[] = [];
    private maxPowerUps: number = 5;
    private healthPotions: HealthPotion[] = [];
    private maxHealthPotions: number = 3;
    
    private worldWidth: number = 8000;
    private worldHeight: number = 6000;
    private background!: Phaser.GameObjects.Image;
    
    // UI
    private levelText!: Phaser.GameObjects.Text;
    private expText!: Phaser.GameObjects.Text;
    private enemyCountText!: Phaser.GameObjects.Text;
    private bossHealthText!: Phaser.GameObjects.Text;
    private weaponInfoText!: Phaser.GameObjects.Text;
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
        this.createHealthPotions();

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
        this.updateHealthPotions(delta);
        this.regeneratePlayerHealth(delta);
        this.updateWeaponInfo();
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
        // 计算当前武器数量
        let currentBladeCount = 0;
        if (this.playerBlades.length > 0) {
            currentBladeCount = this.playerBlades[0].getBladeCount();
        }
        
        this.playerBlades.forEach(bladeArray => bladeArray.destroy());
        this.playerBlades = [];
        
        if (!this.player) return;
        
        // 为玩家选择武器类型（可以根据玩家等级或其他因素决定）
        const weaponType = this.getRandomWeaponType();
        const weaponLevel = Math.min(Math.floor(this.playerLevel / 2) + 1, 5);
        
        // 计算新的武器数量，确保至少为playerLevel + 2
        const newBladeCount = Math.max(this.playerLevel + 2, currentBladeCount);
        
        const bladeArray = new BladeArray(
            this,
            this.player.x,
            this.player.y,
            {
                bladeCount: newBladeCount,
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

    private healthText!: Phaser.GameObjects.Text;

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

        this.healthText = this.add.text(20, 90, `HP: ${this.player?.getHealth() || 0}/${this.player?.getMaxHealth() || 0}`, {
            fontSize: '22px',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.healthText.setScrollFactor(0);

        this.enemyCountText = this.add.text(20, 120, `Enemies: ${this.totalEnemySlots}`, {
            fontSize: '20px',
            color: '#ff6666',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.enemyCountText.setScrollFactor(0);

        this.bossHealthText = this.add.text(20, 150, '', {
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

        this.weaponInfoText = this.add.text(20, 150, '', {
            fontSize: '20px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.weaponInfoText.setScrollFactor(0);
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
            isMoving: true,
            lastHitTime: 0
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
            isAlive: true,
            lastHitTime: 0
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
            
            playerBlades.forEach((playerBlade, playerBladeIndex) => {
                const bladeMatrix = playerBlade.getWorldTransformMatrix();
                const bladeX = bladeMatrix.tx;
                const bladeY = bladeMatrix.ty;
                
                this.enemies.forEach((enemyData, enemyIndex) => {
                    if (!enemyData.character.active) return;
                    
                    // 检查玩家武器是否击中敌人角色
                    const distanceToEnemy = Phaser.Math.Distance.Between(bladeX, bladeY, enemyData.character.x, enemyData.character.y);
                    const currentTime = this.time.now;
                    
                    if (distanceToEnemy < 40 && currentTime - enemyData.lastHitTime > HIT_COOLDOWN) {
                        // 扣除敌人的生命值
                        const playerWeaponDamage = playerBladeArray.getWeaponStats().damage;
                        const enemyIsDead = enemyData.character.takeDamage(playerWeaponDamage);
                        
                        // 更新敌人被击中的时间
                        enemyData.lastHitTime = currentTime;
                        
                        if (enemyIsDead) {
                            this.defeatEnemy(enemyIndex);
                        }
                    }
                    
                    enemyData.blades.forEach(enemyBladeArray => {
                        const enemyBlades = enemyBladeArray.getBlades();
                        
                        enemyBlades.forEach((enemyBlade, enemyBladeIndex) => {
                            const enemyBladeMatrix = enemyBlade.getWorldTransformMatrix();
                            const enemyBladeX = enemyBladeMatrix.tx;
                            const enemyBladeY = enemyBladeMatrix.ty;
                            
                            const distance = Phaser.Math.Distance.Between(bladeX, bladeY, enemyBladeX, enemyBladeY);
                            
                            if (distance < 30) {
                                // 武器碰撞响应：稍微后退
                                this.handleWeaponCollision(playerBladeArray, enemyBladeArray, playerBlade, enemyBlade);
                                
                                // 扣除双方武器的生命值
                                const playerWeaponDamage = playerBladeArray.getWeaponStats().damage;
                                const enemyWeaponDamage = enemyBladeArray.getWeaponStats().damage;
                                
                                // 扣除敌人武器的生命值
                                const enemyBladeHealth = enemyBladeArray.getBladeHealth(enemyBladeIndex);
                                const newEnemyBladeHealth = enemyBladeHealth - playerWeaponDamage;
                                
                                if (newEnemyBladeHealth <= 0) {
                                    // 敌人武器被摧毁
                                    enemyBladeArray.removeBlade(enemyBladeIndex);
                                } else {
                                    enemyBladeArray.setBladeHealth(enemyBladeIndex, newEnemyBladeHealth);
                                }
                                
                                // 扣除玩家武器的生命值
                                const playerBladeHealth = playerBladeArray.getBladeHealth(playerBladeIndex);
                                const newPlayerBladeHealth = playerBladeHealth - enemyWeaponDamage;
                                
                                if (newPlayerBladeHealth <= 0) {
                                    // 玩家武器被摧毁
                                    playerBladeArray.removeBlade(playerBladeIndex);
                                } else {
                                    playerBladeArray.setBladeHealth(playerBladeIndex, newPlayerBladeHealth);
                                }
                                
                                // 检查敌人是否所有武器都被摧毁
                                if (enemyBladeArray.isEmpty()) {
                                    this.defeatEnemy(enemyIndex);
                                }
                                
                                // 检查玩家是否所有武器都被摧毁
                                if (playerBladeArray.isEmpty()) {
                                    this.gameOver();
                                }
                            }
                        });
                    });
                });
            });
        });
    }

    private checkPlayerVsBoss() {
        if (!this.player || !this.boss || !this.boss.isAlive) return;
        
        this.playerBlades.forEach(playerBladeArray => {
            const playerBlades = playerBladeArray.getBlades();
            
            playerBlades.forEach((playerBlade, playerBladeIndex) => {
                const bladeMatrix = playerBlade.getWorldTransformMatrix();
                const bladeX = bladeMatrix.tx;
                const bladeY = bladeMatrix.ty;
                
                // 检查玩家武器是否击中BOSS角色
                const distanceToBoss = Phaser.Math.Distance.Between(bladeX, bladeY, this.boss!.character.x, this.boss!.character.y);
                const currentTime = this.time.now;
                
                if (distanceToBoss < 40 && currentTime - this.boss!.lastHitTime > HIT_COOLDOWN) {
                    // 扣除BOSS的生命值
                    const playerWeaponDamage = playerBladeArray.getWeaponStats().damage;
                    this.damageBoss(playerWeaponDamage);
                    // 更新BOSS被击中的时间
                    this.boss!.lastHitTime = currentTime;
                }
                
                this.boss!.blades.forEach(bossBladeArray => {
                    const bossBlades = bossBladeArray.getBlades();
                    
                    bossBlades.forEach((bossBlade, bossBladeIndex) => {
                        const bossBladeMatrix = bossBlade.getWorldTransformMatrix();
                        const bossBladeX = bossBladeMatrix.tx;
                        const bossBladeY = bossBladeMatrix.ty;
                        
                        const distance = Phaser.Math.Distance.Between(bladeX, bladeY, bossBladeX, bossBladeY);
                        
                        if (distance < 30) {
                            // 扣除双方武器的生命值
                            const playerWeaponDamage = playerBladeArray.getWeaponStats().damage;
                            const bossWeaponDamage = bossBladeArray.getWeaponStats().damage;
                            
                            // 扣除BOSS武器的生命值
                            const bossBladeHealth = bossBladeArray.getBladeHealth(bossBladeIndex);
                            const newBossBladeHealth = bossBladeHealth - playerWeaponDamage;
                            
                            if (newBossBladeHealth <= 0) {
                                // BOSS武器被摧毁
                                bossBladeArray.removeBlade(bossBladeIndex);
                            } else {
                                bossBladeArray.setBladeHealth(bossBladeIndex, newBossBladeHealth);
                            }
                            
                            // 扣除玩家武器的生命值
                            const playerBladeHealth = playerBladeArray.getBladeHealth(playerBladeIndex);
                            const newPlayerBladeHealth = playerBladeHealth - bossWeaponDamage;
                            
                            if (newPlayerBladeHealth <= 0) {
                                // 玩家武器被摧毁
                                playerBladeArray.removeBlade(playerBladeIndex);
                            } else {
                                playerBladeArray.setBladeHealth(playerBladeIndex, newPlayerBladeHealth);
                            }
                            
                            // 检查BOSS是否所有武器都被摧毁
                            if (bossBladeArray.isEmpty()) {
                                this.defeatBoss();
                            }
                            
                            // 检查玩家是否所有武器都被摧毁
                            if (playerBladeArray.isEmpty()) {
                                this.gameOver();
                            }
                        }
                    });
                });
            });
        });
    }
    private checkEnemiesVsPlayer() {
        if (!this.player) return;
        
        this.enemies.forEach(enemyData => {
            if (!enemyData.character.active) return;
            
            enemyData.blades.forEach(enemyBladeArray => {
                const enemyBlades = enemyBladeArray.getBlades();
                
                enemyBlades.forEach((enemyBlade, enemyBladeIndex) => {
                    const enemyBladeMatrix = enemyBlade.getWorldTransformMatrix();
                    const enemyBladeX = enemyBladeMatrix.tx;
                    const enemyBladeY = enemyBladeMatrix.ty;
                    
                    // 检查敌人武器是否击中玩家角色
                    const distanceToPlayer = Phaser.Math.Distance.Between(enemyBladeX, enemyBladeY, this.player!.x, this.player!.y);
                    const currentTime = this.time.now;
                    
                    if (distanceToPlayer < 40 && currentTime - this.playerLastHitTime > HIT_COOLDOWN) {
                        // 扣除玩家的生命值
                        const enemyWeaponDamage = enemyBladeArray.getWeaponStats().damage;
                        const playerIsDead = this.player!.takeDamage(enemyWeaponDamage);
                        
                        // 更新玩家被击中的时间
                        this.playerLastHitTime = currentTime;
                        
                        if (playerIsDead) {
                            this.gameOver();
                        } else {
                            // 更新玩家生命值显示
                            this.healthText.setText(`HP: ${this.player?.getHealth() || 0}/${this.player?.getMaxHealth() || 0}`);
                        }
                    }
                    
                    this.playerBlades.forEach(playerBladeArray => {
                        const playerBlades = playerBladeArray.getBlades();
                        
                        playerBlades.forEach((playerBlade, playerBladeIndex) => {
                            const playerBladeMatrix = playerBlade.getWorldTransformMatrix();
                            const playerBladeX = playerBladeMatrix.tx;
                            const playerBladeY = playerBladeMatrix.ty;
                            
                            const distance = Phaser.Math.Distance.Between(enemyBladeX, enemyBladeY, playerBladeX, playerBladeY);
                            
                            if (distance < 30) {
                                // 武器碰撞响应：稍微后退
                                this.handleWeaponCollision(enemyBladeArray, playerBladeArray, enemyBlade, playerBlade);
                                
                                // 扣除双方武器的生命值
                                const enemyWeaponDamage = enemyBladeArray.getWeaponStats().damage;
                                const playerWeaponDamage = playerBladeArray.getWeaponStats().damage;
                                
                                // 扣除玩家武器的生命值
                                const playerBladeHealth = playerBladeArray.getBladeHealth(playerBladeIndex);
                                const newPlayerBladeHealth = playerBladeHealth - enemyWeaponDamage;
                                
                                if (newPlayerBladeHealth <= 0) {
                                    // 玩家武器被摧毁
                                    playerBladeArray.removeBlade(playerBladeIndex);
                                } else {
                                    playerBladeArray.setBladeHealth(playerBladeIndex, newPlayerBladeHealth);
                                }
                                
                                // 扣除敌人武器的生命值
                                const enemyBladeHealth = enemyBladeArray.getBladeHealth(enemyBladeIndex);
                                const newEnemyBladeHealth = enemyBladeHealth - playerWeaponDamage;
                                
                                if (newEnemyBladeHealth <= 0) {
                                    // 敌人武器被摧毁
                                    enemyBladeArray.removeBlade(enemyBladeIndex);
                                } else {
                                    enemyBladeArray.setBladeHealth(enemyBladeIndex, newEnemyBladeHealth);
                                }
                                
                                // 检查敌人是否所有武器都被摧毁
                                if (enemyBladeArray.isEmpty()) {
                                    // 找到敌人索引并调用defeatEnemy
                                    const enemyIndex = this.enemies.findIndex(enemy => 
                                        enemy.blades.includes(enemyBladeArray)
                                    );
                                    if (enemyIndex !== -1) {
                                        this.defeatEnemy(enemyIndex);
                                    }
                                }
                                
                                // 检查玩家是否所有武器都被摧毁
                                if (playerBladeArray.isEmpty()) {
                                    this.gameOver();
                                }
                            }
                        });
                    });
                });
            });
        });
        
        if (this.boss && this.boss.isAlive) {
            this.boss.blades.forEach(bossBladeArray => {
                const bossBlades = bossBladeArray.getBlades();
                
                bossBlades.forEach((bossBlade, bossBladeIndex) => {
                    const bossBladeMatrix = bossBlade.getWorldTransformMatrix();
                    const bossBladeX = bossBladeMatrix.tx;
                    const bossBladeY = bossBladeMatrix.ty;
                    
                    // 检查BOSS武器是否击中玩家角色
                    const distanceToPlayer = Phaser.Math.Distance.Between(bossBladeX, bossBladeY, this.player!.x, this.player!.y);
                    const currentTime = this.time.now;
                    
                    if (distanceToPlayer < 40 && currentTime - this.playerLastHitTime > HIT_COOLDOWN) {
                        // 扣除玩家的生命值
                        const bossWeaponDamage = bossBladeArray.getWeaponStats().damage;
                        const playerIsDead = this.player!.takeDamage(bossWeaponDamage);
                        
                        // 更新玩家被击中的时间
                        this.playerLastHitTime = currentTime;
                        
                        if (playerIsDead) {
                            this.gameOver();
                        } else {
                            // 更新玩家生命值显示
                            this.healthText.setText(`HP: ${this.player?.getHealth() || 0}/${this.player?.getMaxHealth() || 0}`);
                        }
                    }
                    
                    this.playerBlades.forEach(playerBladeArray => {
                        const playerBlades = playerBladeArray.getBlades();
                        
                        playerBlades.forEach((playerBlade, playerBladeIndex) => {
                            const playerBladeMatrix = playerBlade.getWorldTransformMatrix();
                            const playerBladeX = playerBladeMatrix.tx;
                            const playerBladeY = playerBladeMatrix.ty;
                            
                            const distance = Phaser.Math.Distance.Between(bossBladeX, bossBladeY, playerBladeX, playerBladeY);
                            
                            if (distance < 30) {
                                // 武器碰撞响应：稍微后退
                                this.handleWeaponCollision(bossBladeArray, playerBladeArray, bossBlade, playerBlade);
                                
                                // 扣除双方武器的生命值
                                const bossWeaponDamage = bossBladeArray.getWeaponStats().damage;
                                const playerWeaponDamage = playerBladeArray.getWeaponStats().damage;
                                
                                // 扣除玩家武器的生命值
                                const playerBladeHealth = playerBladeArray.getBladeHealth(playerBladeIndex);
                                const newPlayerBladeHealth = playerBladeHealth - bossWeaponDamage;
                                
                                if (newPlayerBladeHealth <= 0) {
                                    // 玩家武器被摧毁
                                    playerBladeArray.removeBlade(playerBladeIndex);
                                } else {
                                    playerBladeArray.setBladeHealth(playerBladeIndex, newPlayerBladeHealth);
                                }
                                
                                // 扣除BOSS武器的生命值
                                const bossBladeHealth = bossBladeArray.getBladeHealth(bossBladeIndex);
                                const newBossBladeHealth = bossBladeHealth - playerWeaponDamage;
                                
                                if (newBossBladeHealth <= 0) {
                                    // BOSS武器被摧毁
                                    bossBladeArray.removeBlade(bossBladeIndex);
                                } else {
                                    bossBladeArray.setBladeHealth(bossBladeIndex, newBossBladeHealth);
                                }
                                
                                // 检查玩家是否所有武器都被摧毁
                                if (playerBladeArray.isEmpty()) {
                                    this.gameOver();
                                }
                                
                                // 检查BOSS是否所有武器都被摧毁
                                if (bossBladeArray.isEmpty()) {
                                    this.defeatBoss();
                                }
                            }
                        });
                    });
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
                this.player.levelUp(); // 调用levelUp方法增加hp
                this.player.setTint(0x00ff00);
                this.time.delayedCall(300, () => {
                    if (this.player) this.player.clearTint();
                });
            }
            
            // 更新UI显示
            this.levelText.setText(`Level: ${this.playerLevel}`);
            this.expText.setText(`EXP: ${this.playerExp}/${this.expToNextLevel}`);
            this.healthText.setText(`HP: ${this.player?.getHealth() || 0}/${this.player?.getMaxHealth() || 0}`);
        }
    }

    private gameOver() {
        this.isGameOver = true;
        
        this.victoryText.setText('GAME OVER');
        this.victoryText.setColor('#ff0000');
        this.victoryText.setVisible(true);
        
        this.isMoving = false;
        
        // 直接重启场景，而不是使用延迟调用
        // 这样可以避免场景销毁后回调函数访问已销毁实例的问题
        this.scene.restart();
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
        
        // 检查是否与敌人或武器碰撞
        if (this.checkCollisionWithEnemies(this.player.x, this.player.y, dx, dy)) {
            this.isMoving = false;
            return;
        }
        
        const speed = this.player.getSpeed() * (delta / 1000);
        this.player.x += (dx / distance) * Math.min(speed, distance);
        this.player.y += (dy / distance) * Math.min(speed, distance);
    }

    private checkCollisionWithEnemies(x: number, y: number, dx: number, dy: number): boolean {
        const playerRadius = 30; // 玩家碰撞半径
        
        // 检查与敌人的碰撞
        for (const enemyData of this.enemies) {
            if (!enemyData.character.active) continue;
            
            const enemyX = enemyData.character.x;
            const enemyY = enemyData.character.y;
            const distance = Phaser.Math.Distance.Between(x, y, enemyX, enemyY);
            
            if (distance < playerRadius + 30) { // 敌人碰撞半径
                return true;
            }
        }
        
        // 检查与敌人武器的碰撞
        for (const enemyData of this.enemies) {
            if (!enemyData.character.active) continue;
            
            for (const bladeArray of enemyData.blades) {
                const blades = bladeArray.getBlades();
                for (const blade of blades) {
                    const bladeMatrix = blade.getWorldTransformMatrix();
                    const bladeX = bladeMatrix.tx;
                    const bladeY = bladeMatrix.ty;
                    
                    const distance = Phaser.Math.Distance.Between(x, y, bladeX, bladeY);
                    if (distance < playerRadius + 15) { // 武器碰撞半径
                        return true;
                    }
                }
            }
        }
        
        // 检查与BOSS的碰撞
        if (this.boss && this.boss.isAlive) {
            const bossX = this.boss.character.x;
            const bossY = this.boss.character.y;
            const distance = Phaser.Math.Distance.Between(x, y, bossX, bossY);
            
            if (distance < playerRadius + 40) { // BOSS碰撞半径
                return true;
            }
            
            // 检查与BOSS武器的碰撞
            for (const bladeArray of this.boss.blades) {
                const blades = bladeArray.getBlades();
                for (const blade of blades) {
                    const bladeMatrix = blade.getWorldTransformMatrix();
                    const bladeX = bladeMatrix.tx;
                    const bladeY = bladeMatrix.ty;
                    
                    const distance = Phaser.Math.Distance.Between(x, y, bladeX, bladeY);
                    if (distance < playerRadius + 15) { // 武器碰撞半径
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    private handleWeaponCollision(playerBladeArray: BladeArray, enemyBladeArray: BladeArray, playerBlade: Phaser.GameObjects.Sprite, enemyBlade: Phaser.GameObjects.Sprite) {
        // 计算碰撞方向
        const playerBladeMatrix = playerBlade.getWorldTransformMatrix();
        const playerBladeX = playerBladeMatrix.tx;
        const playerBladeY = playerBladeMatrix.ty;
        
        const enemyBladeMatrix = enemyBlade.getWorldTransformMatrix();
        const enemyBladeX = enemyBladeMatrix.tx;
        const enemyBladeY = enemyBladeMatrix.ty;
        
        // 计算碰撞方向向量
        const dx = playerBladeX - enemyBladeX;
        const dy = playerBladeY - enemyBladeY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const directionX = dx / distance;
            const directionY = dy / distance;
            
            // 玩家稍微后退
            if (this.player) {
                this.player.x += directionX * 10;
                this.player.y += directionY * 10;
                
                // 同时停止玩家的移动
                this.isMoving = false;
            }
        }
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

        // 生成随机武器类型、等级和数量
        const weaponType = this.getRandomWeaponType();
        const weaponLevel = this.getRandomWeaponLevel();
        const bladeCount = Phaser.Math.Between(1, 3);

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
            weaponLevel: weaponLevel,
            bladeCount: bladeCount
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
            
            // 检查玩家是否碰撞武器道具
            const playerDistance = Phaser.Math.Distance.Between(
                powerUp.sprite.x, powerUp.sprite.y,
                this.player!.x, this.player!.y
            );
            
            if (playerDistance < 60) {
                this.collectWeaponPowerUp(index, 'player');
                return;
            }
            
            // 检查敌人是否碰撞武器道具
            this.enemies.forEach((enemyData, enemyIndex) => {
                if (!enemyData.character.active) return;
                
                const enemyDistance = Phaser.Math.Distance.Between(
                    powerUp.sprite.x, powerUp.sprite.y,
                    enemyData.character.x, enemyData.character.y
                );
                
                if (enemyDistance < 60) {
                    this.collectWeaponPowerUp(index, 'enemy', enemyIndex);
                }
            });
        });
    }

    private collectWeaponPowerUp(index: number, characterType: 'player' | 'enemy', enemyIndex?: number) {
        const powerUp = this.weaponPowerUps[index];
        if (!powerUp.isActive) return;
        
        powerUp.isActive = false;
        powerUp.sprite.destroy();
        
        this.weaponPowerUps.splice(index, 1);
        
        if (characterType === 'player' && this.player) {
            // 计算当前武器数量
            let currentBladeCount = 0;
            if (this.playerBlades.length > 0) {
                currentBladeCount = this.playerBlades[0].getBladeCount();
            }
            
            // 增加对应的武器数量
            const newBladeCount = currentBladeCount + powerUp.bladeCount;
            
            // 创建新的武器数组，使用拾取的武器类型和等级
            this.playerBlades.forEach(bladeArray => bladeArray.destroy());
            this.playerBlades = [];
            
            const bladeArray = new BladeArray(
                this,
                this.player.x,
                this.player.y,
                {
                    bladeCount: newBladeCount,
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
        } else if (characterType === 'enemy' && enemyIndex !== undefined) {
            const enemyData = this.enemies[enemyIndex];
            if (enemyData) {
                // 计算当前武器数量
                let currentBladeCount = 0;
                if (enemyData.blades.length > 0) {
                    currentBladeCount = enemyData.blades[0].getBladeCount();
                }
                
                // 增加对应的武器数量
                const newBladeCount = currentBladeCount + powerUp.bladeCount;
                
                // 创建新的武器数组，使用拾取的武器类型和等级
                enemyData.blades.forEach(bladeArray => bladeArray.destroy());
                enemyData.blades = [];
                
                const bladeArray = new BladeArray(
                    this,
                    enemyData.character.x,
                    enemyData.character.y,
                    {
                        bladeCount: newBladeCount,
                        radius: 80,
                        rotationSpeed: 2.0 + Math.random() * 2.0,
                        clockwise: Math.random() > 0.5,
                        weaponType: powerUp.weaponType,
                        weaponLevel: powerUp.weaponLevel
                    }
                );
                
                enemyData.blades.push(bladeArray);
            }
        }
        
        // 延迟生成新的武器道具
        this.time.delayedCall(5000, () => {
            if (!this.isGameOver && this.weaponPowerUps.length < this.maxPowerUps) {
                this.spawnWeaponPowerUp();
            }
        });
    }

    private createHealthPotions() {
        for (let i = 0; i < this.maxHealthPotions; i++) {
            this.spawnHealthPotion();
        }
    }

    private spawnHealthPotion() {
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

        const healAmount = Phaser.Math.Between(20, 50);

        const potion = this.add.sprite(x, y, 'blade');
        potion.setTint(0xff0000);
        potion.setScale(0.5);
        potion.setDepth(5);

        this.tweens.add({
            targets: potion,
            y: y - 10,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        this.healthPotions.push({
            sprite: potion,
            isActive: true,
            healAmount: healAmount
        });
    }

    private updateHealthPotions(delta: number) {
        if (!this.player) return;
        
        this.healthPotions.forEach((potion, index) => {
            if (!potion.isActive) return;
            
            const playerDistance = Phaser.Math.Distance.Between(
                potion.sprite.x, potion.sprite.y,
                this.player!.x, this.player!.y
            );
            
            if (playerDistance < 60) {
                this.collectHealthPotion(index);
            }
        });
    }

    private collectHealthPotion(index: number) {
        const potion = this.healthPotions[index];
        if (!potion.isActive) return;
        
        potion.isActive = false;
        potion.sprite.destroy();
        
        this.healthPotions.splice(index, 1);
        
        if (this.player) {
            const maxHealth = this.player.getMaxHealth();
            const currentHealth = this.player.getHealth();
            const newHealth = Math.min(currentHealth + potion.healAmount, maxHealth);
            this.player.setHealth(newHealth);
            
            this.healthText.setText(`HP: ${this.player.getHealth()}/${maxHealth}`);
            
            this.player.setTint(0x00ff00);
            this.time.delayedCall(300, () => {
                if (this.player) this.player.clearTint();
            });
        }
        
        this.time.delayedCall(8000, () => {
            if (!this.isGameOver && this.healthPotions.length < this.maxHealthPotions) {
                this.spawnHealthPotion();
            }
        });
    }

    private regeneratePlayerHealth(delta: number) {
        if (!this.player) return;
        
        const currentHealth = this.player.getHealth();
        const maxHealth = this.player.getMaxHealth();
        
        if (currentHealth < maxHealth) {
            const healRate = 1;
            const healAmount = healRate * (delta / 1000);
            const newHealth = Math.min(currentHealth + healAmount, maxHealth);
            this.player.setHealth(newHealth);
            
            this.healthText.setText(`HP: ${Math.floor(this.player.getHealth())}/${maxHealth}`);
        }
    }

    private updateWeaponInfo() {
        if (!this.player || this.playerBlades.length === 0) return;
        
        const bladeArray = this.playerBlades[0];
        const weaponType = bladeArray.getWeaponType();
        const weaponLevel = bladeArray.getWeaponLevel();
        const bladeCount = bladeArray.getBladeCount();
        const weaponStats = bladeArray.getWeaponStats();
        const totalDamage = bladeArray.getEffectiveDamage();
        
        const weaponTypeNames: Record<string, string> = {
            'sword': '剑',
            'axe': '斧',
            'spear': '矛',
            'hammer': '锤',
            'dagger': '匕首'
        };
        
        const weaponName = weaponTypeNames[weaponType] || weaponType;
        
        this.weaponInfoText.setText(
            `武器: ${weaponName} Lv${weaponLevel}\n` +
            `数量: ${bladeCount}\n` +
            `攻击力: ${weaponStats.damage}\n` +
            `总攻击力: ${totalDamage}`
        );
    }
}