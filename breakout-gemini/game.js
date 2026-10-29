/**
 * Breakout Game
 * Developed for CIS-450 Emergent Technologies.
 * Licensed under the MIT License.
 *
 * This implementation adheres strictly to the requirements in SPEC.md:
 * - 5 rows of bricks with specific colors (Red, Orange, Yellow, Green, Blue)
 * - Exact half-brick gaps on left and right borders
 * - Keyboard paddle controls (Left / Right arrow keys) with boundary collision
 * - Accurate ball bouncing physics against walls, paddle, and bricks
 * - 3 lives with state preservation across lost lives
 * - Win, Loss, and Restart handling
 */

// =============================================================================
// Game Configuration and Constants
// =============================================================================

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Brick layout configuration:
// Total width = (Brick Width / 2) + (Cols * Brick Width) + ((Cols - 1) * Col Gap) + (Brick Width / 2)
// For 9 columns, 76px width, 5px gap:
// Left Gap (38) + 9 * 76 (684) + 8 * 5 (40) + Right Gap (38) = 800px.
const BRICK_ROWS = 5;
const BRICK_COLS = 9;
const BRICK_WIDTH = 76;
const BRICK_HEIGHT = 24;
const BRICK_GAP_X = 5;
const BRICK_GAP_Y = 6;
const BRICK_OFFSET_LEFT = BRICK_WIDTH / 2; // Exactly half-brick gap on left and right
const BRICK_OFFSET_TOP = 70;

// Row colors specified from top to bottom: Red, Orange, Yellow, Green, Blue
const ROW_COLORS = [
  '#e74c3c', // Row 0 (Top): Red
  '#e67e22', // Row 1: Orange
  '#f1c40f', // Row 2: Yellow
  '#2ecc71', // Row 3: Green
  '#3498db'  // Row 4: Blue
];

const INITIAL_LIVES = 3;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 500; // Pixels per second
const PADDLE_Y = 550;

const BALL_RADIUS = 7;
const BALL_SPEED = 360; // Pixels per second

// Game states
const STATE = {
  READY: 'READY',           // Initial state or fresh reset; waiting to start
  PLAYING: 'PLAYING',       // Ball is moving, active play
  LIFE_LOST: 'LIFE_LOST',   // Ball passed paddle, lives > 0; waiting for player to launch
  GAME_OVER: 'GAME_OVER',   // Ball passed paddle, lives == 0; player lost
  GAME_WON: 'GAME_WON'      // All bricks destroyed; player won
};

// =============================================================================
// Game State Variables
// =============================================================================

let currentState = STATE.READY;
let score = 0;
let lives = INITIAL_LIVES;
let remainingBricks = 0;

// Paddle state
const paddle = {
  x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
  y: PADDLE_Y,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PADDLE_SPEED
};

// Ball state
const ball = {
  x: CANVAS_WIDTH / 2,
  y: PADDLE_Y - BALL_RADIUS - 1,
  radius: BALL_RADIUS,
  vx: 0,
  vy: 0,
  speed: BALL_SPEED
};

// 2D Array of bricks
let bricks = [];

// Keyboard input state
const keys = {
  left: false,
  right: false
};

// DOM references
let canvas = null;
let ctx = null;
let scoreDisplay = null;
let livesDisplay = null;
let restartButton = null;

// =============================================================================
// Initialization and State Management
// =============================================================================

/**
 * Initializes the brick grid according to the specifications.
 * 5 rows with respective colors, 9 columns with half-brick gaps on the edges.
 */
function createBricks() {
  bricks = [];
  remainingBricks = 0;

  for (let r = 0; r < BRICK_ROWS; r++) {
    bricks[r] = [];
    const color = ROW_COLORS[r];
    for (let c = 0; c < BRICK_COLS; c++) {
      const brickX = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_GAP_X);
      const brickY = BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_GAP_Y);
      bricks[r][c] = {
        x: brickX,
        y: brickY,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        color: color,
        alive: true
      };
      remainingBricks++;
    }
  }
}

/**
 * Resets the ball and paddle positions to their default starting locations.
 * The ball rests on the center of the paddle.
 */
function resetBallAndPaddle() {
  paddle.x = (CANVAS_WIDTH - paddle.width) / 2;
  paddle.y = PADDLE_Y;

  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius - 1;
  ball.vx = 0;
  ball.vy = 0;
}

/**
 * Launches the ball from the paddle at an initial upward trajectory.
 */
function launchBall() {
  // Launch at an upward angle (approx -60 to -70 degrees from horizontal)
  // Give it a slight horizontal bias based on current paddle movement or center
  let initialAngle = -Math.PI / 3; // 60 degrees upward to the right
  if (keys.left && !keys.right) {
    initialAngle = -(2 * Math.PI) / 3; // 60 degrees upward to the left
  }

  ball.vx = ball.speed * Math.cos(initialAngle);
  ball.vy = ball.speed * Math.sin(initialAngle);
  currentState = STATE.PLAYING;
}

/**
 * Performs a full restart of the game.
 * Resets score, lives, bricks, ball, and paddle back to the initial state.
 */
function restartFullGame() {
  score = 0;
  lives = INITIAL_LIVES;
  createBricks();
  resetBallAndPaddle();
  currentState = STATE.READY;
  updateHUD();
}

/**
 * Handles the primary action key (Space, Enter, or Click) depending on current game state.
 */
function handleAction() {
  if (currentState === STATE.READY || currentState === STATE.LIFE_LOST) {
    launchBall();
  } else if (currentState === STATE.GAME_OVER || currentState === STATE.GAME_WON) {
    restartFullGame();
  }
}

/**
 * Synchronizes HTML display elements with game state.
 */
function updateHUD() {
  if (scoreDisplay) scoreDisplay.textContent = score;
  if (livesDisplay) livesDisplay.textContent = lives;
}

// =============================================================================
// Physics and Game Logic
// =============================================================================

/**
 * Updates paddle position based on active keyboard input and clamps to boundaries.
 * @param {number} dt Delta time in seconds
 */
function updatePaddle(dt) {
  if (keys.left && !keys.right) {
    paddle.x -= paddle.speed * dt;
  } else if (keys.right && !keys.left) {
    paddle.x += paddle.speed * dt;
  }

  // Prevent paddle from moving beyond canvas boundaries
  if (paddle.x < 0) {
    paddle.x = 0;
  } else if (paddle.x + paddle.width > CANVAS_WIDTH) {
    paddle.x = CANVAS_WIDTH - paddle.width;
  }

  // If waiting to serve, keep the ball anchored to the paddle
  if (currentState === STATE.READY || currentState === STATE.LIFE_LOST) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 1;
  }
}

/**
 * Counts how many bricks remain unbroken.
 * @returns {number}
 */
function countAliveBricks() {
  let count = 0;
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (bricks[r] && bricks[r][c] && bricks[r][c].alive) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Checks and resolves collision between the ball and a single brick.
 * SPEC requirement:
 * "The ball's direction must change based on the surface it hits:
 *  a collision with the top or bottom of a brick reverses its vertical direction,
 *  while a collision with the left or right side reverses its horizontal direction."
 *
 * @param {Object} brick
 * @returns {boolean} True if collision occurred
 */
function checkBrickCollision(brick) {
  if (!brick.alive) return false;

  // Find closest point on brick to ball center
  const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
  const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));

  const distX = ball.x - closestX;
  const distY = ball.y - closestY;
  const distanceSquared = distX * distX + distY * distY;

  // Collision detected
  if (distanceSquared <= ball.radius * ball.radius) {
    brick.alive = false;
    score += 1;
    remainingBricks = countAliveBricks();
    updateHUD();

    // Determine collision surface using penetration depths
    const overlapLeft = (ball.x + ball.radius) - brick.x;
    const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
    const overlapTop = (ball.y + ball.radius) - brick.y;
    const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
      // Left or right side collision: reverse horizontal velocity
      if (overlapLeft < overlapRight) {
        ball.vx = -Math.abs(ball.vx);
        ball.x = brick.x - ball.radius;
      } else {
        ball.vx = Math.abs(ball.vx);
        ball.x = brick.x + brick.width + ball.radius;
      }
    } else {
      // Top or bottom side collision: reverse vertical velocity
      if (overlapTop < overlapBottom) {
        ball.vy = -Math.abs(ball.vy);
        ball.y = brick.y - ball.radius;
      } else {
        ball.vy = Math.abs(ball.vy);
        ball.y = brick.y + brick.height + ball.radius;
      }
    }

    // Check win condition
    if (remainingBricks <= 0) {
      currentState = STATE.GAME_WON;
      ball.vx = 0;
      ball.vy = 0;
    }

    return true;
  }

  return false;
}

/**
 * Checks and resolves collision between the ball and the paddle.
 * Deflects ball upwards with an angle determined by the hit location on the paddle.
 */
function checkPaddleCollision() {
  // Only bounce if the ball is moving downwards towards the paddle
  if (ball.vy <= 0) return;

  const closestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
  const closestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));

  const distX = ball.x - closestX;
  const distY = ball.y - closestY;

  if (distX * distX + distY * distY <= ball.radius * ball.radius) {
    // Reposition ball directly on top of paddle to prevent sticking
    ball.y = paddle.y - ball.radius;

    // Calculate hit offset from center (-1.0 at far left, 0 at center, +1.0 at far right)
    const paddleCenter = paddle.x + paddle.width / 2;
    const hitOffset = (ball.x - paddleCenter) / (paddle.width / 2);
    const clampedOffset = Math.max(-0.85, Math.min(0.85, hitOffset));

    // Deflect between -60 and +60 degrees from vertical normal
    const maxBounceAngle = (60 * Math.PI) / 180;
    const bounceAngle = clampedOffset * maxBounceAngle;

    ball.vx = ball.speed * Math.sin(bounceAngle);
    ball.vy = -ball.speed * Math.cos(bounceAngle);
  }
}

/**
 * Updates ball movement and tests collisions with walls, paddle, and bricks.
 * @param {number} dt Delta time in seconds
 */
function updateBall(dt) {
  if (currentState !== STATE.PLAYING) return;

  // Move ball
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Wall collisions: Left & Right
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }

  // Wall collision: Top
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  }

  // Paddle collision
  checkPaddleCollision();

  // Brick collisions (resolve at most one brick collision per frame for stability)
  for (let r = 0; r < BRICK_ROWS; r++) {
    let hit = false;
    for (let c = 0; c < BRICK_COLS; c++) {
      if (checkBrickCollision(bricks[r][c])) {
        hit = true;
        break;
      }
    }
    if (hit) break;
  }

  // Ball fell past the paddle (bottom boundary)
  if (ball.y - ball.radius > CANVAS_HEIGHT) {
    lives -= 1;
    updateHUD();

    if (lives > 0) {
      // Return ball and paddle to start, keep current brick formation
      currentState = STATE.LIFE_LOST;
      resetBallAndPaddle();
    } else {
      // Lost all 3 lives: Game Over
      currentState = STATE.GAME_OVER;
      ball.vx = 0;
      ball.vy = 0;
    }
  }
}

/**
 * Master update step called on fixed intervals.
 * @param {number} dt Delta time in seconds
 */
function update(dt) {
  updatePaddle(dt);
  updateBall(dt);
}

// =============================================================================
// Rendering Logic
// =============================================================================

/**
 * Draws the bricks on the canvas.
 */
function drawBricks() {
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const brick = bricks[r][c];
      if (!brick.alive) continue;

      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      // Subtle border for clean retro arcade distinction
      ctx.strokeStyle = '#12131a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    }
  }
}

/**
 * Draws the player's paddle.
 */
function drawPaddle() {
  ctx.fillStyle = '#f0f3f6';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Accent edge for visual polish
  ctx.fillStyle = '#00d2d3';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, 3);
}

/**
 * Draws the ball.
 */
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.closePath();
}

/**
 * Draws overlay status messages for Ready, Life Lost, Game Over, and Victory.
 */
function drawOverlayMessages() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (currentState === STATE.READY) {
    // Semi-transparent backdrop for prompt
    ctx.fillStyle = 'rgba(11, 12, 16, 0.75)';
    ctx.fillRect(0, 260, CANVAS_WIDTH, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('BREAKOUT', CANVAS_WIDTH / 2, 310);

    ctx.fillStyle = '#38ef7d';
    ctx.font = '18px sans-serif';
    ctx.fillText('Press SPACE or ENTER to Launch Ball', CANVAS_WIDTH / 2, 350);
  } else if (currentState === STATE.LIFE_LOST) {
    ctx.fillStyle = 'rgba(11, 12, 16, 0.75)';
    ctx.fillRect(0, 260, CANVAS_WIDTH, 140);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('LIFE LOST!', CANVAS_WIDTH / 2, 305);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Lives remaining: ${lives}  —  Press SPACE or ENTER to Continue`, CANVAS_WIDTH / 2, 345);
  } else if (currentState === STATE.GAME_OVER) {
    ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
    ctx.fillRect(0, 240, CANVAS_WIDTH, 170);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 295);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, 340);

    ctx.fillStyle = '#9ba1b8';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press SPACE, ENTER, or Restart to play again', CANVAS_WIDTH / 2, 375);
  } else if (currentState === STATE.GAME_WON) {
    ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
    ctx.fillRect(0, 240, CANVAS_WIDTH, 170);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, 295);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Final Score: ${score} (All Bricks Destroyed!)`, CANVAS_WIDTH / 2, 340);

    ctx.fillStyle = '#9ba1b8';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press SPACE, ENTER, or Restart to play again', CANVAS_WIDTH / 2, 375);
  }

  ctx.restore();
}

/**
 * Master render loop.
 */
function render() {
  if (!ctx) return;

  // Clear background
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawBricks();
  drawPaddle();
  drawBall();
  drawOverlayMessages();
}

// =============================================================================
// Main Game Loop (Fixed Timestep)
// =============================================================================

let lastFrameTime = 0;
let accumulator = 0;
const FIXED_TIMESTEP = 1 / 60; // 60 updates per second

function gameLoop(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;

  let deltaTime = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  // Cap delta time to prevent spiral-of-death on window tab change
  if (deltaTime > 0.1) deltaTime = 0.1;

  accumulator += deltaTime;
  while (accumulator >= FIXED_TIMESTEP) {
    update(FIXED_TIMESTEP);
    accumulator -= FIXED_TIMESTEP;
  }

  render();
  requestAnimationFrame(gameLoop);
}

// =============================================================================
// Event Listeners and Setup
// =============================================================================

function setupEventListeners() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
      keys.left = true;
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
      keys.right = true;
      e.preventDefault();
    } else if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter' || e.code === 'Enter') {
      handleAction();
      e.preventDefault();
    } else if (e.key === 'r' || e.key === 'R') {
      restartFullGame();
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
      keys.left = false;
    } else if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
      keys.right = false;
    }
  });

  // Stop paddle movement if browser window loses focus
  window.addEventListener('blur', () => {
    keys.left = false;
    keys.right = false;
  });

  if (restartButton) {
    restartButton.addEventListener('click', () => {
      restartFullGame();
    });
  }

  if (canvas) {
    canvas.addEventListener('click', () => {
      handleAction();
    });
  }
}

/**
 * Initializes the game on DOM ready.
 */
function init() {
  canvas = document.getElementById('game-canvas');
  if (canvas) {
    ctx = canvas.getContext('2d');
  }

  scoreDisplay = document.getElementById('score-display');
  livesDisplay = document.getElementById('lives-display');
  restartButton = document.getElementById('restart-button');

  setupEventListeners();
  restartFullGame();

  requestAnimationFrame(gameLoop);
}

// Automatically start when loaded in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Export for headless testing in Node.js environments if required
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    BRICK_ROWS,
    BRICK_COLS,
    BRICK_WIDTH,
    BRICK_HEIGHT,
    BRICK_GAP_X,
    BRICK_GAP_Y,
    BRICK_OFFSET_LEFT,
    BRICK_OFFSET_TOP,
    ROW_COLORS,
    INITIAL_LIVES,
    STATE,
    paddle,
    ball,
    keys,
    createBricks,
    getBricks: () => bricks,
    resetBallAndPaddle,
    launchBall,
    restartFullGame,
    handleAction,
    updatePaddle,
    updateBall,
    checkBrickCollision,
    checkPaddleCollision,
    getState: () => currentState,
    setState: (s) => { currentState = s; },
    getScore: () => score,
    getLives: () => lives,
    getRemainingBricks: () => remainingBricks
  };
}
