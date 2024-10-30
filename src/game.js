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

// Enhanced Asset loading with better quality images
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

// Enhanced Game Variables
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
    powerUps: [],
    enemySpawnInterval: 1500,
    lastEnemySpawnTime: 0,
    score: 0,
    hasBomb: false,
    isGameOver: false,
    isPaused: false
};

// Enhanced bullet properties
const BULLET_CONFIG = {
    width: 20,
    height: 10,
    speed: 15,
    color: '#ff0000',
    glowColor: '#ff6666'
};

// Key tracking with improved responsiveness
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// Enhanced event listeners
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

// Enhanced enemy creation
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
        attackCooldown: 800,
        glowIntensity: 0
    };
}

// Enhanced game loop with smooth animations
function gameLoop(timestamp) {
    if (gameState.isPaused) {
        drawPauseScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Parallax background
    drawParallaxBackground(timestamp);
    
    if (!gameState.isGameOver) {
        handlePlayerMovement();
        updateAndDrawBullets();
        updateAndDrawEnemies(timestamp);
        updateAndDrawPowerUps();
        drawPlayer();
        drawEnhancedHUD();
        spawnEnemies(timestamp);
        spawnPowerUps(timestamp);
    }

    requestAnimationFrame(gameLoop);
}

// Enhanced visual effects
function drawParallaxBackground(timestamp) {
    const scrollSpeed = 0.5;
    const backgroundPos = -(timestamp * scrollSpeed) % canvas.width;
    
    ctx.drawImage(loadedAssets.background, backgroundPos, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedAssets.background, backgroundPos + canvas.width, 0, canvas.width, canvas.height);

    // Add a moving star field
    const starScrollSpeed = 1;
    const starPos = -(timestamp * starScrollSpeed) % canvas.width;
    ctx.globalAlpha = 0.5;
    ctx.drawImage(loadedAssets.stars, starPos, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedAssets.stars, starPos + canvas.width, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

// Handle Player Movement
function handlePlayerMovement() {
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.Space) shoot();
}

// Draw Player
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
        
        // Check for collision with enemies
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
        
        // Enemy attack
        if (collision( loadedAssets.player, enemy)) {
            player.health -= enemy.attackPower;
            if (player.health <= 0) {
                gameState.isGameOver = true;
            }
        }
        
        // Remove enemy if it goes off screen
        if (enemy.x + enemy.width < 0) {
            gameState.enemies.splice(index, 1);
        }
    });
}

// Update and draw power-ups
function updateAndDrawPowerUps() {
    gameState.powerUps.forEach((powerUp, index) => {
        powerUp.x -= powerUp.speed;
        
        // Draw power-up
        ctx.fillStyle = powerUp.type === 'speed' ? 'blue' : 'red';
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
        // Check collision with player
        if (collision(player, powerUp)) {
            if (powerUp.type === 'speed') {
                player.speed *= 1.5;
                setTimeout(() => player.speed /= 1.5, 5000);
            } else {
                player.shootingPower *= 2;
                setTimeout(() => player.shootingPower /= 2, 5000);
            }
            gameState.powerUps.splice(index, 1);
        }
        
        // Remove if off screen
        if (powerUp.x + powerUp.width < 0) {
            gameState.powerUps.splice(index, 1);
        }
    });
}

// Spawn enemies
function spawnEnemies(timestamp) {
    if (timestamp - gameState.lastEnemySpawnTime > gameState.enemySpawnInterval) {
        gameState.enemies.push(createEnemy());
        gameState.lastEnemySpawnTime = timestamp;
    }
}

// Spawn power-ups
function spawnPowerUps(timestamp) {
    if (Math.random() < 0.01) {
        gameState.powerUps.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 30),
            width: 30,
            height: 30,
            type: Math.random() < 0.5 ? 'speed' : 'power',
            speed: 2
        });
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

// Pause and restart functionality
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

function restartGame() {
    player.health = player.maxHealth;
    gameState.score = 0;
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.powerUps = [];
    gameState.isGameOver = false;
    gameState.isPaused = false;
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
}

// Collision detection
function collision(obj1, obj2) {
    if (obj1.x + obj1.width < obj2.x || obj1.x > obj2.x + obj2.width ||
        obj1.y + obj1.height < obj2.y || obj1.y > obj2.y + obj2.height) {
        return false;
    }
    return true;
}
