const fs = require('fs');
let s = fs.readFileSync('work/test-v2.js','utf8');
/* 跟手后需要更大位移才能提交一格，改为拖 260px 并放宽断言 */
s = s.replace(`  await p.mouse.move(t.x + 110, t.y, { steps: 10 });
  await p.waitForTimeout(60);
  const mid2 = await p.evaluate(() => +(drag ? drag.angle : 0).toFixed(1));
  ok(Math.abs(mid2) > Math.abs(mid.angle), 'angle grows with drag: ' + mid.angle + ' -> ' + mid2);`,
`  await p.mouse.move(t.x + 260, t.y, { steps: 14 });
  await p.waitForTimeout(60);
  const mid2 = await p.evaluate(() => +(drag ? drag.angle : 0).toFixed(1));
  ok(Math.abs(mid2) > Math.abs(mid.angle), 'angle grows with drag: ' + mid.angle + ' -> ' + mid2);
  ok(Math.abs(mid2) > 40, 'drag far enough to snap a turn (' + mid2 + 'deg)');`);
fs.writeFileSync('work/test-v2.js', s);
console.log('test-v2 drag distance updated');
