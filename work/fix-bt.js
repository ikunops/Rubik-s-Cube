const fs = require('fs');
let s = fs.readFileSync('work/browser-test.js','utf8');

/* 修正：net 颜色断言（浏览器归一化为 rgb()） */
s = s.replace(`  ok(netF.some(c => c.includes('196, 16, 46') || c.includes('#c8102e')), 'net F shows red (U turned in)');`,
`  ok(netF.some(c => /rgb\\(200,\\s*16,\\s*46\\)/.test(c) || c.includes('#c8102e')), 'net F shows red (U turned in)');`);

/* 修正：连点要等队列跑完 */
s = s.replace(`  for (const sel of [3, 5, 7]) {
    await page.locator('#moves .mv').nth(sel).click();
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1400);`,
`  for (const sel of [3, 5, 7]) {
    await page.locator('#moves .mv').nth(sel).click();
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(2600);`);

/* 修正：solveAll 有 22+ 步动画，需要更长等待，并轮询直到稳定 */
s = s.replace(`  await page.locator('#btnSolve').click();
  await page.waitForTimeout(6000);
  const sv = await page.locator('#badge').textContent();
  ok(sv.trim() === 'SOLVED', 'solved after 还原, got ' + sv.trim());`,
`  await page.locator('#btnSolve').click();
  /* 轮询直到动画队列跑完（最多 40 秒） */
  await page.waitForFunction(() => !anim && queue.length === 0, null, { timeout: 40000 });
  await page.waitForTimeout(400);
  const sv = await page.locator('#badge').textContent();
  ok(sv.trim() === 'SOLVED', 'solved after 还原, got ' + sv.trim());`);

fs.writeFileSync('work/browser-test.js', s);
console.log('browser test updated');
