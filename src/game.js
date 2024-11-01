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

// Enhanced game variables
let player = {
    x: 100,
    y: canvas.height / 2,
    width: 80,
    height: 80,
    health: 100,
    maxHealth: 100,
    speed: 8,
    isInvulnerable: false,
    invulnerabilityDuration: 1000
};

let gameState = {
    bullets: [],
    enemies: [],
    powerUps: [],
    bombActive: false,
    lastEnemySpawnTime: 0,
    score: 0,
    isGameOver: false,
    isPaused: false,
    enemySpawnInterval: 1500 // Spawn interval in milliseconds
};

// Key tracking for controls
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    b: false
};

window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === 'p') togglePause();
    if (e.key === 'r' && gameState.isGameOver) restartGame();
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// Draw parallax background with stars
function drawParallaxBackground(timestamp) {
    const scrollSpeed = 0.5;
    const backgroundPos = -(timestamp * scrollSpeed) % canvas.width;
    
    ctx.drawImage(loadedAssets.background, backgroundPos, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedAssets.background, backgroundPos + canvas.width, 0, canvas.width, canvas.height);

    // Draw stars with transparency for visibility
    ctx.globalAlpha = 0.5;
    const starScrollSpeed = 1;
    const starPos = -(timestamp * starScrollSpeed) % canvas.width;
    ctx.drawImage(loadedAssets.stars, starPos, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedAssets.stars, starPos + canvas.width, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

// Handle player movement
function handlePlayerMovement() {
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.Space) shoot();
}

// Draw the player on the canvas
function drawPlayer() {
    ctx.drawImage(loadedAssets.player, player.x, player.y, player.width, player.height);
}

// Shoot function for firing bullets
function shoot() {
    gameState.bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 5,
        width: 20,
        height: 10,
        speed: 15
    });
}

// Update and draw bullets
function updateAndDrawBullets() {
    gameState.bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Remove bullet if it goes off-screen
        if (bullet.x > canvas.width) {
            gameState.bullets.splice(index, 1);
        }
    });
}

// Create and draw enemies with proper spawning
function createEnemy() {
    return {
        x: canvas.width,
        y: Math.random() * (canvas.height - 80),
        width: 80,
        height: 80,
        speed: 3 + Math.random() * 2,
        health: 50
    };
}

function updateAndDrawEnemies(timestamp) {
    gameState.enemies.forEach((enemy, index) => {
        enemy.x -= enemy.speed;
        ctx.drawImage(loadedAssets.enemy, enemy.x, enemy.y, enemy.width, enemy.height);

        if (enemy.x + enemy.width < 0) {
            gameState.enemies.splice(index, 1);
        }

        if (collision(player, enemy)) {
            player.health -= 10;
            if (player.health <= 0) {
                gameState.isGameOver = true;
            }
        }
    });
}

function spawnEnemies(timestamp) {
    if (timestamp - gameState.lastEnemySpawnTime > gameState.enemySpawnInterval) {
        gameState.enemies.push(createEnemy());
        gameState.lastEnemySpawnTime = timestamp;
    }
}

// Draw the enhanced HUD
function drawEnhancedHUD() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${gameState.score}`, 10, 10);
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 10, 40);
}

// Game loop function
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
        updateAndDrawEnemies(timestamp);
        drawPlayer();
        drawEnhancedHUD();
        spawnEnemies(timestamp);
    } else {
        drawGameOverScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Pause and game over screens
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
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

// Toggle pause function
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

// Restart the game function
function restartGame() {
    player.health = player.maxHealth;
    gameState.score = 0;
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.isGameOver = false;
    gameState.isPaused = false;
}
