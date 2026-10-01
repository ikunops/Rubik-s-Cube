const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
s = s.replace("  await p.mouse.move(t.x, t.y);\n  await p.mouse.down();\n  await p.mouse.move(t.x + dx, t.y + dy, { steps: 8 });",
`  if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) return { ok:false, why:'坐标无效 '+JSON.stringify(t) };
  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  await p.mouse.move(t.x + dx, t.y + dy, { steps: 8 });`);
s = s.replace("  return { ok: st.locked && st.kind === 'turn', kind: st.kind, locked: st.locked };",
`  if (st.locked !== true) console.log('      [debug] ' + label + ' -> ' + JSON.stringify({ t: {x:Math.round(t.x),y:Math.round(t.y)}, st }));
  return { ok: st.locked && st.kind === 'turn', kind: st.kind, locked: st.locked };`);
fs.writeFileSync('work/audit-v6.js', s);
console.log('debug added');
