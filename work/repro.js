const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  p.setDefaultTimeout(15000);
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const cdp = await p.context().newCDPSession(p);
  const S = (t,x,y) => cdp.send('Input.dispatchMouseEvent', { type:t, x, y, button:'left',
    buttons: t==='mouseReleased'?0:1, clickCount:1 });

  /* 直接构造复现：在 1,1,1 的 R 面上向下拖 */
  const cell = await p.evaluate(() => {
    for (const c of cubies) {
      if (c.p.join(',') !== '1,1,1' || !c.faces['R']) continue;
      const st = c.el.children[FACE_KEYS.indexOf('R')].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      return { x: r.left+r.width/2, y: r.top+r.height/2, w: r.width };
    }
    return null;
  });
  console.log('格子屏幕位置:', cell);

  await S('mousePressed', cell.x, cell.y);
  for (let k=1;k<=5;k++) await S('mouseMoved', cell.x, cell.y + 140*k/5);
  const mid = await p.evaluate(() => ({
    locked: !!(drag && drag.locked),
    pick: drag && drag.pick ? { name: drag.pick.name, axis: drag.pick.axis,
                                coord: drag.pick.coord, sign: drag.pick.sign,
                                cos: +drag.pick.cos.toFixed(3) } : null,
    spinAngle: spin ? +spin.angle.toFixed(1) : null,
    spinName: spin ? spin.name : null,
  }));
  console.log('拖动中:', JSON.stringify(mid));
  await S('mouseReleased', cell.x, cell.y + 140);
  await p.waitForTimeout(60);
  const after = await p.evaluate(() => ({
    spin: spin ? { angle: +spin.angle.toFixed(1), target: spin.target, name: spin.name,
                   anim: spin.anim ? { from: +spin.anim.from.toFixed(1), to: +spin.anim.to.toFixed(1), dur: spin.anim.dur } : null } : null,
    queue: queue.length, moveCount,
  }));
  console.log('松手后:', JSON.stringify(after));
  await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 5000, polling: 30 });
  const done = await p.evaluate(() => ({ moveCount, histLen: history.length, last: history[history.length-1] }));
  console.log('完成后:', JSON.stringify(done));
  await b.close();
})();
