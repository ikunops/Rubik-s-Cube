const fs = require('fs');
let t = fs.readFileSync('work/test-model-body.js', 'utf8');

/* 用外表面 + 展开图 2D 偏移替换旧的 H=1 期望 */
t = t.replace("const H = 1.0, hinges = buildHinges(H);", "const H = CUBE_HALF, hinges = buildHinges();");
t = t.replace(`  const ctr = m4mv(M, FACE_CENTER[f]);
  const { col: c, row: rw } = NET_LAYOUT[f];
  const cx = (c - 1) * 2 * H, cy = (rw - 1) * 2 * H;
  ok(Math.abs(ctr[2] - H) < 1e-6, f+' flat z=H got ' + ctr[2].toFixed(4));
  ok(Math.abs(ctr[0]-cx) < 1e-6 && Math.abs(ctr[1]-cy) < 1e-6,
     f+' net slot ('+ctr[0].toFixed(2)+','+ctr[1].toFixed(2)+') want ('+cx+','+cy+')');`,
`  const ctr = m4mv(M, sheetCenter(f));
  const [cx, cy] = netOffset2D(f);
  ok(Math.abs(ctr[2] - H) < 1e-6, f+' flat z=H got ' + ctr[2].toFixed(4));
  ok(Math.abs(ctr[0]-cx) < 1e-6 && Math.abs(ctr[1]-cy) < 1e-6,
     f+' net slot ('+ctr[0].toFixed(2)+','+ctr[1].toFixed(2)+') want ('+cx+','+cy+')');`);

t = t.replace(`ok(new Set(FACE_KEYS.map(f => { const c = m4mv(unfoldMatrix(hinges[f],1), FACE_CENTER[f]); return c[0]+','+c[1]; })).size === 6,
   'unfolded 6 distinct slots');`,
`ok(new Set(FACE_KEYS.map(f => { const c = m4mv(unfoldMatrix(hinges[f],1), sheetCenter(f)); return c[0]+','+c[1]; })).size === 6,
   'unfolded 6 distinct slots');`);

/* 面片角点用外表面尺寸 H */
t = t.replace(`  const M = unfoldMatrix(hinges[f], 1.0), fr = FACE_FRAME[f], c = FACE_CENTER[f];
  const corners = [[-1,-1],[1,-1],[-1,1],[1,1]].map(([dr,dc]) => {
    const o = [0,1,2].map(i => dc*fr.right[i] + dr*fr.down[i]);
    return m4mv(M, [c[0]+o[0], c[1]+o[1], c[2]+o[2]]);
  });`,
`  const M = unfoldMatrix(hinges[f], 1.0), fr = FACE_FRAME[f], sc = sheetCenter(f);
  const corners = [[-1,-1],[1,-1],[-1,1],[1,1]].map(([dr,dc]) => {
    const o = [0,1,2].map(i => (dc*fr.right[i] + dr*fr.down[i]) * H);
    return m4mv(M, [sc[0]+o[0], sc[1]+o[1], sc[2]+o[2]]);
  });`);

t = t.replace(`ok(Math.abs((X1-X0) - 8) < 1e-6 && Math.abs((Y1-Y0) - 6) < 1e-6,
   'cross net bbox 8x6 got ' + (X1-X0).toFixed(2) + 'x' + (Y1-Y0).toFixed(2));`,
`ok(Math.abs((X1-X0) - 12) < 1e-6 && Math.abs((Y1-Y0) - 9) < 1e-6,
   'cross net bbox 12x9 got ' + (X1-X0).toFixed(2) + 'x' + (Y1-Y0).toFixed(2));`);

t = t.replace(`  ok(m4mv(M, faceCellCenter(f,0,2))[0] > m4mv(M, faceCellCenter(f,0,0))[0] + 1.9, f + ' col grows rightward');
  ok(m4mv(M, faceCellCenter(f,2,0))[1] > m4mv(M, faceCellCenter(f,0,0))[1] + 1.9, f + ' row grows downward');`,
`  const s0 = m4mv(M, sheetCenter(f));
  const rightPt = [0,1,2].map(i => s0[i] + FACE_FRAME[f].right[i] * H);
  const downPt  = [0,1,2].map(i => s0[i] + FACE_FRAME[f].down[i] * H);
  ok(m4mv(M, rightPt)[0] > m4mv(M, s0)[0] + 2.9, f + ' col grows rightward');
  ok(m4mv(M, downPt)[1] > m4mv(M, s0)[1] + 2.9, f + ' row grows downward');`);

fs.writeFileSync('work/test-model-body.js', t);
console.log('test updated');
