import Phaser from 'phaser';
import { PlayerStats } from './Player';

export class UIManager {
    private scene: Phaser.Scene;

    // UI Elements
    private levelText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private titansText!: Phaser.GameObjects.Text;
    private messageText!: Phaser.GameObjects.Text;
    private controlsText!: Phaser.GameObjects.Text;

    // Score & level tracking
    private score: number = 0;
    private currentLevel: number = 1;
    private titansRemaining: number = 0;

    // Message queue
    private messageQueue: string[] = [];
    private isShowingMessage: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.create();
    }

    private create(): void {
        const { width, height } = this.scene.scale;

        // Level & Score display (top right)
        this.levelText = this.scene.add.text(width - 20, 20, 'Level 1', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(3000);

        this.scoreText = this.scene.add.text(width - 20, 50, 'Score: 0', {
            fontSize: '18px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(3000);

        // Titans remaining (top center)
        this.titansText = this.scene.add.text(width / 2, 20, 'Titans: 0', {
            fontSize: '20px',
            color: '#ff4444',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(3000);

        // Message text (center screen, for notifications)
        this.messageText = this.scene.add.text(width / 2, height / 2 - 50, '', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(4000).setAlpha(0);

        // Controls text (bottom)
        this.controlsText = this.scene.add.text(width / 2, height - 20,
            'WASD/Arrows: Move | SPACE: Attack | SHIFT: Dodge', {
            fontSize: '14px',
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(3000);
    }

    setLevel(level: number, name: string): void {
        this.currentLevel = level;
        this.levelText.setText(`Level ${level}: ${name}`);

        // Show level intro message
        this.showMessage(`Level ${level}\n${name}`, 2000);
    }

    setTitansRemaining(count: number): void {
        this.titansRemaining = count;
        this.titansText.setText(`Titans: ${count}`);

        // Flash when titans change
        this.scene.tweens.add({
            targets: this.titansText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            yoyo: true
        });
    }

    addScore(points: number): void {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);

        // Flash effect
        this.scene.tweens.add({
            targets: this.scoreText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    getScore(): number {
        return this.score;
    }

    showMessage(message: string, duration: number = 2000): void {
        this.messageQueue.push(message);

        if (!this.isShowingMessage) {
            this.processMessageQueue();
        }
    }

    private processMessageQueue(): void {
        if (this.messageQueue.length === 0) {
            this.isShowingMessage = false;
            return;
        }

        this.isShowingMessage = true;
        const message = this.messageQueue.shift()!;

        this.messageText.setText(message);
        this.messageText.setAlpha(0);
        this.messageText.setScale(0.5);

        // Animate in
        this.scene.tweens.add({
            targets: this.messageText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold, then animate out
                this.scene.time.delayedCall(1500, () => {
                    this.scene.tweens.add({
                        targets: this.messageText,
                        alpha: 0,
                        scaleX: 0.8,
                        scaleY: 0.8,
                        duration: 300,
                        onComplete: () => {
                            this.processMessageQueue();
                        }
                    });
                });
            }
        });
    }

    showVictory(): void {
        const { width, height } = this.scene.scale;

        // Victory screen overlay
        const overlay = this.scene.add.rectangle(
            width / 2, height / 2, width, height, 0x000000, 0.7
        ).setScrollFactor(0).setDepth(5000);

        const victoryText = this.scene.add.text(width / 2, height / 2 - 50,
            '🎉 VICTORY! 🎉', {
            fontSize: '48px',
            color: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        const scoreDisplay = this.scene.add.text(width / 2, height / 2 + 20,
            `Final Score: ${this.score}`, {
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        const continueText = this.scene.add.text(width / 2, height / 2 + 80,
            'Press ENTER to continue', {
            fontSize: '20px',
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        // Pulsing animation
        this.scene.tweens.add({
            targets: continueText,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    showGameOver(): void {
        const { width, height } = this.scene.scale;

        // Game over overlay
        const overlay = this.scene.add.rectangle(
            width / 2, height / 2, width, height, 0x000000, 0.8
        ).setScrollFactor(0).setDepth(5000);

        const gameOverText = this.scene.add.text(width / 2, height / 2 - 50,
            '💀 GAME OVER 💀', {
            fontSize: '48px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        const scoreDisplay = this.scene.add.text(width / 2, height / 2 + 20,
            `Score: ${this.score}`, {
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        const retryText = this.scene.add.text(width / 2, height / 2 + 80,
            'Press ENTER to retry', {
            fontSize: '20px',
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        // Shake effect
        this.scene.cameras.main.shake(500, 0.02);

        // Pulsing animation
        this.scene.tweens.add({
            targets: retryText,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    destroy(): void {
        this.levelText.destroy();
        this.scoreText.destroy();
        this.titansText.destroy();
        this.messageText.destroy();
        this.controlsText.destroy();
    }
}
