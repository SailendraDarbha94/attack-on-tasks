import Phaser from 'phaser';

export interface TitanConfig {
    name: string;
    health: number;
    speed: number;
    damage: number;
    scale: number;
    tint?: number;
}

export class Titan extends Phaser.GameObjects.Container {
    private physicsBody!: Phaser.Physics.Arcade.Body;
    public sprite: Phaser.GameObjects.Sprite;
    private healthBar: Phaser.GameObjects.Graphics;
    private healthBarBg: Phaser.GameObjects.Graphics;
    private nameText: Phaser.GameObjects.Text;

    private maxHealth: number;
    private currentHealth: number;
    private speed: number;
    private damage: number;
    private titanName: string;

    private target: Phaser.GameObjects.Sprite | null = null;
    private isAggro: boolean = false;
    private aggroRange: number = 200;
    private attackRange: number = 50;
    private lastAttackTime: number = 0;
    private attackCooldown: number = 1000; // 1 second

    // Animation state
    private direction: 'down' | 'up' | 'left' | 'right' = 'down';
    private isAttacking: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, config: TitanConfig) {
        super(scene, x, y);

        this.titanName = config.name;
        this.maxHealth = config.health;
        this.currentHealth = config.health;
        this.speed = config.speed;
        this.damage = config.damage;

        // Create the titan sprite
        this.sprite = scene.add.sprite(0, 0, 'titan');
        this.sprite.setScale(config.scale);
        if (config.tint) {
            this.sprite.setTint(config.tint);
        }
        this.add(this.sprite);

        // Create name text
        this.nameText = scene.add.text(0, -60, this.titanName, {
            fontSize: '12px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.add(this.nameText);

        // Create health bar background
        this.healthBarBg = scene.add.graphics();
        this.healthBarBg.fillStyle(0x000000, 0.8);
        this.healthBarBg.fillRect(-30, -50, 60, 8);
        this.add(this.healthBarBg);

        // Create health bar
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
        this.add(this.healthBar);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configure physics body
        this.physicsBody = this.body as Phaser.Physics.Arcade.Body;
        this.physicsBody.setSize(40, 60);
        this.physicsBody.setOffset(-20, -30);

        // Random initial movement
        this.startPatrol();
    }

    private updateHealthBar(): void {
        this.healthBar.clear();
        const healthPercent = this.currentHealth / this.maxHealth;
        const barWidth = 56 * healthPercent;

        // Color based on health
        let color = 0x00ff00;
        if (healthPercent < 0.3) {
            color = 0xff0000;
        } else if (healthPercent < 0.6) {
            color = 0xffff00;
        }

        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRect(-28, -48, barWidth, 4);
    }

    private startPatrol(): void {
        // Random patrol movement
        this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            callback: () => {
                if (!this.isAggro && this.active) {
                    const angle = Phaser.Math.Between(0, 360);
                    const vx = Math.cos(Phaser.Math.DegToRad(angle)) * this.speed * 0.3;
                    const vy = Math.sin(Phaser.Math.DegToRad(angle)) * this.speed * 0.3;
                    this.physicsBody.setVelocity(vx, vy);
                    this.updateDirection(vx, vy);

                    // Stop after a bit
                    this.scene.time.delayedCall(1000, () => {
                        if (!this.isAggro && this.active) {
                            this.physicsBody.setVelocity(0, 0);
                        }
                    });

                    this.startPatrol();
                }
            },
            loop: false
        });
    }

    private updateDirection(vx: number, vy: number): void {
        if (Math.abs(vx) > Math.abs(vy)) {
            this.direction = vx > 0 ? 'right' : 'left';
            this.sprite.setFlipX(vx < 0);
        } else if (vy !== 0) {
            this.direction = vy > 0 ? 'down' : 'up';
        }
    }

    setTarget(target: Phaser.GameObjects.Sprite): void {
        this.target = target;
    }

    update(): void {
        if (!this.active || !this.target) return;

        // Update depth for 2.5D effect
        this.setDepth(1000 + this.y);

        // Check distance to target
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        // Aggro behavior
        if (distance < this.aggroRange) {
            this.isAggro = true;

            // Move towards target
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );

            const vx = Math.cos(angle) * this.speed;
            const vy = Math.sin(angle) * this.speed;

            this.physicsBody.setVelocity(vx, vy);
            this.updateDirection(vx, vy);

            // Pulsing effect when aggressive
            const scale = 1 + Math.sin(this.scene.time.now * 0.01) * 0.05;
            this.sprite.setScale(scale);

        } else {
            this.isAggro = false;
        }

        // Attack if in range
        if (distance < this.attackRange) {
            this.attack();
        }
    }

    private attack(): void {
        const now = this.scene.time.now;
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;
        this.isAttacking = true;

        // Attack animation
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.isAttacking = false;
            }
        });

        // Emit attack event
        this.scene.events.emit('titanAttack', this, this.damage);
    }

    takeDamage(amount: number): boolean {
        this.currentHealth -= amount;
        this.updateHealthBar();

        // Flash red
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });

        // Knockback
        if (this.target) {
            const angle = Phaser.Math.Angle.Between(
                this.target.x, this.target.y,
                this.x, this.y
            );
            this.physicsBody.setVelocity(
                Math.cos(angle) * 200,
                Math.sin(angle) * 200
            );
        }

        if (this.currentHealth <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    private die(): void {
        // Death animation
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 500,
            onComplete: () => {
                this.scene.events.emit('titanDefeated', this.titanName);
                this.destroy();
            }
        });
    }

    getHealth(): number {
        return this.currentHealth;
    }

    getName(): string {
        return this.titanName;
    }

    getDamage(): number {
        return this.damage;
    }
}
