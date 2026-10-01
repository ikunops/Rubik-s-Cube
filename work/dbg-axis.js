const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome-win64/chrome.exe'.replace('/chrome-win64/chrome-win64','/chrome-win64') });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const c = cubies.find(x => x.p.join() === '-1,0,1');
    const nW = faceNormal(c, 'F');
    const P0 = grabPoint(c, nW);
    const nAxis = nW.findIndex(v => v !== 0);
    const info = { pos: c.p.join(','), nW: nW.join(','), nAxis, P0: P0.map(v=>+v.toFixed(1)), axes: [] };
    for (let a = 0; a < 3; a++) {
      if (a === nAxis) { info.axes.push({ a, skip: '法向' }); continue; }
      if (c.p[a] === 0) { info.axes.push({ a, skip: '中间层' }); continue; }
      const d1 = screenDeltaPerDeg(a, P0);
      const len = Math.hypot(d1[0], d1[1]);
      const proj = (60 * d1[0] + 0 * d1[1]) / len;   // 水平拖 60px
      info.axes.push({ a, coord: c.p[a], d1: d1.map(v=>+v.toFixed(2)),
                       len: +len.toFixed(3), projH: +proj.toFixed(2) });
    }
    const t = pickAxis(c, nW, [60, 0]);
    info.picked = t ? { axis: t.axis, coord: t.coord, proj: +t.proj.toFixed(2) } : null;
    info.ang60 = t ? +solveDragAngle(t.axis, P0, [60, 0]).toFixed(1) : null;
    return info;
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
})();
