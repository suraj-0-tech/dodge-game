

    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('best');
    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlaySub = document.getElementById('overlaySub');
    const startBtn = document.getElementById('startBtn');

    const W = canvas.width;
    const H = canvas.height;

    let best = Number(localStorage.getItem('dodge_best') || 0);
    bestEl.textContent = best;

    const player = {
      w: 34, h: 34,
      x: W / 2 - 17,
      y: H - 60,
      speed: 320,
      color: '#5eead4'
    };

    let keys = { left: false, right: false };
    let blocks = [];
    let spawnTimer = 0;
    let spawnInterval = 0.85;
    let score = 0;
    let running = false;
    let gameOver = false;
    let lastTime = 0;

    function resetGame() {
      blocks = [];
      spawnTimer = 0;
      spawnInterval = 0.85;
      score = 0;
      player.x = W / 2 - player.w / 2;
      gameOver = false;
    }

    function spawnBlock() {
      const size = 26 + Math.random() * 22;
      blocks.push({
        x: Math.random() * (W - size),
        y: -size,
        size,
        speed: 140 + Math.random() * 160,
        color: Math.random() < 0.15 ? '#ff4d6d' : '#e8ecf1'
      });
    }

    function rectsOverlap(a, b) {
      return a.x < b.x + b.size && a.x + a.w > b.x &&
             a.y < b.y + b.size && a.y + a.h > b.y;
    }

    function update(dt) {
      if (keys.left) player.x -= player.speed * dt;
      if (keys.right) player.x += player.speed * dt;
      player.x = Math.max(0, Math.min(W - player.w, player.x));

      spawnTimer += dt;
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnBlock();
        if (spawnInterval > 0.28) spawnInterval -= 0.012;
      }

      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        b.y += b.speed * dt;
        if (b.y > H) {
          blocks.splice(i, 1);
          score += 10;
          continue;
        }
        if (rectsOverlap(player, b)) {
          endGame();
          return;
        }
      }

      score += dt * 6;
      scoreEl.textContent = Math.floor(score);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // subtle grid background
      ctx.strokeStyle = '#161b26';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // blocks
      blocks.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x, b.y, b.size, b.size);
      });
      ctx.shadowBlur = 0;

      // player
      ctx.fillStyle = player.color;
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 14;
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.shadowBlur = 0;
    }

    function loop(ts) {
      if (!running) return;
      const dt = Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      update(dt);
      if (!running) return; // endGame may have stopped it mid-update
      draw();
      requestAnimationFrame(loop);
    }

    function startGame() {
      resetGame();
      running = true;
      gameOver = false;
      overlay.classList.add('hidden');
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }

    function endGame() {
      running = false;
      gameOver = true;
      const finalScore = Math.floor(score);
      if (finalScore > best) {
        best = finalScore;
        localStorage.setItem('dodge_best', best);
        bestEl.textContent = best;
      }
      overlayTitle.textContent = 'GAME OVER';
      overlaySub.textContent = `Score: ${finalScore} — Press SPACE or START to retry`;
      overlay.classList.remove('hidden');
      draw();
    }

    // input
    window.addEventListener('keydown', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!running) startGame();
      }
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    });

    startBtn.addEventListener('click', () => {
      if (!running) startGame();
    });

    // touch support: tap left/right half of canvas to steer
    canvas.addEventListener('touchstart', handleTouch, { passive: true });
    canvas.addEventListener('touchmove', handleTouch, { passive: true });
    canvas.addEventListener('touchend', () => { keys.left = false; keys.right = false; }, { passive: true });

    function handleTouch(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      keys.left = x < rect.width / 2;
      keys.right = x >= rect.width / 2;
    }

    draw();