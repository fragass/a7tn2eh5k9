document.addEventListener('DOMContentLoaded', () => {

  /* =======================
     CANVAS E CONTEXTOS
  ======================= */
  const canvas = document.getElementById('tetris');
  const context = canvas.getContext('2d');
  context.scale(20, 20);

  const nextCanvas1 = document.getElementById('next1');
  const nextCtx1 = nextCanvas1.getContext('2d'); nextCtx1.scale(20, 20);
  const nextCanvas2 = document.getElementById('next2');
  const nextCtx2 = nextCanvas2.getContext('2d'); nextCtx2.scale(20, 20);
  const nextCanvas3 = document.getElementById('next3');
  const nextCtx3 = nextCanvas3.getContext('2d'); nextCtx3.scale(20, 20);

  /* =======================
     UI
  ======================= */
  const startPauseBtn = document.getElementById('startPauseBtn');
  const overlay = document.getElementById('overlayPopup');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayInfo = document.getElementById('overlayInfo');
  const overlayBtn = document.getElementById('overlayBtn');

  /* =======================
     ESTADO DO JOGO
  ======================= */
  const arena = createMatrix(10, 20);
  const colors = [null,'#00ffff','#ffff00','#800080','#00ff00','#ff0000','#0000ff','#ffa500'];

  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    lines: 0,
    level: 1,
    next: [],
    canHold: true
  };

  let dropCounter = 0;
  let dropInterval = 1000;
  let lastTime = 0;
  let started = false;
  let paused = true;
  let gameOver = false;

  /* =======================
     UTIL
  ======================= */
  function createMatrix(w, h) {
    return Array.from({ length: h }, () => new Array(w).fill(0));
  }

  function createPiece(type) {
    if (type === 'T') return [[0,3,0],[3,3,3],[0,0,0]];
    if (type === 'O') return [[2,2],[2,2]];
    if (type === 'L') return [[0,0,7],[7,7,7],[0,0,0]];
    if (type === 'J') return [[6,0,0],[6,6,6],[0,0,0]];
    if (type === 'I') return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
    if (type === 'S') return [[0,4,4],[4,4,0],[0,0,0]];
    if (type === 'Z') return [[5,5,0],[0,5,5],[0,0,0]];
  }

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

  function merge(arena, player) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          arena[y + player.pos.y][x + player.pos.x] = value;
        }
      });
    });
    arenaSweep();
  }

  function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
      for (let x = 0; x < arena[y].length; ++x) {
        if (arena[y][x] === 0) continue outer;
      }
      arena.splice(y, 1);
      arena.unshift(new Array(10).fill(0));
      rowCount++;
      y++;
    }

    if (rowCount > 0) {
      player.lines += rowCount;
      player.score += rowCount * 100 * player.level;
      player.level = Math.floor(player.lines / 10) + 1;
      dropInterval = Math.max(250, 1000 * Math.pow(0.92, player.level - 1));
      updateScoreboard();
    }
  }

  function rotate(matrix) {
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    matrix.forEach(row => row.reverse());
  }

  /* =======================
     PLAYER
  ======================= */
  function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
      showGameOver();
    }
  }

  function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
      merge(arena, player);
      playerReset();
    }
    dropCounter = 0;
  }

  function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
      player.pos.x -= dir;
    }
  }

  /* =======================
     DESENHO
  ======================= */
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
    if (player.matrix) {
      drawMatrix(player.matrix, player.pos);
    }
  }

  /* =======================
     LOOP
  ======================= */
  function update(time = 0) {
    const delta = time - lastTime;
    lastTime = time;

    if (!paused && !gameOver) {
      dropCounter += delta;
      if (dropCounter > dropInterval) {
        playerDrop();
      }
    }

    draw();
    requestAnimationFrame(update);
  }

  /* =======================
     SCORE
  ======================= */
  function updateScoreboard() {
    const el = document.getElementById('scoreboard');
    if (el) {
      el.textContent = `Score: ${player.score} | Linhas: ${player.lines} | Level: ${player.level}`;
    }
  }

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
      console.error("Erro ao enviar score");
    }
  }

  function showGameOver() {
    gameOver = true;
    paused = true;
    enviarScoreFinal();

    overlay.style.display = 'flex';
    overlayTitle.textContent = 'FIM DE JOGO';
    overlayInfo.textContent = 'Score: ' + player.score;
    overlayBtn.textContent = 'Novo Jogo';
  }

  /* =======================
     CONTROLES
  ======================= */
  document.addEventListener('keydown', e => {
    if (paused || gameOver) return;

    if (e.key === 'ArrowLeft') playerMove(-1);
    if (e.key === 'ArrowRight') playerMove(1);
    if (e.key === 'ArrowDown') playerDrop();
    if (e.key === 'ArrowUp') rotate(player.matrix);
  });

  startPauseBtn.addEventListener('click', () => {
    if (!started) {
      started = true;
      paused = false;
      gameOver = false;
      playerReset();
      updateScoreboard();
      startPauseBtn.textContent = 'Pausar';
      return;
    }

    paused = !paused;
    startPauseBtn.textContent = paused ? 'Retomar' : 'Pausar';
  });

  overlayBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    gameOver = false;
    paused = false;
    playerReset();
    updateScoreboard();
  });

  update();
});
