const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');

/* 给关键步骤加时间戳日志 */
s = s.replace("async function dragTest(p, label, dx, dy, waitBefore) {",
`const T0 = Date.now();
const LOG = (m) => console.log('      [' + ((Date.now()-T0)/1000).toFixed(1) + 's] ' + m);

async function dragTest(p, label, dx, dy, waitBefore) {
  LOG('dragTest 开始: ' + label);`);
s = s.replace("  const t = await findSticker(p, Math.floor(Math.random()*6));\n  if (!t) return { ok: false, why: '无贴纸' };",
              "  LOG('找贴纸...');\n  const t = await findSticker(p, Math.floor(Math.random()*6));\n  LOG('找到: ' + (t ? Math.round(t.x)+','+Math.round(t.y) : 'null'));\n  if (!t) return { ok: false, why: '无贴纸' };");
s = s.replace("  await p.mouse.move(t.x + dx, t.y + dy, { steps: 8 });",
              "  LOG('拖动中...');\n  await p.mouse.move(t.x + dx, t.y + dy, { steps: 8 });\n  LOG('拖动完成');");
s = s.replace("  await p.mouse.up();\n  try {",
              "  LOG('松手');\n  await p.mouse.up();\n  LOG('等待静止...');\n  try {");
s = s.replace("  await p.waitForTimeout(80);\n  if (st.locked !== true)",
              "  LOG('已静止');\n  await p.waitForTimeout(80);\n  if (st.locked !== true)");
/* 点击按钮也加日志 */
s = s.replace("  await p.locator('#moves .mv').first().click();\n  const r2",
              "  LOG('点击 U 按钮...');\n  await p.locator('#moves .mv').first().click();\n  LOG('U 已点');\n  const r2");
s = s.replace("  await p.locator('#moves .mv').nth(1).click();\n  const r3",
              "  LOG('点击 U\\' 按钮...');\n  await p.locator('#moves .mv').nth(1).click();\n  LOG('U\\' 已点');\n  const r3");
fs.writeFileSync('work/audit-v6.js', s);
console.log('logging added');
