const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// Game settings
const playerWidth = 50;
const playerHeight = 50;
const playerSpeed = 5;
let playerX = (canvas.width - playerWidth) / 2;
let playerY = canvas.height - playerHeight - 10;
let leftPressed = false;
let rightPressed = false;
let upPressed = false;
let downPressed = false;
let spacePressed = false;

const bulletWidth = 5;
const bulletHeight = 10;
const bulletSpeed = 7;
let bullets = [];

const enemyTypes = [
    { width: 50, height: 50, speed: 4, color: '#f00' },
    { width: 40, height: 40, speed: 5, color: '#0f0' },
    { width: 30, height: 30, speed: 6, color: '#00f' },
    { width: 30, height: 30, speed: 4, color: '#0ff' },
    { width: 30, height: 30, speed: 4, color: '#fded' },
    { width: 30, height: 30, speed: 4, color: '#e5c' }
];
let enemies = [];
let enemySpawnInterval = 2000;
let lastEnemySpawnTime = 0;

const powerUpWidth = 20;
const powerUpHeight = 20;
const powerUpSpeed = 2;
let powerUps = [];
let powerUpSpawnInterval = 10000;
let lastPowerUpSpawnTime = 0;

let score = 0;
let bulletsCaught = 0;
let playerHealth = 20;
let rapidFire = false;
let shield = false;
let currentLevel = 1;
const levelThreshold = 1000;

const shootSound = document.getElementById('shootSound');
const hitSound = document.getElementById('hitSound');
const powerUpSound = document.getElementById('powerUpSound');
const explosionSound = document.getElementById('explosionSound');
const backgroundMusic = document.getElementById('backgroundMusic');

// Background movement
const backgroundSpeed = 1;
let backgroundY = 0;

let startTime;
let elapsedTime = 0;

// Start background music
backgroundMusic.play();

// Player drawing function
function drawPlayer() {
    context.fillStyle = shield ? '#0ff' : '#00f';
    context.fillRect(playerX, playerY, playerWidth, playerHeight);
}

// Bullet drawing function
function drawBullets() {
    context.fillStyle = '#fff';
    bullets.forEach(bullet => {
        context.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
        bullet.y -= bulletSpeed;
    });
    bullets = bullets.filter(bullet => bullet.y > 0);
}

// Enemy drawing function
function drawEnemies() {
    enemies.forEach(enemy => {
        context.fillStyle = enemy.color;
        context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        enemy.y += enemy.speed;
    });
    enemies = enemies.filter(enemy => enemy.y < canvas.height);
}

// Power-up drawing function
function drawPowerUps() {
    context.fillStyle = '#ff0';
    powerUps.forEach(powerUp => {
        context.fillRect(powerUp.x, powerUp.y, powerUpWidth, powerUpHeight);
        powerUp.y += powerUpSpeed;
    });
    powerUps = powerUps.filter(powerUp => powerUp.y < canvas.height);
}

// Explosion drawing function
function drawExplosion(x, y) {
    context.fillStyle = '#ff0';
    context.beginPath();
    context.arc(x, y, 30, 0, Math.PI * 2);
    context.fill();
    explosionSound.play();
}

// Collision detection function
function detectCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bulletWidth > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bulletHeight > enemy.y
            ) {
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                drawExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                hitSound.play();
                score += 10;
                bulletsCaught++;
            }
        });
    });

    enemies.forEach((enemy, enemyIndex) => {
        if (
            playerX < enemy.x + enemy.width &&
            playerX + playerWidth > enemy.x &&
            playerY < enemy.y + enemy.height &&
            playerY + playerHeight > enemy.y
        ) {
            if (!shield) {
                enemies.splice(enemyIndex, 1);
                hitSound.play();
                playerHealth -= 1;
                if (playerHealth <= 0) {
                    gameOver();
                }
            } else {
                shield = false;
                enemies.splice(enemyIndex, 1);
                drawExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                hitSound.play();
            }
        }
    });

    powerUps.forEach((powerUp, powerUpIndex) => {
        if (
            playerX < powerUp.x + powerUpWidth &&
            playerX + playerWidth > powerUp.x &&
            playerY < powerUp.y + powerUpHeight &&
            playerY + playerHeight > powerUp.y
        ) {
            powerUps.splice(powerUpIndex, 1);
            powerUpSound.play();
            const powerUpType = Math.random();
            if (powerUpType < 0.5) {
                rapidFire = true;
                setTimeout(() => rapidFire = false, 5000);
            } else {
                shield = true;
            }
        }
    });
}

// Draw score and health
function drawScoreAndHealth() {
    context.fillStyle = '#fff';
    context.font = '20px Arial';
    context.fillText('Level: ' + currentLevel, 10, 100);
    context.fillText('Score: ' + score, 10, 20);
    context.fillText('Bullets Caught: ' + bulletsCaught, 10, 40);
    context.fillText('Health: ' + playerHealth, 10, 60);
    context.fillText('Time: ' + formatTime(elapsedTime), 10, 80);
}

// Format time
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Draw background
function drawBackground() {
    context.fillStyle = '#000';
    context.fillRect(0, backgroundY, canvas.width, canvas.height);
    context.fillRect(0, backgroundY - canvas.height, canvas.width, canvas.height);
    backgroundY += backgroundSpeed;
    if (backgroundY >= canvas.height) {
        backgroundY = 0;
    }
}

// Event listeners for key presses
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === 'Up' || e.key === 'ArrowUp') {
        upPressed = true;
    } else if (e.key === 'Down' || e.key === 'ArrowDown') {
        downPressed = true;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        spacePressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    } else if (e.key === 'Up' || e.key === 'ArrowUp') {
        upPressed = false;
    } else if (e.key === 'Down' || e.key === 'ArrowDown') {
        downPressed = false;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        spacePressed = false;
    }
}

// Game over function
function gameOver() {
    alert('Game Over! Your score: ' + score);
    document.location.reload();
}

// Game loop
function gameLoop(timestamp) {
    if (!startTime) startTime = timestamp;
    elapsedTime = Math.floor((timestamp - startTime) / 1000);

    context.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawPowerUps();
    detectCollisions();
    drawScoreAndHealth();

    if (rightPressed && playerX < canvas.width - playerWidth) {
        playerX += playerSpeed;
    }
    if (leftPressed && playerX > 0) {
        playerX -= playerSpeed;
    }
    if (upPressed && playerY > 0) {
        playerY -= playerSpeed;
    }
    if (downPressed && playerY < canvas.height - playerHeight) {
        playerY += playerSpeed;
    }

    if (spacePressed) {
        if (rapidFire || bullets.length === 0 || bullets[bullets.length - 1].y < playerY - bulletHeight) {
            bullets.push({ x: playerX + playerWidth / 2 - bulletWidth / 2, y: playerY });
            shootSound.play();
        }
    }

    if (timestamp - lastEnemySpawnTime > enemySpawnInterval) {
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        enemies.push({
            x: Math.random() * (canvas.width - enemyType.width),
            y: -enemyType.height,
            width: enemyType.width,
            height: enemyType.height,
            speed: enemyType.speed,
            color: enemyType.color
        });
        lastEnemySpawnTime = timestamp;
    }

    if (timestamp - lastPowerUpSpawnTime > powerUpSpawnInterval) {
        powerUps.push({
            x: Math.random() * (canvas.width - powerUpWidth),
            y: -powerUpHeight
        });
        lastPowerUpSpawnTime = timestamp;
    }
     
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
