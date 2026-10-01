const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1600);

  const cdp = await p.context().newCDPSession(p);
  const S = (type, x, y) => cdp.send('Input.dispatchMouseEvent', {
    type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });

  /* 收集魔方上所有可命中的点 */
  const pts = await p.evaluate(() => {
    const out = [];
    for (let y = 80; y < 830; y += 9) {
      for (let x = 60; x < 1000; x += 9) {
        const el = document.elementFromPoint(x, y);
        if (!el) continue;
        const cu = el.closest ? el.closest('.cubie') : null;
        if (cu) out.push([x, y]);
      }
    }
    return out;
  });
  console.log('魔方上可命中采样点 =', pts.length);

  /* 随机抽 160 个点 × 随机方向做真实拖拽 */
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  let ok = 0, fail = 0, nullFace = 0;
  const failSamples = [];
  const N = 160;
  for (let i = 0; i < N; i++) {
    const [x, y] = pts[Math.floor(Math.random() * pts.length)];
    const [dx, dy] = DIRS[Math.floor(Math.random() * DIRS.length)];
    const D = 170;
    const ex = Math.max(6, Math.min(1494, x + dx * D / Math.hypot(dx,dy)));
    const ey = Math.max(6, Math.min(934, y + dy * D / Math.hypot(dx,dy)));
    await p.evaluate(() => { history = []; moveCount = 0; queue.length = 0; spin = null; updateUI(); });
    await S('mousePressed', x, y);
    for (let k = 1; k <= 6; k++) await S('mouseMoved', x + (ex-x)*k/6, y + (ey-y)*k/6);
    const st = await p.evaluate(() => ({
      locked: !!(drag && drag.locked), kind: drag ? drag.kind : null,
      face: drag ? drag.faceKey : null }));
    await S('mouseReleased', ex, ey);
    await p.waitForTimeout(30);
    if (st.locked && st.kind === 'turn') ok++;
    else { fail++; if (failSamples.length < 8) failSamples.push({ x, y, dir: [dx,dy], st }); }
    if (!st.face) nullFace++;
    /* 等静止，避免状态累积 */
    await p.evaluate(() => { if (spin) { spin.anim = null; if (spin.name) commitSpin(); } spin = null; queue.length = 0; });
    await p.waitForTimeout(20);
  }

  console.log('真实拖拽测试: ' + N + ' 次');
  console.log('  成功转层 = ' + ok + '  (' + (ok/N*100).toFixed(1) + '%)');
  console.log('  失败     = ' + fail + '  (' + (fail/N*100).toFixed(1) + '%)');
  console.log('  无面判定 = ' + nullFace);
  if (failSamples.length) {
    console.log('  失败样例:');
    for (const s of failSamples) console.log('    ' + JSON.stringify(s));
  }
  await b.close();
})();
