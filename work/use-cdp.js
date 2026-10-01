const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
/* 用 CDP 原始鼠标事件替代 p.mouse（避免可操作性/坐标校验阻塞） */
s = s.replace("  await p.mouse.move(t.x, t.y);\n  await p.mouse.down();\n  LOG('拖动中...');\n  await p.mouse.move(ex, ey, { steps: 8 });",
`  const cdp = await p.context().newCDPSession(p);
  const send = (type, x, y, btn) => cdp.send('Input.dispatchMouseEvent', {
    type, x, y, button: btn || 'none', buttons: btn === 'left' ? 1 : 0,
    clickCount: btn === 'left' ? 1 : 0,
  });
  await send('mousePressed', t.x, t.y, 'left');
  LOG('拖动中...');
  const N = 8;
  for (let i = 1; i <= N; i++) {
    await send('mouseMoved', t.x + (ex - t.x) * i / N, t.y + (ey - t.y) * i / N);
  }`);
s = s.replace("  LOG('松手');\n  await p.mouse.up();",
              "  LOG('松手');\n  await send('mouseReleased', ex, ey, 'left');");
fs.writeFileSync('work/audit-v6.js', s);
console.log('switched to CDP mouse');
