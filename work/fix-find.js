const fs = require('fs');
let s = fs.readFileSync('work/find-fail.js','utf8');
s = s.replace(`  const cells = await p.evaluate(() => {
    const out = [];
    for (const c of cubies) for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      if (m4dir(frameCam, faceNormal(c,fk))[2] < 0.35) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left+r.width/2, cy = r.top+r.height/2;
      if (document.elementFromPoint(cx,cy) !== st) continue;
      out.push({x:cx, y:cy, pos:c.p.join(','), face:fk});
    }
    return out;
  });`,
`  /* 每次拖拽前重新查询（魔方状态在变，位置会移动） */
  const getCells = () => p.evaluate(() => {
    const out = [];
    for (const c of cubies) for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      if (m4dir(frameCam, faceNormal(c,fk))[2] < 0.35) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left+r.width/2, cy = r.top+r.height/2;
      if (document.elementFromPoint(cx,cy) !== st) continue;
      out.push({x:cx, y:cy, pos:c.p.join(','), face:fk});
    }
    return out;
  });
  const cells = await getCells();`);
s = s.replace("    const cell = cells[Math.floor(Math.random()*cells.length)];",
              "    const cellsNow = await getCells();\n    const cell = cellsNow[Math.floor(Math.random()*cellsNow.length)];");
fs.writeFileSync('work/find-fail.js', s);
console.log('test fixed: re-query cells');
