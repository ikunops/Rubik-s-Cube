const fs = require('fs');
const path = 'work/';
for (const f of ['cube-core.js','cube-model.js'])
  eval(fs.readFileSync(path+f,'utf8'));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('FAIL:', msg); } };

/* --- 1. 复原态：每面单色 --- */
let cubies = makeSolved();
ok(cubies.length === 27, '27 cubies');
ok(cubies.filter(c => Object.keys(c.faces).length === 3).length === 8, '8 corners');
ok(cubies.filter(c => Object.keys(c.faces).length === 2).length === 12, '12 edges');
ok(cubies.filter(c => Object.keys(c.faces).length === 1).length === 6, '6 centers');
ok(cubies.filter(c => Object.keys(c.faces).length === 0).length === 1, '1 core');
for (const f of FACE_KEYS) {
  const g = readFaceColors(cubies, f);
  const flat = [].concat(...g);
  ok(flat.every(x => x === FACE_DEF[f].color), 'solved face ' + f + ' uniform');
}

/* --- 2. 单个转动后仍是合法状态（每面 9 格，颜色计数守恒） --- */
cubies = makeSolved();
applyMoveTo(cubies, 'U');
const counts = {};
for (const c of cubies) for (const f in c.faces) counts[c.faces[f]] = (counts[c.faces[f]]||0)+1;
for (const k of FACE_KEYS) ok(counts[FACE_DEF[k].color] === 9, 'color count 9 for ' + k);

/* --- 3. U U U U = 复原 --- */
cubies = makeSolved();
for (let i = 0; i < 4; i++) applyMoveTo(cubies, 'U');
let same = cubies.every(c => c.p.join() === c.home.join() && c.rot.join() === I3.join());
ok(same, 'U^4 = identity');

/* --- 4. 各面单转四次都复原 --- */
for (const m of ['U','D','L','R','F','B']) {
  let cs = makeSolved();
  for (let i = 0; i < 4; i++) applyMoveTo(cs, m);
  ok(cs.every(c => c.p.join() === c.home.join()), m + '^4 = identity');
}

/* --- 5. 逆操作：X X' = 复原 --- */
for (const m of ['U','D','L','R','F','B']) {
  let cs = makeSolved();
  applyMoveTo(cs, m); applyMoveTo(cs, m + "'");
  ok(cs.every(c => c.p.join() === c.home.join() && c.rot.join() === I3.join()), m + " inverse");
}

/* --- 6. 转动物理位置与朝向一致：面的世界法向正确 --- */
let cs = makeSolved();
applyMoveTo(cs, 'U');
const uf = readFaceColors(cs, 'U');
ok([].concat(...uf).every(x => x === FACE_DEF.U.color), 'U turn keeps U white');
/* 侧面出现白色的是 F 面的顶行 */
const ff = readFaceColors(cs, 'F');
ok(ff[0].every(x => x === FACE_DEF.U.color), 'U turn puts white on top row of F');
const rf = readFaceColors(cs, 'R');
ok(rf[0].every(x => x === FACE_DEF.U.color), 'U turn puts white on top row of R');
const bf = readFaceColors(cs, 'B');
ok(bf[0].every(x => x === FACE_DEF.L.color), 'U turn puts orange on top row of B');
const lf = readFaceColors(cs, 'L');
ok(lf[0].every(x => x === FACE_DEF.R.color), 'U turn puts red on top row of L');

/* --- 7. 展开映射：净图格子 <-> 3D 位置 是双射，且法向一致 --- */
const seen = new Set();
for (const f of FACE_KEYS) {
  const { col, row } = NET_LAYOUT[f];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const p = netCellToPos(f, r, c);
    /* 该位置必须真的贴在 f 面上 */
    ok(Math.abs(p[0]) <= 1 && Math.abs(p[1]) <= 1 && Math.abs(p[2]) <= 1, f+' cell in range');
    const n = FACE_DEF[f].n;
    const onFace = p[0]*n[0] + p[1]*n[1] + p[2]*n[2] === 1;
    ok(onFace, f+' cell lies on face plane');
    seen.add(f + ':' + p.join());
  }
}
ok(seen.size === 54, 'net covers all 54 stickers, got ' + seen.size);

/* 每个面 9 格互不重复 */
for (const f of FACE_KEYS) {
  const s = new Set();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.add(netCellToPos(f,r,c).join());
  ok(s.size === 9, f + ' net cells unique');
}

/* --- 8. 展开动画：t=1 时各面应落在同一平面 z=H（对 F 面同平面） --- */
const H = 1.0;
const hinges = buildHinges(H);
for (const f of FACE_KEYS) {
  const M = unfoldMatrix(hinges[f], 1.0);
  const { col, row } = NET_LAYOUT[f];
  /* 面中心 (0,0,H) 转到 2D 网格位置 */
  const ctr = m4mv(M, [0,0,H]);
  ok(Math.abs(ctr[2] - H) < 1e-6, f + ' unfolded flat at z=H, got z=' + ctr[2].toFixed(4));
  const cx = (col - 1.5) * 2 * H, cy = (row - 1.5) * 2 * H;
  ok(Math.abs(ctr[0] - cx) < 1e-6 && Math.abs(ctr[1] - cy) < 1e-6,
     f + ' unfolded at net slot, got (' + ctr[0].toFixed(3) + ',' + ctr[1].toFixed(3) + ') want (' + cx + ',' + cy + ')');
}
/* 折叠态 t=0 必须是恒等 */
for (const f of FACE_KEYS) {
  const M = unfoldMatrix(hinges[f], 0.0);
  ok(M.every((v,i) => Math.abs(v - m4id()[i]) < 1e-9), f + ' t=0 identity');
}

console.log(fails === 0 ? '\n=== ALL TESTS PASSED ===' : '\n=== ' + fails + ' FAILURES ===');
