class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('background', 'assets/background.png');
    }

    create() {
        this.add.image(400, 300, 'background');

        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);

        // Initialize health
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;

        // Create health bar graphics
        this.healthBar = this.add.graphics();
        this.drawHealthBar();

        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown_SPACE', this.shootBullet, this);

        // Example: Simulate taking damage
        this.time.addEvent({
            delay: 2000,
            callback: this.takeDamage,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        this.handlePlayerMovement();
        this.updateHealthBar();
    }

    handlePlayerMovement() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-160);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(160);
        } else {
            this.player.setVelocityY(0);
        }
    }

    shootBullet() {
        const bullet = this.bullets.get(this.player.x, this.player.y);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.velocity.x = 400; // Set bullet speed
        }
    }

    drawHealthBar() {
        this.healthBar.clear();
        this.healthBar.fillStyle(0xff0000, 1); // Red color for the health bar background
        this.healthBar.fillRect(10, 10, 200, 20); // Draw the background

        this.healthBar.fillStyle(0x00ff00, 1); // Green color for the health bar foreground
        const healthWidth = (this.currentHealth / this.maxHealth) * 200; // Calculate health width
        this.healthBar.fillRect(10, 10, healthWidth, 20); // Draw the foreground
    }

    updateHealthBar() {
        this.drawHealthBar(); // Redraw the health bar every update
    }

    takeDamage() {
        if (this.currentHealth > 0) {
            this.currentHealth -= 10; // Decrease health by 10
            if (this.currentHealth < 0) {
                this.currentHealth = 0; // Ensure health doesn't go below 0
            }
        }
    }
}

// Initialize the game scene
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: GameScene
};

const game = new Phaser.Game(config);