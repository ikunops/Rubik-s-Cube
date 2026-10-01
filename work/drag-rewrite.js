const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ============================================================
   重写 1：拖拽转层 —— 实时跟手预览 + 松手吸附
   ============================================================ */
const oldDrag = s.slice(s.indexOf("/* 该 cubie 上朝向相机的那个贴纸面的世界法向 */"),
                       s.indexOf("/* ============================================================\n   9. 控件"));

const newDrag = `/* 该 cubie 上朝向相机的那个贴纸面的世界法向 */
function nearestFaceNormal(c) {
  let best = null;
  for (const k of FACE_KEYS) {
    if (!c.faces[k]) continue;
    const n = faceNormal(c, k);
    const nz = m4dir(frameCam, n)[2];
    if (!best || nz > best.nz) best = { nz, n };
  }
  return best ? best.n : null;
}

/* 单位向量投影到屏幕的方向（用于把拖拽向量翻译成转动） */
function screenDirOfAxis(a, P0) {
  const s0 = projectToStage(P0);
  const s1 = projectToStage(m4mv(m4rot(AXIS_VEC[a], 9), P0));
  const dx = s1[0] - s0[0], dy = s1[1] - s0[1];
  const d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
}

/* 根据拖拽方向挑选最匹配的转动，返回 {axis, coord, sign} */
function pickTurn(c, nWorld, dv) {
  const nAxis = nWorld.findIndex(v => v !== 0);
  const P0 = [
    (c.p[0] + nWorld[0] * 0.5) * PX,
    (c.p[1] + nWorld[1] * 0.5) * PX,
    (c.p[2] + nWorld[2] * 0.5) * PX,
  ];
  const dl = Math.hypot(dv[0], dv[1]) || 1;
  let best = null;
  for (let a = 0; a < 3; a++) {
    if (a === nAxis) continue;
    const coord = c.p[a];
    if (coord === 0) continue;
    for (const sign of [1, -1]) {
      const dir = screenDirOfAxis(a, P0);
      const score = (sign > 0 ? 1 : -1) * (dir[0] * dv[0] + dir[1] * dv[1]) / dl;
      if (!best || score > best.score) best = { score, axis: a, coord, sign };
    }
  }
  return best;
}
function turnName(t) { return moveNameFor(t.axis, t.coord, t.sign); }

/* ============================================================
   8. 交互
   ============================================================ */
/* 拖拽状态机：
   - 按下贴纸 -> 预备
   - 移动超过阈值 -> 锁定一个层/方向，进入实时跟手预览
   - 拖拽中实时旋转该层（drag.previewAngle）
   - 松手 -> 吸附到最近的 90 度并提交 */
const DRAG_LOCK_PX = 9;      // 超过此位移才锁定转层（避免误触）
const SNAP_DEG = 90;

function onDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  const hitEl = e.target.closest ? e.target.closest('.cubie') : null;
  const c = hitEl ? hitEl.__cubie : null;
  const canTurn = mode === 'turn' && c && !anim && unfoldT < 0.05;
  stageEl.setPointerCapture(e.pointerId);
  drag = {
    id: e.pointerId,
    x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY,
    kind: canTurn ? 'turn' : 'orbit',
    c, rx0: camT.rx, ry0: camT.ry,
    locked: false, axis: 0, coord: 0, sign: 1, angle: 0, name: null,
  };
  stageEl.classList.add('grabbing');
}

function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  drag.x = e.clientX; drag.y = e.clientY;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  const dist = Math.hypot(dx, dy);

  if (drag.kind === 'turn') {
    if (!drag.locked) {
      if (dist < DRAG_LOCK_PX) return;
      const nWorld = nearestFaceNormal(drag.c);
      const t = nWorld ? pickTurn(drag.c, nWorld, [dx, dy]) : null;
      if (!t) { drag.kind = 'orbit'; drag.rx0 = camT.rx; drag.ry0 = camT.ry; return; }
      drag.locked = true;
      drag.axis = t.axis; drag.coord = t.coord; drag.sign = t.sign;
      drag.name = turnName(t);
      /* 命中该层的全部小方块（整层 9 块一起动） */
      drag.hit = cubies.filter(cc => cc.p[t.axis] === t.coord);
      drag.baseTurn = m4rot(AXIS_VEC[t.axis], 0);
      cubeEl.classList.add('animating');
      return;
    }
    /* 实时跟手：把拖拽位移投影到该轴在屏幕上的方向，换算成角度 */
    const nWorld = nearestFaceNormal(drag.c);
    if (!nWorld) return;
    const P0 = [
      (drag.c.p[0] + nWorld[0] * 0.5) * PX,
      (drag.c.p[1] + nWorld[1] * 0.5) * PX,
      (drag.c.p[2] + nWorld[2] * 0.5) * PX,
    ];
    const dir = screenDirOfAxis(drag.axis, P0);
    const along = (dx * dir[0] + dy * dir[1]) * drag.sign;
    /* 屏幕上 1px 约等于多少度：用层宽（PX）对应 90 度估算，手感自然 */
    const degPerPx = 90 / (PX * 1.15);
    drag.angle = along * degPerPx;
    return;
  }

  /* 视角 */
  camT.ry = drag.ry0 + dx * 0.34;
  camT.rx = Math.max(-88, Math.min(88, drag.rx0 - dy * 0.30));
}

function onUp(e) {
  if (!drag) return;
  try { stageEl.releasePointerCapture(drag.id); } catch (_) {}
  const d = drag;
  drag = null;
  stageEl.classList.remove('grabbing');

  if (d.kind === 'turn' && d.locked) {
    /* 吸附：拖过 45 度就转一格 */
    const deg = d.angle || 0;
    const steps = Math.round(deg / SNAP_DEG);
    cubeEl.classList.remove('animating');
    /* 用队列播放 0~1 格的动画，保证视觉与状态一致 */
    if (steps !== 0) {
      const n = Math.abs(steps);
      for (let i = 0; i < n; i++) doMove(steps > 0 ? d.name : invertMove(d.name));
    } else {
      /* 没拖动足够距离：把预览角度归零 */
      dragSnapBack = { hit: d.hit, axis: d.axis, from: deg, t0: performance.now(), dur: 160 };
    }
  }
}

function invertMove(name) { return name.endsWith("'") ? name[0] : name + "'"; }

`;

s = s.replace(oldDrag, newDrag);
fs.writeFileSync('work/app.js', s);
console.log('drag rewritten');
