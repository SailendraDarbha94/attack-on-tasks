import Phaser from 'phaser';
import { Player } from './Player';
import { Titan } from './Titan';
import { UIManager } from './UIManager';
import { getLevel, LevelConfig, getTotalLevels } from './LevelConfig';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private titans: Titan[] = [];
    private obstacles: Phaser.GameObjects.Sprite[] = [];
    private uiManager!: UIManager;

    // Background layers for parallax
    private farBackground!: Phaser.GameObjects.TileSprite;
    private nearBackground!: Phaser.GameObjects.TileSprite;

    // Level state
    private currentLevelId: number = 1;
    private levelConfig!: LevelConfig;
    private isGameOver: boolean = false;
    private isVictory: boolean = false;

    // Input
    private enterKey!: Phaser.Input.Keyboard.Key;
    private escapeKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: { levelId?: number }): void {
        this.currentLevelId = data.levelId || 1;
        this.titans = [];
        this.obstacles = [];
        this.isGameOver = false;
        this.isVictory = false;
    }

    preload(): void {
        // Assets are loaded in PreloaderScene
        // Generate any additional textures needed
        this.createTextures();
    }

    private createTextures(): void {
        // Only create if not already exists
        if (!this.textures.exists('player-fallback')) {
            // Player fallback (animated look)
            const playerG = this.add.graphics();
            // Body
            playerG.fillStyle(0x4a6741);
            playerG.fillRoundedRect(4, 16, 24, 28, 4);
            // Head
            playerG.fillStyle(0xffdbac);
            playerG.fillCircle(16, 12, 10);
            // Hair
            playerG.fillStyle(0x3d2314);
            playerG.fillEllipse(16, 8, 18, 10);
            // Cape (Survey Corps style)
            playerG.fillStyle(0x2e5d2e);
            playerG.fillTriangle(4, 20, 16, 44, 28, 20);
            // Wings of Freedom emblem (simplified)
            playerG.fillStyle(0xffffff);
            playerG.fillTriangle(12, 25, 16, 35, 20, 25);
            playerG.generateTexture('player-fallback', 32, 48);
            playerG.destroy();
        }

        if (!this.textures.exists('titan-fallback')) {
            // Titan fallback
            const titanG = this.add.graphics();
            // Body
            titanG.fillStyle(0xd4a574);
            titanG.fillRoundedRect(8, 30, 48, 60, 8);
            // Head
            titanG.fillStyle(0xd4a574);
            titanG.fillCircle(32, 20, 18);
            // Creepy smile
            titanG.lineStyle(3, 0xffffff);
            titanG.beginPath();
            titanG.arc(32, 24, 10, 0.2, Math.PI - 0.2);
            titanG.strokePath();
            // Eyes (glowing)
            titanG.fillStyle(0xff0000);
            titanG.fillCircle(26, 16, 4);
            titanG.fillCircle(38, 16, 4);
            titanG.generateTexture('titan-fallback', 64, 96);
            titanG.destroy();
        }
    }

    create(): void {
        // Get level configuration
        this.levelConfig = getLevel(this.currentLevelId)!;

        if (!this.levelConfig) {
            console.error(`Level ${this.currentLevelId} not found!`);
            this.scene.start('MainMenuScene');
            return;
        }

        // Set up world bounds
        this.physics.world.setBounds(
            0, 0,
            this.levelConfig.worldWidth,
            this.levelConfig.worldHeight
        );

        // Create parallax backgrounds
        this.createBackgrounds();

        // Create obstacles
        this.createObstacles();

        // Create player
        this.player = new Player(
            this,
            this.levelConfig.playerStart.x,
            this.levelConfig.playerStart.y
        );

        // Use fallback texture if main one failed to load
        if (!this.textures.exists('player') || this.textures.get('player').key === '__MISSING') {
            this.player.setTexture('player-fallback');
        }

        // Create titans
        this.createTitans();

        // Setup camera
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(
            0, 0,
            this.levelConfig.worldWidth,
            this.levelConfig.worldHeight
        );

        // Apply level background tint if specified
        if (this.levelConfig.backgroundTint) {
            this.cameras.main.setBackgroundColor(this.levelConfig.backgroundTint);
        } else {
            this.cameras.main.setBackgroundColor(0x87CEEB);
        }

        // Create UI Manager
        this.uiManager = new UIManager(this);
        this.uiManager.setLevel(this.currentLevelId, this.levelConfig.name);
        this.uiManager.setTitansRemaining(this.titans.length);

        // Setup event listeners
        this.setupEventListeners();

        // Setup input
        this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Fade in
        this.cameras.main.fadeIn(500);

        // Show level start message
        this.uiManager.showMessage(this.levelConfig.description);
    }

    private createBackgrounds(): void {
        // Far background (sky/distant)
        this.farBackground = this.add.tileSprite(
            0, 0,
            this.levelConfig.worldWidth * 2,
            this.levelConfig.worldHeight * 2,
            'far-bg'
        ).setOrigin(0, 0).setDepth(-100);

        // Near background (grass/ground details)
        this.nearBackground = this.add.tileSprite(
            0, 0,
            this.levelConfig.worldWidth * 2,
            this.levelConfig.worldHeight * 2,
            'near-bg'
        ).setOrigin(0, 0).setDepth(-50).setAlpha(0.6);
    }

    private createObstacles(): void {
        // Map obstacle types to texture keys
        const textureMap: Record<string, string> = {
            'giant-tree': 'giant-tree',
            'building': 'building',
            'wall': 'wall',
            'rock': 'rock',
            'tree': 'giant-tree',
            'house': 'building'
        };

        this.levelConfig.obstacles.forEach(obs => {
            const textureKey = textureMap[obs.type] || obs.type;
            const sprite = this.add.sprite(obs.x, obs.y, textureKey);

            if (obs.scale) {
                sprite.setScale(obs.scale);
            }

            // Set initial depth based on Y position
            sprite.setDepth(1000 + obs.y);

            // Enable physics for collision
            this.physics.add.existing(sprite, true); // true = static body

            this.obstacles.push(sprite);
        });
    }

    private createTitans(): void {
        this.levelConfig.titans.forEach(titanData => {
            const titan = new Titan(
                this,
                titanData.x,
                titanData.y,
                titanData.config
            );

            // Use fallback texture if needed
            if (!this.textures.exists('titan') || this.textures.get('titan').key === '__MISSING') {
                titan.sprite.setTexture('titan-fallback');
            }

            titan.setTarget(this.player);
            this.titans.push(titan);
        });
    }

    private setupEventListeners(): void {
        // Player attack event
        this.events.on('playerAttack', (hitbox: Phaser.GameObjects.Zone, damage: number) => {
            this.handlePlayerAttack(hitbox, damage);
        });

        // Titan attack event
        this.events.on('titanAttack', (titan: Titan, damage: number) => {
            this.player.takeDamage(damage);
        });

        // Titan defeated event
        this.events.on('titanDefeated', (titanName: string) => {
            this.handleTitanDefeated(titanName);
        });

        // Player death event
        this.events.on('playerDeath', () => {
            this.handlePlayerDeath();
        });
    }

    private handlePlayerAttack(hitbox: Phaser.GameObjects.Zone, damage: number): void {
        this.titans.forEach(titan => {
            if (!titan.active) return;

            // Simple distance-based collision check
            const distance = Phaser.Math.Distance.Between(
                hitbox.x, hitbox.y,
                titan.x, titan.y
            );

            // Hit if within attack range (hitbox size + titan size)
            if (distance < 60) {
                const killed = titan.takeDamage(damage);
                if (!killed) {
                    // Add score for hitting
                    this.uiManager.addScore(10);
                }
            }
        });
    }

    private handleTitanDefeated(titanName: string): void {
        // Remove from array
        this.titans = this.titans.filter(t => t.active);

        // Update UI
        this.uiManager.setTitansRemaining(this.titans.length);
        this.uiManager.addScore(100);
        this.uiManager.showMessage(`${titanName} Defeated!`);

        // Check victory condition
        if (this.levelConfig.victoryCondition === 'defeat_all' && this.titans.length === 0) {
            this.handleVictory();
        }
    }

    private handleVictory(): void {
        if (this.isVictory) return;
        this.isVictory = true;

        // Slow motion effect
        this.time.timeScale = 0.5;

        this.time.delayedCall(1000, () => {
            this.time.timeScale = 1;
            this.uiManager.showVictory();
        });
    }

    private handlePlayerDeath(): void {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Death animation for player
        this.tweens.add({
            targets: this.player,
            alpha: 0,
            angle: 90,
            duration: 500,
            onComplete: () => {
                this.uiManager.showGameOver();
            }
        });
    }

    update(): void {
        if (this.isGameOver || this.isVictory) {
            // Handle restart/continue input
            if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                if (this.isVictory) {
                    // Go to next level or back to menu
                    const nextLevel = this.currentLevelId + 1;
                    if (nextLevel <= getTotalLevels()) {
                        this.scene.restart({ levelId: nextLevel });
                    } else {
                        this.scene.start('MainMenuScene');
                    }
                } else {
                    // Retry current level
                    this.scene.restart({ levelId: this.currentLevelId });
                }
            }
            return;
        }

        // ESC to return to menu
        if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
            this.scene.start('MainMenuScene');
        }

        // Update player
        this.player.update();

        // Update titans
        this.titans.forEach(titan => titan.update());

        // Parallax scrolling
        const camera = this.cameras.main;
        this.farBackground.tilePositionX = camera.scrollX * 0.1;
        this.farBackground.tilePositionY = camera.scrollY * 0.1;
        this.nearBackground.tilePositionX = camera.scrollX * 0.3;
        this.nearBackground.tilePositionY = camera.scrollY * 0.3;

        // Update obstacle depths for 2.5D effect
        this.obstacles.forEach(obs => {
            obs.setDepth(1000 + obs.y);
        });

        // Player-obstacle collision
        this.physics.collide(this.player, this.obstacles);
    }
}