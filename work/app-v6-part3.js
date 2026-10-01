/* ============================================================
   10. 主循环
   ============================================================ */
function frame(now) {
  const dt = Math.min(64, now - lastFrame) / 1000;
  lastFrame = now;

  stepSpin(now);

  /* 主视图展开动画 */
  if (Math.abs(mainU - mainUTarget) > 1e-4) {
    if (!mainUAnim) mainUAnim = { from: mainU, to: mainUTarget, t0: now, dur: UNFOLD_MS };
    const p = clamp01((now - mainUAnim.t0) / mainUAnim.dur);
    mainU = lerp(mainUAnim.from, mainUAnim.to, easeInOut(p));
    if (p >= 1) { mainU = mainUTarget; mainUAnim = null; }
    const pct = Math.round(mainU * 100) + '%';
    roUnfoldEl.textContent = pct;
    stUnfoldEl.textContent = pct;
  }

  /* 视角平滑 */
  if (spinning) camT.ry += dt * 22;
  const k = 1 - Math.pow(0.0016, dt);
  cam.rx = lerp(cam.rx, camT.rx, k);
  cam.ry = lerp(cam.ry, camT.ry, k);
  cam.zoom = lerp(cam.zoom, camT.zoom, k);

  /* 侧栏迷你立方体平滑 */
  if (!sideShowsNet) {
    const mk = 1 - Math.pow(0.0016, dt);
    const nRx = lerp(miniRx, miniTargetRx, mk);
    const nRy = lerp(miniRy, miniTargetRy, mk);
    if (Math.abs(nRx - miniRx) > 0.01 || Math.abs(nRy - miniRy) > 0.01) {
      miniRx = nRx; miniRy = nRy;
      drawMini();
    }
  }

  render(now);
  requestAnimationFrame(frame);
}

/* ============================================================
   11. UI
   ============================================================ */
function isSolved() {
  return FACE_KEYS.every(f => readFaceColors(cubies, f).flat().every(x => x === FACE_DEF[f].color));
}

function updateUI() {
  const solved = isSolved();
  badgeEl.textContent = solved ? 'SOLVED' : 'SCRAMBLED';
  badgeEl.style.color = solved ? 'var(--ok)' : '#ffb84d';
  badgeEl.style.borderColor = solved ? 'rgba(61,220,151,.4)' : 'rgba(255,184,77,.4)';
  badgeEl.style.background = solved ? 'rgba(61,220,151,.10)' : 'rgba(255,184,77,.10)';
  const stEl = document.getElementById('stState');
  stEl.textContent = solved ? '已复原' : '未复原';
  stEl.className = solved ? 'solved-pill' : '';
  document.getElementById('stMoves').textContent = moveCount;
  document.getElementById('roMoves').textContent = moveCount;

  /* 还原进行中：显示剩余步数 */
  const btnSolve = document.getElementById('btnSolve');
  btnSolve.textContent = restoreLeft > 0 ? ('还原中 ' + restoreLeft) : '还原';
  btnSolve.disabled = restoreLeft > 0 || isBusy();

  if (!history.length && restoreLeft === 0) {
    histEl.innerHTML = '<span class="empty">尚无操作</span>';
  } else {
    histEl.innerHTML = history.map((m, i) =>
      '<b>' + String(i+1).padStart(2,'0') + '</b> ' + m.replace("'", '&#8242;')).join('&nbsp;&nbsp;');
    histEl.scrollTop = histEl.scrollHeight;
  }
}

function buildMoveButtons() {
  const box = document.getElementById('moves');
  box.innerHTML = '';
  for (const base of ['U','D','L','R','F','B','M','E','S']) {
    for (const p of ['', "'"]) {
      const b = document.createElement('button');
      b.className = 'mv' + (p ? ' prime' : '');
      b.textContent = base + (p ? '′' : '');
      b.addEventListener('click', () => doMove(base + p));
      box.appendChild(b);
    }
  }
}

function setMode(m) {
  mode = m;
  document.getElementById('modeOrbit').classList.toggle('on', m === 'orbit');
  document.getElementById('modeTurn').classList.toggle('on', m === 'turn');
  roHintEl.textContent = m === 'turn' ? '拖动贴纸转动' : '拖动旋转视角';
  document.getElementById('hint').textContent = m === 'turn'
    ? '拖动贴纸转层（任意位置都可拖） · 拖动空白转视角 · 滚轮缩放'
    : '拖动旋转视角 · 滚轮缩放 · 切到「转动」可拖贴纸';
}

/* 主图展开/折叠 —— 不再联动侧栏 */
function toggleUnfold() {
  mainUTarget = mainUTarget > 0.5 ? 0 : 1;
  mainUAnim = null;
  if (mainUTarget > 0.5) { camT.rx = 0; camT.ry = 0; camT.zoom = 1; }
  else { camT.rx = -35.264; camT.ry = -45; camT.zoom = 1; }
  document.getElementById('btnFold').classList.toggle('on', mainUTarget < 0.5);
  document.getElementById('btnNet').classList.toggle('on', mainUTarget > 0.5);
}

/* 打乱：即时应用，并清空历史（否则还原语义混乱） */
function scramble() {
  if (isBusy()) return;
  const bases = ['U','D','L','R','F','B'];
  const seq = [];
  let prev = '';
  for (let i = 0; i < 22; i++) {
    let b;
    do { b = bases[Math.floor(Math.random()*6)]; } while (b === prev);
    prev = b;
    seq.push(b + (Math.random() < 0.5 ? "'" : ''));
  }
  for (const m of seq) { applyMoveTo(cubies, m); history.push(m); }
  stateVer++;
  moveCount += seq.length;
  renderNet(); drawMini(); updateUI();
}

/* 还原：严格闭环 —— 用「当前 history 的逆序」逐步播放，播完 history 归零。
   关键修复：不再先清空 history（之前导致 commitSpin 又把逆向序列写回，
   再点一次还原等于原样转回去 -> 越还原越乱）。 */
function solveAll() {
  if (restoreLeft > 0) return;
  if (!history.length) return;
  /* 先停掉正在进行的拖拽/动画 */
  if (spin && spin.dragging) spin = null;
  queue.length = 0;
  if (spin && spin.anim) { spin.angle = spin.target; spin.anim = null; if (spin.name) commitSpin(); }

  const inv = history.slice().reverse().map(invertMove);
  /* 逆序列就是唯一的真源；播放期间不写入 history */
  history = [];
  historyFrozen = true;
  restoreLeft = inv.length;
  queue.push(...inv);
  updateUI();
  pumpQueue();
}
let historyFrozen = false;

function resetView() {
  camT.rx = -35.264; camT.ry = -45; camT.zoom = 1;
  spinning = false;
  document.getElementById('btnSpin').classList.remove('on');
}

/* ============================================================
   12. 启动
   ============================================================ */
function init() {
  layout();
  buildCube();
  buildNet();
  buildMoveButtons();
  renderNet();
  updateUI();
  setMode('turn');
  document.getElementById('btnFold').classList.add('on');
  setSideView(true);           // 侧栏默认显示平面展开图（独立于主图）

  stageEl.addEventListener('pointerdown', onDown);
  stageEl.addEventListener('pointermove', onMove);
  stageEl.addEventListener('pointerup', onUp);
  stageEl.addEventListener('pointercancel', onUp);
  stageEl.addEventListener('wheel', onWheel, { passive: false });
  stageEl.addEventListener('contextmenu', e => e.preventDefault());

  /* 侧栏迷你立方体也支持拖动旋转 */
  miniCv.addEventListener('pointerdown', onDown);
  miniCv.addEventListener('pointermove', onMove);
  miniCv.addEventListener('pointerup', onUp);

  document.getElementById('modeOrbit').addEventListener('click', () => setMode('orbit'));
  document.getElementById('modeTurn').addEventListener('click', () => setMode('turn'));
  document.getElementById('btnUnfold').addEventListener('click', toggleUnfold);
  document.getElementById('btnSideNet').addEventListener('click', () => setSideView(true));
  document.getElementById('btnSideMini').addEventListener('click', () => setSideView(false));
  document.getElementById('btnSpin').addEventListener('click', e => {
    spinning = !spinning; e.currentTarget.classList.toggle('on', spinning);
  });
  document.getElementById('btnScramble').addEventListener('click', scramble);
  document.getElementById('btnSolve').addEventListener('click', solveAll);

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toUpperCase();
    if (MOVE_KEYS.indexOf(k) >= 0 && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      doMove(k + (e.shiftKey ? "'" : ''));
    } else if (e.code === 'Space') { e.preventDefault(); toggleUnfold(); }
    else if (e.key === 'Escape') resetView();
  });

  window.addEventListener('resize', () => { layout(); drawMini(); });

  /* 预热：跑一遍完整展开路径，消除首次展开的冷启动尖峰 */
  (function prewarm() {
    const path = [0.06,0.18,0.32,0.48,0.64,0.80,1.0,0.80,0.48,0.16,0];
    let i = 0;
    const tick = () => {
      if (i < path.length) {
        mainU = path[i++];
        frameCam = cameraM(mainU);
        render(performance.now());
        requestAnimationFrame(tick);
      } else {
        mainU = 0; mainUTarget = 0; mainUAnim = null;
        frameCam = cameraM(0);
        render(performance.now());
        lastFrame = performance.now();
        bootEl.classList.add('done');
      }
    };
    requestAnimationFrame(tick);
  })();

  requestAnimationFrame(frame);
}
document.addEventListener('DOMContentLoaded', init);
