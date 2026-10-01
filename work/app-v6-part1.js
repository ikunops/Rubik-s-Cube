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
  const done = spin.angle;
  spin = null;
  applyMoveTo(cubies, name);
  if (name) history.push(name);
  moveCount++;
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

/* 松手：带阻尼吸附到最近 90 度 */
function releaseSpin(angle, velocity) {
  if (!spin) return;
  /* 惯性：把速度折算成额外角度，再吸附到最近的 90 度 */
  const inertia = velocity * 90;                       // 速度 -> 额外角度
  const projected = angle + inertia;
  let steps = Math.round(projected / SNAP_DEG);
  /* 快速甩动至少转一格 */
  if (steps === 0 && Math.abs(velocity) > 0.45) steps = Math.sign(velocity);
  const targetAngle = steps * SNAP_DEG;
  const name = moveNameFor(spin.axis, spin.coord, steps > 0 ? 1 : -1);

  if (steps === 0) {
    spin.name = null;
    spin.anim = { from: angle, to: 0, t0: performance.now(), dur: SNAP_MS };
    spin.target = 0;
    return;
  }
  spin.name = name;
  spin.target = targetAngle;
  /* 阻尼：时长随角度差缩放，保证手感一致 */
  const dur = Math.min(420, SNAP_MS + Math.abs(targetAngle - angle) * 1.2);
  spin.anim = { from: angle, to: targetAngle, t0: performance.now(), dur };
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
    else spin = null;
  }
}

const isBusy = () => !!spin || queue.length > 0;

/* ============================================================
   5. 拖拽 -> 转动数学
   ============================================================ */
function screenDeltaPerDeg(axis, P0) {
  const s0 = projectToStage(P0);
  const s1 = projectToStage(m4mv(m4rot(AXIS_VEC[axis], 1), P0));
  return [s1[0]-s0[0], s1[1]-s0[1]];
}
function grabPoint(c, nWorld) {
  return [ (c.p[0]+nWorld[0]*0.5)*PX, (c.p[1]+nWorld[1]*0.5)*PX, (c.p[2]+nWorld[2]*0.5)*PX ];
}

/* 按用户直觉选轴选层：水平拖 -> 绕该面的「下」；垂直拖 -> 绕该面的「右」 */
function pickTurnFromDrag(c, faceKey, dv) {
  const fr = FACE_FRAME[faceKey];
  const horizontal = Math.abs(dv[0]) >= Math.abs(dv[1]);
  const axisVec = horizontal ? fr.down : fr.right;
  const axis = axisVec.findIndex(v => v !== 0);
  return { axis, coord: c.p[axis], horizontal };
}

/* 弧长跟随：鼠标拖 d 像素，抓取点沿弧走 d 像素 */
function solveDragAngle(axis, P0, dv) {
  const s0 = projectToStage(P0);
  const t1 = screenDeltaPerDeg(axis, P0);
  const tl = Math.hypot(t1[0], t1[1]);
  if (tl < 1e-6) return 0;
  const tx = t1[0]/tl, ty = t1[1]/tl;
  const along = dv[0]*tx + dv[1]*ty;
  const sgn = along >= 0 ? 1 : -1;
  const target = Math.hypot(dv[0], dv[1]);
  if (target < 0.5) return 0;
  const distAt = th => {
    const p = projectToStage(m4mv(m4rot(AXIS_VEC[axis], th), P0));
    return Math.hypot(p[0]-s0[0], p[1]-s0[1]);
  };
  let prevM = 0, hitM = -1, maxD = 0, maxM = 0;
  for (let m = 1; m <= 180; m++) {
    const d = distAt(sgn*m);
    if (d > maxD) { maxD = d; maxM = m; }
    if (d >= target) { hitM = m; break; }
    prevM = m;
  }
  if (hitM < 0) return sgn * maxM;
  let lo = prevM, hi = hitM;
  for (let i = 0; i < 26; i++) {
    const mid = (lo+hi)/2;
    if (distAt(sgn*mid) < target) lo = mid; else hi = mid;
  }
  return sgn * ((lo+hi)/2);
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
