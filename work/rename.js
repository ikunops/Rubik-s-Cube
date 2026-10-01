const fs = require('fs');
let s = fs.readFileSync('work/test-v2.js','utf8');
s = s.replace("  const t2 = await p.evaluate(() => {\n    let best = null;\n    for (const c of cubies) {\n      if (!c.faces['F'] || faceNormal(c,'F').join() !== '0,0,1') continue;\n      const st = c.el.children[FACE_KEYS.indexOf('F')].querySelector('.sticker');\n      if (!st) continue;\n      const r = st.getBoundingClientRect();\n      const cx = r.left + r.width/2, cy = r.top + r.height/2;\n      if (document.elementFromPoint(cx, cy) !== st) continue;\n      const d = Math.hypot(cx - 750, cy - 470);\n      if (!best || d < best.d) best = { x: cx, y: cy, d };\n    }\n    return best;\n  });\n  await p.mouse.move(t2.x, t2.y);",
"  const tSmall = await p.evaluate(() => {\n    let best = null;\n    for (const c of cubies) {\n      if (!c.faces['F'] || faceNormal(c,'F').join() !== '0,0,1') continue;\n      const st = c.el.children[FACE_KEYS.indexOf('F')].querySelector('.sticker');\n      if (!st) continue;\n      const r = st.getBoundingClientRect();\n      const cx = r.left + r.width/2, cy = r.top + r.height/2;\n      if (document.elementFromPoint(cx, cy) !== st) continue;\n      const d = Math.hypot(cx - 750, cy - 470);\n      if (!best || d < best.d) best = { x: cx, y: cy, d };\n    }\n    return best;\n  });\n  await p.mouse.move(tSmall.x, tSmall.y);");
s = s.replace("  await p.mouse.move(t2.x + 5, t2.y + 3, { steps: 3 });",
              "  await p.mouse.move(tSmall.x + 5, tSmall.y + 3, { steps: 3 });");
fs.writeFileSync('work/test-v2.js', s);
console.log('renamed');
