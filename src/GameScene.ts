import Phaser from 'phaser';
import { Player } from './Player';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private farBackground!: Phaser.GameObjects.TileSprite;
    private nearBackground!: Phaser.GameObjects.TileSprite;
    private obstacles: Phaser.GameObjects.Sprite[] = [];
    private gameObjects: Phaser.GameObjects.GameObject[] = [];

    constructor() {
        super({ key: 'GameScene' });
    }

    preload(): void {
        // Create placeholder assets as colored rectangles
        // Replace these with actual game assets
        
        // Player sprite (32x48 - taller for isometric feel)
        this.add.graphics()
            .fillStyle(0x4CAF50)
            .fillRect(0, 0, 32, 48)
            .generateTexture('player', 32, 48);

        // Tree obstacle (40x80)
        this.add.graphics()
            .fillStyle(0x8B4513)
            .fillRect(16, 60, 8, 20) // trunk
            .fillStyle(0x228B22)
            .fillCircle(20, 50, 30) // leaves
            .generateTexture('tree', 40, 80);

        // Far background tile (repeated pattern)
        this.add.graphics()
            .fillStyle(0x87CEEB)
            .fillRect(0, 0, 64, 64)
            .fillStyle(0x98FB98)
            .fillRect(8, 8, 48, 48)
            .generateTexture('far-bg', 64, 64);

        // Near background tile (foreground elements)
        this.add.graphics()
            .fillStyle(0x90EE90, 0.3)
            .fillRect(0, 0, 128, 128)
            .fillStyle(0x32CD32, 0.5)
            .fillRect(20, 20, 88, 88)
            .generateTexture('near-bg', 128, 128);
    }

    create(): void {
        // PARALLAX BACKGROUND LAYERS
        // Far background - moves slowest (creates depth illusion)
        this.farBackground = this.add.tileSprite(0, 0, 1600, 1200, 'far-bg')
            .setOrigin(0, 0)
            .setDepth(-100); // Far behind everything

        // Near background - moves faster than far, slower than foreground
        this.nearBackground = this.add.tileSprite(0, 0, 1600, 1200, 'near-bg')
            .setOrigin(0, 0)
            .setDepth(-50)
            .setAlpha(0.6); // Semi-transparent for layering effect

        // Create world bounds for larger play area
        this.physics.world.setBounds(0, 0, 1600, 1200);

        // Create player
        this.player = new Player(this, 400, 300);
        this.gameObjects.push(this.player);

        // Create sample obstacles for depth sorting demonstration
        this.createObstacles();

        // Camera setup - follows player with smooth movement
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 1600, 1200);

        // Instructions text
        this.add.text(10, 10, 'Use ARROW KEYS or WASD to move\nWalk behind and in front of trees!', {
            fontSize: '16px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 10 }
        }).setScrollFactor(0).setDepth(2000); // UI layer, doesn't scroll with camera
    }

    private createObstacles(): void {
        // Create multiple trees at different positions for depth sorting demo
        const treePositions = [
            { x: 300, y: 200 },
            { x: 500, y: 350 },
            { x: 700, y: 250 },
            { x: 450, y: 450 },
            { x: 800, y: 400 },
            { x: 200, y: 500 },
            { x: 600, y: 600 }
        ];

        treePositions.forEach(pos => {
            const tree = this.add.sprite(pos.x, pos.y, 'tree');
            // Set initial depth based on y position
            tree.setDepth(1000 + pos.y);
            this.obstacles.push(tree);
            this.gameObjects.push(tree);
        });
    }

    update(): void {
        // Update player
        this.player.update();

        // PARALLAX SCROLLING EFFECT
        // Get camera position for parallax calculations
        const camera = this.cameras.main;
        
        // Far background moves very slowly (0.1x camera speed)
        this.farBackground.tilePositionX = camera.scrollX * 0.1;
        this.farBackground.tilePositionY = camera.scrollY * 0.1;
        
        // Near background moves at medium speed (0.3x camera speed)
        this.nearBackground.tilePositionX = camera.scrollX * 0.3;
        this.nearBackground.tilePositionY = camera.scrollY * 0.3;

        // 2.5D DEPTH SORTING
        // Update depth for all game objects based on their y position
        // Objects with higher y values appear in front (closer to camera)
        this.gameObjects.forEach(obj => {
            if (obj instanceof Phaser.GameObjects.Sprite) {
                obj.setDepth(1000 + obj.y);
            }
        });
    }
}