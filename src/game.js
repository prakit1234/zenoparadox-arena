const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to full screen and resize on window change
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Asset loading for better quality images
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

// Load all assets and start the game
let loadedAssets = {};
Promise.all(Object.entries(assets).map(([key, src]) => loadImage(src).then(img => [key, img])))
    .then(Object.fromEntries)
    .then(loaded => {
        loadedAssets = loaded;
        console.log('Assets loaded successfully');
        gameLoop(0); // Start the game loop
    })
    .catch(error => console.error('Failed to load assets:', error));

// Game Variables
let player = {
    x: 100,
    y: canvas.height / 2,
    width: 80,
    height: 80,
    health: 100,
    maxHealth: 100,
    speed: 8,
    shootingPower: 15,
    isInvulnerable: false,
    invulnerabilityDuration: 1000
};

let gameState = {
    bullets: [],
    enemies: [],
    powerUps: [],
    bombs: [],
    score: 0,
    enemySpawnInterval: 1500,
    lastEnemySpawnTime: 0,
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
    b: false
};

// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        if (e.key === 'Space' || e.key === 'b') {
            e.preventDefault();
        }
    }
    if (e.key === 'p') togglePause();
    if (e.key === 'r' && gameState.isGameOver) restartGame();
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// Game loop
function gameLoop(timestamp) {
    console.log('Game loop running');
    
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
        updateAndDrawBombs();
        drawPlayer();
        drawEnhancedHUD();
        spawnEnemies(timestamp);
        spawnPowerUps(timestamp);

        if (keys.b) {
            activateBomb();
        }

        requestAnimationFrame(gameLoop);
    } else {
        drawGameOverScreen();
        // Keep drawing the game over screen
        requestAnimationFrame(gameLoop);
    }
}

// Parallax background
function drawParallaxBackground(timestamp) {
    const scrollSpeed = 0.5;
    const backgroundPos = -(timestamp * scrollSpeed) % canvas.width;

    ctx.drawImage(loadedAssets.background, backgroundPos, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedAssets.background, backgroundPos + canvas.width, 0, canvas.width, canvas.height);

    // Add star field
    const starScrollSpeed = 1;
    const starPos = -(timestamp * starScrollSpeed) % canvas.width;
    ctx.globalAlpha = 0.5;
    ctx.drawImage(loadedAssets.stars, starPos, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedAssets.stars, starPos + canvas.width, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

// Player movement
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

// Shoot function
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

        // Draw bullet with glow effect
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.glowColor;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.restore();

        // Remove bullet if it goes off screen
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

        // Check collision with player
        if (collision(player, enemy)) {
            player.health -= enemy.attackPower;
            if (player.health <= 0) {
                gameState.isGameOver = true;
            }
        }

        // Remove enemy if off screen
        if (enemy.x + enemy.width < 0) {
            gameState.enemies.splice(index, 1);
        }
    });
}

// Activate bomb
function activateBomb() {
    if (gameState.bombs.length > 0) {
        gameState.enemies = [];
        gameState.bombs.pop(); // Use one bomb
        console.log('Bomb activated');
    }
}

// Enhanced HUD
function drawEnhancedHUD() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${gameState.score}`, 10, 10);
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 10, 40);
}

// Collision detection
function collision(obj1, obj2) {
    return !(obj1.x + obj1.width < obj2.x || obj1.x > obj2.x + obj2.width ||
             obj1.y + obj1.height < obj2.y || obj1.y > obj2.y + obj2.height);
}

// Game over screen
function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

// Pause game
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

// Restart game
function restartGame() {
    player.health = player.maxHealth;
    gameState.score = 0;
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.bombs = [];
    gameState.isGameOver = false;
    gameState.isPaused = false;
    console.log('Game restarted');
}
