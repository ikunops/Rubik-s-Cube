const fs = require('fs');
let t = fs.readFileSync('work/test-model-body.js', 'utf8');

t = t.replace(`  const s0 = m4mv(M, sheetCenter(f));
  const rightPt = [0,1,2].map(i => s0[i] + FACE_FRAME[f].right[i] * H);
  const downPt  = [0,1,2].map(i => s0[i] + FACE_FRAME[f].down[i] * H);
  ok(m4mv(M, rightPt)[0] > m4mv(M, s0)[0] + 2.9, f + ' col grows rightward');
  ok(m4mv(M, downPt)[1] > m4mv(M, s0)[1] + 2.9, f + ' row grows downward');`,
`  /* 在"折叠空间"里取三个点，再用 M 变换到展开平面 */
  const sc = sheetCenter(f);
  const mid = m4mv(M, sc);
  const rightPt = m4mv(M, [0,1,2].map(i => sc[i] + FACE_FRAME[f].right[i] * H));
  const downPt  = m4mv(M, [0,1,2].map(i => sc[i] + FACE_FRAME[f].down[i]  * H));
  ok(rightPt[0] > mid[0] + 2.9, f + ' col grows rightward');
  ok(downPt[1]  > mid[1] + 2.9, f + ' row grows downward');
  ok(Math.abs(rightPt[2] - mid[2]) < 1e-6 && Math.abs(downPt[2] - mid[2]) < 1e-6,
     f + ' unfolded sheet is planar');`);

fs.writeFileSync('work/test-model-body.js', t);
console.log('fixed');
