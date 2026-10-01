const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ============================================================
   方向判定改用「正交投影」
   问题：透视投影下，抓取点靠边时会多出一个「远离中心」的分量，
        当该分量压过旋转分量时，点在屏幕上会朝反方向移动，
        表现为「向左拖却向右转」。
   修复：方向与角度都用正交投影求解 —— 旋转分量单调，
        同一面任意位置方向完全一致。
   ============================================================ */
s = s.replace("function projectToStage(v) {",
`/* 正交投影（用于方向判定与角度求解，去掉透视干扰） */
function projectOrtho(v) {
  const p = m4mv(frameCam, v);
  return [p[0], p[1]];
}

function projectToStage(v) {`);

/* screenDeltaPerDeg 与 solveDragAngle 改用正交投影 */
s = s.replace(`function screenDeltaPerDeg(axis, P0) {
  const s0 = projectToStage(P0);
  const s1 = projectToStage(m4mv(m4rot(AXIS_VEC[axis], 1), P0));
  return [s1[0]-s0[0], s1[1]-s0[1]];
}`,
`function screenDeltaPerDeg(axis, P0) {
  const s0 = projectOrtho(P0);
  const s1 = projectOrtho(m4mv(m4rot(AXIS_VEC[axis], 1), P0));
  return [s1[0]-s0[0], s1[1]-s0[1]];
}`);

const a = s.indexOf("function solveDragAngle(axis, P0, dv, faceKey) {");
const b = s.indexOf("function moveNameFor(axis, coord, sign) {");
if (a < 0 || b < 0) throw new Error('solveDragAngle anchor not found');

const NEW = `function solveDragAngle(axis, P0, dv, faceKey) {
  const s0 = projectOrtho(P0);
  /* 正负号：用面中心的切线投影决定 —— 同一面任意位置方向一致 */
  const R0 = faceRefPoint(faceKey);
  const rt = screenDeltaPerDeg(axis, R0);
  const rl = Math.hypot(rt[0], rt[1]);
  if (rl < 1e-6) return 0;
  const along = dv[0]*(rt[0]/rl) + dv[1]*(rt[1]/rl);
  const sgn = along >= 0 ? 1 : -1;
  /* 幅度：拖多远，抓取点就沿弧走多远（正交下单调，稳定跟手） */
  const target = Math.hypot(dv[0], dv[1]);
  if (target < 0.5) return 0;
  const distAt = th => {
    const p = projectOrtho(m4mv(m4rot(AXIS_VEC[axis], th), P0));
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

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/app.js', s);
console.log('orthographic solver applied');
