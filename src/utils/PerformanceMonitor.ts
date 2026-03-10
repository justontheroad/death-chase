export class PerformanceMonitor {
    private scene: Phaser.Scene;
    private fpsHistory: number[] = [];
    private targetFPS: number = 55;
    private maxMemoryMB: number = 150;
    private qualityLevel: number = 3;
    private lastReportTime: number = 0;
    private reportInterval: number = 10000;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    update(time: number): void {
        const fps = this.scene.game.loop.actualFps;
        this.fpsHistory.push(fps);
        
        if (this.fpsHistory.length > 60) {
            this.fpsHistory.shift();
        }
        
        this.checkAndAdjustQuality(fps);
        
        if (time - this.lastReportTime >= this.reportInterval) {
            this.generateReport();
            this.lastReportTime = time;
            this.scene.events.emit('performance-report', this.getPerformanceReport());
        }
    }

    private checkAndAdjustQuality(currentFPS: number): void {
        const avgFPS = this.calculateAverageFPS();
        
        if (avgFPS < this.targetFPS && this.qualityLevel > 1) {
            this.reduceQuality();
        } else if (avgFPS > this.targetFPS + 10 && this.qualityLevel < 3) {
            this.increaseQuality();
        }
    }

    private calculateAverageFPS(): number {
        if (this.fpsHistory.length === 0) return 60;
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return sum / this.fpsHistory.length;
    }

    private reduceQuality(): void {
        this.qualityLevel = Math.max(1, this.qualityLevel - 1);
        console.log(`Reduced quality level to ${this.qualityLevel} to maintain ${this.targetFPS}fps`);
    }

    private increaseQuality(): void {
        this.qualityLevel = Math.min(3, this.qualityLevel + 1);
        console.log(`Increased quality level to ${this.qualityLevel}`);
    }

    private getMemoryUsageMB(): number | null {
        try {
            const perf = (window as any).performance;
            if (perf && perf.memory) {
                return perf.memory.usedJSHeapSize / (1024 * 1024);
            }
        } catch (e) {
            console.warn('Memory measurement not available:', e);
        }
        return null;
    }

    public getPerformanceReport() {
        const currentFPS = this.scene.game.loop.actualFps;
        const avgFPS = this.calculateAverageFPS();
        const memoryMB = this.getMemoryUsageMB();
        const bladeCount = this.getBladeCount();
        
        return {
            timestamp: Date.now(),
            currentFPS,
            averageFPS: avgFPS,
            targetFPS: this.targetFPS,
            memoryMB,
            maxMemoryMB: this.maxMemoryMB,
            qualityLevel: this.qualityLevel,
            bladeCount,
            isMeetingTargets: avgFPS >= this.targetFPS && (memoryMB === null || memoryMB < this.maxMemoryMB)
        };
    }

    private getBladeCount(): number {
        let count = 0;
        this.scene.children.getAll().forEach(child => {
            if (child instanceof Phaser.GameObjects.Sprite && child.texture.key === 'blade') {
                count++;
            }
        });
        return count;
    }

    public generateReport(): string {
        const report = this.getPerformanceReport();
        const memoryStatus = report.memoryMB ? `${report.memoryMB.toFixed(1)}MB / ${report.maxMemoryMB}MB` : 'N/A';
        
        return `Performance Report:
- Current FPS: ${report.currentFPS.toFixed(1)}
- Average FPS: ${report.averageFPS.toFixed(1)} (Target: ≥${report.targetFPS})
- Memory Usage: ${memoryStatus}
- Quality Level: ${report.qualityLevel}/3
- Blade Count: ${report.bladeCount}
- Meeting Targets: ${report.isMeetingTargets ? 'YES' : 'NO'}
`;
    }

    public getQualityLevel(): number {
        return this.qualityLevel;
    }

    public setTargetFPS(fps: number): void {
        this.targetFPS = fps;
    }

    public setMaxMemoryMB(memoryMB: number): void {
        this.maxMemoryMB = memoryMB;
    }
}