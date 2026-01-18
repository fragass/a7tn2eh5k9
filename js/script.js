// ================== PROTEÇÃO ==================
if (sessionStorage.getItem("auth") !== "true") {
  window.location.href = "index.html";
}

// ================== CANVAS ==================
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCtxs = [
  document.getElementById('next1').getContext('2d'),
  document.getElementById('next2').getContext('2d'),
  document.getElementById('next3').getContext('2d')
];
nextCtxs.forEach(c => c.scale(20, 20));

const scoreboard = document.getElementById('scoreboard');
const startPauseBtn = document.getElementById('startPauseBtn');

// ================== OVERLAY ==================
const overlay = document.getElementById('overlayPopup');
const overlayTitle = document.getElementById('overlayTitle');
const overlayInfo = document.getElementById('overlayInfo');
const overlayBtn = document.getElementById('overlayBtn');

// botão ranking (criado via JS)
const rankingBtn = document.createElement('button');
rankingBtn.className = 'btn';
rankingBtn.textContent = 'RANKING';
rankingBtn.style.marginTop = '10px';
rankingBtn.onclick = () => window.location.href = 'ranking.html';
overlay.appendChild(rankingBtn);

// ================== ESTADO ==================
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000;

let paused = true;
let gameOver = false;
let gameStarted = false;

let holdPiece = null;
let holdUsed = false;

// ================== MATRIZ ==================
function createMatrix(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(0));
}

const arena = createMatrix(10, 20);

// ================== PLAYER ==================
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  lines: 0,
  level: 1
};

// ================== PEÇAS ==================
const colors = [
  null, '#00f0f0', '#0000f0', '#f0a000',
  '#f0f000', '#00f000', '#a000f0', '#f00000'
];

function createPiece(type) {
  if (type === 'T') return [[0,0,0],[1,1,1],[0,1,0]];
  if (type === 'O') return [[2,2],[2,2]];
  if (type === 'L') return [[0,3,0],[0,3,0],[0,3,3]];
  if (type === 'J') return [[0,4,0],[0,4,0],[4,4,0]];
  if (type === 'I') return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
  if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
  if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

let nextQueue = [];

function refillQueue() {
  const types = 'TJLOSZI';
  while (nextQueue.length < 4) {
    nextQueue.push(createPiece(types[Math.floor(Math.random() * types.length)]));
  }
}

function playerReset() {
  refillQueue();
  player.matrix = nextQueue.shift();
  holdUsed = false;

  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) -
                 (player.matrix[0].length / 2 | 0);

  if (collide()) showGameOver();
  drawNext();
}

// ================== COLISÃO ==================
function collide() {
  return player.matrix.some((row, y) =>
    row.some((v, x) =>
      v !== 0 &&
      (arena[y + player.pos.y] &&
       arena[y + player.pos.y][x + player.pos.x]) !== 0
    )
  );
}

function merge() {
  player.matrix.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v !== 0) arena[y + player.pos.y][x + player.pos.x] = v;
    })
  );
}

// ================== LIMPAR LINHAS (SCORE REAL) ==================
function arenaSweep() {
  let linesCleared = 0;

  outer: for (let y = arena.length - 1; y >= 0; y--) {
    for (let x = 0; x < arena[y].length; x++) {
      if (arena[y][x] === 0) continue outer;
    }
    arena.splice(y, 1);
    arena.unshift(Array(10).fill(0));
    linesCleared++;
    y++;
  }

  if (linesCleared > 0) {
    const points = [0, 100, 300, 500, 800];
    player.score += points[linesCleared] * player.level;
    player.lines += linesCleared;

    if (player.lines >= player.level * 10) {
      player.level++;
      dropInterval *= 0.9;
    }
  }
}

// ================== DROP ==================
function playerDrop() {
  player.pos.y++;
  if (collide()) {
    player.pos.y--;
    merge();
    arenaSweep();
    playerReset();
    updateScore();
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collide()) player.pos.y++;
  player.pos.y--;
  playerDrop();
}

// ================== HOLD ==================
function hold() {
  if (holdUsed) return;
  if (!holdPiece) {
    holdPiece = player.matrix;
    playerReset();
  } else {
    [player.matrix, holdPiece] = [holdPiece, player.matrix];
    player.pos.y = 0;
  }
  holdUsed = true;
}

// ================== DRAW ==================
function drawMatrix(matrix, offset, ctx = context) {
  matrix.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v !== 0) {
        ctx.fillStyle = colors[v];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    })
  );
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function drawNext() {
  nextCtxs.forEach(c => c.clearRect(0, 0, 5, 5));
  nextQueue.slice(0, 3).forEach((p, i) => {
    drawMatrix(p, { x: 1, y: 1 }, nextCtxs[i]);
  });
}

// ================== SCORE ==================
function updateScore() {
  scoreboard.textContent =
    `Score: ${player.score} | Linhas: ${player.lines} | Level: ${player.level}`;
}

// ================== LOOP ==================
function update(time = 0) {
  if (paused || gameOver) return;

  const delta = time - lastTime;
  lastTime = time;

  dropCounter += delta;
  if (dropCounter > dropInterval) playerDrop();

  draw();
  requestAnimationFrame(update);
}

// ================== GAME OVER ==================
async function enviarScoreFinal() {
  const username = sessionStorage.getItem("loggedUserPhone");
  if (!username) return;

  await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, score: player.score })
  });
}

function showGameOver() {
  gameOver = true;
  paused = true;
  enviarScoreFinal();

  overlay.style.display = 'flex';
  overlayTitle.textContent = 'FIM DE JOGO';
  overlayInfo.textContent = `Score: ${player.score}`;
  overlayBtn.textContent = 'NOVO JOGO';
}

// ================== CONTROLES ==================
document.addEventListener('keydown', e => {
  if (gameOver) return;

  if (e.key === 'ArrowLeft') player.pos.x--;
  if (e.key === 'ArrowRight') player.pos.x++;
  if (e.key === 'ArrowDown') playerDrop();
  if (e.key === 'ArrowUp') rotate(player.matrix, 1);
  if (e.code === 'Space') hardDrop();
  if (e.key.toLowerCase() === 'c') hold();
  if (e.key.toLowerCase() === 'p') togglePause();
  if (e.key.toLowerCase() === 'r') startGame();
});

// ================== START / PAUSE ==================
function startGame() {
  arena.forEach(r => r.fill(0));
  player.score = 0;
  player.lines = 0;
  player.level = 1;

  nextQueue = [];
  holdPiece = null;

  gameOver = false;
  paused = false;
  gameStarted = true;

  overlay.style.display = 'none';

  playerReset();
  updateScore();

  lastTime = 0;
  requestAnimationFrame(update);
}

function togglePause() {
  paused = !paused;
  if (!paused) requestAnimationFrame(update);
}

startPauseBtn.addEventListener('click', () => {
  if (!gameStarted) {
    startGame();
    startPauseBtn.textContent = 'Pausar';
    startPauseBtn.className = 'btn pause';
    return;
  }

  togglePause();
  startPauseBtn.textContent = paused ? 'Continuar' : 'Pausar';
  startPauseBtn.className = paused ? 'btn resume' : 'btn pause';
});

// botão do overlay
overlayBtn.onclick = startGame;
