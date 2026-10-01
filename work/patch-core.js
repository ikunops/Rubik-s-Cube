const fs = require('fs');
let s = fs.readFileSync('work/cube-core.js', 'utf8');

const anchor = "const FACE_KEYS = ['U','D','F','B','L','R'];";
if (!s.includes(anchor)) throw new Error('anchor not found');

const add = anchor + `

/* 每个面的标准局部坐标系（从面外看：right=屏幕右, down=屏幕下）
   满足 right x down === n，保证 6 个面的网格方向一致 */
const FACE_FRAME = {
  U: { n: [ 0,-1, 0], right: [ 1, 0, 0], down: [ 0, 0, 1] },
  D: { n: [ 0, 1, 0], right: [ 1, 0, 0], down: [ 0, 0,-1] },
  F: { n: [ 0, 0, 1], right: [ 1, 0, 0], down: [ 0, 1, 0] },
  B: { n: [ 0, 0,-1], right: [-1, 0, 0], down: [ 0, 1, 0] },
  L: { n: [-1, 0, 0], right: [ 0, 0, 1], down: [ 0, 1, 0] },
  R: { n: [ 1, 0, 0], right: [ 0, 0,-1], down: [ 0, 1, 0] },
};
/* 面中心（世界坐标） */
const FACE_CENTER = {
  U: [0,-1,0], D: [0,1,0], F: [0,0,1], B: [0,0,-1], L: [-1,0,0], R: [1,0,0],
};
/* 面网格 (row, col) -> 该面局部的 3D 偏移 */
function faceCellOffset(f, row, col) {
  const fr = FACE_FRAME[f];
  return [0,1,2].map(i => (col - 1) * fr.right[i] + (row - 1) * fr.down[i]);
}
/* 面中心 + 网格偏移 -> 世界坐标 */
function faceCellCenter(f, row, col) {
  const c = FACE_CENTER[f], o = faceCellOffset(f, row, col);
  return [c[0] + o[0], c[1] + o[1], c[2] + o[2]];
}`;

s = s.replace(anchor, add);
fs.writeFileSync('work/cube-core.js', s);
console.log('core patched ok');
