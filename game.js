const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game settings
const paddleWidth = 15;
const paddleHeight = 100;
const ballSize = 15;
const playerX = 10;
const aiX = canvas.width - paddleWidth - 10;

// Paddle positions
let playerY = (canvas.height - paddleHeight) / 2;
let aiY = (canvas.height - paddleHeight) / 2;

// Ball position and velocity
let ballX = canvas.width / 2 - ballSize / 2;
let ballY = canvas.height / 2 - ballSize / 2;
let ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1);

// Scores
let playerScore = 0;
let aiScore = 0;

// Mouse control for left paddle
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    playerY = mouseY - paddleHeight / 2;
    playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
});

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.setLineDash([10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(playerX, playerY, paddleWidth, paddleHeight); // Player
    ctx.fillRect(aiX, aiY, paddleWidth, paddleHeight);         // AI

    // Draw ball
    ctx.fillRect(ballX, ballY, ballSize, ballSize);

    // Draw scores
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore, canvas.width / 4, 50);
    ctx.fillText(aiScore, 3 * canvas.width / 4, 50);
}

// Paddle collision detection
function paddleCollision(px, py) {
    return (
        ballX < px + paddleWidth &&
        ballX + ballSize > px &&
        ballY < py + paddleHeight &&
        ballY + ballSize > py
    );
}

// Basic AI for right paddle
function aiMove() {
    // Move toward the ball with some delay
    const center = aiY + paddleHeight / 2;
    if (center < ballY) aiY += 4;
    else if (center > ballY) aiY -= 4;

    // Clamp position
    aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
}

// Update game state
function update() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Top/bottom wall collision
    if (ballY <= 0 || ballY + ballSize >= canvas.height) {
        ballSpeedY = -ballSpeedY;
    }

    // Left paddle collision
    if (paddleCollision(playerX, playerY)) {
        ballSpeedX = Math.abs(ballSpeedX);
        // Add some variation
        ballSpeedY += (ballY + ballSize / 2 - (playerY + paddleHeight / 2)) * 0.08;
    }

    // Right paddle collision
    if (paddleCollision(aiX, aiY)) {
        ballSpeedX = -Math.abs(ballSpeedX);
        // Add some variation
        ballSpeedY += (ballY + ballSize / 2 - (aiY + paddleHeight / 2)) * 0.08;
    }

    // Score for player or AI
    if (ballX < 0) {
        aiScore++;
        resetBall(-1);
    }
    if (ballX + ballSize > canvas.width) {
        playerScore++;
        resetBall(1);
    }

    aiMove();
}

// Reset ball after a score
function resetBall(direction) {
    ballX = canvas.width / 2 - ballSize / 2;
    ballY = canvas.height / 2 - ballSize / 2;
    ballSpeedX = 5 * direction;
    ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1);
}

// Game loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
