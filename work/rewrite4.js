const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 1. 替换 pickTurnFromDrag ---- */
const a1 = s.indexOf("/* 选轴选层（四边判定）。");
const b1 = s.indexOf("/* 方向参考点：面中心（稳定、可预测） */");
if (a1 < 0 || b1 < 0) throw new Error('pickTurn anchor: ' + a1 + ',' + b1);

const NEW_PICK = `/* ============================================================
   四边判定（重写）
   关键认识：让「被抓住的点」精确跟住鼠标在几何上做不到
     —— 面边缘处该点的切线与鼠标方向近乎垂直。
   正确模型（符合"看鼠标往哪条边拖"的直觉）：
     1. 以「面中心」在屏幕上的两个运动方向为基准：
          tDown  = 绕该面 down 轴转时，面中心的屏幕移动方向（对应拖 左/右）
          tRight = 绕该面 right 轴转时，面中心的屏幕移动方向（对应拖 上/下）
     2. 把鼠标位移投影到这两个基准，取分量大者 -> 决定绕哪条轴转
     3. 层由「点击格子在该轴上的坐标」决定（±1，或 0 = 中间层 M/E/S）
     4. 角度由投影分量线性映射（拖约 1.3 个格宽 = 90°）
   这样任意位置、任意方向都稳定可预测。
   ============================================================ */

/* 面基准：两个候选轴及其在面中心处的屏幕运动方向 */
function faceBasis(faceKey) {
  const fr = FACE_FRAME[faceKey];
  const R0 = faceRefPoint(faceKey);
  const aDown  = fr.down.findIndex(v => v !== 0);
  const aRight = fr.right.findIndex(v => v !== 0);
  return { aDown, aRight,
           tDown:  screenDeltaPerDeg(aDown,  R0),
           tRight: screenDeltaPerDeg(aRight, R0) };
}

function pickTurnFromDrag(c, faceKey, dv) {
  const { aDown, aRight, tDown, tRight } = faceBasis(faceKey);
  const lD = Math.hypot(tDown[0], tDown[1])  || 1;
  const lR = Math.hypot(tRight[0], tRight[1]) || 1;
  const projD = (dv[0]*tDown[0]  + dv[1]*tDown[1])  / lD;
  const projR = (dv[0]*tRight[0] + dv[1]*tRight[1]) / lR;
  if (Math.abs(projD) >= Math.abs(projR)) {
    return { axis: aDown,  coord: c.p[aDown],  sign: projD >= 0 ? 1 : -1, proj: projD };
  }
  return { axis: aRight, coord: c.p[aRight], sign: projR >= 0 ? 1 : -1, proj: projR };
}

/* 角度：投影分量线性映射。拖约 1.3 个格子宽 = 90° */
function angleFromProjection(proj) {
  const k = 90 / (PX * 1.3);
  return Math.max(-150, Math.min(150, proj * k));
}

`;
s = s.slice(0, a1) + NEW_PICK + s.slice(b1);

/* ---- 2. 替换 solveDragAngle 为基于投影的角度计算 ---- */
const a2 = s.indexOf("function solveDragAngle(axis, P0, dv, faceKey) {");
const b2 = s.indexOf("function moveNameFor(axis, coord, sign) {");
if (a2 < 0 || b2 < 0) throw new Error('solveDrag anchor: ' + a2 + ',' + b2);

const NEW_ANGLE = `/* 计算当前拖拽应施加的旋转角。
   drag.pick 保存了锁定时选定的轴与正负号；角度由投影分量线性给出。 */
function dragAngleFor(drag, dx, dy) {
  const { aDown, aRight, tDown, tRight } = drag.basis;
  const lD = Math.hypot(tDown[0], tDown[1])  || 1;
  const lR = Math.hypot(tRight[0], tRight[1]) || 1;
  const projD = (dx*tDown[0]  + dy*tDown[1])  / lD;
  const projR = (dx*tRight[0] + dy*tRight[1]) / lR;
  /* 用锁定时选定的轴对应的分量 */
  const proj = drag.pick.axis === aDown ? projD : projR;
  return drag.pick.sign * angleFromProjection(Math.abs(proj)) * (proj >= 0 ? 1 : -1);
}

`;
s = s.slice(0, a2) + NEW_ANGLE + s.slice(b2);

fs.writeFileSync('work/app.js', s);
console.log('picker + angle replaced');
