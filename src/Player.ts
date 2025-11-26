import Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys: any;
    private speed: number = 150;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up input
        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.wasdKeys = scene.input.keyboard!.addKeys('W,S,A,D');
        
        // Set player properties for depth sorting
        this.setDepth(1); // Base depth, will be adjusted by y position
    }

    update(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Reset velocity
        body.setVelocity(0);

        // Handle horizontal movement
        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
            body.setVelocityX(-this.speed);
        } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
            body.setVelocityX(this.speed);
        }

        // Handle vertical movement
        if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
            body.setVelocityY(-this.speed);
        } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
            body.setVelocityY(this.speed);
        }

        // 2.5D DEPTH SORTING: Update depth based on y position
        // Objects with higher y values (lower on screen) appear in front
        this.setDepth(1000 + this.y);
    }

    // Get player position for camera following
    getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
}