const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
/* 连点两次的场景：第一次点完 history 已空、按钮禁用 —— 这正是正确行为。
   改为验证：还原完成后按钮禁用（不可再点），且魔方保持复原。 */
s = s.replace(`  const afterFirst = await p.evaluate(() => isSolved());
  await p.locator('#btnSolve').click();   // 再点一次
  await p.waitForTimeout(600);
  const afterSecond = await p.evaluate(() => isSolved());
  ok(afterFirst && afterSecond, '连点两次还原：第一次复原，第二次保持复原（不再变乱）');`,
`  const afterFirst = await p.evaluate(() => isSolved());
  /* 还原完成后按钮应禁用（无内容可还原），因此不可能再点一次把魔方弄乱 */
  const btnDisabled = await p.evaluate(() => document.getElementById('btnSolve').disabled);
  await p.waitForTimeout(600);
  const afterSecond = await p.evaluate(() => isSolved());
  ok(afterFirst && afterSecond && btnDisabled,
     '还原后按钮禁用 + 魔方保持复原（不存在「再点一次反而更乱」）');
  /* 再验证：强行调用 solveAll() 也不应破坏状态 */
  await p.evaluate(() => solveAll());
  await p.waitForTimeout(500);
  const afterForce = await p.evaluate(() => isSolved());
  ok(afterForce, '强行再次调用 solveAll() 后仍保持复原（幂等）');`);
fs.writeFileSync('work/audit-v6.js', s);
console.log('C criterion fixed');
