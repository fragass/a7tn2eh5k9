// ========================
// ELEMENTOS
// ========================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlayPopup");
const overlayTitle = document.getElementById("overlayTitle");
const overlayInfo = document.getElementById("overlayInfo");
const overlayBtn = document.getElementById("overlayBtn");
const rankingBtn = document.getElementById("rankingBtn");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

// ========================
// ESTADO
// ========================
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let gameOver = false;
let paused = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// ========================
// PLAYER
// ========================
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  lines: 0,
  level: 1,
  hold: null,
  canHold: true
};

// ========================
// PEÇAS
// ========================
const pieces = {
  T: [[0,1,0],[1,1,1]],
  O: [[1,1],[1,1]],
  L: [[0,0,1],[1,1,1]],
  J: [[1,0,0],[1,1,1]],
  I: [[1,1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]]
};

function createPiece(type) {
  return pieces[type].map(row => row.slice());
}

function randomPiece() {
  const keys = Object.keys(pieces);
  return createPiece(keys[Math.floor(Math.random() * keys.length)]);
}

// ========================
// DRAW
// ========================
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        ctx.fillStyle = "#4cafef";
        ctx.fillRect(
          (x + offset.x) * BLOCK,
          (y + offset.y) * BLOCK,
          BLOCK,
          BLOCK
        );
      }
    });
  });
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

// ========================
// COLLISION
// ========================
function collide(board, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (
        m[y][x] &&
        (board[y + o.y] &&
         board[y + o.y][x + o.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

// ========================
// MERGE
// ========================
function merge(board, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// ========================
// CLEAR LINES
// ========================
function sweep() {
  let rowCount = 0;
  outer: for (let y = board.length - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (!board[y][x]) continue outer;
    }
    board.splice(y, 1);
    board.unshift(Array(COLS).fill(0));
    rowCount++;
    y++;
  }

  if (rowCount > 0) {
    player.lines += rowCount;
    player.score += rowCount * 100;
    player.level = Math.floor(player.lines / 10) + 1;
    dropInterval = 1000 - (player.level - 1) * 100;
  }
}

// ========================
// PLAYER ACTIONS
// ========================
function playerDrop() {
  player.pos.y++;
  if (collide(board, player)) {
    player.pos.y--;
    merge(board, player);
    resetPlayer();
    sweep();
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collide(board, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(board, player);
  resetPlayer();
  sweep();
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(board, player)) {
    player.pos.x -= dir;
  }
}

function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] =
      [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
}

function playerRotate() {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix);
  while (collide(board, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix);
      rotate(player.matrix);
      rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
}

// ========================
// RESET
// ========================
function resetPlayer() {
  player.matrix = randomPiece();
  player.pos.y = 0;
  player.pos.x = (COLS / 2 | 0) -
    (player.matrix[0].length / 2 | 0);
  player.canHold = true;

  if (collide(board, player)) {
    showGameOver();
  }
}

// ========================
// SCORE SEND
// ========================
async function enviarScoreFinal() {
  const username = sessionStorage.getItem("loggedUserPhone");
  if (!username) return;

  await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      score: player.score,
      lines: player.lines,
      level: player.level
    })
  });
}

// ========================
// GAME OVER
// ========================
function showGameOver() {
  gameOver = true;
  paused = true;
  enviarScoreFinal();

  overlay.style.display = "flex";
  overlayTitle.textContent = "FIM DE JOGO";
  overlayInfo.textContent = "Score: " + player.score;
}

// ========================
// INPUT
// ========================
document.addEventListener("keydown", e => {
  if (paused || gameOver) return;

  if (e.code === "ArrowLeft") playerMove(-1);
  if (e.code === "ArrowRight") playerMove(1);
  if (e.code === "ArrowDown") playerDrop();
  if (e.code === "ArrowUp") playerRotate();
  if (e.code === "Space") hardDrop();
  if (e.code === "KeyP") paused = !paused;
  if (e.code === "KeyR") startGame();
});

// ========================
// LOOP
// ========================
function update(time = 0) {
  if (paused || gameOver) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

// ========================
// START
// ========================
function startGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  player.score = 0;
  player.lines = 0;
  player.level = 1;
  gameOver = false;
  paused = false;
  overlay.style.display = "none";
  resetPlayer();
  update();
}

overlayBtn.onclick = startGame;
rankingBtn.onclick = () => location.href = "ranking.html";

startGame();
