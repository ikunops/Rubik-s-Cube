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
