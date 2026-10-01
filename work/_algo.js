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
/* 中间层切片：M 跟随 L，E 跟随 D，S 跟随 F */
MOVES.M = { axis: [1,0,0], layerAxis: 0, layerVal: 0, rot: RXn90, ang: -90 };
MOVES.E = { axis: [0,1,0], layerAxis: 1, layerVal: 0, rot: RY90,  ang:  90 };
MOVES.S = { axis: [0,0,1], layerAxis: 2, layerVal: 0, rot: RZ90,  ang:  90 };
/* 可转动层（6 个面 + 3 个切片） */
const MOVE_KEYS = ['U','D','L','R','F','B','M','E','S'];

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
/* ===== 新方案：用「面内 2D 网格运动」判定 =====
   用户点击面上某格后，往哪拖，就是让该格在「该面的 2D 网格」里朝那个方向移动。
   绕不同轴旋转会让该格在网格里朝不同方向移动，选最匹配的那个。
   这个方案与透视无关，且天然符合「看往哪条边拖」的直觉。 */
const PX = 129.5;
const CAM = m4mul(m4rot([1,0,0],-35.264), m4rot([0,1,0],-45));
function projO(v){ const p = m4mv(CAM, v); return [p[0], p[1]]; }
const AX = [[1,0,0],[0,1,0],[0,0,1]];
function grabP(c, nW){ return [(c.p[0]+nW[0]*0.5)*PX,(c.p[1]+nW[1]*0.5)*PX,(c.p[2]+nW[2]*0.5)*PX]; }

/* 绕轴转 1 度，抓取点的屏幕切线（正交） */
function tang(axis, P0){
  const a = projO(P0), b = projO(m4mv(m4rot(AX[axis],1), P0));
  return [b[0]-a[0], b[1]-a[1]];
}
/* 弧长解角度 */
function solveMag(axis, sgn, P0, target){
  const s0 = projO(P0);
  const distAt = th => { const p = projO(m4mv(m4rot(AX[axis],th),P0));
                         return Math.hypot(p[0]-s0[0], p[1]-s0[1]); };
  let prevM=0, hitM=-1, maxD=0, maxM=0;
  for(let m=1;m<=180;m++){const d=distAt(sgn*m);if(d>maxD){maxD=d;maxM=m;}if(d>=target){hitM=m;break;}prevM=m;}
  if(hitM<0) return sgn*maxM;
  let lo=prevM,hi=hitM;
  for(let i=0;i<26;i++){const mid=(lo+hi)/2;if(distAt(sgn*mid)<target)lo=mid;else hi=mid;}
  return sgn*((lo+hi)/2);
}

/* 方案 D：选轴只看方向对齐（cos），幅度单独解 —— 不把幅度混进选轴 */
function algD(c, faceKey, dv){
  const nW = FACE_DEF[faceKey].n;
  const P0 = grabP(c, nW);
  const dl = Math.hypot(dv[0],dv[1])||1, ux=dv[0]/dl, uy=dv[1]/dl;
  let best=null;
  for(let a=0;a<3;a++){
    const t=tang(a,P0), L=Math.hypot(t[0],t[1]);
    if(L<0.05) continue;
    const cos=(ux*t[0]+uy*t[1])/L;
    /* 只按 |cos| 选轴；同分时选响应更大的 */
    const score = Math.abs(cos) + 0.001*L;
    if(!best||score>best.score) best={axis:a,coord:c.p[a],sgn:cos>=0?1:-1,cos,L,P0,score};
  }
  return best;
}

/* 评估：分「方向」与「幅度」两个维度 */
function evalAlg(alg,name){
  const DIRS=[['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
              ['右下',1,1],['右上',1,-1],['左下',-1,1],['左上',-1,-1]];
  const cubies=makeSolved();
  const dirCos=[], magErr=[], rows=[];
  for(const c of cubies){
    for(const fk of FACE_KEYS){
      if(!c.faces[fk]) continue;
      const nW=faceNormal(c,fk);
      if(m4dir(CAM,nW)[2]<0.35) continue;
      for(const [label,vx,vy] of DIRS){
        const t=alg(c,fk,[vx,vy]);
        if(!t) continue;
        /* 方向：选中轴的切线方向与拖拽方向的 |cos| */
        const tt=tang(t.axis,t.P0), tl=Math.hypot(tt[0],tt[1]);
        const dc=Math.abs((vx*tt[0]+vy*tt[1])/(tl*Math.hypot(vx,vy)));
        dirCos.push(dc);
        /* 幅度：小拖时点位移应约等于拖拽距离 */
        const D=40;
        const ang=solveMag(t.axis,t.sgn,t.P0,Math.hypot(vx*D,vy*D));
        const s0=projO(t.P0);
        const p1=projO(m4mv(m4rot(AX[t.axis],ang),t.P0));
        const moved=Math.hypot(p1[0]-s0[0],p1[1]-s0[1]);
        magErr.push(Math.abs(moved-D));
        rows.push({pos:c.p.join(','),face:fk,dir:label,axis:t.axis,coord:t.coord,
                   ang:+ang.toFixed(1),dc:+dc.toFixed(3),
                   moved:+moved.toFixed(1),magErr:+Math.abs(moved-D).toFixed(1)});
      }
    }
  }
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  console.log(name);
  console.log('  方向对齐 |cos|: 平均='+avg(dirCos).toFixed(3)+
    '  最小='+Math.min(...dirCos).toFixed(3)+'  <0.9='+dirCos.filter(x=>x<0.9).length+'/'+dirCos.length);
  console.log('  幅度误差: 平均='+avg(magErr).toFixed(2)+'px  最大='+Math.max(...magErr).toFixed(2)+'px');
  const byDir={};
  for(const r of rows)(byDir[r.dir]=byDir[r.dir]||[]).push(r.dc);
  const worst=Object.keys(byDir).map(k=>({k,min:Math.min(...byDir[k]),
    avg:avg(byDir[k])})).sort((a,b)=>a.min-b.min);
  console.log('  各方向最低 |cos|: '+worst.map(w=>w.k+'='+w.min.toFixed(2)).join('  '));
  return rows;
}

const rowsD = evalAlg(algD, '=== 方案 D：仅按方向对齐选轴 ===');
console.log('');
console.log('=== F 面明细 ===');
console.log('位置        方向  轴  层  角度    方向|cos|  位移  幅度误差');
for(const r of rowsD.filter(x=>x.face==='F')){
  console.log(r.pos.padEnd(10)+' '+r.dir.padEnd(4)+' '+r.axis+'  '+String(r.coord).padStart(2)+
    ' '+String(r.ang).padStart(6)+'  '+String(r.dc).padStart(6)+'  '+
    String(r.moved).padStart(6)+'  '+String(r.magErr).padStart(5)+
    (r.dc<0.9?'  <<<':''));
}
