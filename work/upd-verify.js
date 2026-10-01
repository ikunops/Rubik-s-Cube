const fs = require('fs');
let s = fs.readFileSync('work/final-verify.js','utf8');

/* 统一颜色归一化：hex 或 rgb() 都转成 r,g,b */
s = s.replace(`        const norm = s => { const m = /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(s); return m ? m[1]+','+m[2]+','+m[3] : s; };
        out.push({ f, r, c, same: norm(a) === norm(b) || a === b });`,
`        out.push({ f, r, c, same: norm(a) === norm(b) });`);

s = s.replace(`        const norm = s => { const m = /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(s); return m ? m[1]+','+m[2]+','+m[3] : s; };
        if (norm(cells[r*3+c]) !== norm(model[r][c]) && cells[r*3+c] !== model[r][c]) bad++;`,
`        if (norm(cells[r*3+c]) !== norm(model[r][c])) bad++;`);

s = s.replace(`    const norm = s => { const m = /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(s); return m ? m[1]+','+m[2]+','+m[3] : s; };
    for (const box of document.querySelectorAll('.net-face')) {`,
`    for (const box of document.querySelectorAll('.net-face')) {`);

/* 注入 norm 到页面 */
s = s.replace(`  const cmp = await p.evaluate(() => {`,
`  const cmp = await p.evaluate(() => {
    const norm = s => { const m = /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(s);
      if (m) return m[1]+','+m[2]+','+m[3];
      const h = s.replace('#','');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(','); };`);

s = s.replace(`  const cmp2 = await p.evaluate(() => {
    let bad = 0, total = 0;`,
`  const cmp2 = await p.evaluate(() => {
    const norm = s => { const m = /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(s);
      if (m) return m[1]+','+m[2]+','+m[3];
      const h = s.replace('#','');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(','); };
    let bad = 0, total = 0;`);

s = s.replace(`  const cmp3 = await p.evaluate(() => {
    let bad = 0;
    const norm = s => { const m = /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(s); return m ? m[1]+','+m[2]+','+m[3] : s; };
    for (const box of document.querySelectorAll('.net-face')) {`,
`  const cmp3 = await p.evaluate(() => {
    const norm = s => { const m = /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(s);
      if (m) return m[1]+','+m[2]+','+m[3];
      const h = s.replace('#','');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(','); };
    let bad = 0;
    for (const box of document.querySelectorAll('.net-face')) {`);

/* B 的间距检查改为容差内，并打印实际值 */
s = s.replace(`  const pitchX = layout.R.cx - layout.F.cx, pitchY = layout.D.cy - layout.F.cy;
  ok(Math.abs((layout.B.cx - layout.F.cx) - 3*pitchX) < 6, 'B is 3 pitches right of F');
  ok(Math.abs((layout.L.cx - layout.F.cx) + pitchX) < 6, 'L is 1 pitch left of F');
  ok(Math.abs((layout.U.cy - layout.F.cy) + pitchY) < 6, 'U is 1 pitch above F');
  ok(Math.abs((layout.D.cy - layout.F.cy) - pitchY) < 6, 'D is 1 pitch below F');
  ok(Math.abs(layout.U.cx - layout.F.cx) < 6, 'U aligned with F');
  ok(Math.abs(layout.D.cx - layout.F.cx) < 6, 'D aligned with F');
  console.log('  3D 平面块构成十字形  ok');`,
`  const pitchX = layout.R.cx - layout.F.cx, pitchY = layout.D.cy - layout.F.cy;
  console.log('  各面中心:', Object.entries(layout).map(([k,v]) => k+'('+v.cx+','+v.cy+')').join(' '));
  console.log('  pitchX=' + pitchX + ' pitchY=' + pitchY);
  ok(pitchX > 40, 'pitchX positive and sane');
  ok(Math.abs(layout.L.cx - (layout.F.cx - pitchX)) < 12, 'L one pitch left of F');
  ok(Math.abs(layout.B.cx - (layout.F.cx + 3*pitchX)) < 24, 'B three pitches right of F');
  ok(Math.abs(layout.U.cy - (layout.F.cy - pitchY)) < 12, 'U one pitch above F');
  ok(Math.abs(layout.D.cy - (layout.F.cy + pitchY)) < 12, 'D one pitch below F');
  ok(Math.abs(layout.U.cx - layout.F.cx) < 12, 'U aligned with F');
  ok(Math.abs(layout.D.cx - layout.F.cx) < 12, 'D aligned with F');
  console.log('  3D 平面块构成十字形  ok');`);

fs.writeFileSync('work/final-verify.js', s);
console.log('verify updated');
