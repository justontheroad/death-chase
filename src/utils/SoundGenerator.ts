export enum SoundType {
    SWORD_SWING = 'sword_swing',
    AXE_SWING = 'axe_swing',
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

export class SoundGenerator {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private isMuted: boolean = false;
    private musicOscillators: OscillatorNode[] = [];

    constructor() {
        this.initAudioContext();
    }

    private initAudioContext(): void {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            this.masterGain.connect(this.audioContext.destination);
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            
            this.musicGain.gain.value = 0.3;
            this.sfxGain.gain.value = 0.5;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    private ensureContext(): boolean {
        if (!this.audioContext) {
            this.initAudioContext();
        }
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
        return !!this.audioContext;
    }

    public setSFXVolume(volume: number): void {
        if (this.sfxGain) {
            this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    public setMusicVolume(volume: number): void {
        if (this.musicGain) {
            this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    public setMuted(muted: boolean): void {
        this.isMuted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : 1;
        }
    }

    public playSwingSound(weaponType: string): void {
        if (!this.ensureContext() || !this.audioContext || !this.sfxGain) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        const baseFreq = this.getWeaponFrequency(weaponType);
        osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc.type = 'triangle';
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    public playHitSound(): void {
        if (!this.ensureContext() || !this.audioContext || !this.sfxGain) return;
        
        const osc = this.audioContext.createOscillator();
        const noise = this.createNoise();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        noise.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.type = 'square';
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    public playKillSound(): void {
        if (!this.ensureContext() || !this.audioContext || !this.sfxGain) return;
        
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);
        
        osc1.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
        
        osc2.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.4);
        osc2.stop(this.audioContext.currentTime + 0.4);
    }

    public playPlayerHurtSound(): void {
        if (!this.ensureContext() || !this.audioContext || !this.sfxGain) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.type = 'sawtooth';
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    public playLevelUpSound(): void {
        if (!this.ensureContext() || !this.audioContext || !this.sfxGain) return;
        
        const notes = [523, 659, 784, 1047];
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            
            osc.connect(gain);
            gain.connect(this.sfxGain!);
            
            const startTime = this.audioContext!.currentTime + i * 0.1;
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.type = 'sine';
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    public playPowerUpSound(): void {
        if (!this.ensureContext() || !this.audioContext || !this.sfxGain) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.type = 'sine';
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    public startBackgroundMusic(): void {
        this.stopBackgroundMusic();
        
        if (!this.ensureContext() || !this.audioContext || !this.musicGain) return;
        
        const bpm = 130;
        const beatInterval = 60 / bpm;
        
        const playLoop = () => {
            if (this.isMuted) return;
            if (!this.audioContext) return;
            
            const now = this.audioContext!.currentTime;
            
            for (let bar = 0; bar < 4; bar++) {
                const barStart = now + bar * beatInterval * 4;
                
                for (let beat = 0; beat < 4; beat++) {
                    const beatTime = barStart + beat * beatInterval;
                    const isDownbeat = beat === 0;
                    const isOffbeat = beat === 2;
                    
                    if (isDownbeat) {
                        const osc = this.audioContext!.createOscillator();
                        const gain = this.audioContext!.createGain();
                        
                        osc.connect(gain);
                        gain.connect(this.musicGain!);
                        
                        osc.frequency.setValueAtTime(55, beatTime);
                        osc.frequency.exponentialRampToValueAtTime(45, beatTime + 0.15);
                        
                        gain.gain.setValueAtTime(0.4, beatTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, beatTime + 0.2);
                        
                        osc.type = 'sine';
                        osc.start(beatTime);
                        osc.stop(beatTime + 0.2);
                        
                        const osc2 = this.audioContext!.createOscillator();
                        const gain2 = this.audioContext!.createGain();
                        
                        osc2.connect(gain2);
                        gain2.connect(this.musicGain!);
                        
                        osc2.frequency.setValueAtTime(110, beatTime);
                        osc2.frequency.exponentialRampToValueAtTime(80, beatTime + 0.1);
                        
                        gain2.gain.setValueAtTime(0.15, beatTime);
                        gain2.gain.exponentialRampToValueAtTime(0.01, beatTime + 0.1);
                        
                        osc2.type = 'triangle';
                        osc2.start(beatTime);
                        osc2.stop(beatTime + 0.1);
                    } else if (isOffbeat) {
                        const osc = this.audioContext!.createOscillator();
                        const gain = this.audioContext!.createGain();
                        
                        osc.connect(gain);
                        gain.connect(this.musicGain!);
                        
                        osc.frequency.setValueAtTime(65, beatTime);
                        
                        gain.gain.setValueAtTime(0.25, beatTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, beatTime + 0.15);
                        
                        osc.type = 'triangle';
                        osc.start(beatTime);
                        osc.stop(beatTime + 0.15);
                    } else {
                        const osc = this.audioContext!.createOscillator();
                        const gain = this.audioContext!.createGain();
                        
                        osc.connect(gain);
                        gain.connect(this.musicGain!);
                        
                        osc.frequency.setValueAtTime(82, beatTime);
                        
                        gain.gain.setValueAtTime(0.1, beatTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, beatTime + 0.08);
                        
                        osc.type = 'sine';
                        osc.start(beatTime);
                        osc.stop(beatTime + 0.08);
                    }
                }
                
                const melodyFrequencies = [392, 440, 494, 523];
                for (let i = 0; i < 4; i++) {
                    const noteTime = barStart + i * beatInterval + 0.1;
                    if (i < melodyFrequencies.length) {
                        const osc = this.audioContext!.createOscillator();
                        const gain = this.audioContext!.createGain();
                        
                        osc.connect(gain);
                        gain.connect(this.musicGain!);
                        
                        osc.frequency.setValueAtTime(melodyFrequencies[i], noteTime);
                        osc.frequency.setValueAtTime(melodyFrequencies[i] * 1.02, noteTime + 0.05);
                        
                        gain.gain.setValueAtTime(0, noteTime);
                        gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.05);
                        gain.gain.linearRampToValueAtTime(0, noteTime + beatInterval * 0.8);
                        
                        osc.type = i === 0 ? 'square' : 'triangle';
                        osc.start(noteTime);
                        osc.stop(noteTime + beatInterval * 0.9);
                    }
                }
                
                for (let i = 0; i < 8; i++) {
                    const drumTime = barStart + i * beatInterval / 2;
                    const isKick = i % 2 === 0;
                    
                    const osc = this.audioContext!.createOscillator();
                    const gain = this.audioContext!.createGain();
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain!);
                    
                    if (isKick) {
                        osc.frequency.setValueAtTime(80, drumTime);
                        osc.frequency.exponentialRampToValueAtTime(40, drumTime + 0.05);
                        
                        gain.gain.setValueAtTime(0.2, drumTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, drumTime + 0.08);
                    } else {
                        osc.frequency.setValueAtTime(200, drumTime);
                        osc.frequency.exponentialRampToValueAtTime(100, drumTime + 0.02);
                        
                        gain.gain.setValueAtTime(0.08, drumTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, drumTime + 0.04);
                    }
                    
                    osc.type = 'square';
                    osc.start(drumTime);
                    osc.stop(drumTime + 0.1);
                }
            }
        };
        
        playLoop();
        
        const loopInterval = setInterval(() => {
            if (this.isMuted) return;
            if (!this.audioContext) return;
            playLoop();
        }, beatInterval * 4 * 1000 * 4);
        
        (this as any).musicInterval = loopInterval;
    }

    public stopBackgroundMusic(): void {
        const interval = (this as any).musicInterval;
        if (interval) {
            clearInterval(interval);
            (this as any).musicInterval = null;
        }
        
        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) {}
        });
        this.musicOscillators = [];
    }

    private createNoise(): AudioBufferSourceNode {
        if (!this.audioContext) {
            throw new Error('AudioContext not initialized');
        }
        
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        return noise;
    }

    private getWeaponFrequency(weaponType: string): number {
        const frequencies: Record<string, number> = {
            'sword': 400,
            'axe': 300,
            'spear': 450,
            'hammer': 200,
            'dagger': 600
        };
        return frequencies[weaponType.toLowerCase()] || 400;
    }

    public destroy(): void {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
    }
}
