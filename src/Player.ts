import Phaser from 'phaser';

export interface PlayerStats {
    maxHealth: number;
    currentHealth: number;
    maxEnergy: number;
    currentEnergy: number;
    attackPower: number;
    defense: number;
    speed: number;
}

export class Player extends Phaser.GameObjects.Sprite {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: any;
    private attackKey!: Phaser.Input.Keyboard.Key;
    private dodgeKey!: Phaser.Input.Keyboard.Key;

    // Stats
    private stats: PlayerStats = {
        maxHealth: 100,
        currentHealth: 100,
        maxEnergy: 100,
        currentEnergy: 100,
        attackPower: 25,
        defense: 5,
        speed: 180
    };

    // Animation state
    private currentDirection: 'down' | 'up' | 'left' | 'right' = 'down';
    private isAttacking: boolean = false;
    private isDodging: boolean = false;
    private isInvulnerable: boolean = false;
    private lastAttackTime: number = 0;
    private attackCooldown: number = 400; // ms
    private lastDodgeTime: number = 0;
    private dodgeCooldown: number = 800; // ms

    // Visual elements
    private healthBar!: Phaser.GameObjects.Graphics;
    private energyBar!: Phaser.GameObjects.Graphics;
    private attackHitbox!: Phaser.GameObjects.Zone;

    // Particles
    private attackParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player');

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configure physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(24, 32);
        body.setOffset(4, 16);
        body.setCollideWorldBounds(true);

        // Set up input
        this.setupInput();

        // Create UI elements
        this.createUI();

        // Set player properties
        this.setDepth(1);

        // Create attack hitbox (invisible zone for attack detection)
        this.attackHitbox = scene.add.zone(x, y + 30, 40, 40);
        scene.physics.add.existing(this.attackHitbox, false);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
    }

    private setupInput(): void {
        this.cursors = this.scene.input.keyboard!.createCursorKeys();
        this.wasdKeys = this.scene.input.keyboard!.addKeys('W,S,A,D');
        this.attackKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.dodgeKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    private createUI(): void {
        // Health bar background
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setScrollFactor(0);
        this.healthBar.setDepth(3000);

        // Energy bar
        this.energyBar = this.scene.add.graphics();
        this.energyBar.setScrollFactor(0);
        this.energyBar.setDepth(3000);

        this.updateUI();
    }

    private updateUI(): void {
        // Health Bar
        this.healthBar.clear();

        // Background
        this.healthBar.fillStyle(0x000000, 0.8);
        this.healthBar.fillRoundedRect(20, 20, 204, 24, 4);

        // Health fill
        const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
        let healthColor = 0x00ff00;
        if (healthPercent < 0.3) healthColor = 0xff0000;
        else if (healthPercent < 0.6) healthColor = 0xffff00;

        this.healthBar.fillStyle(healthColor, 1);
        this.healthBar.fillRoundedRect(22, 22, 200 * healthPercent, 20, 3);

        // Health text
        this.healthBar.fillStyle(0xffffff, 1);

        // Energy Bar
        this.energyBar.clear();

        // Background
        this.energyBar.fillStyle(0x000000, 0.8);
        this.energyBar.fillRoundedRect(20, 50, 154, 16, 4);

        // Energy fill
        const energyPercent = this.stats.currentEnergy / this.stats.maxEnergy;
        this.energyBar.fillStyle(0x00aaff, 1);
        this.energyBar.fillRoundedRect(22, 52, 150 * energyPercent, 12, 3);
    }

    update(): void {
        if (!this.active) return;

        const body = this.body as Phaser.Physics.Arcade.Body;

        // Don't move during attack or dodge animation
        if (this.isAttacking || this.isDodging) {
            return;
        }

        // Reset velocity
        body.setVelocity(0);

        let vx = 0;
        let vy = 0;

        // Handle horizontal movement
        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
            vx = -this.stats.speed;
            this.currentDirection = 'left';
            this.setFlipX(true);
        } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
            vx = this.stats.speed;
            this.currentDirection = 'right';
            this.setFlipX(false);
        }

        // Handle vertical movement
        if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
            vy = -this.stats.speed;
            this.currentDirection = 'up';
        } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
            vy = this.stats.speed;
            this.currentDirection = 'down';
        }

        // Apply velocity
        body.setVelocity(vx, vy);

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            body.velocity.normalize().scale(this.stats.speed);
        }

        // Walking animation effect
        if (vx !== 0 || vy !== 0) {
            // Bobbing effect while walking
            const bobAmount = Math.sin(this.scene.time.now * 0.015) * 2;
            this.setOrigin(0.5, 0.5 + bobAmount * 0.01);
        } else {
            this.setOrigin(0.5, 0.5);
        }

        // Handle attack
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.attack();
        }

        // Handle dodge
        if (Phaser.Input.Keyboard.JustDown(this.dodgeKey)) {
            this.dodge();
        }

        // Regenerate energy
        if (this.stats.currentEnergy < this.stats.maxEnergy) {
            this.stats.currentEnergy = Math.min(
                this.stats.maxEnergy,
                this.stats.currentEnergy + 0.1
            );
            this.updateUI();
        }

        // 2.5D DEPTH SORTING
        this.setDepth(1000 + this.y);

        // Update attack hitbox position
        this.updateAttackHitboxPosition();
    }

    private updateAttackHitboxPosition(): void {
        const offsets = {
            'down': { x: 0, y: 40 },
            'up': { x: 0, y: -40 },
            'left': { x: -40, y: 0 },
            'right': { x: 40, y: 0 }
        };

        const offset = offsets[this.currentDirection];
        this.attackHitbox.setPosition(this.x + offset.x, this.y + offset.y);
    }

    private attack(): void {
        const now = this.scene.time.now;

        // Check cooldown
        if (now - this.lastAttackTime < this.attackCooldown) return;

        // Check energy
        if (this.stats.currentEnergy < 10) return;

        this.lastAttackTime = now;
        this.isAttacking = true;
        this.stats.currentEnergy -= 10;
        this.updateUI();

        // Enable attack hitbox
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = true;

        // Attack animation - lunge forward
        const lungeDistance = 20;
        const lungeOffsets = {
            'down': { x: 0, y: lungeDistance },
            'up': { x: 0, y: -lungeDistance },
            'left': { x: -lungeDistance, y: 0 },
            'right': { x: lungeDistance, y: 0 }
        };

        const offset = lungeOffsets[this.currentDirection];

        // Visual feedback
        this.setTint(0xffaa00);

        this.scene.tweens.add({
            targets: this,
            x: this.x + offset.x,
            y: this.y + offset.y,
            duration: 100,
            yoyo: true,
            ease: 'Power2',
            onComplete: () => {
                this.isAttacking = false;
                this.clearTint();
                (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
            }
        });

        // Screen shake for impact
        this.scene.cameras.main.shake(50, 0.003);

        // Emit attack event
        this.scene.events.emit('playerAttack', this.attackHitbox, this.stats.attackPower);
    }

    private dodge(): void {
        const now = this.scene.time.now;

        // Check cooldown
        if (now - this.lastDodgeTime < this.dodgeCooldown) return;

        // Check energy
        if (this.stats.currentEnergy < 20) return;

        this.lastDodgeTime = now;
        this.isDodging = true;
        this.isInvulnerable = true;
        this.stats.currentEnergy -= 20;
        this.updateUI();

        // Dodge in current direction
        const dodgeDistance = 100;
        const body = this.body as Phaser.Physics.Arcade.Body;

        const dodgeOffsets = {
            'down': { x: 0, y: dodgeDistance },
            'up': { x: 0, y: -dodgeDistance },
            'left': { x: -dodgeDistance, y: 0 },
            'right': { x: dodgeDistance, y: 0 }
        };

        const offset = dodgeOffsets[this.currentDirection];

        // Visual feedback - ghost effect
        this.setAlpha(0.5);
        this.setTint(0x00ffff);

        this.scene.tweens.add({
            targets: this,
            x: this.x + offset.x,
            y: this.y + offset.y,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.isDodging = false;
                this.isInvulnerable = false;
                this.setAlpha(1);
                this.clearTint();
            }
        });
    }

    takeDamage(amount: number): void {
        if (this.isInvulnerable) return;

        const actualDamage = Math.max(0, amount - this.stats.defense);
        this.stats.currentHealth -= actualDamage;

        if (this.stats.currentHealth < 0) {
            this.stats.currentHealth = 0;
        }

        this.updateUI();

        // Visual feedback
        this.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });

        // Invulnerability frames
        this.isInvulnerable = true;
        this.scene.time.delayedCall(500, () => {
            this.isInvulnerable = false;
        });

        // Screen shake
        this.scene.cameras.main.shake(100, 0.01);

        // Check death
        if (this.stats.currentHealth <= 0) {
            this.scene.events.emit('playerDeath');
        }
    }

    heal(amount: number): void {
        this.stats.currentHealth = Math.min(
            this.stats.maxHealth,
            this.stats.currentHealth + amount
        );
        this.updateUI();

        // Visual feedback
        this.setTint(0x00ff00);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
    }

    restoreEnergy(amount: number): void {
        this.stats.currentEnergy = Math.min(
            this.stats.maxEnergy,
            this.stats.currentEnergy + amount
        );
        this.updateUI();
    }

    getStats(): PlayerStats {
        return { ...this.stats };
    }

    getAttackHitbox(): Phaser.GameObjects.Zone {
        return this.attackHitbox;
    }

    isDoingAttack(): boolean {
        return this.isAttacking;
    }

    resetPosition(x: number, y: number): void {
        this.setPosition(x, y);
        this.stats.currentHealth = this.stats.maxHealth;
        this.stats.currentEnergy = this.stats.maxEnergy;
        this.updateUI();
    }
}