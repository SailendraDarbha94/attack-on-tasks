import Phaser from 'phaser';
import { LEVELS, getTotalLevels } from './LevelConfig';

export class MainMenuScene extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private subtitleText!: Phaser.GameObjects.Text;
    private startButton!: Phaser.GameObjects.Container;
    private levelButtons: Phaser.GameObjects.Container[] = [];
    private particles!: Phaser.GameObjects.Graphics[];

    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create(): void {
        const { width, height } = this.scale;

        // Animated background
        this.createBackground();

        // Title with animation
        this.titleText = this.add.text(width / 2, 100, '⚔️ ATTACK ON TASKS ⚔️', {
            fontSize: '48px',
            color: '#ff6600',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 10,
                fill: true
            }
        }).setOrigin(0.5);

        // Floating animation for title
        this.tweens.add({
            targets: this.titleText,
            y: 110,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Subtitle
        this.subtitleText = this.add.text(width / 2, 160,
            'Defeat the Titans of Bad Habits!', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'italic',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Create level selection
        this.createLevelButtons();

        // Start button
        this.createStartButton();

        // Credits
        this.add.text(width / 2, height - 30, 'Use WASD/Arrows to move, SPACE to attack, SHIFT to dodge', {
            fontSize: '14px',
            color: '#888888',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Fade in
        this.cameras.main.fadeIn(500);
    }

    private createBackground(): void {
        const { width, height } = this.scale;

        // Gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, width, height);

        // Floating particles
        this.particles = [];
        for (let i = 0; i < 20; i++) {
            const particle = this.add.graphics();
            particle.fillStyle(0xff6600, Phaser.Math.FloatBetween(0.1, 0.3));
            particle.fillCircle(0, 0, Phaser.Math.Between(2, 6));

            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            particle.setPosition(x, y);

            this.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(50, 150),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                ease: 'Linear',
                repeat: -1,
                onRepeat: () => {
                    particle.setPosition(
                        Phaser.Math.Between(0, width),
                        height + 20
                    );
                    particle.setAlpha(Phaser.Math.FloatBetween(0.1, 0.3));
                }
            });

            this.particles.push(particle);
        }
    }

    private createLevelButtons(): void {
        const { width, height } = this.scale;
        const startY = 220;
        const buttonSpacing = 60;

        LEVELS.forEach((level, index) => {
            const y = startY + index * buttonSpacing;

            // Button background
            const bg = this.add.graphics();
            bg.fillStyle(0x333333, 0.8);
            bg.fillRoundedRect(-150, -20, 300, 40, 10);
            bg.lineStyle(2, 0xff6600, 0.8);
            bg.strokeRoundedRect(-150, -20, 300, 40, 10);

            // Level text
            const text = this.add.text(0, 0, `Level ${level.id}: ${level.name}`, {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Container
            const container = this.add.container(width / 2, y, [bg, text]);
            container.setSize(300, 40);
            container.setInteractive({ useHandCursor: true });

            // Hover effects
            container.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100
                });
                bg.clear();
                bg.fillStyle(0x444444, 0.9);
                bg.fillRoundedRect(-150, -20, 300, 40, 10);
                bg.lineStyle(3, 0xff8800, 1);
                bg.strokeRoundedRect(-150, -20, 300, 40, 10);
                text.setColor('#ffcc00');
            });

            container.on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
                bg.clear();
                bg.fillStyle(0x333333, 0.8);
                bg.fillRoundedRect(-150, -20, 300, 40, 10);
                bg.lineStyle(2, 0xff6600, 0.8);
                bg.strokeRoundedRect(-150, -20, 300, 40, 10);
                text.setColor('#ffffff');
            });

            container.on('pointerdown', () => {
                this.startLevel(level.id);
            });

            this.levelButtons.push(container);
        });
    }

    private createStartButton(): void {
        const { width, height } = this.scale;

        // Quick play button at bottom
        const bg = this.add.graphics();
        bg.fillStyle(0xff6600, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 12);
        bg.lineStyle(3, 0xffaa00, 1);
        bg.strokeRoundedRect(-100, -25, 200, 50, 12);

        const text = this.add.text(0, 0, '▶ QUICK PLAY', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.startButton = this.add.container(width / 2, height - 100, [bg, text]);
        this.startButton.setSize(200, 50);
        this.startButton.setInteractive({ useHandCursor: true });

        // Pulsing animation
        this.tweens.add({
            targets: this.startButton,
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Hover effects
        this.startButton.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0xff8800, 1);
            bg.fillRoundedRect(-100, -25, 200, 50, 12);
            bg.lineStyle(3, 0xffcc00, 1);
            bg.strokeRoundedRect(-100, -25, 200, 50, 12);
        });

        this.startButton.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0xff6600, 1);
            bg.fillRoundedRect(-100, -25, 200, 50, 12);
            bg.lineStyle(3, 0xffaa00, 1);
            bg.strokeRoundedRect(-100, -25, 200, 50, 12);
        });

        this.startButton.on('pointerdown', () => {
            this.startLevel(1);
        });
    }

    private startLevel(levelId: number): void {
        // Transition effect
        this.cameras.main.fadeOut(300, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { levelId });
        });
    }
}
