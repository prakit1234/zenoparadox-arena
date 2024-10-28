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
const bombImage = new Image(); // Add bomb image
bombImage.src = 'assets/bomb.png';
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
let score = 0;
let hasBomb = false;

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
    drawScore();
    checkBombAvailability();
    
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
                    score += 10; // Increase score when enemy is defeated
                }
            }
        });
        
        // Check for collision with player for enemy bullets
        if (bullet.isEnemyBullet && collision(bullet, player)) {
            player.health -= 10; // Player takes damage from enemy bullets
            bullets.splice(index, 1);
            if (player.health <= 0) {
                gameOver();
            }
        }
    });
}

// Update and draw enemies
function updateAndDrawEnemies(timestamp) {
    enemies.forEach((enemy, index) => {
        enemy.x -= enemy.speed;
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Highlight effect
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Enemy attack
        if (timestamp - enemy.lastAttackTime > enemy.attackCooldown) {
            if (collision(player, enemy)) {
                player.health -= enemy.attackPower;
                enemy.lastAttackTime = timestamp;
                if (player.health <= 0) {
                    gameOver();
                }
            }
        }

        // Enemy shooting
        if (Math.random() < 0.01) { // 1% chance to shoot each frame
            enemyShoot(enemy);
        }
        
        // Remove enemy if it goes off screen
        if (enemy.x + enemy.width < 0) {
            enemies.splice(index, 1);
        }
    });
}

// Enemy shooting function
function enemyShoot(enemy) {
    bullets.push({
        x: enemy.x,
        y: enemy.y + enemy.height / 2,
        width: 10,
        height: 5,
        speed: -5,
        isEnemyBullet: true
    });
}

// Shoot function
function shoot() {
    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 7.5,
        width: 20,
        height: 15,
        speed: 10,
        isEnemyBullet: false
    });
}

// Draw health bar
function drawHealthBar() {
    ctx.fillStyle = 'green';
    ctx.fillRect(10, 10, player.health / player.maxHealth * 100, 20);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(10, 10, 100, 20);
}

// Draw score
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

// Check bomb availability
function checkBombAvailability() {
    if (score >= 100 && !hasBomb) {
        hasBomb = true;
        // Display bomb icon or notification
        ctx.drawImage(bombImage, canvas.width - 50, 10, 40, 40);
    }
}

// Game over function
function gameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.fillText('You Lose!', canvas.width / 2 - 100, canvas.height / 2);
    // Stop the game loop or restart the game
}

// Collision detection
function collision(obj1, obj2) {
    if (obj1.x + obj1.width > obj2.x &&
        obj1.x < obj2.x + obj2.width &&
        obj1.y + obj1.height > obj2.y &&
        obj1.y < obj2.y + obj2.height) {
        return true;
    }
    return false;
}

// Initialize game
gameLoop(0);
