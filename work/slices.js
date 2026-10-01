const fs = require('fs');

/* ---- 1. core：加入 M/E/S 切片转动 ---- */
let c = fs.readFileSync('work/cube-core.js','utf8');
c = c.replace(`function moveInfo(name) {`,
`/* 中间层切片：M 跟随 L，E 跟随 D，S 跟随 F */
MOVES.M = { axis: [1,0,0], layerAxis: 0, layerVal: 0, rot: RXn90, ang: -90 };
MOVES.E = { axis: [0,1,0], layerAxis: 1, layerVal: 0, rot: RY90,  ang:  90 };
MOVES.S = { axis: [0,0,1], layerAxis: 2, layerVal: 0, rot: RZ90,  ang:  90 };
/* 可转动层（6 个面 + 3 个切片） */
const MOVE_KEYS = ['U','D','L','R','F','B','M','E','S'];

function moveInfo(name) {`);
fs.writeFileSync('work/cube-core.js', c);
console.log('slices added to core');

/* ---- 2. app：拖拽改为「按拖拽方向选轴 + 切片兜底」 ---- */
let s = fs.readFileSync('work/app.js','utf8');

/* moveNameFor 支持切片 */
s = s.replace(`function moveNameFor(axis, coord, sign) {
  for (const k of FACE_KEYS) {`,
`function moveNameFor(axis, coord, sign) {
  for (const k of MOVE_KEYS) {`);

/* 用「按拖拽方向分类」替换 pickAxis */
const a = s.indexOf("/* 选轴：拖拽向量在候选轴运动方向上的投影，取绝对值最大者 */");
const b = s.indexOf("/* 解旋转角（弧长跟随）。");
if (a < 0 || b < 0) throw new Error('pickAxis anchor not found');

const NEW_PICK = `/* 选轴 + 选层。
   按用户直觉：水平拖 -> 绕该面的「下」方向为轴，层由行决定；
              垂直拖 -> 绕该面的「右」方向为轴，层由列决定。
   中间层由切片 M/E/S 承担，因此任意位置、任意方向拖拽都有对应的层。 */
function pickTurnFromDrag(c, faceKey, dv) {
  const fr = FACE_FRAME[faceKey];
  const horizontal = Math.abs(dv[0]) >= Math.abs(dv[1]);
  const axisVec = horizontal ? fr.down : fr.right;
  const axis = axisVec.findIndex(v => v !== 0);
  const coord = c.p[axis];
  return { axis, coord, horizontal };
}

`;
s = s.slice(0, a) + NEW_PICK + s.slice(b);

/* 解旋转角：目标弧长改为「拖拽距离」（跟手） */
s = s.replace(`function solveDragAngle(axis, P0, dv) {
  const s0 = projectToStage(P0);
  const t1 = screenDeltaPerDeg(axis, P0);
  const tl = Math.hypot(t1[0], t1[1]);
  if (tl < 1e-6) return 0;
  const tx = t1[0] / tl, ty = t1[1] / tl;
  const along = dv[0] * tx + dv[1] * ty;      // 拖拽在切向上的可达分量
  const target = Math.abs(along);
  const sgn = along >= 0 ? 1 : -1;
  if (target < 0.5) return 0;`,
`function solveDragAngle(axis, P0, dv) {
  const s0 = projectToStage(P0);
  const t1 = screenDeltaPerDeg(axis, P0);
  const tl = Math.hypot(t1[0], t1[1]);
  if (tl < 1e-6) return 0;
  const tx = t1[0] / tl, ty = t1[1] / tl;
  /* 方向：拖拽在切向上的投影决定往哪边转 */
  const along = dv[0] * tx + dv[1] * ty;
  const sgn = along >= 0 ? 1 : -1;
  /* 幅度：拖多远，抓取点就沿弧走多远（跟手） */
  const target = Math.hypot(dv[0], dv[1]);
  if (target < 0.5) return 0;`);

/* onDown / onMove 适配新签名 */
s = s.replace(`  const bodyEl = e.target.closest ? e.target.closest('.body-face') : null;
  const faceKey = bodyEl ? bodyEl.__face : null;   // 精确到「点中的是哪个面」`,
`  const bodyEl = e.target.closest ? e.target.closest('.body-face') : null;
  const faceKey = bodyEl ? bodyEl.__face : null;   // 精确到「点中的是哪个面」`);

s = s.replace(`      const t = pickAxis(drag.c, drag.nWorld, [dx, dy]);`,
              `      const t = drag.faceKey ? pickTurnFromDrag(drag.c, drag.faceKey, [dx, dy]) : null;`);

s = s.replace(`      drag.P0 = grabPoint(drag.c, drag.nWorld);   // 锁定抓取点，全程以它为基准`,
              `      drag.P0 = grabPoint(drag.c, drag.nWorld);   // 锁定抓取点，全程以它为基准
      drag.horizontal = t.horizontal;`);

fs.writeFileSync('work/app.js', s);
console.log('drag -> direction-classified axis + slices');
