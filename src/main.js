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
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('background', 'assets/background.png');
}

let player;
let bullets;
let cursors;

function create() {
    this.add.image(400, 300, 'background');

    player = this.physics.add.sprite(400, 300, 'player');
    player.setCollideWorldBounds(true);

    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 10
    });

    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown_SPACE', shootBullet, this);
}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-160);
    } else if (cursors.down.isDown) {
        player.setVelocityY(160);
    } else {
        player.setVelocityY(0);
    }
}

function shootBullet() {
    const bullet = bullets.get(player.x, player.y);
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.velocity.x = 400; // Set bullet speed
    }
}