const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
context.scale(20, 20);

/* =====================
   ESTADO DO JOGO
===================== */
let gameOver = false;
let paused = true;
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000;

/* =====================
   ELEMENTOS UI
===================== */
const overlay = document.getElementById("overlayPopup");
const overlayTitle = document.getElementById("overlayTitle");
const overlayInfo = document.getElementById("overlayInfo");
const overlayBtn = document.getElementById("overlayBtn");

/* =====================
   JOGADOR
===================== */
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  lines: 0,
  level: 1
};

/* =====================
   ARENA
===================== */
function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

const arena = createMatrix(10, 20);

/* =====================
   PEÇAS
===================== */
function createPiece(type) {
  if (type === 'T') return [[0,1,0],[1,1,1],[0,0,0]];
  if (type === 'O') return [[2,2],[2,2]];
  if (type === 'L') return [[0,0,3],[3,3,3],[0,0,0]];
  if (type === 'J') return [[4,0,0],[4,4,4],[0,0,0]];
  if (type === 'I') return [[0,0,0,0],[5,5,5,5],[0,0,0,0]];
  if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
  if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

const colors = [
  null,
  '#ff5f5f',
  '#ffd27a',
  '#9fddb3',
  '#9fc3ff',
  '#c59fff',
  '#ff9fd4',
  '#9ffff0'
];

/* =====================
   DESENHO
===================== */
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

/* =====================
   COLISÃO
===================== */
function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
        (arena[y + o.y] &&
         arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

/* =====================
   LÓGICA
===================== */
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
    });
  });
}

function arenaSweep() {
  let rowCount = 0;
  outer: for (let y = arena.length - 1; y >= 0; y--) {
    for (let x = 0; x < arena[y].length; x++) {
      if (arena[y][x] === 0) continue outer;
    }
    arena.splice(y, 1);
    arena.unshift(new Array(10).fill(0));
    rowCount++;
    y++;
  }

  if (rowCount > 0) {
    player.lines += rowCount;
    player.score += rowCount * 100;
    player.level = Math.floor(player.lines / 10) + 1;
    dropInterval = Math.max(1000 - player.level * 100, 150);
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function playerRotate() {
  const pos = player.pos.x;
  let offset = 1;
  player.matrix = rotate(player.matrix);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      player.matrix = rotate(player.matrix);
      player.matrix = rotate(player.matrix);
      player.matrix = rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
}

/* =====================
   RESET / GAME OVER
===================== */
function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
  player.pos.y = 0;
  player.pos.x =
    ((arena[0].length / 2) | 0) -
    ((player.matrix[0].length / 2) | 0);

  if (collide(arena, player)) {
    showGameOver();
  }
}

function showGameOver() {
  gameOver = true;
  paused = true;

  // ✅ ENVIO DO SCORE FINAL
  enviarScoreFinal();

  overlay.style.display = 'flex';
  overlayTitle.textContent = 'FIM DE JOGO';
  overlayInfo.textContent =
    `Score: ${player.score} | Linhas: ${player.lines} | Level: ${player.level}`;
  overlayBtn.textContent = 'Novo Jogo';
}

/* =====================
   LOOP
===================== */
function update(time = 0) {
  if (paused || gameOver) return;

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

/* =====================
   CONTROLES
===================== */
document.addEventListener('keydown', e => {
  if (paused || gameOver) return;

  if (e.key === 'ArrowLeft') playerMove(-1);
  else if (e.key === 'ArrowRight') playerMove(1);
  else if (e.key === 'ArrowDown') playerDrop();
  else if (e.key === 'ArrowUp') playerRotate();
});

/* =====================
   START
===================== */
function startGame() {
  arena.forEach(row => row.fill(0));
  player.score = 0;
  player.lines = 0;
  player.level = 1;
  dropInterval = 1000;
  paused = false;
  gameOver = false;
  overlay.style.display = 'none';
  playerReset();
  update();
}

overlayBtn.addEventListener('click', startGame);

/* =====================
   ENVIO DE SCORE
===================== */
async function enviarScoreFinal() {
  const username = sessionStorage.getItem("loggedUserPhone");
  if (!username) return;

  try {
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
  } catch (e) {
    console.error("Erro ao enviar score", e);
  }
}
