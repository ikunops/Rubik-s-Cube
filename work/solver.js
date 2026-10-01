const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 用精确求解替换线性近似 */
const a = s.indexOf("/* 解旋转角：让抓取点的屏幕位移等于鼠标位移");
const b = s.indexOf("/* (axis, coord) 对应的层名 */");
if (a < 0 || b < 0) throw new Error('anchor not found');

const NEW = `/* 解旋转角：直接搜索「让抓取点的屏幕位置最接近鼠标当前位置」的角度。
   线性近似在圆弧 + 透视下会有偏差，这里用粗扫 + 两轮细化精确求解，
   保证鼠标下的那个点真的跟着鼠标走。 */
function solveDragAngle(axis, P0, dv) {
  const s0 = projectToStage(P0);
  const tx = s0[0] + dv[0], ty = s0[1] + dv[1];
  const cost = th => {
    const p = projectToStage(m4mv(m4rot(AXIS_VEC[axis], th), P0));
    const ex = p[0] - tx, ey = p[1] - ty;
    return ex * ex + ey * ey;
  };
  /* 粗扫：3 度步长找最优区间 */
  let bestTh = 0, bestC = cost(0);
  for (let th = -180; th <= 180; th += 3) {
    const c = cost(th);
    if (c < bestC) { bestC = c; bestTh = th; }
  }
  /* 两轮细化 */
  let step = 3;
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

/* 使用精确求解 */
s = s.replace("    drag.angle = angleFromDrag(drag.d1, [dx, dy]);",
              "    drag.angle = solveDragAngle(drag.axis, drag.P0, [dx, dy]);");
s = s.replace("      drag.d1 = t.d1;                  // 锁定初始灵敏度，手感线性",
              "      drag.P0 = grabPoint(drag.c, drag.nWorld);   // 锁定抓取点，全程以它为基准");

/* 小方块完全展开时透明度归零 */
s = s.replace(`  if (solidFade > 0.01) {
    for (const c of cubies) {
      const M = m4mulAll((activeHit && activeHit.indexOf(c) >= 0) ? turnM : m4id(), baseM(c));
      c.el.style.transform = m4css(M);
      c.el.style.opacity = solidFade;
    }
  }`,
`  if (solidFade > 0.004) {
    for (const c of cubies) {
      const M = m4mulAll((activeHit && activeHit.indexOf(c) >= 0) ? turnM : m4id(), baseM(c));
      c.el.style.transform = m4css(M);
      c.el.style.opacity = solidFade;
    }
    solidHidden = false;
  } else if (!solidHidden) {
    for (const c of cubies) c.el.style.opacity = 0;
    solidHidden = true;
  }`);
s = s.replace("let dragSnapBack = null;          // 松手回弹",
              "let dragSnapBack = null;          // 松手回弹\nlet solidHidden = false;          // 小方块是否已完全隐藏");

fs.writeFileSync('work/app.js', s);
console.log('exact solver applied');
