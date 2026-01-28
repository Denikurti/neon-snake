// Neon Snake Game

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const overlay = document.getElementById("overlay");
const statusText = document.getElementById("statusText");
const restartBtn = document.getElementById("restartBtn");

// Grid config
const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = canvas.width / GRID_SIZE;

// Game state
let snake;
let direction;
let nextDirection;
let food;
let score;
let gameOver = false;
let gameStarted = false;
let lastTime = 0;
let moveInterval = 140; // ms between moves, tweak for speed
let accumulator = 0;

function initGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  updateScore();
  gameOver = false;
  gameStarted = false;
  moveInterval = 140;
  accumulator = 0;
  spawnFood();
  showOverlay("Tap or press any key to start");
}

function updateScore() {
  scoreEl.textContent = score;
}

function spawnFood() {
  while (true) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const onSnake = snake.some((seg) => seg.x === x && seg.y === y);
    if (!onSnake) {
      food = { x, y };
      break;
    }
  }
}

function showOverlay(text) {
  statusText.textContent = text;
  overlay.classList.add("visible");
}

function hideOverlay() {
  overlay.classList.remove("visible");
}

function handleInput(key) {
  if (!gameStarted && !gameOver) {
    gameStarted = true;
    hideOverlay();
  }

  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      if (direction.y === 0) nextDirection = { x: 0, y: -1 };
      break;
    case "ArrowDown":
    case "s":
    case "S":
      if (direction.y === 0) nextDirection = { x: 0, y: 1 };
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      if (direction.x === 0) nextDirection = { x: -1, y: 0 };
      break;
    case "ArrowRight":
    case "d":
    case "D":
      if (direction.x === 0) nextDirection = { x: 1, y: 0 };
      break;
    default:
      break;
  }
}

// Touch controls for mobile (simple swipe detection)
let touchStartX = null;
let touchStartY = null;

canvas.addEventListener(
  "touchstart",
  (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  },
  { passive: true }
);

canvas.addEventListener(
  "touchend",
  (e) => {
    if (touchStartX === null || touchStartY === null) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      // horizontal swipe
      if (dx > 0 && direction.x === 0) {
        handleInput("ArrowRight");
      } else if (dx < 0 && direction.x === 0) {
        handleInput("ArrowLeft");
      }
    } else {
      // vertical swipe
      if (dy > 0 && direction.y === 0) {
        handleInput("ArrowDown");
      } else if (dy < 0 && direction.y === 0) {
        handleInput("ArrowUp");
      }
    }

    touchStartX = null;
    touchStartY = null;
  },
  { passive: true }
);

document.addEventListener("keydown", (e) => {
  if (gameOver && (e.key === "Enter" || e.key === " ")) {
    restartGame();
    return;
  }
  handleInput(e.key);
});

restartBtn.addEventListener("click", () => {
  restartGame();
});

overlay.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    hideOverlay();
  } else if (gameOver) {
    restartGame();
  }
});

function restartGame() {
  initGame();
}

function update(delta) {
  if (!gameStarted || gameOver) return;

  accumulator += delta;
  if (accumulator < moveInterval) return;
  accumulator = 0;

  // apply buffered direction just before moving
  direction = nextDirection;

  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  // Collision with walls
  if (
    newHead.x < 0 ||
    newHead.x >= GRID_SIZE ||
    newHead.y < 0 ||
    newHead.y >= GRID_SIZE
  ) {
    endGame();
    return;
  }

  // Collision with self
  if (snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  // Eating food
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    updateScore();
    spawnFood();

    // Slight speed up as snake grows, with a cap
    moveInterval = Math.max(70, moveInterval - 3);
  } else {
    snake.pop();
  }
}

function endGame() {
  gameOver = true;
  showOverlay(`Game over! Score: ${score}. Tap or press Enter to restart.`);
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawSnake() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#00ff99");
  gradient.addColorStop(1, "#00e6ff");

  snake.forEach((segment, index) => {
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;

    ctx.fillStyle = gradient;
    ctx.shadowColor = "#00ff99";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(
      x + 2,
      y + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
      CELL_SIZE * 0.25
    );
    ctx.fill();

    // Draw eyes on head
    if (index === 0) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#111";
      const eyeSize = CELL_SIZE / 6;
      const offsetX = direction.x !== 0 ? (direction.x * CELL_SIZE) / 6 : CELL_SIZE / 6;
      const offsetY = direction.y !== 0 ? (direction.y * CELL_SIZE) / 6 : CELL_SIZE / 6;

      ctx.beginPath();
      ctx.arc(
        x + CELL_SIZE / 2 - offsetX,
        y + CELL_SIZE / 2 - offsetY,
        eyeSize,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        x + CELL_SIZE / 2 + offsetX / 2,
        y + CELL_SIZE / 2 - offsetY,
        eyeSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  });

  // Reset shadow so it doesn't affect other drawings
  ctx.shadowBlur = 0;
}

function drawFood() {
  const x = food.x * CELL_SIZE;
  const y = food.y * CELL_SIZE;

  const gradient = ctx.createRadialGradient(
    x + CELL_SIZE / 2,
    y + CELL_SIZE / 2,
    2,
    x + CELL_SIZE / 2,
    y + CELL_SIZE / 2,
    CELL_SIZE / 2
  );
  gradient.addColorStop(0, "#ff4b6e");
  gradient.addColorStop(1, "#ff1f3d");

  ctx.fillStyle = gradient;
  ctx.shadowColor = "#ff4b6e";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.roundRect(
    x + 4,
    y + 4,
    CELL_SIZE - 8,
    CELL_SIZE - 8,
    CELL_SIZE * 0.3
  );
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#050712");
  gradient.addColorStop(1, "#050b1f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
  drawBackground();
  drawGrid();
  drawFood();
  drawSnake();
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  draw();

  window.requestAnimationFrame(loop);
}

// Polyfill for roundRect on older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.lineTo(x + w, y + h - radius);
    this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.lineTo(x + radius, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
    return this;
  };
}

initGame();
window.requestAnimationFrame(loop);

