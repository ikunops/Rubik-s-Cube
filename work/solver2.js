const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

const a = s.indexOf("/* 解旋转角：直接搜索");
const b = s.indexOf("/* (axis, coord) 对应的层名 */");
if (a < 0 || b < 0) throw new Error('anchor not found');

const NEW = `/* 解旋转角。
   抓取点绕轴旋转时在屏幕上走一段圆弧（投影后是椭圆），
   所以「拖拽方向」不可能总被完全跟随。
   做法：先把拖拽向量投影到该轴在抓取点处的切向（取可达分量），
        再精确求解让抓取点落到该投影目标的角度。
   效果：鼠标怎么拖，这一层就朝那个方向转，且跟手是精确的。 */
function solveDragAngle(axis, P0, dv) {
  const s0 = projectToStage(P0);
  /* 切向：绕轴转 1 度时抓取点在屏幕上的移动方向 */
  const t1 = screenDeltaPerDeg(axis, P0);
  const tl = Math.hypot(t1[0], t1[1]);
  if (tl < 1e-6) return 0;
  const tx = t1[0] / tl, ty = t1[1] / tl;
  /* 拖拽在切向上的可达分量 */
  const along = dv[0] * tx + dv[1] * ty;
  const gx = s0[0] + tx * along, gy = s0[1] + ty * along;

  const cost = th => {
    const p = projectToStage(m4mv(m4rot(AXIS_VEC[axis], th), P0));
    const ex = p[0] - gx, ey = p[1] - gy;
    return ex * ex + ey * ey;
  };
  /* 粗扫 2 度 + 两轮细化 */
  let bestTh = 0, bestC = cost(0);
  for (let th = -180; th <= 180; th += 2) {
    const c = cost(th);
    if (c < bestC) { bestC = c; bestTh = th; }
  }
  let step = 2;
  for (let pass = 0; pass < 2; pass++) {
    step /= 10;
    const base = bestTh;
    for (let k = -10; k <= 10; k++) {
      const th = base + k * step;
      const c = cost(th);
      if (c < bestC) { bestC = c; bestTh = th; }
    }
  }
  return bestTh;
}

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/app.js', s);
console.log('projection + exact solver');
