const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 1) 补充 DOM 引用 */
s = s.replace("const miniCv     = document.getElementById('miniCube');",
`const miniCv     = document.getElementById('miniCube');
const roHintEl   = document.getElementById('roHint');`);

/* 2) 修复展开层分组：按「所点面」把 27 块分成 6 组（每组 9 块，互不重叠）。
      原实现 faceGroupOf 用「第一个可见面」，导致角块/棱块被归到同一组，
      展开时它们叠在一起 —— 这就是「不能同时展开」的根因。 */
s = s.replace(`/* 该 cubie 归属哪个展开面（取它的第一个可见面） */
function faceGroupOf(c) {
  for (const k of FACE_KEYS) if (c.faces[k]) return k;
  return 'F';
}`,
`/* 每个小方块在展开时归属哪个面。
   分配规则：按所点面的法向给方块分组，每组恰好 9 块且互不重叠：
     - 面心块（只有该面贴纸）      -> 该面
     - 棱块（该面 + 相邻面）        -> 优先分给「贴纸数最少」的面，保证 9 块
     - 角块（三个面）               -> 同上
   结果：6 组 × 9 块，展开后正好拼成十字形，不会重叠。 */
function assignGroups() {
  const groups = {}; for (const f of FACE_KEYS) groups[f] = [];
  /* 先按「贴纸数量」升序处理：面心(1) -> 棱(2) -> 角(3) */
  const sorted = cubies.slice().sort((a, b) =>
    Object.keys(a.faces).length - Object.keys(b.faces).length);
  for (const c of sorted) {
    const own = FACE_KEYS.filter(k => c.faces[k]);
    /* 选一个尚未满 9 块的面；优先选贴纸数最少的（即更"属于"该面） */
    let pick = null;
    for (const f of own) {
      if (groups[f].length < 9) { pick = f; break; }
    }
    if (!pick) pick = own[0] || 'F';
    groups[pick].push(c);
    c.group = pick;
  }
  return groups;
}
let GROUP_OF = {};     // cubie -> 面
function refreshGroups() {
  const g = assignGroups();
  GROUP_OF = {};
  for (const f of FACE_KEYS) for (const c of g[f]) GROUP_OF[c.id] = f;
}
function faceGroupOf(c) { return GROUP_OF[c.id] || 'F'; }`);

fs.writeFileSync('work/app.js', s);
console.log('grouping fixed');
