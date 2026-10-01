const fs=require('fs');
const src = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_probe5.js', src + `
;
const H = CUBE_HALF;
const hinges = buildHinges();
console.log('CUBE_HALF =', H, ' NET_PITCH =', NET_PITCH);
console.log();
for (const f of FACE_KEYS) {
  const M = unfoldMatrix(hinges[f], 1.0);
  const sheet = sheetCenter(f);
  const ctr = m4mv(M, sheet);
  const off = netOffset2D(f);
  const want = [off[0], off[1], H];
  const err = Math.hypot(ctr[0]-want[0], ctr[1]-want[1], ctr[2]-want[2]);
  console.log(f.padEnd(2), 'sheet', JSON.stringify(sheet),
              '-> (' + ctr.map(v=>v.toFixed(3)).join(',') + ')',
              ' want (' + want.join(',') + ')',
              err < 1e-9 ? 'OK' : '*** ERR ' + err.toFixed(6));
}
console.log();
console.log('--- 展开后每面 4 个角（检查网格朝向与不重叠）---');
const boxes = FACE_KEYS.map(f => {
  const M = unfoldMatrix(hinges[f], 1.0), fr = FACE_FRAME[f];
  const cs = [];
  for (const [dr,dc] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    const o = [0,1,2].map(i => dc*fr.right[i]*H + dr*fr.down[i]*H);
    const sc = sheetCenter(f);
    cs.push(m4mv(M, [sc[0]+o[0], sc[1]+o[1], sc[2]+o[2]]));
  }
  const xs=cs.map(p=>p[0]), ys=cs.map(p=>p[1]);
  return {f, x0:Math.min(...xs), x1:Math.max(...xs), y0:Math.min(...ys), y1:Math.max(...ys)};
});
let ov = 0;
for (let i=0;i<6;i++) for (let j=i+1;j<6;j++){
  const a=boxes[i], b=boxes[j];
  const ox=Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0);
  const oy=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);
  if (ox>1e-6 && oy>1e-6) { ov++; console.log('  OVERLAP', a.f, b.f); }
}
console.log('overlaps:', ov);
const X0=Math.min(...boxes.map(b=>b.x0)), X1=Math.max(...boxes.map(b=>b.x1));
const Y0=Math.min(...boxes.map(b=>b.y0)), Y1=Math.max(...boxes.map(b=>b.y1));
console.log('cross bbox =', (X1-X0).toFixed(2), 'x', (Y1-Y0).toFixed(2), '(want 12 x 9)');
console.log();
console.log('--- 折叠态 t=0 恒等 ---');
for (const f of FACE_KEYS) {
  const M0 = unfoldMatrix(hinges[f], 0);
  console.log(f, M0.every((v,i)=>Math.abs(v-m4id()[i])<1e-9) ? 'identity OK' : '*** NOT IDENTITY');
}
`);
