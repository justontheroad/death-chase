/**
 * AudioManager - 处理游戏中的所有音效和背景音乐
 */
export class AudioManager {
    private scene: Phaser.Scene;
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private musicVolume: number = 0.5;
    private sfxVolume: number = 0.7;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public addSound(key: string, sound: Phaser.Sound.BaseSound) {
        this.sounds.set(key, sound);
    }

    public play(soundName: string): void {
        const sound = this.sounds.get(soundName);
        if (sound && !sound.isPlaying) {
            sound.play();
        }
    }

    public stop(soundName: string): void {
        const sound = this.sounds.get(soundName);
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    public isPlaying(soundName: string): boolean {
        const sound = this.sounds.get(soundName);
        return sound ? sound.isPlaying : false;
    }

    public startBackgroundMusic(): void {
        this.play('background_music');
    }

    public stopBackgroundMusic(): void {
        this.stop('background_music');
    }
}