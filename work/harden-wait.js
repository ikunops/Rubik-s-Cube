const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
/* 等待条件放宽 + 加超时兜底，避免整测试挂死 */
s = s.replace(`  await p.mouse.up();
  await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 8000 });
  await p.waitForTimeout(80);`,
`  await p.mouse.up();
  try {
    await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 12000, polling: 50 });
  } catch (e) {
    const st = await p.evaluate(() => ({ spin: !!spin, queue: queue.length,
      angle: spin ? +spin.angle.toFixed(1) : null, anim: spin ? !!spin.anim : null }));
    return { ok: false, why: '等待超时 ' + JSON.stringify(st) };
  }
  await p.waitForTimeout(80);`);
fs.writeFileSync('work/audit-v6.js', s);
console.log('wait hardened');
