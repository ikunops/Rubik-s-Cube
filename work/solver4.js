const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

const a = s.indexOf("/* 解旋转角（弧长跟随）。");
const b = s.indexOf("/* (axis, coord) 对应的层名 */");
if (a < 0 || b < 0) throw new Error('anchor not found');

const NEW = `/* 解旋转角（弧长跟随）。
   物理模型：鼠标拖了 d 像素，被抓的那个点就沿它所在的圆弧走 d 像素。
   抓取点的屏幕轨迹是椭圆（距离先增后减），所以先扫描找到「首个到达目标距离」
   的角度区间，再二分细化；若整段都到不了目标，则取最远点。
   效果：鼠标往哪拖，这一层就往哪转，抓取点始终贴着光标。 */
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

  /* 1 度步长扫描，找首个 dist >= target 的区间 [prev, cur] */
  let prevTh = 0, prevD = 0, hit = -1, maxD = 0, maxTh = 0;
  for (let th = 1; th <= 180; th++) {
    const d = distAt(th);
    if (d > maxD) { maxD = d; maxTh = th; }
    if (d >= target) { hit = th; break; }
    prevTh = th; prevD = d;
  }
  if (hit < 0) return sgn * maxTh;            // 到不了目标：取最远点

  /* 在 [prevTh, hit] 内二分细化 */
  let lo = prevTh, hi = hit;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (distAt(mid) < target) lo = mid; else hi = mid;
  }
  return sgn * ((lo + hi) / 2);
}

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/app.js', s);
console.log('scan+bisect solver');
