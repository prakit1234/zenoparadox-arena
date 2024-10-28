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
    player: loadImage('assets/player.png', 2048), // Using higher resolution images
    enemy: loadImage('assets/enemy.png', 2048),
    bullet: loadImage('assets/bullet.png', 1024),
    bomb: loadImage('assets/bomb.png', 1024),
    background: loadImage('assets/background.png', 4096)
};

function loadImage(src, size) {
    const img = new Image();
    img.src = src;
    img.width = size;
    img.height = size;
    return img;
}

// Enhanced Game Variables
let player = {
    x: 100,
    y: canvas.height / 2,
    width: 80,  // Increased size
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
    width: 40,  // Larger bullets
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
            e.preventDefault(); // Prevent page scrolling
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
    
    ctx.drawImage(assets.background, backgroundPos, 0, canvas.width, canvas.height);
    ctx.drawImage(assets.background, backgroundPos + canvas.width, 0, canvas.width, canvas.height);
}

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

gameLoop(0);