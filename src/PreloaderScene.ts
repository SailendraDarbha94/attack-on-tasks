import Phaser from 'phaser';

export class PreloaderScene extends Phaser.Scene {
    private loadingBar!: Phaser.GameObjects.Graphics;
    private progressBar!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload(): void {
        const { width, height } = this.scale;

        // Create loading bar background
        this.loadingBar = this.add.graphics();
        this.loadingBar.fillStyle(0x222222, 0.8);
        this.loadingBar.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);

        // Create progress bar
        this.progressBar = this.add.graphics();

        // Loading text
        this.loadingText = this.add.text(width / 2, height / 2 - 60, 'Loading...', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Title
        this.add.text(width / 2, height / 2 - 120, '⚔️ ATTACK ON TASKS ⚔️', {
            fontSize: '36px',
            color: '#ff6600',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 2 - 85, 'Shinzou wo Sasageyo!', {
            fontSize: '16px',
            color: '#aaaaaa',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Progress events
        this.load.on('progress', (value: number) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0xff6600, 1);
            this.progressBar.fillRoundedRect(
                width / 2 - 150,
                height / 2 - 15,
                300 * value,
                30,
                8
            );
            this.loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
        });

        this.load.on('complete', () => {
            this.loadingText.setText('Complete!');
        });

        // Load all game assets
        this.loadAssets();
    }

    private loadAssets(): void {
        // Player with ODM gear
        this.load.image('player-odm', 'assets/player-odm.png');

        // Titan types
        this.load.image('abnormal-titan', 'assets/abnormal-titan.png');
        this.load.image('colossal-titan', 'assets/colossal-titan.png');

        // Environments
        this.load.image('giant-forest', 'assets/giant-forest.png');
        this.load.image('trost-district', 'assets/trost-district.png');
        this.load.image('wall-segment', 'assets/wall-segment.png');

        // Create procedural assets
        this.createProceduralAssets();
    }

    private createProceduralAssets(): void {
        // Survey Corps soldier (fallback player with ODM gear)
        const playerG = this.add.graphics();
        // Body with brown jacket
        playerG.fillStyle(0x8B4513);
        playerG.fillRoundedRect(6, 18, 20, 24, 3);
        // White pants
        playerG.fillStyle(0xffffff);
        playerG.fillRect(8, 36, 7, 10);
        playerG.fillRect(17, 36, 7, 10);
        // Head
        playerG.fillStyle(0xffdbac);
        playerG.fillCircle(16, 12, 9);
        // Hair (dark)
        playerG.fillStyle(0x2c1810);
        playerG.fillEllipse(16, 8, 16, 10);
        // Green cape (Survey Corps)
        playerG.fillStyle(0x2d5a27);
        playerG.fillTriangle(6, 22, 16, 46, 26, 22);
        // Wings of Freedom emblem (white/blue)
        playerG.fillStyle(0xffffff);
        playerG.fillTriangle(13, 28, 16, 38, 19, 28);
        playerG.fillStyle(0x4169e1);
        playerG.fillTriangle(14, 30, 16, 36, 18, 30);
        // ODM gear boxes (on waist)
        playerG.fillStyle(0x444444);
        playerG.fillRect(3, 30, 5, 8);
        playerG.fillRect(24, 30, 5, 8);
        // Gas canisters
        playerG.fillStyle(0x666666);
        playerG.fillRect(1, 28, 3, 12);
        playerG.fillRect(28, 28, 3, 12);
        // Blades
        playerG.fillStyle(0xcccccc);
        playerG.fillRect(0, 20, 2, 18);
        playerG.fillRect(30, 20, 2, 18);
        playerG.generateTexture('player', 32, 48);
        playerG.destroy();

        // Abnormal Titan (fallback)
        const titanG = this.add.graphics();
        // Body (skinless muscle look)
        titanG.fillStyle(0xc4735c);
        titanG.fillRoundedRect(10, 35, 44, 55, 8);
        // Muscle lines
        titanG.lineStyle(2, 0x8b4049);
        titanG.lineBetween(20, 40, 20, 85);
        titanG.lineBetween(44, 40, 44, 85);
        titanG.lineBetween(32, 35, 32, 90);
        // Head
        titanG.fillStyle(0xc4735c);
        titanG.fillCircle(32, 22, 20);
        // Creepy wide smile
        titanG.lineStyle(4, 0x2c1810);
        titanG.beginPath();
        titanG.arc(32, 28, 14, 0.3, Math.PI - 0.3);
        titanG.strokePath();
        // Teeth
        titanG.fillStyle(0xffffff);
        for (let i = 0; i < 8; i++) {
            titanG.fillRect(20 + i * 3, 26, 2, 6);
        }
        // Eyes (menacing)
        titanG.fillStyle(0x000000);
        titanG.fillCircle(24, 16, 4);
        titanG.fillCircle(40, 16, 4);
        // Eye glint
        titanG.fillStyle(0xff0000, 0.5);
        titanG.fillCircle(24, 16, 2);
        titanG.fillCircle(40, 16, 2);
        titanG.generateTexture('titan', 64, 96);
        titanG.destroy();

        // Colossal Titan (boss)
        const colossalG = this.add.graphics();
        // Massive body with exposed muscle
        colossalG.fillStyle(0x8b3a3a);
        colossalG.fillRoundedRect(15, 45, 66, 75, 10);
        // Muscle fiber lines
        colossalG.lineStyle(3, 0x5c2020);
        for (let i = 0; i < 5; i++) {
            colossalG.lineBetween(25 + i * 12, 50, 25 + i * 12, 115);
        }
        // Head
        colossalG.fillStyle(0x8b3a3a);
        colossalG.fillCircle(48, 28, 25);
        // Skull-like face
        colossalG.fillStyle(0x2c1810);
        colossalG.fillCircle(38, 22, 5);
        colossalG.fillCircle(58, 22, 5);
        // Giant teeth
        colossalG.fillStyle(0xffffff);
        for (let i = 0; i < 10; i++) {
            colossalG.fillRect(28 + i * 4, 34, 3, 8);
        }
        // Steam effect
        colossalG.fillStyle(0xffffff, 0.3);
        colossalG.fillCircle(20, 30, 10);
        colossalG.fillCircle(76, 30, 10);
        colossalG.fillCircle(15, 60, 8);
        colossalG.fillCircle(81, 60, 8);
        colossalG.generateTexture('colossal', 96, 128);
        colossalG.destroy();

        // Giant Tree
        const treeG = this.add.graphics();
        // Massive trunk
        treeG.fillStyle(0x4a3728);
        treeG.fillRect(15, 50, 30, 70);
        // Bark texture
        treeG.lineStyle(2, 0x2c1810);
        treeG.lineBetween(20, 55, 20, 115);
        treeG.lineBetween(30, 50, 30, 120);
        treeG.lineBetween(40, 55, 40, 115);
        // Canopy layers
        treeG.fillStyle(0x1a3d1a);
        treeG.fillCircle(30, 35, 35);
        treeG.fillStyle(0x2d5a27);
        treeG.fillCircle(30, 30, 28);
        treeG.fillStyle(0x3d7a3d);
        treeG.fillCircle(30, 25, 20);
        treeG.generateTexture('giant-tree', 60, 120);
        treeG.destroy();

        // Stone building (Trost style)
        const buildingG = this.add.graphics();
        // Main structure
        buildingG.fillStyle(0x8b8b7a);
        buildingG.fillRect(5, 30, 70, 50);
        // Roof
        buildingG.fillStyle(0x8b4513);
        buildingG.fillTriangle(40, 5, 0, 35, 80, 35);
        // Windows
        buildingG.fillStyle(0x2c1810);
        buildingG.fillRect(15, 45, 15, 20);
        buildingG.fillRect(50, 45, 15, 20);
        // Door
        buildingG.fillStyle(0x4a3728);
        buildingG.fillRect(32, 55, 16, 25);
        // Stone texture
        buildingG.lineStyle(1, 0x6b6b5a);
        for (let y = 35; y < 80; y += 10) {
            buildingG.lineBetween(5, y, 75, y);
        }
        buildingG.generateTexture('building', 80, 80);
        buildingG.destroy();

        // Wall Maria/Rose segment
        const wallG = this.add.graphics();
        // Massive wall
        wallG.fillStyle(0x6b6b5a);
        wallG.fillRect(0, 0, 100, 40);
        // Stone blocks
        wallG.lineStyle(2, 0x4a4a3a);
        for (let x = 0; x < 100; x += 20) {
            wallG.lineBetween(x, 0, x, 40);
        }
        for (let y = 0; y < 40; y += 10) {
            wallG.lineBetween(0, y, 100, y);
        }
        // Weathering
        wallG.fillStyle(0x3d5a3d, 0.3);
        wallG.fillRect(0, 30, 100, 10);
        wallG.generateTexture('wall', 100, 40);
        wallG.destroy();

        // Far background (sky with walls in distance)
        const farBgG = this.add.graphics();
        // Sky gradient
        farBgG.fillStyle(0x87CEEB);
        farBgG.fillRect(0, 0, 256, 180);
        // Distant wall silhouette
        farBgG.fillStyle(0x5a5a4a);
        farBgG.fillRect(0, 140, 256, 60);
        // Clouds
        farBgG.fillStyle(0xffffff, 0.6);
        farBgG.fillCircle(50, 50, 25);
        farBgG.fillCircle(75, 45, 30);
        farBgG.fillCircle(100, 55, 20);
        farBgG.fillCircle(180, 70, 22);
        farBgG.fillCircle(200, 65, 28);
        farBgG.generateTexture('far-bg', 256, 200);
        farBgG.destroy();

        // Near background (ground with debris)
        const nearBgG = this.add.graphics();
        // Grass/ground
        nearBgG.fillStyle(0x4a6741, 0.5);
        nearBgG.fillRect(0, 0, 256, 256);
        // Grass patches
        nearBgG.fillStyle(0x5a7a51, 0.6);
        nearBgG.fillCircle(50, 50, 30);
        nearBgG.fillCircle(200, 150, 40);
        nearBgG.fillCircle(100, 200, 35);
        // Cobblestone path hints
        nearBgG.fillStyle(0x6b6b5a, 0.3);
        nearBgG.fillRect(100, 0, 56, 256);
        nearBgG.generateTexture('near-bg', 256, 256);
        nearBgG.destroy();

        // Rock/debris
        const rockG = this.add.graphics();
        rockG.fillStyle(0x5a5a4a);
        rockG.fillEllipse(25, 18, 50, 30);
        rockG.fillStyle(0x6b6b5a);
        rockG.fillEllipse(25, 15, 40, 22);
        rockG.generateTexture('rock', 50, 35);
        rockG.destroy();
    }

    create(): void {
        // Fade out and start main menu
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenuScene');
        });
    }
}
