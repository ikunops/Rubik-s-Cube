const fs = require('fs');
let s = fs.readFileSync('work/shots-v8.js','utf8');
s = s.replace(`  const cell = await p.evaluate(() => {
    for (const c of cubies) {
      if (c.p.join(',') !== '0,-1,1') continue;
      const st = c.el.children[FACE_KEYS.indexOf('U')].querySelector('.sticker');
      const r = st.getBoundingClientRect();
      return { x: r.left+r.width/2, y: r.top+r.height/2 };
    }
    return null;
  });`,
`  const cell = await p.evaluate(() => {
    let best = null;
    for (const c of cubies) for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      if (m4dir(frameCam, faceNormal(c,fk))[2] < 0.35) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left+r.width/2, cy = r.top+r.height/2;
      if (document.elementFromPoint(cx,cy) !== st) continue;
      const d = Math.hypot(cx-innerWidth/2, cy-innerHeight/2);
      if (!best || d < best.d) best = { x:cx, y:cy, d };
    }
    return best;
  });`);
fs.writeFileSync('work/shots-v8.js', s);
console.log('fixed');
