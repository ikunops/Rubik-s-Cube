const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
/* 关键修复：dragTest 里 dy 缺省时补 0；并对超出视口的位移做裁剪 */
s = s.replace("async function dragTest(p, label, dx, dy, waitBefore) {\n  LOG('dragTest 开始: ' + label);",
`async function dragTest(p, label, dx, dy, waitBefore) {
  dx = dx || 0; dy = dy || 0;
  LOG('dragTest 开始: ' + label + ' dx=' + dx + ' dy=' + dy);`);
s = s.replace("  LOG('找到: ' + (t ? Math.round(t.x)+','+Math.round(t.y) : 'null'));\n  if (!t) return { ok: false, why: '无贴纸' };",
`  LOG('找到: ' + (t ? Math.round(t.x)+','+Math.round(t.y) : 'null'));
  if (!t) return { ok: false, why: '无贴纸' };
  /* 裁剪到视口内，避免 mouse.move 参数越界 */
  const vw = 1500, vh = 940;
  const ex = Math.max(5, Math.min(vw - 5, t.x + dx));
  const ey = Math.max(5, Math.min(vh - 5, t.y + dy));
  LOG('目标点: ' + Math.round(ex) + ',' + Math.round(ey));`);
s = s.replace("  await p.mouse.move(t.x + dx, t.y + dy, { steps: 8 });",
              "  await p.mouse.move(ex, ey, { steps: 8 });");
/* 连续拖的 dx 也调整到视口内 */
s = s.replace("    const r = await dragTest(p, '连拖' + (i+1), i % 2 ? -260 : 260, 0, 40);",
              "    const r = await dragTest(p, '连拖' + (i+1), i % 2 ? -200 : 200, 0, 40);");
s = s.replace("  const r2 = await dragTest(p, '转完立刻拖(0ms)', 260, 0, 0);",
              "  const r2 = await dragTest(p, '转完立刻拖(0ms)', 200, 0, 0);");
s = s.replace("  const r3 = await dragTest(p, '动画期间拖(60ms)', 260, 0, 60);",
              "  const r3 = await dragTest(p, '动画期间拖(60ms)', 200, 0, 60);");
fs.writeFileSync('work/audit-v6.js', s);
console.log('viewport clamp fixed');
