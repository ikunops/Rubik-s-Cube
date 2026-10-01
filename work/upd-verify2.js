const fs = require('fs');
let s = fs.readFileSync('work/final-verify.js','utf8');

/* 修正 B 的格距：B 在列 3、F 在列 1 -> 相差 2 格 */
s = s.replace("ok(Math.abs(layout.B.cx - (layout.F.cx + 3*pitchX)) < 24, 'B three pitches right of F');",
              "ok(Math.abs(layout.B.cx - (layout.F.cx + 2*pitchX)) < 24, 'B two pitches right of F (col3 - col1)');");

/* 修正 cmp3 的 norm */
s = s.replace(`  const cmp3 = await p.evaluate(() => {
    let bad = 0;
    for (const box of document.querySelectorAll('.net-face')) {
      const model = readFaceColors(cubies, box.__face);
      const cells = Array.from(box.children).slice(0,9).map(c => c.style.background);
      for (let i = 0; i < 9; i++) if (norm(cells[i]) !== norm(model[Math.floor(i/3)][i%3])) bad++;
    }
    return bad;
  });`,
`  const cmp3 = await p.evaluate(() => {
    const norm = s => { const m = /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/.exec(s);
      if (m) return m[1]+','+m[2]+','+m[3];
      const h = s.replace('#','');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(','); };
    let bad = 0;
    for (const box of document.querySelectorAll('.net-face')) {
      const model = readFaceColors(cubies, box.__face);
      const cells = Array.from(box.children).slice(0,9).map(c => c.style.background);
      for (let i = 0; i < 9; i++) if (norm(cells[i]) !== norm(model[Math.floor(i/3)][i%3])) bad++;
    }
    return bad;
  });`);

fs.writeFileSync('work/final-verify.js', s);
console.log('fixed');
