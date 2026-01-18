document.addEventListener('DOMContentLoaded', () => {

  /* =======================
     CANVAS
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
     ESTADO
  ======================= */
  const arena = createMatrix(10, 20);
  const colors = [null,'#00ffff','#ffff00','#800080','#00ff00','#ff0000','#0000ff','#ffa500'];
  const pieces = 'IJLOTSZ';

  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    lines: 0,
    level: 1,
    next: [],
    hold: null,
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
    if (type === 'I') return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
    if (type === 'O') return [[2,2],[2,2]];
    if (type === 'T') return [[0,3,0],[3,3,3],[0,0,0]];
    if (type === 'S') return [[0,4,4],[4,4,0],[0,0,0]];
    if (type === 'Z') return [[5,5,0],[0,5,5],[0,0,0]];
    if (type === 'J') return [[6,0,0],[6,6,6],[0,0,0]];
    if (type === 'L') return [[0,0,7],[7,7,7],[0,0,0]];
  }

  function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
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
    sweep();
  }

  function sweep() {
    let cleared = 0;

    outer: for (let y = arena.length - 1; y >= 0; y--) {
      for (let x = 0; x < arena[y].length; x++) {
        if (arena[y][x] === 0) continue outer;
      }
      arena.splice(y, 1);
      arena.unshift(new Array(10).fill(0));
      cleared++;
      y++;
    }

    if (cleared > 0) {
      player.lines += cleared;
      player.score += cleared * 100 * player.level;
      player.level = Math.floor(player.lines / 10) + 1;
      dropInterval = Math.max(250, 1000 * Math.pow(0.92, player.level - 1));
      updateScoreboard();
    }
  }

  /* =======================
     PLAYER
  ======================= */
  function resetPosition() {
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
  }

  function playerReset() {
    if (player.next.length < 3) {
      while (player.next.length < 3) {
        player.next.push(createPiece(pieces[Math.floor(Math.random() * pieces.length)]));
      }
    }

    player.matrix = player.next.shift();
    player.next.push(createPiece(pieces[Math.floor(Math.random() * pieces.length)]));

    resetPosition();
    player.canHold = true;

    drawNext();

    if (collide(arena, player)) showGameOver();
  }

  function hardDrop() {
    let distance = 0;
    while (!collide(arena, player)) {
      player.pos.y++;
      distance++;
    }
    player.pos.y--;
    merge(arena, player);
    player.score += distance * 5 * player.level;
    updateScoreboard();
    playerReset();
    dropCounter = 0;
  }

  function softDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
      merge(arena, player);
      playerReset();
    } else {
      player.score += 1 * player.level;
      updateScoreboard();
    }
    dropCounter = 0;
  }

  function hold() {
    if (!player.canHold) return;

    if (player.hold === null) {
      player.hold = player.matrix;
      player.matrix = player.next.shift();
      player.next.push(createPiece(pieces[Math.floor(Math.random() * pieces.length)]));
    } else {
      [player.hold, player.matrix] = [player.matrix, player.hold];
    }

    resetPosition();
    player.canHold = false;
    drawNext();
  }

  /* =======================
     ROTATION
  ======================= */
  function playerRotate(dir = 1) {
    const m = player.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = y; x < m[y].length; x++) {
        [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
      }
    }
    if (dir > 0) m.forEach(row => row.reverse());
    else m.reverse();

    // Wall kick
    const pos = player.pos.x;
    let offset = 1;
    while (collide(arena, player)) {
      player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > m[0].length) {
        playerRotate(-dir);
        player.pos.x = pos;
        return;
      }
    }
  }

  /* =======================
     DESENHO
  ======================= */
  function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          ctx.fillStyle = colors[value];
          ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        }
      });
    });
  }

  function drawNext() {
    [nextCtx1, nextCtx2, nextCtx3].forEach(ctx => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 5, 5);
    });

    player.next.slice(0, 3).forEach((piece, i) => {
      drawMatrix(piece, { x: 1, y: 1 }, [nextCtx1, nextCtx2, nextCtx3][i]);
    });
  }

  function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    if (player.matrix) drawMatrix(player.matrix, player.pos);
  }

  /* =======================
     LOOP
  ======================= */
  function update(time = 0) {
    const delta = time - lastTime;
    lastTime = time;

    if (!paused && !gameOver) {
      dropCounter += delta;
      if (dropCounter > dropInterval) softDrop();
    }

    draw();
    requestAnimationFrame(update);
  }

  /* =======================
     SCORE + API
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
     PAUSE HELPER
  ======================= */
  function togglePause() {
    paused = !paused;
    if (paused) startPauseBtn.textContent = 'Retomar';
    else startPauseBtn.textContent = 'Pausar';
  }

  /* =======================
     RESTART HELPER
  ======================= */
  function restartGame() {
    // limpa arena
    for (let y = 0; y < arena.length; y++) arena[y].fill(0);

    // reset player
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    player.hold = null;
    player.next = [];
    player.matrix = null;
    player.pos = {x:0, y:0};
    player.canHold = true;

    dropCounter = 0;
    dropInterval = 1000;
    lastTime = 0;
    started = false;
    paused = true;
    gameOver = false;

    overlay.style.display = 'none';
    startPauseBtn.textContent = 'Iniciar';

    playerReset();
    updateScoreboard();
  }

  /* =======================
     INPUT
  ======================= */
  document.addEventListener('keydown', e => {
    if (e.key === 'p') togglePause();
    if (e.key.toLowerCase() === 'r') restartGame();

    if (paused || gameOver) return;

    if (e.key === 'ArrowLeft') player.pos.x--, collide(arena, player) && player.pos.x++;
    if (e.key === 'ArrowRight') player.pos.x++, collide(arena, player) && player.pos.x--;
    if (e.key === 'ArrowDown') softDrop();
    if (e.key === ' ') hardDrop();
    if (e.key.toLowerCase() === 'c') hold();
    if (e.key === 'ArrowUp') playerRotate(1);
  });

startPauseBtn.onclick = () => {
  if (!started) {
    started = true;
    paused = false;

    // Só chama playerReset se ainda não houver peça carregada
    if (!player.matrix) {
      playerReset();
    }

    updateScoreboard();
    startPauseBtn.textContent = 'Pausar';
  } else {
    togglePause();
  }
};

  overlayBtn.onclick = () => restartGame();

  update();
});

