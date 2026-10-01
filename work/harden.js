const fs = require('fs');
let s = fs.readFileSync('work/test-v2.js','utf8');
/* 每步打时间戳，便于定位卡点 */
s = s.replace("const ok = (c, m) => {", "const T0 = Date.now();\nconst ok = (c, m) => { m = '[' + ((Date.now()-T0)/1000).toFixed(1) + 's] ' + m;");
/* 步骤 6 用当前贴纸位置重新定位 */
s = s.replace(`  console.log('\\n=== 6. 小位移不触发转动 ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  await p.mouse.move(t.x, t.y);`,
`  console.log('\\n=== 6. 小位移不触发转动 ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  const t2 = await p.evaluate(() => {
    let best = null;
    for (const c of cubies) {
      if (!c.faces['F'] || faceNormal(c,'F').join() !== '0,0,1') continue;
      const st = c.el.children[FACE_KEYS.indexOf('F')].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      if (document.elementFromPoint(cx, cy) !== st) continue;
      const d = Math.hypot(cx - 750, cy - 470);
      if (!best || d < best.d) best = { x: cx, y: cy, d };
    }
    return best;
  });
  await p.mouse.move(t2.x, t2.y);`);
s = s.replace(`  await p.mouse.move(t.x + 5, t.y + 3, { steps: 3 });`,
              `  await p.mouse.move(t2.x + 5, t2.y + 3, { steps: 3 });`);
s = s.replace("  await p.mouse.move(t.x + 40, t.y, { steps: 8 });",
              "  await p.mouse.move(t.x + 40, t.y, { steps: 8 });");
fs.writeFileSync('work/test-v2.js', s);
console.log('test hardened');
