import { SoundGenerator } from './SoundGenerator';

export enum SoundType {
    SWORD_SWING = 'sword_swing',
    AXE_SWING = 'axe_swling',
    SPEAR_SWING = 'spear_swling',
    HAMMER_SWING = 'hammer_swing',
    DAGGER_SWING = 'dagger_swing',
    HIT = 'hit',
    KILL = 'kill',
    PLAYER_HURT = 'player_hurt',
    LEVEL_UP = 'level_up',
    POWERUP = 'powerup',
    BACKGROUND_MUSIC = 'background_music'
}

export class AudioManager {
    private soundGenerator: SoundGenerator;
    private sfxVolume: number = 0.7;
    private musicVolume: number = 0.5;
    private isMuted: boolean = false;

    constructor(_scene: Phaser.Scene) {
        this.soundGenerator = new SoundGenerator();
    }

    public playSwingSound(weaponType: string): void {
        this.soundGenerator.playSwingSound(weaponType);
    }

    public playHitSound(): void {
        this.soundGenerator.playHitSound();
    }

    public playKillSound(): void {
        this.soundGenerator.playKillSound();
    }

    public playPlayerHurtSound(): void {
        this.soundGenerator.playPlayerHurtSound();
    }

    public playLevelUpSound(): void {
        this.soundGenerator.playLevelUpSound();
    }

    public playPowerUpSound(): void {
        this.soundGenerator.playPowerUpSound();
    }

    public startBackgroundMusic(): void {
        this.soundGenerator.startBackgroundMusic();
    }

    public stopBackgroundMusic(): void {
        this.soundGenerator.stopBackgroundMusic();
    }

    public setSFXVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.soundGenerator.setSFXVolume(this.sfxVolume);
    }

    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.soundGenerator.setMusicVolume(this.musicVolume);
    }

    public setMuted(muted: boolean): void {
        this.isMuted = muted;
        this.soundGenerator.setMuted(muted);
    }

    public getSFXVolume(): number {
        return this.sfxVolume;
    }

    public getMusicVolume(): number {
        return this.musicVolume;
    }

    public getMuted(): boolean {
        return this.isMuted;
    }

    public destroy(): void {
        if (this.soundGenerator) {
            this.soundGenerator.destroy();
        }
    }
}
