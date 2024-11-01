const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const assets = {
    player: 'assets/player.png',
    enemy: 'assets/enemy.png',
    bullet: 'assets/bullet.png',
    bomb: 'assets/bomb.png',
    background: 'assets/background.png',
    stars: 'assets/stars.png'
};

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

let loadedAssets = {};
Promise.all(Object.entries(assets).map(([key, src]) => loadImage(src).then(img => [key, img])))
    .then(Object.fromEntries)
    .then(loaded => {
        loadedAssets = loaded;
        gameLoop(0);
    })
    .catch(error => console.error('Failed to load assets:', error));

let player = {
    x: 100,
    y: canvas.height / 2,
    width: 80,
    height: 80,
    health: 100,
    maxHealth: 100,
    shootingPower: 15,
    speed: 8,
    hasBomb: true
};

let gameState = {
    bullets: [],
    enemies: [],
    powerUps: [],
    enemySpawnInterval: 1500,
    lastEnemySpawnTime: 0,
    score: 0,
    isGameOver: false,
    isPaused: false
};

const BULLET_CONFIG = {
    width: 20,
    height: 10,
    speed: 15,
    color: '#ff0000',
    glowColor: '#ff6666'
};

let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    b: false
};

window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        if (e.key === 'Space') {
            e.preventDefault();
        }
    }
    if (e.key === 'p') togglePause();
    if (e.key === 'r' && gameState.isGameOver) restartGame();
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

function createEnemy() {
    return {
        x: canvas.width,
        y: Math.random() * (canvas.height - 80),
        width: 60,
        height: 60,
        health: 30,
        speed: 2 + Math.random() * 2,
        attackPower: 10
    };
}

function gameLoop(timestamp) {
    if (gameState.isPaused) {
        drawPauseScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawParallaxBackground(timestamp);

    if (!gameState.isGameOver) {
        handlePlayerMovement();
        updateAndDrawBullets();
        updateAndDrawEnemies();
        updateAndDrawPowerUps();
        drawPlayer();
        drawEnhancedHUD();
        spawnEnemies(timestamp);
        spawnPowerUps();
    } else {
        drawGameOverScreen();
    }

    requestAnimationFrame(gameLoop);
}

function drawParallaxBackground(timestamp) {
    const scrollSpeed = 0.5;
    const backgroundPos = -(timestamp * scrollSpeed) % canvas.width;
    ctx.drawImage(loadedAssets.background, backgroundPos, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedAssets.background, backgroundPos + canvas.width, 0, canvas.width, canvas.height);
}

function handlePlayerMovement() {
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.Space) shoot();
    if (keys.b && player.hasBomb) useBomb();
}

function shoot() {
    gameState.bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - BULLET_CONFIG.height / 2,
        width: BULLET_CONFIG.width,
        height: BULLET_CONFIG.height,
        speed: BULLET_CONFIG.speed,
        color: BULLET_CONFIG.color,
        glowColor: BULLET_CONFIG.glowColor
    });
}

function useBomb() {
    player.hasBomb = false;
    gameState.enemies = [];
}

function updateAndDrawBullets() {
    gameState.bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.glowColor;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.restore();

        if (bullet.x > canvas.width) {
            gameState.bullets.splice(index, 1);
        }

        gameState.enemies.forEach((enemy, enemyIndex) => {
            if (collision(bullet, enemy)) {
                enemy.health -= player.shootingPower;
                gameState.bullets.splice(index, 1);
                if (enemy.health <= 0) {
                    gameState.enemies.splice(enemyIndex, 1);
                    gameState.score += 10;
                }
            }
        });
    });
}

function updateAndDrawEnemies() {
    gameState.enemies.forEach((enemy, index) => {
        enemy.x -= enemy.speed;
        ctx.drawImage(loadedAssets.enemy, enemy.x, enemy.y, enemy.width, enemy.height);

        if (enemy.x + enemy.width < 0) {
            gameState.enemies.splice(index, 1);
        }
    });
}

function updateAndDrawPowerUps() {
    gameState.powerUps.forEach((powerUp, index) => {
        powerUp.x -= powerUp.speed;
        ctx.fillStyle = powerUp.type === 'heal' ? 'green' : 'blue';
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);

        if (collision(player, powerUp)) {
            if (powerUp.type === 'heal') {
                player.health = Math.min(player.maxHealth, player.health + 20);
            }
            gameState.powerUps.splice(index, 1);
        }

        if (powerUp.x + powerUp.width < 0) {
            gameState.powerUps.splice(index, 1);
        }
    });
}

function spawnEnemies(timestamp) {
    if (timestamp - gameState.lastEnemySpawnTime > gameState.enemySpawnInterval) {
        gameState.enemies.push(createEnemy());
        gameState.lastEnemySpawnTime = timestamp;
    }
}

function spawnPowerUps() {
    if (Math.random() < 0.01) {
        gameState.powerUps.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 30),
            width: 30,
            height: 30,
            type: 'heal',
            speed: 2
        });
    }
}

function drawEnhancedHUD() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${gameState.score}`, 10, 10);
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 10, 40);
    ctx.fillText(`Bomb: ${player.hasBomb ? 'Available' : 'Used'}`, 10, 70);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '24px Arial';
    ctx.fillText('Press "R" to Restart', canvas.width / 2, canvas.height / 2 + 20);
}

function collision(obj1, obj2) {
    return !(
        obj1.x + obj1.width < obj2.x ||
        obj1.x > obj2.x + obj2.width ||
        obj1.y + obj1.height < obj2.y ||
        obj1.y > obj2.y + obj2.height
    );
}

function restartGame() {
    player.health = player.maxHealth;
    player.hasBomb = true;
    gameState.score = 0;
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.powerUps = [];
    gameState.isGameOver = false;
    gameState.isPaused = false;
}
