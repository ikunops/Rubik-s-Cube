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
function buildHinges(H) {
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
function solvedQ(cs){ return cs.every(c => c.p.join()===c.home.join() && c.rot.join()===I3.join()); }
function order(moves){ let cs = makeSolved(); for (let n=1; n<=2000; n++){ for (const m of moves) applyMoveTo(cs,m); if (solvedQ(cs)) return n; } return -1; }
console.log('order(R U)      =', order(['R','U']), '(known 105)');
console.log('order(R U2)     =', order(['R','U2'.slice(0,1)]), '(R,U)');
console.log('order(R U R\' U\') =', order(['R','U',"R'","U'"]), '(known 6)');
console.log('order(R2 U2)    =', order(['R','R','U','U']), '(known 6)');
console.log('order(F R)      =', order(['F','R']), '(known 105)');
console.log('order(F U)      =', order(['F','U']), '(known 105)');
console.log('order(L D)      =', order(['L','D']), '(known 105)');
console.log('order(B R)      =', order(['B','R']), '(known 105)');
console.log('order(R U L D)  =', order(['R','U','L','D']));
console.log('order(sune R U R\' U R U2 R\') =', order(['R','U',"R'",'U','R','U','U',"R'"]), '(known 6)');
console.log('order(T-perm R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\') =',
  order(['R','U',"R'","U'","R'",'F','R','R',"U'","R'","U'",'R','U',"R'","F'"]), '(known 2)');
