// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Asset loading
const playerImage = new Image();
playerImage.src = 'assets/player.png';
const enemyImage = new Image();
enemyImage.src = 'assets/enemy.png';
const bulletImage = new Image();
bulletImage.src = 'assets/bullet.png';
const backgroundImage = new Image();
backgroundImage.src = 'assets/background.png';

// Game Variables
let player = {
    x: 50,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    health: 100,
    maxHealth: 100,
    shootingPower: 10,
    speed: 5
};

let bullets = [];
let enemies = [];
let enemySpawnInterval = 2000; // milliseconds
let lastEnemySpawnTime = 0;

// Initialize enemies
function createEnemy() {
    enemies.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - 50),
        width: 40,
        height: 40,
        health: 20,
        speed: 2,
        attackPower: 5,
        lastAttackTime: 0,
        attackCooldown: 1000 // 1 second cooldown between attacks
    });
}

// Game Loop
function gameLoop(timestamp) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    
    handlePlayerMovement();
    updateAndDrawBullets();
    updateAndDrawEnemies(timestamp);
    drawPlayer();
    drawHealthBar();
    
    // Spawn enemies
    if (timestamp - lastEnemySpawnTime > enemySpawnInterval) {
        createEnemy();
        lastEnemySpawnTime = timestamp;
    }
    
    requestAnimationFrame(gameLoop);
}

// Handle Player Movement
function handlePlayerMovement() {
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
}

// Draw Player
function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

// Update and draw bullets
function updateAndDrawBullets() {
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        ctx.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
        
        // Remove bullet if it goes off screen
        if (bullet.x > canvas.width) {
            bullets.splice(index, 1);
        }
        
        // Check for collision with enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (collision(bullet, enemy)) {
                enemy.health -= player.shootingPower;
                bullets.splice(index, 1);
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                }
            }
        });
    });
}

// Update and draw enemies
function updateAndDrawEnemies(timestamp) {
    enemies.forEach((enemy, index) => {
        enemy.x -= enemy.speed;
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Enemy attack
        if (timestamp - enemy.lastAttackTime > enemy.attackCooldown) {
            if (collision(player, enemy)) {
                player.health -= enemy.attackPower;
                enemy.lastAttackTime = timestamp;
                if (player.health <= 0) {
                    console.log("Game Over!");
                    // Implement game over logic here
                }
            }
        }
        
        // Remove enemy if it goes off screen
        if (enemy.x + enemy.width < 0) {
            enemies.splice(index, 1);
        }
    });
}

// Collision detection
function collision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Draw health bar
function drawHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 10;
    const y = canvas.height - barHeight - 10;
    
    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    const healthWidth = (player.health / player.maxHealth) * barWidth;
    ctx.fillStyle = 'green';
    ctx.fillRect(x, y, healthWidth, barHeight);
    
    ctx.strokeStyle = 'white';
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, x + 5, y + 15);
}

// Shoot bullet
function shoot() {
    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 5,
        width: 10,
        height: 5,
        speed: 10,
    });
}

// Key state
let keys = {};

// Event listeners
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    if (event.code === 'Space') {
        shoot();
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Image loading function
function loadImage(img) {
    return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

// Wait for images to load before starting the game
Promise.all([
    loadImage(playerImage),
    loadImage(enemyImage),
    loadImage(bulletImage),
    loadImage(backgroundImage)
]).then(() => {
    // Start the game loop once all images are loaded
    requestAnimationFrame(gameLoop);
}).catch(error => {
    console.error("Error loading images:", error);
});