const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

const a = s.indexOf("/* 解旋转角。");
const b = s.indexOf("/* (axis, coord) 对应的层名 */");
if (a < 0 || b < 0) throw new Error('anchor not found');

const NEW = `/* 解旋转角（弧长跟随）。
   物理模型：鼠标拖了 d 像素，被抓的那个点就沿它所在的圆弧走 d 像素。
   抓取点在屏幕上走的是椭圆弧，所以按弧长反解角度：
     找 θ 使 |screen(P(θ)) - screen(P(0))| = |拖拽在切向上的投影|
   这样鼠标往哪个方向拖，这一层就朝哪个方向转，且抓取点始终贴着光标。 */
function solveDragAngle(axis, P0, dv) {
  const s0 = projectToStage(P0);
  /* 切向（绕轴转 1 度时抓取点在屏幕上的移动方向） */
  const t1 = screenDeltaPerDeg(axis, P0);
  const tl = Math.hypot(t1[0], t1[1]);
  if (tl < 1e-6) return 0;
  const tx = t1[0] / tl, ty = t1[1] / tl;
  /* 拖拽在切向上的可达分量（决定转多少、朝哪边转） */
  const along = dv[0] * tx + dv[1] * ty;
  const target = Math.abs(along);
  const sgn = along >= 0 ? 1 : -1;
  if (target < 0.5) return 0;

  /* 屏幕位移随 |θ| 单调增（到一定程度后可能回落），取第一次到达目标的 θ */
  const distAt = th => {
    const p = projectToStage(m4mv(m4rot(AXIS_VEC[axis], th), P0));
    return Math.hypot(p[0] - s0[0], p[1] - s0[1]);
  };
  let lo = 0, hi = 1;
  while (hi < 180 && distAt(hi) < target) hi *= 1.6;
  if (hi > 180) hi = 180;
  for (let i = 0; i < 42; i++) {           // 二分，精度 180/2^42
    const mid = (lo + hi) / 2;
    if (distAt(mid) < target) lo = mid; else hi = mid;
  }
  return sgn * ((lo + hi) / 2);
}

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/app.js', s);
console.log('arc-length solver applied');
