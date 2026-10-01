const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ============================================================
   方向判定改用「面中心」而非「抓取点」
   原因：抓取点在角落时，其自身切线投影可能偏离用户直觉方向 60°以上，
        导致「向左拖却向右转」。
   改为：用面中心的切线方向判定正负 —— 同一个面上任意位置拖动，
        方向完全一致（符合「看鼠标往哪条边拖就往哪转」）。
        幅度仍按抓取点弧长计算，保证跟手。
   ============================================================ */
s = s.replace(`function solveDragAngle(axis, P0, dv) {
  const s0 = projectToStage(P0);
  const t1 = screenDeltaPerDeg(axis, P0);
  const tl = Math.hypot(t1[0], t1[1]);
  if (tl < 1e-6) return 0;
  const tx = t1[0]/tl, ty = t1[1]/tl;
  const along = dv[0]*tx + dv[1]*ty;
  const sgn = along >= 0 ? 1 : -1;
  const target = Math.hypot(dv[0], dv[1]);
  if (target < 0.5) return 0;`,
`/* 方向参考点：面中心（稳定、可预测） */
function faceRefPoint(faceKey) {
  const sc = sheetCenter(faceKey);
  return [sc[0]*PX, sc[1]*PX, sc[2]*PX];
}

function solveDragAngle(axis, P0, dv, faceKey) {
  const s0 = projectToStage(P0);
  /* 正负号：用面中心的切线投影决定 —— 同一面任意位置方向一致 */
  const R0 = faceRefPoint(faceKey);
  const rt = screenDeltaPerDeg(axis, R0);
  const rl = Math.hypot(rt[0], rt[1]);
  if (rl < 1e-6) return 0;
  const along = dv[0]*(rt[0]/rl) + dv[1]*(rt[1]/rl);
  const sgn = along >= 0 ? 1 : -1;
  /* 幅度：拖多远，抓取点就沿弧走多远（跟手） */
  const target = Math.hypot(dv[0], dv[1]);
  if (target < 0.5) return 0;`);

/* 调用处传入 faceKey */
s = s.replace("    const a1 = solveDragAngle(drag.axis, drag.P0, [dx, dy]);",
              "    const a1 = solveDragAngle(drag.axis, drag.P0, [dx, dy], drag.faceKey);");

fs.writeFileSync('work/app.js', s);
console.log('face-center sign applied');
