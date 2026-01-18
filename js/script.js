// ================== SETUP ==================
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCanvases = [
  document.getElementById('next1').getContext('2d'),
  document.getElementById('next2').getContext('2d'),
  document.getElementById('next3').getContext('2d'),
];

nextCanvases.forEach(ctx => ctx.scale(20, 20));

const scoreboard = document.getElementById('scoreboard');

const overlay = document.getElementById('overlayPopup');
const overlayTitle = document.getElementById('overlayTitle');
const overlayInfo = document.getElementById('overlayInfo');
const overlayBtn = document.getElementById('overlayBtn');

const startPauseBtn = document.getElementById('startPauseBtn');

// ================== STATE ==================
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

let paused = true;
let gameOver = false;
let gameStarted = false;

let holdPiece = null;
let holdUsed = false;

const colors = [
  null,
  '#00f0f0',
  '#0000f0',
  '#f0a000',
  '#f0f000',
  '#00f000',
  '#a000f0',
  '#f00000'
];

// ================== ARENA ==================
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

// ================== PIECES ==================
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
  const pieces = 'TJLOSZI';
  while (nextQueue.length < 4) {
    nextQueue.push(createPiece(pieces[Math.floor(Math.random() * pieces.length)]));
  }
}

function playerReset() {
  refillQueue();
  player.matrix = nextQueue.shift();
  holdUsed = false;

  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) -
    (player.matrix[0].length / 2 | 0);

  if (collide(arena, player)) {
    showGameOver();
  }

  drawNext();
}

// ================== COLLISION ==================
function collide(arena, player) {
  return player.matrix.some((row, y) =>
    row.some((value, x) =>
      value !== 0 &&
      (arena[y + player.pos.y] &&
       arena[y + player.pos.y][x + player.pos.x]) !== 0
    )
  );
}

// ================== MERGE ==================
function merge(arena, player) {
  player.matrix.forEach((row, y) =>
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    })
  );
}

// ================== ROTATE ==================
function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  dir > 0 ? matrix.forEach(row => row.reverse()) : matrix.reverse();
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

// ================== DROP ==================
function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
    updateScore();
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  playerDrop();
}

// ================== SWEEP ==================
function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }

    arena.splice(y, 1);
    arena.unshift(Array(10).fill(0));
    player.score += rowCount * 100;
    player.lines++;
    rowCount *= 2;
  }

  if (player.lines >= player.level * 10) {
    player.level++;
    dropInterval *= 0.9;
  }
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
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
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
  nextCanvases.forEach(ctx => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 5, 5);
  });

  nextQueue.slice(0, 3).forEach((piece, i) => {
    drawMatrix(piece, { x: 1, y: 1 }, nextCanvases[i]);
  });
}

// ================== SCORE ==================
function updateScore() {
  scoreboard.textContent =
    `Score: ${player.score} | Linhas: ${player.lines} | Level: ${player.level}`;
}

// ================== GAME LOOP ==================
function update(time = 0) {
  if (paused || gameOver) return;

  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

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
    body: JSON.stringify({
      username,
      score: player.score
    })
  });
}

function showGameOver() {
  gameOver = true;
  paused = true;
  enviarScoreFinal();

  overlay.style.display = 'flex';
  overlayTitle.textContent = 'FIM DE JOGO';
  overlayInfo.textContent = `Score: ${player.score}`;
  overlayBtn.textContent = 'Novo Jogo';
}

// ================== CONTROLS ==================
document.addEventListener('keydown', e => {
  if (paused || gameOver) return;

  if (e.key === 'ArrowLeft') player.pos.x--;
  if (e.key === 'ArrowRight') player.pos.x++;
  if (e.key === 'ArrowDown') playerDrop();
  if (e.key === 'ArrowUp') playerRotate(1);
  if (e.code === 'Space') hardDrop();
  if (e.key.toLowerCase() === 'c') hold();
  if (e.key.toLowerCase() === 'p') paused = !paused;
  if (e.key.toLowerCase() === 'r') startGame();
});

// ================== START / PAUSE ==================
function startGame() {
  arena.forEach(row => row.fill(0));

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

startPauseBtn.addEventListener('click', () => {
  if (!gameStarted) {
    startGame();
    startPauseBtn.textContent = 'Pausar';
    startPauseBtn.className = 'btn pause';
    return;
  }

  paused = !paused;
  startPauseBtn.textContent = paused ? 'Continuar' : 'Pausar';
  startPauseBtn.className = paused ? 'btn resume' : 'btn pause';
});
