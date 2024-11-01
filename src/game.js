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
let lastTime = 0;
let accumulator = 0;
const FIXED_TIME_STEP = 1000 / 60; // 60 FPS

// Initialize game state and player
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
    isPaused: false,
    lastShootTime: 0,
    shootCooldown: 250 // 250ms cooldown between shots
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

// Load assets and start game
Promise.all(
    Object.entries(assets).map(([key, src]) => 
        loadImage(src).then(img => [key, img])
    )
)
.then(loadedImages => {
    loadedAssets = Object.fromEntries(loadedImages);
    requestAnimationFrame(gameLoop);
})
.catch(error => console.error('Failed to load assets:', error));

function gameLoop(currentTime) {
    if (!lastTime) lastTime = currentTime;
    
    let deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Prevent spiral of death with max frame time
    if (deltaTime > 1000) deltaTime = FIXED_TIME_STEP;
    
    accumulator += deltaTime;

    // Update game state at a fixed time step
    while (accumulator >= FIXED_TIME_STEP) {
        update(FIXED_TIME_STEP);
        accumulator -= FIXED_TIME_STEP;
    }

    // Render at whatever frame rate the browser provides
    render();

    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (gameState.isPaused || gameState.isGameOver) return;

    handlePlayerMovement();
    updateBullets();
    updateEnemies();
    updatePowerUps();
    checkCollisions();
    spawnEnemies(performance.now());
    
    // Check game over condition
    if (player.health <= 0) {
        gameState.isGameOver = true;
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawParallaxBackground(performance.now());
    
    if (!gameState.isGameOver) {
        // Draw game elements
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawPowerUps();
        drawEnhancedHUD();
    } else {
        drawGameOverScreen();
    }
    
    if (gameState.isPaused) {
        drawPauseScreen();
    }
}

function handlePlayerMovement() {
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    
    // Handle shooting with cooldown
    if (keys.Space && performance.now() - gameState.last ShootTime > gameState.shootCooldown) {
        shoot();
        gameState.lastShootTime = performance.now();
    }
    
    if (keys.b && player.hasBomb) useBomb();
}

function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.x += bullet.speed;
        return bullet.x < canvas.width;
    });
}

function updateEnemies() {
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.x -= enemy.speed;
        
        // Check collision with player
        if (collision(enemy, player)) {
            player.health -= enemy.attackPower;
            return false;
        }
        
        return enemy.x + enemy.width > 0;
    });
}

function updatePowerUps() {
    gameState.powerUps = gameState.powerUps.filter(powerUp => {
        powerUp.x -= powerUp.speed;
        
        if (collision(powerUp, player)) {
            if (powerUp.type === 'heal') {
                player.health = Math.min(player.maxHealth, player.health + 20);
            }
            return false;
        }
        
        return powerUp.x + powerUp.width > 0;
    });
}

function drawPlayer() {
    if (loadedAssets.player) {
        ctx.drawImage(loadedAssets.player, player.x, player.y, player.width, player.height);
    }
}

function drawBullets() {
    gameState.bullets.forEach(bullet => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.glowColor;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.restore();
    });
}

function drawEnemies() {
    gameState.enemies.forEach(enemy => {
        if (loadedAssets.enemy) {
            ctx.drawImage(loadedAssets.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });
}

function drawParallaxBackground(time) {
    // Draw background layers
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Stars', canvas.width / 2, canvas.height / 2);
}

function drawGameOverScreen() {
    ctx.fillStyle = '#fff';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

function drawPauseScreen() {
    ctx.fillStyle = '#fff';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
}

function drawEnhancedHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Health: ${player.health}`, 10, 10);
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
}

function shoot() {
    const bullet = {
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: BULLET_CONFIG.width,
        height: BULLET_CONFIG.height,
        speed: BULLET_CONFIG.speed,
        color: BULLET_CONFIG.color,
        glowColor: BULLET_CONFIG.glowColor
    };
    gameState.bullets.push(bullet);
}

function useBomb() {
    // Implement bomb logic here
    console.log('Bomb used!');
}

function spawnEnemies(time) {
    if (time - gameState.lastEnemySpawnTime > gameState.enemySpawnInterval) {
        const enemy = {
            x: canvas.width,
            y: Math.random() * (canvas.height - 50),
            width: 50,
            height: 50,
            speed: 5,
            attackPower: 10
        };
        gameState.enemies.push(enemy);
        gameState.lastEnemySpawnTime = time;
    }
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

function restartGame() {
    // Reset game state
    player = {
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
    gameState = {
        bullets: [],
        enemies: [],
        powerUps: [],
        enemySpawnInterval: 1500,
        lastEnemySpawnTime: 0,
        score: 0,
        isGameOver: false,
        isPaused: false,
        lastShootTime: 0,
        shootCooldown:  250
    };
    lastTime = 0;
    accumulator = 0;
    requestAnimationFrame(gameLoop);
}

function collision(obj1, obj2) {
    return !(
        obj1.x + obj1.width < obj2.x ||
        obj1.x > obj2.x + obj2.width ||
        obj1.y + obj1.height < obj2.y ||
        obj1.y > obj2.y + obj2.height
    );
}

// Add event listeners
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
