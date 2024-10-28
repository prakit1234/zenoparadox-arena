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
    background: 'assets/background.png'
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
    enemySpawnInterval: 1500,
    lastEnemySpawnTime: 0,
    score: 0,
    hasBomb: false,
    isGameOver: false,
    isPaused: false
};

// Enhanced bullet properties
const BULLET_CONFIG = {
    width: 40,
    height: 25,
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
        drawPlayer();
        drawEnhancedHUD();
        spawnEnemies(timestamp);
    }

    requestAnimationFrame(gameLoop);
}

// Enhanced visual effects
function drawParallaxBackground(timestamp) {
    const scrollSpeed = 2;
    const backgroundPos = -(timestamp * scrollSpeed) % canvas.width;
    
    ctx.drawImage(loadedAssets.background, backgroundPos, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedAssets.background, backgroundPos + canvas.width, 0, canvas.width, canvas.height);
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
        if (collision(player, enemy) && timestamp - enemy.lastAttackTime > enemy.attackCooldown) {
            player.health -= enemy.attackPower;
            enemy.lastAttackTime = timestamp;
            if (player.health <= 0) {
                gameOver();
            }
        }

        // Remove enemy if it goes off screen
        if (enemy.x + enemy.width < 0) {
            gameState.enemies.splice(index, 1);
        }
    });
}

// Spawn enemies
function spawnEnemies(timestamp) {
    if (timestamp - gameState.lastEnemySpawnTime > gameState.enemySpawnInterval) {
        gameState.enemies.push(createEnemy());
        gameState.lastEnemySpawnTime = timestamp;
    } }

// Enhanced HUD
function drawEnhancedHUD() {
    // Health bar with gradient and glow
    const healthBarWidth = 300;
    const healthBarHeight = 30;
    const healthPercentage = player.health / player.maxHealth;
    
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
    
    const gradient = ctx.createLinearGradient(10, 10, healthBarWidth, healthBarHeight);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#66ff66');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(10, 10, healthBarWidth * healthPercentage, healthBarHeight);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, healthBarWidth, healthBarHeight);
    
    // Score display with glow
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ff00';
    ctx.fillText(`Score: ${gameState.score}`, 10, 70);
    
    ctx.restore();
}

// Enhanced game over screen
function gameOver() {
    gameState.isGameOver = true;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 40px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
    `;
    
    const gameOverText = document.createElement('h1');
    gameOverText.textContent = 'Game Over!';
    gameOverText.style.color = '#ff0000';
    
    const scoreText = document.createElement('p');
    scoreText.textContent = `Final Score: ${gameState.score}`;
    scoreText.style.color = '#ffffff';
    
    const restartButton = createButton('Restart Game', restartGame);
    const reportButton = createButton('Report Bug', reportBug);
    
    modal.appendChild(gameOverText);
    modal.appendChild(scoreText);
    modal.appendChild(restartButton);
    modal.appendChild(reportButton);
    
    document.body.appendChild(modal);
}

function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
        background: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 4px;
        transition: 0.3s;
    `;
    button.addEventListener('click', onClick);
    button.addEventListener('mouseover', () => button.style.background = '#45a049');
    button.addEventListener('mouseout', () => button.style.background = '#4CAF50');
    return button;
}

function reportBug() {
    window.open('https://github.com/yourusername/yourgame/issues', '_blank');
}

function restartGame() {
    // Reset all game state
    player.health = player.maxHealth;
    gameState = {
        bullets: [],
        enemies: [],
        enemySpawnInterval: 1500,
        lastEnemySpawnTime: 0,
        score: 0,
        hasBomb: false,
        isGameOver: false,
        isPaused: false
    };
    document.body.removeChild(document.querySelector('.modal'));
    gameLoop(0);
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        drawPauseScreen();
    } else {
        gameLoop(0);
    }
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
}

function collision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}
