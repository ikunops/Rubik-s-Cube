/* ============================================================
   电子魔方 · Electronic Rubik's Cube
   核心数学库：3x3 整数矩阵 / 4x4 变换矩阵
   ============================================================ */

/* ---------- 3x3 ---------- */
const I3 = [[1,0,0],[0,1,0],[0,0,1]];

function m3mul(A, B) {
  const C = [[0,0,0],[0,0,0],[0,0,0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += A[i][k] * B[k][j];
      C[i][j] = s;
    }
  return C;
}
function m3tv(A, v) {
  return [
    A[0][0]*v[0] + A[0][1]*v[1] + A[0][2]*v[2],
    A[1][0]*v[0] + A[1][1]*v[1] + A[1][2]*v[2],
    A[2][0]*v[0] + A[2][1]*v[1] + A[2][2]*v[2],
  ];
}
function m3T(A) {
  return [[A[0][0],A[1][0],A[2][0]],
          [A[0][1],A[1][1],A[2][1]],
          [A[0][2],A[1][2],A[2][2]]];
}
function m3snap(A) { return A.map(r => r.map(v => Math.round(v))); }

/* 90 度旋转矩阵（CSS 约定：x 右 / y 下 / z 朝向观察者） */
const RX90  = [[1,0,0],[0,0,-1],[0,1,0]];
const RXn90 = [[1,0,0],[0,0,1],[0,-1,0]];
const RY90  = [[0,0,1],[0,1,0],[-1,0,0]];
const RYn90 = [[0,0,-1],[0,1,0],[1,0,0]];
const RZ90  = [[0,-1,0],[1,0,0],[0,0,1]];
const RZn90 = [[0,1,0],[-1,0,0],[0,0,1]];

/* ---------- 4x4（行主序，M[r*4+c]） ---------- */
function m4id() {
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}
function m4mul(A, B) {
  const C = new Array(16).fill(0);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += A[i*4+k] * B[k*4+j];
      C[i*4+j] = s;
    }
  return C;
}
function m4mulAll(...ms) { return ms.reduce((a, b) => m4mul(a, b)); }
function m4T(x, y, z) {
  return [1,0,0,x, 0,1,0,y, 0,0,1,z, 0,0,0,1];
}
function m4S(s) {
  return [s,0,0,0, 0,s,0,0, 0,0,s,0, 0,0,0,1];
}
/* Rodrigues：绕单位轴 axis 旋转 deg 度 */
function m4rot(axis, deg) {
  const a = Math.hypot(...axis) || 1;
  const [x, y, z] = axis.map(v => v / a);
  const t = deg * Math.PI / 180;
  const c = Math.cos(t), s = Math.sin(t), C = 1 - c;
  return [
    x*x*C + c,   x*y*C - z*s, x*z*C + y*s, 0,
    y*x*C + z*s, y*y*C + c,   y*z*C - x*s, 0,
    z*x*C - y*s, z*y*C + x*s, z*z*C + c,   0,
    0,0,0,1,
  ];
}
/* 绕过点 p 的轴旋转 */
function m4rotAbout(axis, deg, p) {
  return m4mulAll(m4T(p[0], p[1], p[2]), m4rot(axis, deg), m4T(-p[0], -p[1], -p[2]));
}
function m4mv(M, v) {
  const [x, y, z] = v;
  const w = M[12]*x + M[13]*y + M[14]*z + M[15] || 1;
  return [
    (M[0]*x + M[1]*y + M[2]*z + M[3]) / w,
    (M[4]*x + M[5]*y + M[6]*z + M[7]) / w,
    (M[8]*x + M[9]*y + M[10]*z + M[11]) / w,
  ];
}
/* 只取旋转/缩放部分作用于方向向量 */
function m4dir(M, v) {
  const [x, y, z] = v;
  return [
    M[0]*x + M[1]*y + M[2]*z,
    M[4]*x + M[5]*y + M[6]*z,
    M[8]*x + M[9]*y + M[10]*z,
  ];
}
/* 行主序 -> CSS matrix3d（列主序） */
function m4css(M) {
  return 'matrix3d(' + [
    M[0], M[4], M[8],  M[12],
    M[1], M[5], M[9],  M[13],
    M[2], M[6], M[10], M[14],
    M[3], M[7], M[11], M[15],
  ].map(v => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(6))).join(',') + ')';
}
function m3to4(R) {
  return [R[0][0],R[0][1],R[0][2],0,
          R[1][0],R[1][1],R[1][2],0,
          R[2][0],R[2][1],R[2][2],0,
          0,0,0,1];
}

/* ---------- 颜色 / 面定义 ---------- */
/* CSS 空间：x 右 / y 下 / z 朝前 */
const FACE_DEF = {
  R: { n: [ 1, 0, 0], color: '#c8102e', label: 'R' },   // 右 · 红
  L: { n: [-1, 0, 0], color: '#ff6a00', label: 'L' },   // 左 · 橙
  U: { n: [ 0,-1, 0], color: '#f7f7f5', label: 'U' },   // 上 · 白
  D: { n: [ 0, 1, 0], color: '#ffd500', label: 'D' },   // 下 · 黄
  F: { n: [ 0, 0, 1], color: '#0057b8', label: 'F' },   // 前 · 蓝
  B: { n: [ 0, 0,-1], color: '#00a05a', label: 'B' },   // 后 · 绿
};
const FACE_KEYS = ['U','D','F','B','L','R'];

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
/* 魔方外表面到中心的距离（3 个单位方块，中心在 ±1，故半宽 1.5） */
const CUBE_HALF = 1.5;
/* 某个面的"贴纸面"中心（位于外表面） */
function sheetCenter(f) {
  const c = FACE_CENTER[f];
  return [c[0]*CUBE_HALF, c[1]*CUBE_HALF, c[2]*CUBE_HALF];
}

/* 面网格 (row, col) -> 该面局部的 3D 偏移 */
function faceCellOffset(f, row, col) {
  const fr = FACE_FRAME[f];
  return [0,1,2].map(i => (col - 1) * fr.right[i] + (row - 1) * fr.down[i]);
}
/* 面中心 + 网格偏移 -> 世界坐标 */
function faceCellCenter(f, row, col) {
  const c = FACE_CENTER[f], o = faceCellOffset(f, row, col);
  return [c[0] + o[0], c[1] + o[1], c[2] + o[2]];
}
const nKey = n => n[0] + ',' + n[1] + ',' + n[2];
const KEY_TO_FACE = {};
for (const k of FACE_KEYS) KEY_TO_FACE[nKey(FACE_DEF[k].n)] = k;

/* 把 +z 转到 n 的旋转矩阵 */
const Z_TO_N = {
  '1,0,0':  RY90,
  '-1,0,0': RYn90,
  '0,1,0':  RXn90,
  '0,-1,0': RX90,
  '0,0,1':  I3,
  '0,0,-1': [[-1,0,0],[0,1,0],[0,0,-1]],
};

/* ---------- 转动定义 ----------
   rot 为逻辑旋转矩阵；ang 为 CSS rotate3d 的动画角度 */
const MOVES = {
  U: { axis: [0,1,0], layerAxis: 1, layerVal: -1, rot: RYn90, ang: -90 },
  D: { axis: [0,1,0], layerAxis: 1, layerVal:  1, rot: RY90,  ang:  90 },
  R: { axis: [1,0,0], layerAxis: 0, layerVal:  1, rot: RX90,  ang:  90 },
  L: { axis: [1,0,0], layerAxis: 0, layerVal: -1, rot: RXn90, ang: -90 },
  F: { axis: [0,0,1], layerAxis: 2, layerVal:  1, rot: RZ90,  ang:  90 },
  B: { axis: [0,0,1], layerAxis: 2, layerVal: -1, rot: RZn90, ang: -90 },
};
function moveInfo(name) {
  const prime = name.endsWith("'");
  const base = MOVES[name[0]];
  return {
    name,
    base,
    prime,
    rot: prime ? m3T(base.rot) : base.rot,
    ang: prime ? -base.ang : base.ang,
  };
}

/* ---------- 展开铰链 ----------
   chain 依次应用（chain[0] 最先），每项：绕 point 处的 axis 转 sign*90 度 */
function buildHinges(H = CUBE_HALF) {
  const ax = { x: [1,0,0], y: [0,1,0], z: [0,0,1] };
  return {
    F: [],
    U: [{ a: ax.x, p: [0,-H, H], s: -1 }],
    D: [{ a: ax.x, p: [0, H, H], s:  1 }],
    R: [{ a: ax.y, p: [ H,0, H], s: -1 }],
    L: [{ a: ax.y, p: [-H,0, H], s:  1 }],
    B: [{ a: ax.y, p: [ H,0,-H], s: -1 },
        { a: ax.y, p: [ H,0, H], s: -1 }],
  };
}
function unfoldMatrix(chain, t) {
  let M = m4id();
  for (const h of chain) M = m4mul(m4rotAbout(h.a, h.s * 90 * t, h.p), M);
  return M;
}

/* ---------- 平面展开图（十字形）的 2D -> 3D 映射 ---------- */
const NET_LAYOUT = {
  U: { col: 1, row: 0 },
  L: { col: 0, row: 1 }, F: { col: 1, row: 1 },
  R: { col: 2, row: 1 }, B: { col: 3, row: 1 },
  D: { col: 1, row: 2 },
};
/* 展开图 2D 网格：相邻面中心间距（每面 3 个单位宽） */
const NET_PITCH = 3;
/* 面 f 在展开图中的 2D 中心偏移 */
function netOffset2D(f) {
  const { col, row } = NET_LAYOUT[f];
  return [(col - 1) * NET_PITCH, (row - 1) * NET_PITCH];
}

/* 给定面 f 的格子 (row r, col c) -> 该贴在魔方上的小方块坐标 */
function netCellToPos(f, r, c) {
  switch (f) {
    case 'U': return [c - 1, -1, r - 1];
    case 'D': return [c - 1,  1, 1 - r];
    case 'F': return [c - 1, r - 1,  1];
    case 'B': return [1 - c, r - 1, -1];
    case 'L': return [-1, r - 1, c - 1];
    case 'R': return [ 1, r - 1, 1 - c];
  }
}

;
/* 模型层：cubie 状态 / 转动 / 打乱 / 复原 / 展开映射 */
/* 依赖 cube-core.js */

function makeSolved() {
  const cubies = [];
  let id = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        const faces = {};
        for (const k of FACE_KEYS) {
          const n = FACE_DEF[k].n;
          if (x*n[0] + y*n[1] + z*n[2] === 1) faces[k] = FACE_DEF[k].color;
        }
        cubies.push({ id: id++, home: [x,y,z], p: [x,y,z], rot: I3.slice(), faces });
      }
  return cubies;
}

/* 某转动影响的层 */
function moveLayer(mv) {
  const b = MOVES[mv[0]];
  return cubies => cubies.filter(c => c.p[b.layerAxis] === b.layerVal);
}

/* 对一组 cubie 应用逻辑转动 */
function applyMoveTo(cubies, name) {
  const { base, rot } = moveInfo(name);
  const axis = base.layerAxis, val = base.layerVal;
  const hit = cubies.filter(c => c.p[axis] === val);
  for (const c of hit) {
    c.p = m3tv(rot, c.p).map(v => Math.round(v));
    c.rot = m3snap(m3mul(rot, c.rot));
  }
  return hit;
}

/* 面 -> 该面中心块的方向（世界坐标） */
function faceNormal(c, f) {
  return m4dir(m3to4(c.rot), FACE_DEF[f].n).map(v => Math.round(v));
}

/* 读某个面的颜色网格，统一返回 [row][col]（从面外看） */
function readFaceColors(cubies, faceKey) {
  const fr = FACE_FRAME[faceKey];
  const out = [[null,null,null],[null,null,null],[null,null,null]];
  for (const c of cubies) {
    for (const f of FACE_KEYS) {
      if (!c.faces[f]) continue;
      const wn = faceNormal(c, f);
      if (wn[0] !== fr.n[0] || wn[1] !== fr.n[1] || wn[2] !== fr.n[2]) continue;
      const col = c.p[0]*fr.right[0] + c.p[1]*fr.right[1] + c.p[2]*fr.right[2];
      const row = c.p[0]*fr.down[0]  + c.p[1]*fr.down[1]  + c.p[2]*fr.down[2];
      out[row+1][col+1] = c.faces[f];
    }
  }
  return out;
}

/* 当前状态下的完整 54 贴纸表：{ face: [row][col] } */
function snapshot(cubies) {
  const o = {};
  for (const f of FACE_KEYS) o[f] = readFaceColors(cubies, f);
  return o;
}

if (typeof module !== 'undefined') module.exports = { makeSolved, applyMoveTo, readFaceColors, faceNormal };

;
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('FAIL:', msg); } };
const C = k => FACE_DEF[k].color;
const rowOf = (g, i) => g[i];
const colOf = (g, i) => [g[0][i], g[1][i], g[2][i]];
const solvedQ = cs => cs.every(c => c.p.join() === c.home.join() && c.rot.join() === I3.join());
const solvedByColor = cs => FACE_KEYS.every(f => readFaceColors(cs,f).flat().every(x => x === C(f)));
const order = moves => { let cs = makeSolved();
  for (let n = 1; n <= 3000; n++) { for (const m of moves) applyMoveTo(cs, m); if (solvedQ(cs)) return n; } return -1; };

console.log('--- 1. 复原态结构 ---');
let cubies = makeSolved();
ok(cubies.length === 27, '27 cubies');
ok(cubies.filter(c => Object.keys(c.faces).length === 3).length === 8, '8 corners');
ok(cubies.filter(c => Object.keys(c.faces).length === 2).length === 12, '12 edges');
ok(cubies.filter(c => Object.keys(c.faces).length === 1).length === 6, '6 centers');
ok(cubies.filter(c => Object.keys(c.faces).length === 0).length === 1, '1 core');
ok(solvedByColor(cubies), 'solved by color');

console.log('--- 2. 颜色守恒 ---');
cubies = makeSolved(); applyMoveTo(cubies, 'U');
const counts = {};
for (const c of cubies) for (const f in c.faces) counts[c.faces[f]] = (counts[c.faces[f]]||0)+1;
for (const k of FACE_KEYS) ok(counts[C(k)] === 9, 'count 9 for ' + k);

console.log('--- 3. 群论恒等式（与约定无关的强校验）---');
ok(order(['R','U','R\'','U\''.replace("'","'")]) === 6, '(R U R\' U\')^6 = e');
ok(order(['R','R','U','U']) === 6, '(R2 U2)^6 = e');
ok(order(['R','U',"R'",'U','R','U','U',"R'"]) === 6, 'sune^6 = e');
ok(order(['R','U',"R'","U'"]) === 6, 'commutator order 6');
/* 中心块朝向被追踪 => 阶数是标准阶数 x 4 */
ok(order(['R','U']) === 420, 'order(R U) = 420 = lcm(105,4) [supercube]');
ok(order(['F','R']) === 420, 'order(F R) = 420');
ok(order(['L','D']) === 420, 'order(L D) = 420');
ok(order(['B','R']) === 420, 'order(B R) = 420');

console.log('--- 4. 各面四次复原 / 逆操作 ---');
for (const m of ['U','D','L','R','F','B']) {
  let cs = makeSolved();
  for (let i = 0; i < 4; i++) applyMoveTo(cs, m);
  ok(solvedQ(cs), m + '^4 = identity');
  let cs2 = makeSolved();
  applyMoveTo(cs2, m); applyMoveTo(cs2, m + "'");
  ok(solvedQ(cs2), m + " inverse");
}

console.log('--- 5. U 转动：整层 9 块联动 ---');
let cs = makeSolved(); applyMoveTo(cs, 'U');
ok(rowOf(readFaceColors(cs,'U'),0).concat(rowOf(readFaceColors(cs,'U'),2)).every(x => x === C('U')), 'U all white');
ok(rowOf(readFaceColors(cs,'D'),0).every(x => x === C('D')), 'D untouched');
ok(rowOf(readFaceColors(cs,'F'),0).every(x => x === C('R')), 'U: F top <- red');
ok(rowOf(readFaceColors(cs,'R'),0).every(x => x === C('B')), 'U: R top <- green');
ok(rowOf(readFaceColors(cs,'B'),0).every(x => x === C('L')), 'U: B top <- orange');
ok(rowOf(readFaceColors(cs,'L'),0).every(x => x === C('F')), 'U: L top <- blue');
ok(rowOf(readFaceColors(cs,'F'),1).every(x => x === C('F')), 'U: F mid stays blue');
ok(rowOf(readFaceColors(cs,'F'),2).every(x => x === C('F')), 'U: F bottom unchanged');
ok(rowOf(readFaceColors(cs,'F'),0).every(x => x !== C('F')), 'U: F top row all changed');

console.log('--- 6. R 转动 ---');
let cs2 = makeSolved(); applyMoveTo(cs2, 'R');
ok(readFaceColors(cs2,'R').flat().every(x => x === C('R')), 'R all red');
ok(readFaceColors(cs2,'L').flat().every(x => x === C('L')), 'L untouched');
ok(colOf(readFaceColors(cs2,'F'),2).every(x => x === C('D')), 'R: F col2 <- yellow');
ok(colOf(readFaceColors(cs2,'U'),2).every(x => x === C('F')), 'R: U col2 <- blue');
ok(colOf(readFaceColors(cs2,'B'),0).every(x => x === C('U')), 'R: B col0 <- white (mirrored frame)');
ok(colOf(readFaceColors(cs2,'D'),2).every(x => x === C('B')), 'R: D col2 <- green');
ok(colOf(readFaceColors(cs2,'F'),1).every(x => x === C('F')), 'R: F col1 stays blue');

console.log('--- 7. F 转动 ---');
let cs5 = makeSolved(); applyMoveTo(cs5, 'F');
ok(readFaceColors(cs5,'F').flat().every(x => x === C('F')), 'F all blue');
ok(readFaceColors(cs5,'B').flat().every(x => x === C('B')), 'B untouched');
ok(rowOf(readFaceColors(cs5,'U'),2).every(x => x === C('L')), 'F: U row2 <- orange');
ok(colOf(readFaceColors(cs5,'R'),0).every(x => x === C('U')), 'F: R col0 <- white');
ok(rowOf(readFaceColors(cs5,'D'),0).every(x => x === C('R')), 'F: D row0 <- red');
ok(colOf(readFaceColors(cs5,'L'),2).every(x => x === C('D')), 'F: L col2 <- yellow');

console.log('--- 8. 展开映射双射 ---');
const seen = new Set();
for (const f of FACE_KEYS) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
  const p = netCellToPos(f, r, c), n = FACE_DEF[f].n;
  ok(Math.abs(p[0])<=1 && Math.abs(p[1])<=1 && Math.abs(p[2])<=1, f+' in range');
  ok(p[0]*n[0]+p[1]*n[1]+p[2]*n[2] === 1, f+' on face plane');
  seen.add(f + ':' + p.join());
}
ok(seen.size === 54, 'net covers 54 stickers, got ' + seen.size);
for (const f of FACE_KEYS) {
  const s = new Set();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.add(netCellToPos(f,r,c).join());
  ok(s.size === 9, f + ' net cells unique');
}

console.log('--- 9. 展开动画 ---');
const H = CUBE_HALF, hinges = buildHinges();
for (const f of FACE_KEYS) {
  const M = unfoldMatrix(hinges[f], 1.0);
  const ctr = m4mv(M, sheetCenter(f));
  const [cx, cy] = netOffset2D(f);
  ok(Math.abs(ctr[2] - H) < 1e-6, f+' flat z=H got ' + ctr[2].toFixed(4));
  ok(Math.abs(ctr[0]-cx) < 1e-6 && Math.abs(ctr[1]-cy) < 1e-6,
     f+' net slot ('+ctr[0].toFixed(2)+','+ctr[1].toFixed(2)+') want ('+cx+','+cy+')');
  ok(unfoldMatrix(hinges[f],0).every((v,i) => Math.abs(v - m4id()[i]) < 1e-9), f + ' t=0 identity');
  ok(unfoldMatrix(hinges[f],0.5).every(v => Number.isFinite(v)), f + ' mid finite');
}
ok(new Set(FACE_KEYS.map(f => { const c = m4mv(unfoldMatrix(hinges[f],1), sheetCenter(f)); return c[0]+','+c[1]; })).size === 6,
   'unfolded 6 distinct slots');

console.log('--- 10. 展开后面片不重叠 + 十字形外接盒 ---');
const boxes = FACE_KEYS.map(f => {
  const M = unfoldMatrix(hinges[f], 1.0), fr = FACE_FRAME[f], sc = sheetCenter(f);
  const corners = [[-1,-1],[1,-1],[-1,1],[1,1]].map(([dr,dc]) => {
    const o = [0,1,2].map(i => (dc*fr.right[i] + dr*fr.down[i]) * H);
    return m4mv(M, [sc[0]+o[0], sc[1]+o[1], sc[2]+o[2]]);
  });
  const xs = corners.map(p=>p[0]), ys = corners.map(p=>p[1]);
  return { f, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
});
let overlaps = 0;
for (let i = 0; i < boxes.length; i++) for (let j = i+1; j < boxes.length; j++) {
  const a = boxes[i], b = boxes[j];
  const ox = Math.min(a.x1,b.x1) - Math.max(a.x0,b.x0);
  const oy = Math.min(a.y1,b.y1) - Math.max(a.y0,b.y0);
  if (ox > 1e-6 && oy > 1e-6) { overlaps++; console.log('  overlap', a.f, b.f); }
}
ok(overlaps === 0, 'no overlap when unfolded, got ' + overlaps);
const X0 = Math.min(...boxes.map(b=>b.x0)), X1 = Math.max(...boxes.map(b=>b.x1));
const Y0 = Math.min(...boxes.map(b=>b.y0)), Y1 = Math.max(...boxes.map(b=>b.y1));
ok(Math.abs((X1-X0) - 12) < 1e-6 && Math.abs((Y1-Y0) - 9) < 1e-6,
   'cross net bbox 12x9 got ' + (X1-X0).toFixed(2) + 'x' + (Y1-Y0).toFixed(2));

console.log('--- 11. 展开图朝向一致 ---');
for (const f of FACE_KEYS) {
  const M = unfoldMatrix(hinges[f], 1.0);
  /* 在"折叠空间"里取三个点，再用 M 变换到展开平面 */
  const sc = sheetCenter(f);
  const mid = m4mv(M, sc);
  const rightPt = m4mv(M, [0,1,2].map(i => sc[i] + FACE_FRAME[f].right[i] * H));
  const downPt  = m4mv(M, [0,1,2].map(i => sc[i] + FACE_FRAME[f].down[i]  * H));
  ok(rightPt[0] > mid[0] + 1.4, f + ' col grows rightward (edge offset = half face = ' + H + ')');
  ok(downPt[1]  > mid[1] + 1.4, f + ' row grows downward');
  ok(Math.abs(rightPt[2] - mid[2]) < 1e-6 && Math.abs(downPt[2] - mid[2]) < 1e-6,
     f + ' unfolded sheet is planar');
}

console.log('--- 12. 打乱 + 复原 ---');
let cs4 = makeSolved();
let sd = 42;
const rnd = () => (sd = (sd * 1103515245 + 12345) % 2147483648) / 2147483648;
const hist = [];
for (let i = 0; i < 30; i++) {
  const m = 'UDLRFB'[Math.floor(rnd()*6)] + (rnd() < 0.5 ? "'" : '');
  applyMoveTo(cs4, m); hist.push(m);
}
ok(!solvedByColor(cs4), 'scrambled is not solved');
const cnt2 = {};
for (const c of cs4) for (const f in c.faces) cnt2[c.faces[f]] = (cnt2[c.faces[f]]||0)+1;
for (const k of FACE_KEYS) ok(cnt2[C(k)] === 9, 'scrambled count 9 for ' + k);
for (let i = hist.length - 1; i >= 0; i--) {
  const m = hist[i];
  applyMoveTo(cs4, m.endsWith("'") ? m[0] : m[0] + "'");
}
ok(solvedQ(cs4), 'scramble + inverse solves');

console.log('--- 13. cubie 朝向始终是合法旋转矩阵 ---');
let cs6 = makeSolved();
for (const m of ['U',"R'",'F','D',"L'",'B','U','R']) applyMoveTo(cs6, m);
for (const c of cs6) {
  const R = c.rot;
  const det = R[0][0]*(R[1][1]*R[2][2]-R[1][2]*R[2][1])
            - R[0][1]*(R[1][0]*R[2][2]-R[1][2]*R[2][0])
            + R[0][2]*(R[1][0]*R[2][1]-R[1][1]*R[2][0]);
  ok(det === 1, 'det=1, got ' + det);
  ok(R.flat().every(v => v === -1 || v === 0 || v === 1), 'integer orthogonal');
}

console.log('--- 14. 展开态下仍能读色（展开图数据源）---');
let cs7 = makeSolved();
for (const m of ['R','U',"F'"]) applyMoveTo(cs7, m);
const snap = snapshot(cs7);
ok(Object.keys(snap).length === 6, 'snapshot has 6 faces');
for (const f of FACE_KEYS) ok(snap[f].flat().every(x => x && x.startsWith('#')), f + ' snapshot colors');

console.log(fails === 0 ? '\n=== ALL TESTS PASSED ===' : '\n=== ' + fails + ' FAILURES ===');
