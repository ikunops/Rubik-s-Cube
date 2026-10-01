const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

const a = s.indexOf("/* 解旋转角（弧长跟随）。");
const b = s.indexOf("/* (axis, coord) 对应的层名 */");
if (a < 0 || b < 0) throw new Error('anchor not found');

const NEW = `/* 解旋转角（弧长跟随）。
   物理模型：鼠标拖了 d 像素，被抓的那个点就沿它所在的圆弧走 d 像素。
   抓取点的屏幕轨迹是椭圆（距离先增后减），所以先按拖拽方向扫描，找到
   「首个到达目标距离」的角度区间，再二分细化；到不了目标就取最远点。
   注意：透视投影下 dist(+θ) ≠ dist(-θ)，因此必须沿拖拽方向扫描。 */
function solveDragAngle(axis, P0, dv) {
  const s0 = projectToStage(P0);
  const t1 = screenDeltaPerDeg(axis, P0);
  const tl = Math.hypot(t1[0], t1[1]);
  if (tl < 1e-6) return 0;
  const tx = t1[0] / tl, ty = t1[1] / tl;
  const along = dv[0] * tx + dv[1] * ty;      // 拖拽在切向上的可达分量
  const target = Math.abs(along);
  const sgn = along >= 0 ? 1 : -1;
  if (target < 0.5) return 0;

  const distAt = th => {
    const p = projectToStage(m4mv(m4rot(AXIS_VEC[axis], th), P0));
    return Math.hypot(p[0] - s0[0], p[1] - s0[1]);
  };

  /* 沿拖拽方向扫描（1 度步长），找首个 dist >= target 的区间 */
  let prevM = 0, hitM = -1, maxD = 0, maxM = 0;
  for (let m = 1; m <= 180; m++) {
    const d = distAt(sgn * m);
    if (d > maxD) { maxD = d; maxM = m; }
    if (d >= target) { hitM = m; break; }
    prevM = m;
  }
  if (hitM < 0) return sgn * maxM;            // 到不了目标：取最远点

  /* 在 [prevM, hitM] 内二分细化 */
  let lo = prevM, hi = hitM;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (distAt(sgn * mid) < target) lo = mid; else hi = mid;
  }
  return sgn * ((lo + hi) / 2);
}

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/app.js', s);
console.log('signed-direction scan applied');
