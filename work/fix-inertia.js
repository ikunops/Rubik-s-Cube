const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 修复 1：惯性限幅 + 逐格拆分，保证逻辑与视觉一致 ---- */
const a = s.indexOf("/* 松手：带阻尼吸附到最近 90 度 */");
const b = s.indexOf("/* 主循环里推进 spin */");
if (a < 0 || b < 0) throw new Error('releaseSpin anchor not found');

const NEW = `/* 松手：阻尼吸附到最近的 90 度。
   关键约束：视觉转了几格，逻辑就必须应用几格。
   做法：把总步数拆成「第一格做吸附动画 + 剩余格入队」，每格都有一次 commit。 */
const MAX_INERTIA_STEPS = 1;      // 惯性最多多带 1 格
const MAX_DRAG_STEPS = 2;         // 单次拖拽最多 2 格

function releaseSpin(angle, velocity) {
  if (!spin) return;
  /* 惯性限幅：最多再带 0.45 格，避免甩一下就转十几格 */
  const inertia = Math.max(-0.45, Math.min(0.45, (velocity || 0) * 0.18));
  const projected = angle + inertia * SNAP_DEG;
  let steps = Math.round(projected / SNAP_DEG);
  /* 快速甩动至少一格 */
  if (steps === 0 && Math.abs(velocity || 0) > 1.1) steps = Math.sign(velocity);
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

  /* 第一格：从当前角度阻尼吸附到 ±90，提交后由 pumpQueue 接着播剩余格 */
  spin.name = name;
  spin.target = dir * SNAP_DEG;
  const dur = Math.min(380, SNAP_MS + Math.abs(spin.target - angle) * 1.0);
  spin.anim = { from: angle, to: dir * SNAP_DEG, t0: performance.now(), dur };

  /* 剩余格数入队（每格都会独立 commit，逻辑与视觉严格一致） */
  for (let i = 1; i < n; i++) queue.push(name);
}

`;
s = s.slice(0, a) + NEW + s.slice(b);

/* ---- 修复 2：速度用 EMA 平滑，避免瞬时尖峰 ---- */
s = s.replace(`    const a0 = spin ? spin.angle : 0;
    const a1 = solveDragAngle(drag.axis, drag.P0, [dx, dy]);
    drag.vel = (a1 - a0) / dt * 1000 / 90;    // 每秒多少格
    drag.lastX = e.clientX; drag.lastY = e.clientY; drag.lastT = nowT;`,
`    const a0 = spin ? spin.angle : 0;
    const a1 = solveDragAngle(drag.axis, drag.P0, [dx, dy]);
    const inst = (a1 - a0) / dt * 1000 / 90;          // 瞬时角速度（格/秒）
    drag.vel = drag.vel * 0.55 + inst * 0.45;         // EMA 平滑，抑制尖峰
    drag.lastX = e.clientX; drag.lastY = e.clientY; drag.lastT = nowT;`);

/* ---- 修复 3：吸附回零后也要消费队列 ---- */
s = s.replace(`    if (spin.name) commitSpin();
    else { spin = null; pumpQueue(); }`,
`    if (spin.name) commitSpin();
    else { spin = null; pumpQueue(); }`);

fs.writeFileSync('work/app.js', s);
console.log('inertia clamped + per-step commit');
