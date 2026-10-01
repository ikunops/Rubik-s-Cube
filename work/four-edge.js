const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ============================================================
   核心修复：四条边的判定
   每个面的 3x3 格子有 4 条「运动方向」——上/下/左/右。
   点击位置所在的格子决定了「哪条边」，鼠标拖向哪边就绕那条边的方向转。
   用单位向量做最大投影，斜向拖动也有确定结果，不会因浮点误差抖动。
   ============================================================ */
const a = s.indexOf("/* 按用户直觉选轴选层：水平拖 -> 绕该面的「下」；垂直拖 -> 绕该面的「右」 */");
const b = s.indexOf("/* 弧长跟随：鼠标拖 d 像素，抓取点沿弧走 d 像素 */");
if (a < 0 || b < 0) throw new Error('pickTurnFromDrag anchor not found');

const NEW = `/* 选轴选层（四边判定）。
   用户点击某个格子后，鼠标往哪个方向拖，这一层就绕该方向对应的轴转。
   四条边的运动方向（从面外看）：
     向右拖 -> 绕该面的 down 轴     (水平方向)
     向左拖 -> 同样绕 down 轴，反向
     向下拖 -> 绕该面的 right 轴    (垂直方向)
     向上拖 -> 同样绕 right 轴，反向
   用「单位向量最大投影」判定，斜向拖动也稳定（不会因浮点误差左右横跳）。
   层由点击格子在对应轴上的坐标决定（±1 或 0=中间层 M/E/S）。 */
function pickTurnFromDrag(c, faceKey, dv) {
  const fr = FACE_FRAME[faceKey];
  const len = Math.hypot(dv[0], dv[1]) || 1;
  const ux = dv[0] / len, uy = dv[1] / len;

  /* 两个候选轴：水平拖 -> down 轴；垂直拖 -> right 轴 */
  const cands = [
    { vec: fr.down,  w: Math.abs(ux) },   // 水平分量强度
    { vec: fr.right, w: Math.abs(uy) },   // 垂直分量强度
  ];
  /* 取强度更大者；相等时（正 45 度）按固定规则选，保证稳定 */
  let pick = cands[0];
  if (cands[1].w > cands[0].w + 1e-9) pick = cands[1];

  const axis = pick.vec.findIndex(v => v !== 0);
  return { axis, coord: c.p[axis] };
}

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/app.js', s);
console.log('four-edge picker applied');
