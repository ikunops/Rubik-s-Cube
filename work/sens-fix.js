const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

const a = s.indexOf("/* 计算当前拖拽应施加的旋转角。");
const b = s.indexOf("function moveNameFor(axis, coord, sign) {");
if (a < 0 || b < 0) throw new Error('anchor');

const NEW = `/* 计算当前拖拽应施加的旋转角。
   关键：灵敏度必须与「拖拽距离」成正比（常量），不能依赖切线投影大小。
   原因：某些位置/方向上，拖拽方向与所有候选轴的切线都近乎垂直
        （对齐度可低至 0.13），若按切线投影算角度就会趋近 0，
        表现为"拖了却不动" —— 这正是"一会能一会不行"的根因。
   做法：方向由切线投影的符号决定，幅度由拖拽距离线性给出：
        拖约 0.8 个小方块宽 = 转 90°。任意方向都可靠触发。 */
const DRAG_90_FACTOR = 0.8;
function dragAngleFor(drag, dx, dy) {
  const p = drag.pick;
  if (!p) return 0;
  const dl = Math.hypot(dx, dy);
  if (dl < 0.5) return 0;
  const proj = dx * p.t[0] + dy * p.t[1];     // 有符号：决定朝哪边转
  const sgn = proj >= 0 ? 1 : -1;
  const degPerPx = 90 / (PX * DRAG_90_FACTOR);
  return Math.max(-140, Math.min(140, sgn * dl * degPerPx));
}

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/app.js', s);
console.log('constant sensitivity applied');
