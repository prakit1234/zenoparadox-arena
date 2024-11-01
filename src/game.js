// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Enhanced asset loading
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

// Load all assets
let loadedAssets = {};
Promise.all(Object.entries(assets).map(([key, src]) => loadImage(src).then(img => [key, img])))
    .then(Object.fromEntries)
    .then(loaded => {
        loadedAssets = loaded;
        gameLoop(0);
    })
    .catch(error => console.error('Failed to load assets:', error));

// Game variables
let player = {
    x: 100,
    y: canvas.height / 2,
    width: 80,
    height: 80,
    health: 100,
    maxHealth: 100,
    shootingPower: 15,
    speed: 8,
    isInvulnerable: false,
    invulnerabilityDuration: 1000
};

let gameState = {
    bullets: [],
    enemies: [],
    bombs: [],
    powerUps: [],
    enemySpawnInterval: 1500,
    lastEnemySpawnTime: 0,
    score: 0,
    hasBomb: true,
    isGameOver: false,
    isPaused: false
};

// Bullet properties
const BULLET_CONFIG = {
    width: 20,
    height: 10,
    speed: 15,
    color: '#ff0000',
    glowColor: '#ff6666'
};

// Key tracking
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    b: false  // Key for bomb
};

// Event listeners for controls
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

// Enemy creation function
function createEnemy() {
    return {
        x: canvas.width,
        y: Math.random() * (canvas.height - 80),
        width: 60,
        height: 60,
        health: 30,
        speed: 2 + Math.random() * 2,
        attackPower: 10,
        lastAttackTime: 0,
        attackCooldown: 800
    };
}

// Game loop with visibility highlights for health
function gameLoop(timestamp) {
    if (gameState.isPaused) {
        drawPauseScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (!gameState.isGameOver) {
        handlePlayerMovement();
        updateAndDrawBullets();
        updateAndDrawEnemies(timestamp);
        updateAndDrawBombs();
        drawPlayer();
        drawHUD();
        spawnEnemies(timestamp);
        handleBombActivation();
        
        // Highlight: Player health checks and damage handling
        gameState.enemies.forEach((enemy, index) => {
            if (collision(player, enemy)) {
                player.health -= enemy.attackPower;  // Health reduction
                gameState.enemies.splice(index, 1);
                if (player.health <= 0) {
                    gameState.isGameOver = true;  // Trigger game over
                }
            }
        });
    } else {
        drawGameOverScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Handle player movement
function handlePlayerMovement() {
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.Space) shoot();
}

// Draw player
function drawPlayer() {
    ctx.drawImage(loadedAssets.player, player.x, player.y, player.width, player.height);
}

// Handle shooting
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

// Update and draw bullets
function updateAndDrawBullets() {
    gameState.bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.glowColor;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.restore();

        // Remove bullets off-screen
        if (bullet.x > canvas.width) {
            gameState.bullets.splice(index, 1);
        }

        // Collision with enemies
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

// Update and draw enemies
function updateAndDrawEnemies(timestamp) {
    gameState.enemies.forEach((enemy, index) => {
        enemy.x -= enemy.speed;
        ctx.drawImage(loadedAssets.enemy, enemy.x, enemy.y, enemy.width, enemy.height);

        // Remove enemies off-screen
        if (enemy.x + enemy.width < 0) {
            gameState.enemies.splice(index, 1);
        }
    });
}

// Handle bomb activation
function handleBombActivation() {
    if (keys.b && gameState.hasBomb) {
        // Bomb logic to clear enemies or deal damage
        gameState.enemies = [];
        gameState.hasBomb = false;  // Use bomb once
    }
}

// Draw bombs
function updateAndDrawBombs() {
    if (gameState.hasBomb) {
        // Visual representation of the bomb icon or status
        ctx.fillStyle = 'yellow';
        ctx.font = '20px Arial';
        ctx.fillText('Bomb Ready (Press B)', 10, 70);
    }
}

// Draw HUD
function drawHUD() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 10, 10);
    // Highlight: Display health for visibility
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 10, 40);
}

// Draw game over screen
function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 50);
}

// Pause and restart functions
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

function restartGame() {
    player.health = player.maxHealth;
    gameState.score = 0;
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.bombs = [];
    gameState.isGameOver = false;
    gameState.isPaused = false;
}

// Background drawing function
function drawBackground() {
    ctx.drawImage(loadedAssets.background, 0, 0, canvas.width, canvas.height);
}

// Collision detection
function collision(obj1, obj2) {
    return !(
        obj1.x + obj1.width < obj2.x ||
        obj1.x > obj2.x + obj2.width ||
        obj1.y + obj1.height < obj2.y ||
        obj1.y > obj2.y + obj2.height
    );
}
