/* ============================================================
   6. 渲染
   ============================================================ */
function paintPlates(t, op, paintColor) {
  for (const pl of PLATE_ELS) {
    const f = pl.__face;
    if (!PLATE_CACHE[f]) PLATE_CACHE[f] = { base: plateBaseM(f), cells: Array.from(pl.children) };
    const cc = PLATE_CACHE[f];
    pl.style.transform = m4css(m4mul(unfoldM(f, t), cc.base));
    pl.style.opacity = op;
    if (paintColor) {
      const g = readFaceColors(cubies, f);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        cc.cells[r*3+c].style.background = g[r][c] || '#1c1c24';
      }
    }
  }
}

function render(now) {
  /* 本帧的转动矩阵 */
  let turnM = m4id(), activeHit = null;
  if (spin && spin.anim) {
    turnM = m4rot(AXIS_VEC[spin.axis], spin.angle);
    activeHit = spin.hit;
  } else if (spin && spin.dragging) {
    turnM = m4rot(AXIS_VEC[spin.axis], spin.angle);
    activeHit = spin.hit;
  }

  frameUnfold = {};
  frameCam = cameraM(mainU);
  cubeEl.style.transform = m4css(frameCam);

  const solidFade = 1 - clamp01(mainU / 0.13);
  const plateOp = Math.max(0.001, clamp01(mainU / 0.11));

  /* 27 个小方块 */
  if (solidFade > 0.004) {
    for (const c of cubies) {
      const M = m4mulAll((activeHit && activeHit.indexOf(c) >= 0) ? turnM : m4id(), baseM(c));
      c.el.style.transform = m4css(M);
      c.el.style.opacity = solidFade;
    }
    if (solidHidden) { solidLayer.style.visibility = ''; solidHidden = false; }
  } else if (!solidHidden) {
    for (const c of cubies) c.el.style.opacity = 0;
    solidLayer.style.visibility = 'hidden';
    solidHidden = true;
  }

  /* 6 个面片 */
  paintPlates(mainU, plateOp, paintedVer !== stateVer);
  if (paintedVer !== stateVer) {
    paintedVer = stateVer;
    renderNet();
    drawMini();
  }
}
let solidHidden = false;

/* ============================================================
   7. 侧栏平面展开图
   ============================================================ */
let netCells = {};
function buildNet() {
  netEl.innerHTML = '';
  netCells = {};
  for (const f of FACE_KEYS) {
    const { col, row } = NET_LAYOUT[f];
    const box = document.createElement('div');
    box.className = 'net-face';
    box.style.gridColumn = col + 1;
    box.style.gridRow = row + 1;
    box.__face = f;
    box.title = '点击：' + f + ' 面顺时针转动';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'net-cell';
      box.appendChild(cell);
    }
    const lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = f;
    box.appendChild(lbl);
    box.addEventListener('click', () => doMove(f));
    netEl.appendChild(box);
    netCells[f] = box.children;
  }
}
function renderNet() {
  for (const f of FACE_KEYS) {
    const g = readFaceColors(cubies, f);
    const cells = netCells[f];
    if (!cells) continue;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      cells[r*3+c].style.background = g[r][c] || '#1c1c24';
    }
  }
}

/* ============================================================
   8. 侧栏迷你 3D 立方体（独立视图，与主图无关）
   ============================================================ */
let miniRx = -35.264, miniRy = -45, miniTargetRx = -35.264, miniTargetRy = -45;
let miniDrag = null;

function miniRotM(rx, ry) { return m4mul(m4rot([1,0,0], rx), m4rot([0,1,0], ry)); }

function miniVisibleFaces(R) {
  return FACE_KEYS
    .map(f => ({ f, z: m4dir(R, FACE_DEF[f].n)[2] }))
    .filter(o => o.z > 0.02)
    .sort((a,b) => a.z - b.z)
    .map(o => o.f);
}

function drawMini() {
  if (!miniCv) return;
  const w = miniCv.clientWidth, h = miniCv.clientHeight;
  if (w < 8 || h < 8) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (miniCv.width !== Math.round(w*dpr) || miniCv.height !== Math.round(h*dpr)) {
    miniCv.width = Math.round(w*dpr);
    miniCv.height = Math.round(h*dpr);
  }
  const ctx = miniCv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const R = miniRotM(miniRx, miniRy);
  const proj = v => { const p = m4mv(R, v); return [p[0], p[1]]; };

  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const sx of [-1.5,1.5]) for (const sy of [-1.5,1.5]) for (const sz of [-1.5,1.5]) {
    const p = proj([sx,sy,sz]);
    x0 = Math.min(x0,p[0]); x1 = Math.max(x1,p[0]);
    y0 = Math.min(y0,p[1]); y1 = Math.max(y1,p[1]);
  }
  const pad = 18;
  const k = Math.min((w-pad*2)/(x1-x0), (h-pad*2)/(y1-y0));
  const cx = w/2 - ((x0+x1)/2)*k, cy = h/2 - ((y0+y1)/2)*k;
  const toS = v => { const p = proj(v); return [cx+p[0]*k, cy+p[1]*k]; };

  const drawFace = (f, colors, gap) => {
    const fr = FACE_FRAME[f], c = sheetCenter(f);
    const corners = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dr,dc]) => {
      const o = [0,1,2].map(i => dc*fr.right[i]*1.5 + dr*fr.down[i]*1.5);
      return toS([c[0]+o[0], c[1]+o[1], c[2]+o[2]]);
    });
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#15151d';
    ctx.fill();

    for (let r = 0; r < 3; r++) for (let cc2 = 0; cc2 < 3; cc2++) {
      const o = [0,1,2].map(i => (cc2-1)*fr.right[i] + (r-1)*fr.down[i]);
      const ctr = [c[0]+o[0], c[1]+o[1], c[2]+o[2]];
      const e = 0.5 - gap;
      const pts = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dr,dc]) => {
        const oo = [0,1,2].map(i => dc*fr.right[i]*e + dr*fr.down[i]*e);
        return toS([ctr[0]+oo[0], ctr[1]+oo[1], ctr[2]+oo[2]]);
      });
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = colors[r][cc2] || '#1c1c24';
      ctx.fill();
    }
  };

  for (const f of miniVisibleFaces(R)) drawFace(f, readFaceColors(cubies, f), 0.055);
}

/* 侧栏视图切换：独立控制，不随主图联动 */
function setSideView(showNet) {
  sideShowsNet = showNet;
  paneMiniEl.classList.toggle('hidden', showNet);
  paneNetEl.classList.toggle('hidden', !showNet);
  viewTitleEl.innerHTML = (showNet ? '平面展开图' : '3D 立体图') +
    '<span class="tag">独立视图</span>';
  if (!showNet) requestAnimationFrame(() => requestAnimationFrame(drawMini));
}

/* ============================================================
   9. 交互
   ============================================================ */
function onDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  /* 侧栏迷你立方体 */
  if (e.target === miniCv && !sideShowsNet) {
    miniDrag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, rx0: miniTargetRx, ry0: miniTargetRy };
    stageEl.setPointerCapture && miniCv.setPointerCapture(e.pointerId);
    return;
  }
  const cubieEl = e.target.closest ? e.target.closest('.cubie') : null;
  const c = cubieEl ? cubieEl.__cubie : null;
  const bodyEl = e.target.closest ? e.target.closest('.body-face') : null;
  const faceKey = bodyEl ? bodyEl.__face : null;

  /* 关键修复：不再因 anim 状态拒绝拖拽。
     只要在「转动」模式且主图是立体态，就允许随时拖。 */
  const canTurn = mode === 'turn' && c && faceKey && mainU < 0.05;
  stageEl.setPointerCapture(e.pointerId);
  drag = {
    id: e.pointerId, x0: e.clientX, y0: e.clientY,
    kind: canTurn ? 'turn' : 'orbit',
    c, faceKey, nWorld: canTurn ? faceNormal(c, faceKey) : null,
    rx0: camT.rx, ry0: camT.ry,
    locked: false, axis: 0, coord: 0, angle: 0, hit: null, P0: null,
    lastX: e.clientX, lastY: e.clientY, lastT: performance.now(),
    vel: 0,
  };
  stageEl.classList.add('grabbing');
}

function onMove(e) {
  /* 侧栏迷你立方体拖动 */
  if (miniDrag && e.pointerId === miniDrag.id) {
    const dx = e.clientX - miniDrag.x0, dy = e.clientY - miniDrag.y0;
    miniTargetRy = miniDrag.ry0 + dx * 0.5;
    miniTargetRx = Math.max(-88, Math.min(88, miniDrag.rx0 - dy * 0.42));
    return;
  }
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  const dist = Math.hypot(dx, dy);

  if (drag.kind === 'turn') {
    if (!drag.locked) {
      if (dist < DRAG_LOCK_PX) return;
      const t = pickTurnFromDrag(drag.c, drag.faceKey, [dx, dy]);
      drag.locked = true;
      drag.axis = t.axis; drag.coord = t.coord;
      drag.P0 = grabPoint(drag.c, drag.nWorld);
      const hit = layerCubies(t.axis, t.coord);
      /* 若正有队列动画在播，先把它落定，避免冲突 */
      if (spin && spin.anim) { spin.angle = spin.target; spin.anim = null; commitSpin(); }
      if (spin && spin.dragging) spin = null;
      beginSpin(t.axis, t.coord, hit);
      for (const cc of hit) cc.el.classList.add('hi');
      roHintEl.textContent = layerLabel(t.axis, t.coord) + ' 层';
      return;
    }
    /* 跟手 + 记录速度（用于松手惯性） */
    const nowT = performance.now();
    const dt = Math.max(8, nowT - drag.lastT);
    const a0 = spin ? spin.angle : 0;
    const a1 = solveDragAngle(drag.axis, drag.P0, [dx, dy]);
    drag.vel = (a1 - a0) / dt * 1000 / 90;    // 每秒多少格
    drag.lastX = e.clientX; drag.lastY = e.clientY; drag.lastT = nowT;
    updateSpinDrag(a1);
    roHintEl.textContent = layerLabel(drag.axis, drag.coord) + ' 层 · ' +
                           Math.round(Math.abs(a1)) + '°';
    return;
  }

  camT.ry = drag.ry0 + dx * 0.34;
  camT.rx = Math.max(-88, Math.min(88, drag.rx0 - dy * 0.30));
}

function clearHi() { for (const c of cubies) c.el.classList.remove('hi'); }

function onUp(e) {
  if (miniDrag) { miniDrag = null; return; }
  if (!drag) return;
  try { stageEl.releasePointerCapture(drag.id); } catch (_) {}
  const d = drag;
  drag = null;
  stageEl.classList.remove('grabbing');
  clearHi();

  if (d.kind === 'turn' && d.locked) {
    releaseSpin(spin ? spin.angle : 0, d.vel);   // 阻尼 + 惯性吸附
    roHintEl.textContent = mode === 'turn' ? '拖动贴纸转动' : '拖动旋转视角';
  }
}

function onWheel(e) {
  e.preventDefault();
  camT.zoom = Math.max(0.45, Math.min(2.4, camT.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
}
