/* ============================================================
   电子魔方 · 应用层 v6
   状态机闭环重写：统一转动引擎（拖拽 / 阻尼吸附 / 队列动画）
   ============================================================ */

/* ---------- 常量 ---------- */
let PX = 62;
const PERSPECTIVE = 1700;
const TURN_MS = 200;        // 队列转动动画
const SNAP_MS = 240;        // 松手阻尼吸附
const UNFOLD_MS = 820;
const DRAG_LOCK_PX = 6;     // 锁定转层的最小位移
const SNAP_DEG = 90;

/* ---------- DOM ---------- */
const stageEl    = document.getElementById('stage');
const cubeEl     = document.getElementById('cube');
const netEl      = document.getElementById('net');
const histEl     = document.getElementById('hist');
const badgeEl    = document.getElementById('badge');
const roHintEl   = document.getElementById('roHint');
const roUnfoldEl = document.getElementById('roUnfold');
const stUnfoldEl = document.getElementById('stUnfold');
const viewTitleEl= document.getElementById('viewTitle');
const paneMiniEl = document.getElementById('paneMini');
const paneNetEl  = document.getElementById('paneNet');
const miniCv     = document.getElementById('miniCube');
const bootEl     = document.getElementById('boot');

/* ---------- 全局状态 ---------- */
let cubies = makeSolved();
let cam  = { rx: -35.264, ry: -45, zoom: 1 };
let camT = { rx: -35.264, ry: -45, zoom: 1 };

/* 主视图展开度（0=立体 1=平面） */
let mainU = 0, mainUTarget = 0, mainUAnim = null;

/* 侧栏是独立视图，与主图互不影响 */
let sideShowsNet = true;          // 默认显示平面展开图（主图默认立体）

/* 统一转动状态：拖拽 / 吸附 / 队列都走这里 */
let spin = null;   // { axis, coord, angle, target, hit, anim }
let queue = [];    // 待播放的转动
let history = [];  // 用户操作历史（还原用）
let restoreLeft = 0; // 还原剩余步数（用于计数显示）
let historyFrozen = false; // 还原播放中：冻结 history 写入
let moveCount = 0;
let spinning = false;
let mode = 'turn';
let drag = null;
let lastFrame = performance.now();
let stateVer = 0, paintedVer = -1;
const HINGES = buildHinges();

/* 每帧缓存 */
let frameUnfold = {};
let frameCam = m4id();
const PLATE_CACHE = {};
let PLATE_ELS = [];
const AXIS_VEC = [[1,0,0],[0,1,0],[0,0,1]];

/* ---------- 缓动 ---------- */
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const lerp = (a,b,t) => a + (b-a)*t;
const easeOutCubic = p => 1 - Math.pow(1-p, 3);
const easeInOut = p => p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;

/* ============================================================
   1. 布局
   ============================================================ */
let UNFOLD_FIT = 0.62;
function layout() {
  const r = stageEl.getBoundingClientRect();
  const w = r.width || 900, h = r.height || 520;
  PX = Math.max(28, Math.min(158, Math.min(w,h) * 0.146));
  UNFOLD_FIT = Math.max(0.30, Math.min(1.6,
    Math.min(0.84 * w / (12 * PX), 0.84 * h / (9 * PX))));
  document.documentElement.style.setProperty('--u', PX + 'px');
  frameUnfold = {};
  for (const bf of cubeEl.querySelectorAll('.body-face')) {
    if (bf.__rot) bf.style.transform = m4css(bf.__rot) + ' translateZ(' + (PX/2) + 'px)';
  }
  for (const pl of PLATE_ELS) {
    const s = 3 * PX;
    pl.style.width = s + 'px'; pl.style.height = s + 'px';
    pl.style.marginLeft = (-s/2) + 'px'; pl.style.marginTop = (-s/2) + 'px';
  }
}

/* ============================================================
   2. 构建场景
   ============================================================ */
function faceRotM(key) { return m3to4(Z_TO_N[nKey(FACE_DEF[key].n)]); }

let solidLayer = null, plateLayer = null;
function buildCube() {
  cubeEl.innerHTML = '';
  solidLayer = document.createElement('div');
  solidLayer.className = 'layer';
  plateLayer = document.createElement('div');
  plateLayer.className = 'layer';
  cubeEl.appendChild(solidLayer);
  cubeEl.appendChild(plateLayer);

  for (const c of cubies) {
    const el = document.createElement('div');
    el.className = 'cubie';
    for (const k of FACE_KEYS) {
      const body = document.createElement('div');
      body.className = 'body-face';
      body.__face = k;
      body.__rot = faceRotM(k);
      body.style.transform = m4css(body.__rot) + ' translateZ(' + (PX/2) + 'px)';
      if (c.faces[k]) {
        const st = document.createElement('div');
        st.className = 'sticker';
        st.style.background = c.faces[k];
        body.appendChild(st);
      }
      el.appendChild(body);
    }
    c.el = el;
    el.__cubie = c;
    solidLayer.appendChild(el);
  }
  buildPlates();
}

function buildPlates() {
  plateLayer.innerHTML = '';
  for (const f of FACE_KEYS) {
    const pl = document.createElement('div');
    pl.className = 'plate';
    const s = 3 * PX;
    Object.assign(pl.style, {
      position:'absolute', left:'0', top:'0',
      width: s+'px', height: s+'px',
      marginLeft: (-s/2)+'px', marginTop: (-s/2)+'px',
      display:'grid', gridTemplateColumns:'repeat(3,1fr)', gridTemplateRows:'repeat(3,1fr)',
      gap:'3px', padding:'3px', borderRadius:'10px', background:'#14141b',
      transformStyle:'preserve-3d', opacity:'0', pointerEvents:'none',
      boxShadow:'0 0 0 1px rgba(255,255,255,.08)',
    });
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.style.borderRadius = '5px';
      cell.style.boxShadow = '0 0 0 1px rgba(0,0,0,.18)';
      pl.appendChild(cell);
    }
    pl.__face = f;
    plateLayer.appendChild(pl);
  }
  PLATE_ELS = Array.from(plateLayer.querySelectorAll('.plate'));
  for (const k in PLATE_CACHE) delete PLATE_CACHE[k];
}

/* ============================================================
   3. 矩阵
   ============================================================ */
function baseM(c) {
  return m4mul(m4T(c.p[0]*PX, c.p[1]*PX, c.p[2]*PX), m3to4(c.rot));
}
function plateBaseM(f) {
  const sc = sheetCenter(f);
  return m4mul(m4T(sc[0]*PX, sc[1]*PX, sc[2]*PX), faceRotM(f));
}
function scaleTranslation(M, k) {
  const o = M.slice();
  o[3] = M[3]*k; o[7] = M[7]*k; o[11] = M[11]*k;
  return o;
}
function unfoldM(f, t) {
  const key = f + '|' + t.toFixed(4);
  if (!frameUnfold[key]) frameUnfold[key] = scaleTranslation(unfoldMatrix(HINGES[f], t), PX);
  return frameUnfold[key];
}
function cameraM(t) {
  const shift = m4T(-1.5 * PX * t, 0, 0);
  return m4mulAll(m4S(cam.zoom * lerp(1, UNFOLD_FIT, t)),
                  m4rot([1,0,0], cam.rx), m4rot([0,1,0], cam.ry), shift);
}
/* 正交投影（用于方向判定与角度求解，去掉透视干扰） */
function projectOrtho(v) {
  const p = m4mv(frameCam, v);
  return [p[0], p[1]];
}

function projectToStage(v) {
  const r = stageEl.getBoundingClientRect();
  const p = m4mv(frameCam, v);
  const k = PERSPECTIVE / (PERSPECTIVE - p[2]);
  return [r.width/2 + p[0]*k, r.height*0.46 + p[1]*k];
}

/* ============================================================
   4. 转动引擎（统一：拖拽 / 吸附 / 队列）
   ============================================================ */
function layerCubies(axis, coord) {
  return cubies.filter(c => c.p[axis] === coord);
}
function invertMove(n) { return n.endsWith("'") ? n[0] : n + "'"; }

/* 立即落子（不播放动画），用于打乱 / 还原的批量应用 */
function applyInstant(name) {
  applyMoveTo(cubies, name);
  stateVer++;
}

/* 队列播放（按钮 / 键盘） */
function doMove(name) {
  if (queue.length > 24) return;            // 防溢出
  queue.push(name);
  pumpQueue();
}

/* 取下一个队列动作，交给 spin 播放 */
function pumpQueue() {
  if (spin || !queue.length) return;
  const name = queue.shift();
  const info = moveInfo(name);
  const b = info.base;
  spin = {
    axis: b.layerAxis, coord: b.layerVal,
    angle: 0, target: info.ang,       // 队列动画：0 -> ±90
    name,
    hit: layerCubies(b.layerAxis, b.layerVal),
    anim: { from: 0, to: info.ang, t0: performance.now(), dur: TURN_MS },
  };
}

/* 提交当前 spin 到逻辑状态 */
function commitSpin() {
  if (!spin) return;
  const name = spin.name;
  spin = null;
  applyMoveTo(cubies, name);
  if (name) {
    if (historyFrozen) {
      /* 还原播放中：不写回 history，只递减剩余步数 */
      restoreLeft = Math.max(0, restoreLeft - 1);
      if (restoreLeft === 0 && queue.length === 0) historyFrozen = false;
    } else {
      history.push(name);
      moveCount++;
    }
  }
  stateVer++;
  updateUI();
  pumpQueue();
}

/* 拖动开始：锁定层（不受 anim 状态影响，随时可拖） */
function beginSpin(axis, coord, hit) {
  spin = { axis, coord, angle: 0, target: 0, name: null, hit, anim: null, dragging: true };
}

/* 拖动中：角度直接跟手 */
function updateSpinDrag(angle) {
  if (spin) { spin.angle = angle; spin.dragging = true; }
}

/* 松手：阻尼吸附到最近的 90 度。
   关键约束：视觉转了几格，逻辑就必须应用几格。
   做法：把总步数拆成「第一格做吸附动画 + 剩余格入队」，每格都有一次 commit。 */
const MAX_INERTIA_STEPS = 1;      // 惯性最多多带 1 格
const MAX_DRAG_STEPS = 2;         // 单次拖拽最多 2 格

function releaseSpin(angle, velocity) {
  if (!spin) return;
  /* 惯性限幅：最多再带 0.45 格，避免甩一下就转十几格 */
  const inertia = Math.max(-0.30, Math.min(0.30, (velocity || 0) * 0.12));
  const projected = angle + inertia * SNAP_DEG;
  let steps = Math.round(projected / SNAP_DEG);
  /* 只有「明显甩动」才补一格：需要速度快 且 已拖出一定角度 */
  if (steps === 0 && Math.abs(velocity || 0) > 2.2 && Math.abs(angle) > 18) {
    steps = Math.sign(velocity);
  }
  /* 限幅 */
  steps = Math.max(-MAX_DRAG_STEPS, Math.min(MAX_DRAG_STEPS, steps));

  const axis = spin.axis, coord = spin.coord;

  if (steps === 0) {
    spin.name = null;
    spin.target = 0;
    spin.anim = { from: angle, to: 0, t0: performance.now(), dur: SNAP_MS };
    return;
  }

  const dir = Math.sign(steps);
  const n = Math.abs(steps);
  const name = moveNameFor(axis, coord, dir);

  /* 第一格：从当前角度阻尼吸附到 ±90，提交后由 pumpQueue 接着播剩余格。
     时长随角度差缩放，角度差越大回弹越久，形成阻尼感。 */
  spin.name = name;
  spin.target = dir * SNAP_DEG;
  const dur = Math.max(160, Math.min(420, 150 + Math.abs(spin.target - angle) * 1.6));
  spin.anim = { from: angle, to: dir * SNAP_DEG, t0: performance.now(), dur };

  /* 剩余格数入队（每格都会独立 commit，逻辑与视觉严格一致） */
  for (let i = 1; i < n; i++) queue.push(name);
}

/* 主循环里推进 spin */
function stepSpin(now) {
  if (!spin || !spin.anim) return;
  const a = spin.anim;
  const p = clamp01((now - a.t0) / a.dur);
  spin.angle = lerp(a.from, a.to, easeOutCubic(p));
  if (p >= 1) {
    spin.angle = a.to;
    spin.anim = null;
    if (spin.name) commitSpin();
    else { spin = null; pumpQueue(); }
  }
}

const isBusy = () => !!spin || queue.length > 0;

/* ============================================================
   5. 拖拽 -> 转动数学
   ============================================================ */
function screenDeltaPerDeg(axis, P0) {
  const s0 = projectOrtho(P0);
  const s1 = projectOrtho(m4mv(m4rot(AXIS_VEC[axis], 1), P0));
  return [s1[0]-s0[0], s1[1]-s0[1]];
}
function grabPoint(c, nWorld) {
  return [ (c.p[0]+nWorld[0]*0.5)*PX, (c.p[1]+nWorld[1]*0.5)*PX, (c.p[2]+nWorld[2]*0.5)*PX ];
}

/* ============================================================
   四边判定（最终方案）
   每个面在屏幕上有 4 个可转方向（2 个面内轴 × 正反）。
   做法：把「拖拽向量」投影到 4 个候选方向的 1 度切线上，取最对齐者。
   保证：
     - 任意位置、任意方向都能锁定（永不失败）
     - 方向确定性（无浮点抖动，不会"一会能一会不行"）
     - 无反向（选出的转动一定朝拖拽方向）
   ============================================================ */

/* 某动作在抓取点处的「每度屏幕位移」向量（用逻辑旋转矩阵，与 MOVES 同约定） */
function tangentPerDeg(name, P0) {
  const info = moveInfo(name);
  const a = projectToStage(P0);
  const b = projectToStage(m4mv(m4rot(info.base.axis, Math.sign(info.ang) * 1), P0));
  return [b[0] - a[0], b[1] - a[1]];
}

/* 选轴选层：2 个面内轴 × 正反 = 4 候选，取最对齐者 */
function pickTurnFromDrag(c, faceKey, dv) {
  const fr = FACE_FRAME[faceKey];
  const nW = FACE_DEF[faceKey].n;
  const P0 = grabPoint(c, nW);
  const dl = Math.hypot(dv[0], dv[1]) || 1;
  /* 全部 3 个轴都参与候选（含面法向 —— 即"面原地旋转"），
     取与拖拽方向最对齐者，最大化"往哪拖就往哪转"的直觉 */
  const axes = [0, 1, 2];
  let best = null;
  for (const a of axes) {
    const coord = c.p[a];
    const base = layerLabel(a, coord);
    if (!base) continue;
    const t = tangentPerDeg(base, P0);
    const L = Math.hypot(t[0], t[1]);
    if (L < 1e-3) continue;
    const cosP = (dv[0]*t[0] + dv[1]*t[1]) / (dl * L);
    if (!best || cosP > best.cos) {
      best = { axis: a, coord, name: base, sign: 1, t, L, cos: cosP, P0 };
    }
    if (-cosP > best.cos) {
      best = { axis: a, coord, name: base + "'", sign: -1,
               t: [-t[0], -t[1]], L, cos: -cosP, P0 };
    }
  }
  return best;
}

/* 计算当前拖拽应施加的旋转角。
   关键：灵敏度必须与「拖拽距离」成正比（常量），不能依赖切线投影大小。
   原因：某些位置/方向上，拖拽方向与所有候选轴的切线都近乎垂直
        （对齐度可低至 0.13），若按切线投影算角度就会趋近 0，
        表现为"拖了却不动" —— 这正是"一会能一会不行"的根因。
   做法：方向由切线投影的符号决定，幅度由拖拽距离线性给出：
        拖约 0.8 个小方块宽 = 转 90°。任意方向都可靠触发。 */
const DRAG_90_FACTOR = 0.8;
function dragAngleFor(drag, dx, dy) {
  const p = drag.pick;
  if (!p) return 0;
  const dl = Math.hypot(dx, dy);
  if (dl < 0.5) return 0;
  const proj = dx * p.t[0] + dy * p.t[1];     // 有符号：决定朝哪边转
  const sgn = proj >= 0 ? 1 : -1;
  const degPerPx = 90 / (PX * DRAG_90_FACTOR);
  return Math.max(-140, Math.min(140, sgn * dl * degPerPx));
}

function moveNameFor(axis, coord, sign) {
  for (const k of MOVE_KEYS) {
    const b = MOVES[k];
    if (b.layerAxis === axis && b.layerVal === coord) {
      return Math.sign(b.ang) === sign ? k : k + "'";
    }
  }
  return null;
}
function layerLabel(axis, coord) {
  for (const k of MOVE_KEYS) {
    const b = MOVES[k];
    if (b.layerAxis === axis && b.layerVal === coord) return k;
  }
  return '?';
}

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
  /* 优先用精确命中的面；若点在方块边缘/间隙（命中 .cubie 本身），
     回退到该方块朝向相机最正的那个面，保证拖拽总能转层。 */
  let faceKey = bodyEl ? bodyEl.__face : null;
  if (!faceKey && c) faceKey = frontFaceOf(c);

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
      drag.pick = t;               // 保存候选（轴/符号/切线/抓取点）
      const hit = layerCubies(t.axis, t.coord);
      /* 用户开始拖拽 = 接管控制：先落定在播动画，再清空剩余队列 */
      queue.length = 0;
      if (spin && spin.anim) { spin.angle = spin.target; spin.anim = null; commitSpin(); }
      spin = null;
      beginSpin(t.axis, t.coord, hit);
      for (const cc of hit) cc.el.classList.add('hi');
      roHintEl.textContent = layerLabel(t.axis, t.coord) + ' 层';
      return;
    }
    /* 跟手 + 记录速度（用于松手惯性） */
    const nowT = performance.now();
    const dt = Math.max(8, nowT - drag.lastT);
    const a0 = spin ? spin.angle : 0;
    const a1 = dragAngleFor(drag, dx, dy);
    const inst = (a1 - a0) / dt * 1000 / 90;          // 瞬时角速度（格/秒）
    drag.vel = drag.vel * 0.55 + inst * 0.45;         // EMA 平滑，抑制尖峰
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

/* 该小方块朝向相机最正的那个面（用于命中方块边缘时的回退） */
function frontFaceOf(c) {
  let best = null;
  for (const k of FACE_KEYS) {
    if (!c.faces[k]) continue;
    const nz = m4dir(frameCam, faceNormal(c, k))[2];
    if (!best || nz > best.nz) best = { nz, k };
  }
  return best ? best.k : null;
}

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
  /* 无可还原内容时禁用，避免无效点击 */
  btnSolve.disabled = restoreLeft > 0 || isBusy() || history.length === 0;

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

/* 重置到复原态（复用已有 DOM 元素，仅改逻辑状态与贴纸颜色） */
function resetToSolved() {
  spin = null; queue.length = 0; drag = null;
  history = []; moveCount = 0; restoreLeft = 0; historyFrozen = false;
  const fresh = makeSolved();
  for (let i = 0; i < cubies.length; i++) {
    const c = cubies[i], f = fresh[i];
    c.p = f.p.slice(); c.rot = f.rot.map(r => r.slice()); c.faces = Object.assign({}, f.faces);
    /* 更新贴纸颜色 */
    for (let k = 0; k < FACE_KEYS.length; k++) {
      const st = c.el.children[k].querySelector('.sticker');
      if (st) { const col = c.faces[FACE_KEYS[k]]; st.style.background = col || ''; }
    }
  }
  stateVer++;
  updateUI();
  renderNet(); drawMini();
  render(performance.now());
}

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
