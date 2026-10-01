const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

const start = s.indexOf("/* 单位向量投影到屏幕的方向（用于把拖拽方向翻译成转动） */");
const end   = s.indexOf("function invertMove(name)");
if (start < 0 || end < 0) throw new Error('anchor not found');

const NEW = `/* ============================================================
   7b. 拖拽 -> 转动的数学（投影法）
   思路：把「拖拽方向」投影到候选旋转轴在屏幕上的运动方向上，
        选投影最大的轴，再解出恰好让抓取点跟住鼠标的旋转角。
   ============================================================ */

/* 绕 axis 转 1 度时，抓取点在屏幕上移动多少像素（线性近似） */
function screenDeltaPerDeg(axis, P0) {
  const s0 = projectToStage(P0);
  const s1 = projectToStage(m4mv(m4rot(AXIS_VEC[axis], 1), P0));
  return [s1[0] - s0[0], s1[1] - s0[1]];
}

/* 抓取点世界坐标：所在小方块的面上、沿法向偏移半格 */
function grabPoint(c, nWorld) {
  return [
    (c.p[0] + nWorld[0] * 0.5) * PX,
    (c.p[1] + nWorld[1] * 0.5) * PX,
    (c.p[2] + nWorld[2] * 0.5) * PX,
  ];
}

/* 选轴：把拖拽向量投影到每条候选轴的运动方向，取投影最大者。
   返回 { axis, coord, d1, len } —— d1 为该轴每度的屏幕位移 */
function pickAxis(c, nWorld, dv) {
  const nAxis = nWorld.findIndex(v => v !== 0);
  const P0 = grabPoint(c, nWorld);
  let best = null;
  for (let a = 0; a < 3; a++) {
    if (a === nAxis) continue;         // 该轴是点击面的法向，不能作为旋转轴
    if (c.p[a] === 0) continue;        // 中间层不存在
    const d1 = screenDeltaPerDeg(a, P0);
    const len = Math.hypot(d1[0], d1[1]);
    if (len < 1e-3) continue;          // 该轴的旋转在屏幕上几乎不产生位移
    const proj = (dv[0] * d1[0] + dv[1] * d1[1]) / len;   // dv 在该轴方向上的投影长度
    if (!best || Math.abs(proj) > Math.abs(best.proj)) {
      best = { axis: a, coord: c.p[a], d1, len, proj };
    }
  }
  return best;
}

/* 解旋转角：让抓取点的屏幕位移 = 鼠标位移
   θ·d1 ≈ dv  ->  θ = (dv·d1)/|d1|²
   当 |d1| 过小（旋转轴几乎正对相机）时限制灵敏度，避免角度爆炸 */
function angleFromDrag(d1, dv) {
  const MIN_LEN = 0.34;                // 每度至少 0.34px 的屏幕位移
  const denom = Math.max(d1[0]*d1[0] + d1[1]*d1[1], MIN_LEN * MIN_LEN);
  return (dv[0] * d1[0] + dv[1] * d1[1]) / denom;
}

/* (axis, coord) 对应的层名（用于提示） */
function layerFaceName(axis, coord) {
  for (const k of FACE_KEYS) {
    const b = MOVES[k];
    if (b.layerAxis === axis && b.layerVal === coord) return k;
  }
  return '?';
}

/* ============================================================
   8. 交互
   ============================================================ */
const DRAG_LOCK_PX = 7;      // 超过此位移才锁定转层（避免误触）
const SNAP_DEG = 90;

function onDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  const cubieEl = e.target.closest ? e.target.closest('.cubie') : null;
  const c = cubieEl ? cubieEl.__cubie : null;
  const bodyEl = e.target.closest ? e.target.closest('.body-face') : null;
  const faceKey = bodyEl ? bodyEl.__face : null;   // 精确到「点中的是哪个面」

  const canTurn = mode === 'turn' && c && faceKey && !anim && unfoldT < 0.05;
  stageEl.setPointerCapture(e.pointerId);
  drag = {
    id: e.pointerId,
    x0: e.clientX, y0: e.clientY,
    kind: canTurn ? 'turn' : 'orbit',
    c, faceKey,
    nWorld: canTurn ? faceNormal(c, faceKey) : null,
    rx0: camT.rx, ry0: camT.ry,
    locked: false, axis: 0, coord: 0, angle: 0, hit: null, d1: null,
  };
  stageEl.classList.add('grabbing');
}

function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  const dist = Math.hypot(dx, dy);

  if (drag.kind === 'turn') {
    if (!drag.locked) {
      if (dist < DRAG_LOCK_PX) return;
      const t = pickAxis(drag.c, drag.nWorld, [dx, dy]);
      if (!t) {
        /* 无法判定（例如轴正对相机）：转为旋转视角，并抵消已累积位移避免跳变 */
        drag.kind = 'orbit';
        drag.rx0 = camT.rx + dy * 0.30;
        drag.ry0 = camT.ry - dx * 0.34;
        return;
      }
      drag.locked = true;
      drag.axis = t.axis;
      drag.coord = t.coord;
      drag.d1 = t.d1;                          // 锁定初始灵敏度，保证手感线性
      drag.hit = cubies.filter(cc => cc.p[t.axis] === t.coord);
      for (const cc of drag.hit) cc.el.classList.add('hi');
      roHintEl.textContent = layerFaceName(t.axis, t.coord) + ' 层';
      return;
    }
    /* 实时跟手 */
    drag.angle = angleFromDrag(drag.d1, [dx, dy]);
    roHintEl.textContent = layerFaceName(drag.axis, drag.coord) + ' 层 · ' +
                           Math.round(Math.abs(drag.angle)) + '°';
    return;
  }

  /* 旋转视角 */
  camT.ry = drag.ry0 + dx * 0.34;
  camT.rx = Math.max(-88, Math.min(88, drag.rx0 - dy * 0.30));
}

function clearHi() {
  for (const cc of cubies) cc.el.classList.remove('hi');
}

function onUp(e) {
  if (!drag) return;
  try { stageEl.releasePointerCapture(drag.id); } catch (_) {}
  const d = drag;
  drag = null;
  stageEl.classList.remove('grabbing');
  clearHi();
  roHintEl.textContent = mode === 'turn' ? '拖动贴纸转动' : '拖动旋转视角';

  if (d.kind === 'turn' && d.locked) {
    /* 吸附到最近的 90 度 */
    const steps = Math.round((d.angle || 0) / SNAP_DEG);
    if (steps !== 0) {
      const name = moveNameFor(d.axis, d.coord, Math.sign(steps));
      if (name) for (let i = 0; i < Math.abs(steps); i++) doMove(name);
    } else if (Math.abs(d.angle || 0) > 0.5) {
      dragSnapBack = { hit: d.hit, axis: d.axis, from: d.angle, t0: performance.now(), dur: 170 };
    }
  }
}

`;

s = s.slice(0, start) + NEW + s.slice(end);
fs.writeFileSync('work/app.js', s);
console.log('drag rewritten with projection method');
