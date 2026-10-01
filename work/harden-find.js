const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');

/* 稳健定位：只取「屏幕中央区域、命中自己」的贴纸，且用 offset 递增避免重复取同一个 */
s = s.replace(`const findSticker = (p) => p.evaluate(() => {
  let best = null;
  for (const c of cubies) {
    for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 10) continue;
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      if (document.elementFromPoint(cx, cy) !== st) continue;
      const d = Math.hypot(cx - 700, cy - 460);
      if (!best || d < best.d) best = { x: cx, y: cy, d };
    }
  }
  return best;
});`,
`const findSticker = (p, skip = 0) => p.evaluate((skip) => {
  const cands = [];
  for (const c of cubies) {
    for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      if (document.elementFromPoint(cx, cy) !== st) continue;
      const d = Math.hypot(cx - innerWidth/2, cy - innerHeight/2);
      cands.push({ x: cx, y: cy, d });
    }
  }
  cands.sort((a,b) => a.d - b.d);
  return cands.length ? cands[Math.min(skip, cands.length-1)] : null;
}, skip);`);

s = s.replace("  const t = await findSticker(p);\n  if (!t) return { ok: false, why: '无贴纸' };",
              "  const t = await findSticker(p, Math.floor(Math.random()*6));\n  if (!t) return { ok: false, why: '无贴纸' };");
s = s.replace("  const t = await findSticker(p);\n  await p.mouse.move(t.x, t.y);",
              "  const t = await findSticker(p);\n  if (!t) { ok(false, '找不到贴纸'); return; }\n  await p.mouse.move(t.x, t.y);");
s = s.replace("  const t2 = await findSticker(p);\n  await p.mouse.move(t2.x, t2.y);",
              "  const t2 = await findSticker(p, 2);\n  if (!t2) { ok(false, '找不到贴纸'); return; }\n  await p.mouse.move(t2.x, t2.y);");

fs.writeFileSync('work/audit-v6.js', s);
console.log('finder hardened');
