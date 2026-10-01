const fs = require('fs');
let s = fs.readFileSync('work/cube-core.js', 'utf8');

/* 1) 增加外表面常量 */
s = s.replace("/* 面网格 (row, col) -> 该面局部的 3D 偏移 */",
`/* 魔方外表面到中心的距离（3 个单位方块，中心在 ±1，故半宽 1.5） */
const CUBE_HALF = 1.5;
/* 某个面的"贴纸面"中心（位于外表面） */
function sheetCenter(f) {
  const c = FACE_CENTER[f];
  return [c[0]*CUBE_HALF, c[1]*CUBE_HALF, c[2]*CUBE_HALF];
}

/* 面网格 (row, col) -> 该面局部的 3D 偏移 */`);

/* 2) 铰链默认 H 用外表面 */
s = s.replace("function buildHinges(H) {", "function buildHinges(H = CUBE_HALF) {");

/* 3) 展开图 2D 间距 = 3（每个面 3 个单位宽） */
s = s.replace(`/* 给定面 f 的格子 (row r, col c) -> 该贴在魔方上的小方块坐标 */`,
`/* 展开图 2D 网格：相邻面中心间距（每面 3 个单位宽） */
const NET_PITCH = 3;
/* 面 f 在展开图中的 2D 中心偏移 */
function netOffset2D(f) {
  const { col, row } = NET_LAYOUT[f];
  return [(col - 1) * NET_PITCH, (row - 1) * NET_PITCH];
}

/* 给定面 f 的格子 (row r, col c) -> 该贴在魔方上的小方块坐标 */`);

fs.writeFileSync('work/cube-core.js', s);
console.log('core updated');
