/*
 * Breakout Game — Main Game Logic
 * MIT License — Copyright (c) 2026 CIS-450 Emergent Technologies
 * See LICENSE for details.
 *
 * Original implementation written for the CIS-450 Breakout project.
 * No external libraries or copied code.
 */

// ─── Canvas Setup ───────────────────────────────────────────────────────────

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score-display");
const livesDisplay = document.getElementById("lives-display");
const gameMessage = document.getElementById("game-message");

// ─── Constants ──────────────────────────────────────────────────────────────

const CANVAS_WIDTH = canvas.width;   // 480
const CANVAS_HEIGHT = canvas.height; // 400

// Paddle
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const PADDLE_Y = CANVAS_HEIGHT - 30; // distance from bottom
const PADDLE_SPEED = 6;

// Ball
const BALL_RADIUS = 6;
const BALL_SPEED = 4;

// Bricks — 5 rows, one color each (red, orange, yellow, green, blue)
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 10;
const BRICK_WIDTH = 42;
const BRICK_HEIGHT = 16;
const BRICK_PADDING = 2;
const BRICK_TOP_OFFSET = 40;

// Half-brick gap on left and right: (canvasWidth - total brick+padding width) / 2
// Total row width = columns * (brickWidth + padding) - padding
// = 10 * 44 - 2 = 438   →  gap = (480 - 438) / 2 = 21 = exactly half of 42
const BRICK_LEFT_OFFSET = (CANVAS_WIDTH - (BRICK_COLUMN_COUNT * (BRICK_WIDTH + BRICK_PADDING) - BRICK_PADDING)) / 2;

// Colors for each row from top to bottom
const ROW_COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db"];

const STARTING_LIVES = 3;

// ─── Game State ─────────────────────────────────────────────────────────────

// Possible states: "idle" (waiting to start), "playing", "won", "lost"
let gameState = "idle";

let score = 0;
let lives = STARTING_LIVES;

// Paddle position (x is left edge)
let paddleX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;

// Ball position and velocity
let ballX = CANVAS_WIDTH / 2;
let ballY = PADDLE_Y - BALL_RADIUS;
let ballDX = BALL_SPEED;  // horizontal velocity
let ballDY = -BALL_SPEED; // vertical velocity (negative = upward)

// Keyboard state
let leftPressed = false;
let rightPressed = false;

// Brick array — each brick has { x, y, alive }
let bricks = [];

// ─── Brick Initialization ───────────────────────────────────────────────────

/** Create the brick grid. Each brick gets a position and an alive flag. */
function createBricks() {
  bricks = [];
  for (let row = 0; row < BRICK_ROW_COUNT; row++) {
    bricks[row] = [];
    for (let col = 0; col < BRICK_COLUMN_COUNT; col++) {
      const x = BRICK_LEFT_OFFSET + col * (BRICK_WIDTH + BRICK_PADDING);
      const y = BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_PADDING);
      bricks[row][col] = { x: x, y: y, alive: true };
    }
  }
}

/** Count how many bricks are still alive. */
function countAliveBricks() {
  let count = 0;
  for (let row = 0; row < BRICK_ROW_COUNT; row++) {
    for (let col = 0; col < BRICK_COLUMN_COUNT; col++) {
      if (bricks[row][col].alive) {
        count++;
      }
    }
  }
  return count;
}

// ─── Reset Helpers ──────────────────────────────────────────────────────────

/** Reset the ball and paddle to their starting positions. */
function resetBallAndPaddle() {
  paddleX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
  ballX = CANVAS_WIDTH / 2;
  ballY = PADDLE_Y - BALL_RADIUS;

  // Launch upward at a slight angle (randomize left or right)
  const direction = Math.random() < 0.5 ? -1 : 1;
  ballDX = BALL_SPEED * direction;
  ballDY = -BALL_SPEED;
}

/** Full reset: score, lives, bricks, ball, paddle. */
function fullReset() {
  score = 0;
  lives = STARTING_LIVES;
  createBricks();
  resetBallAndPaddle();
  updateDisplays();
}

/** Update the score and lives text on screen. */
function updateDisplays() {
  scoreDisplay.textContent = "Score: " + score;
  livesDisplay.textContent = "Lives: " + lives;
}

// ─── Input Handling ─────────────────────────────────────────────────────────

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") {
    leftPressed = true;
  } else if (event.key === "ArrowRight") {
    rightPressed = true;
  } else if (event.key === " ") {
    // Space bar: start, resume after losing a life, or restart after game over / win
    event.preventDefault(); // prevent page scrolling
    handleSpacePress();
  }
});

document.addEventListener("keyup", function (event) {
  if (event.key === "ArrowLeft") {
    leftPressed = false;
  } else if (event.key === "ArrowRight") {
    rightPressed = false;
  }
});

/** Handle the Space key depending on the current game state. */
function handleSpacePress() {
  if (gameState === "idle") {
    // First launch — start the game
    gameState = "playing";
    gameMessage.textContent = "";
  } else if (gameState === "waiting") {
    // Player lost a life but has lives remaining — relaunch ball
    gameState = "playing";
    gameMessage.textContent = "";
  } else if (gameState === "won" || gameState === "lost") {
    // Game over or won — full restart
    fullReset();
    gameState = "idle";
    gameMessage.innerHTML = "Press <strong>Space</strong> to start";
  }
}

// ─── Game Logic ─────────────────────────────────────────────────────────────

/** Move the paddle based on currently pressed keys. */
function movePaddle() {
  if (leftPressed) {
    paddleX -= PADDLE_SPEED;
  }
  if (rightPressed) {
    paddleX += PADDLE_SPEED;
  }

  // Clamp paddle within the playing area
  if (paddleX < 0) {
    paddleX = 0;
  }
  if (paddleX + PADDLE_WIDTH > CANVAS_WIDTH) {
    paddleX = CANVAS_WIDTH - PADDLE_WIDTH;
  }
}

/** Move the ball and handle collisions with walls, paddle, and bricks. */
function moveBall() {
  ballX += ballDX;
  ballY += ballDY;

  // ── Wall collisions ──

  // Left wall
  if (ballX - BALL_RADIUS <= 0) {
    ballX = BALL_RADIUS;
    ballDX = Math.abs(ballDX); // bounce right
  }
  // Right wall
  if (ballX + BALL_RADIUS >= CANVAS_WIDTH) {
    ballX = CANVAS_WIDTH - BALL_RADIUS;
    ballDX = -Math.abs(ballDX); // bounce left
  }
  // Top wall
  if (ballY - BALL_RADIUS <= 0) {
    ballY = BALL_RADIUS;
    ballDY = Math.abs(ballDY); // bounce down
  }

  // ── Bottom edge — ball missed the paddle ──

  if (ballY + BALL_RADIUS >= CANVAS_HEIGHT) {
    lives--;
    updateDisplays();

    if (lives <= 0) {
      // No lives left — game over
      gameState = "lost";
      gameMessage.innerHTML = "Game Over! Press <strong>Space</strong> to restart";
    } else {
      // Lives remaining — wait for player to relaunch
      gameState = "waiting";
      gameMessage.innerHTML = "Ball lost! " + lives + " " + (lives === 1 ? "life" : "lives") + " left. Press <strong>Space</strong>";
      resetBallAndPaddle();
    }
    return; // skip further collision checks this frame
  }

  // ── Paddle collision ──
  // Check if ball overlaps with paddle rectangle

  if (
    ballDY > 0 && // ball moving downward
    ballY + BALL_RADIUS >= PADDLE_Y &&
    ballY + BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
    ballX >= paddleX &&
    ballX <= paddleX + PADDLE_WIDTH
  ) {
    // Place ball just above paddle to prevent sticking
    ballY = PADDLE_Y - BALL_RADIUS;
    ballDY = -Math.abs(ballDY); // bounce upward

    // Adjust horizontal angle based on where the ball hit the paddle.
    // Hitting the left side sends the ball left; right side sends it right.
    const hitPosition = (ballX - paddleX) / PADDLE_WIDTH; // 0 to 1
    const angle = (hitPosition - 0.5) * 2; // -1 to 1
    ballDX = BALL_SPEED * angle * 1.5;

    // Ensure the ball always has some horizontal movement
    if (Math.abs(ballDX) < 1) {
      ballDX = ballDX >= 0 ? 1 : -1;
    }
  }

  // ── Brick collisions ──

  for (let row = 0; row < BRICK_ROW_COUNT; row++) {
    for (let col = 0; col < BRICK_COLUMN_COUNT; col++) {
      const brick = bricks[row][col];
      if (!brick.alive) continue;

      // Check if ball overlaps with this brick
      if (
        ballX + BALL_RADIUS > brick.x &&
        ballX - BALL_RADIUS < brick.x + BRICK_WIDTH &&
        ballY + BALL_RADIUS > brick.y &&
        ballY - BALL_RADIUS < brick.y + BRICK_HEIGHT
      ) {
        // Destroy the brick
        brick.alive = false;
        score++;
        updateDisplays();

        // Determine bounce direction based on which side was hit.
        // Compare overlap depths on each axis to decide which surface
        // the ball contacted.
        const overlapLeft = (ballX + BALL_RADIUS) - brick.x;
        const overlapRight = (brick.x + BRICK_WIDTH) - (ballX - BALL_RADIUS);
        const overlapTop = (ballY + BALL_RADIUS) - brick.y;
        const overlapBottom = (brick.y + BRICK_HEIGHT) - (ballY - BALL_RADIUS);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          // Hit left or right side — reverse horizontal direction
          ballDX = -ballDX;
        } else {
          // Hit top or bottom — reverse vertical direction
          ballDY = -ballDY;
        }

        // Check win condition
        if (countAliveBricks() === 0) {
          gameState = "won";
          gameMessage.innerHTML = "You Win! 🎉 Press <strong>Space</strong> to play again";
        }

        // Only destroy one brick per frame to avoid tunneling issues
        return;
      }
    }
  }
}

// ─── Drawing ────────────────────────────────────────────────────────────────

/** Clear the canvas and draw all game objects. */
function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawBricks();
  drawPaddle();
  drawBall();
}

/** Draw all alive bricks. */
function drawBricks() {
  for (let row = 0; row < BRICK_ROW_COUNT; row++) {
    for (let col = 0; col < BRICK_COLUMN_COUNT; col++) {
      const brick = bricks[row][col];
      if (!brick.alive) continue;

      ctx.fillStyle = ROW_COLORS[row];
      ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);

      // Subtle border for visual definition
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
    }
  }
}

/** Draw the paddle. */
function drawPaddle() {
  ctx.fillStyle = "#ecf0f1";
  ctx.fillRect(paddleX, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);
}

/** Draw the ball. */
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.closePath();
}

// ─── Game Loop ──────────────────────────────────────────────────────────────

/** Main game loop — runs every animation frame. */
function gameLoop() {
  // Always allow paddle movement so the player can position before launch
  movePaddle();

  // Only update ball physics during active play
  if (gameState === "playing") {
    moveBall();
  }

  // Always draw the current state
  draw();

  requestAnimationFrame(gameLoop);
}

// ─── Initialization ─────────────────────────────────────────────────────────

createBricks();
updateDisplays();
gameLoop();
