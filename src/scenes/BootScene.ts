export class BootScene extends Phaser.Scene {
    private loadingBar!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;

    constructor() {
        super('BootScene');
    }

    preload() {
        // Create loading bar
        this.loadingBar = this.add.graphics();
        this.loadingText = this.add.text(400, 300, 'Loading...', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Listen for loading events
        this.load.on('progress', (value: number) => {
            this.loadingBar.clear();
            this.loadingBar.fillStyle(0x00ff00, 1);
            this.loadingBar.fillRect(250, 350, 300 * value, 30);
            this.loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
        });

        this.load.on('fileprogress', (file: Phaser.Loader.File) => {
            console.log(`Loading: ${file.key} from ${file.url}`);
        });

        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error(`Failed to load: ${file.key} from ${file.url}`);
            this.loadingText.setText(`Error loading ${file.key}`);
            this.loadingText.setColor('#ff0000');
        });

        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
            this.loadingBar.destroy();
            this.loadingText.destroy();
        });

        // Load all game assets
        this.load.setPath('assets');
        
        // Character images - use SVG with fallback
        this.load.svg('character', 'characters/character.svg');
        
        // Weapon images
        this.load.svg('blade', 'weapons/blade.svg');
        this.load.svg('weapon_sword', 'weapons/sword.svg');
        this.load.svg('weapon_axe', 'weapons/axe.svg');
        this.load.svg('weapon_spear', 'weapons/spear.svg');
        this.load.svg('weapon_hammer', 'weapons/hammer.svg');
        this.load.svg('weapon_dagger', 'weapons/dagger.svg');
        
        // Background images
        this.load.svg('bamboo_forest', 'backgrounds/bamboo_forest.svg');
        this.load.svg('ancient_temple', 'backgrounds/ancient_temple.svg');
        this.load.svg('inn', 'backgrounds/inn.svg');
        
        // Enemy images
        this.load.svg('enemy_warrior', 'enemies/warrior.svg');
        this.load.svg('enemy_archer', 'enemies/archer.svg');
    }

    create() {
        console.log('BootScene create - starting GameScene');
        // Go to the main game scene
        this.scene.start('GameScene');
    }
}