const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
const OUT = 'work/shots';
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: OUT + '/v8-01-default.png' });

  await p.locator('#btnScramble').click();
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/v8-02-scrambled.png' });

  /* 拖拽跟手瞬间 */
  const cell = await p.evaluate(() => {
    let best = null;
    for (const c of cubies) for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      if (m4dir(frameCam, faceNormal(c,fk))[2] < 0.35) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left+r.width/2, cy = r.top+r.height/2;
      if (document.elementFromPoint(cx,cy) !== st) continue;
      const d = Math.hypot(cx-innerWidth/2, cy-innerHeight/2);
      if (!best || d < best.d) best = { x:cx, y:cy, d };
    }
    return best;
  });
  const cdp = await p.context().newCDPSession(p);
  const S = (t,x,y) => cdp.send('Input.dispatchMouseEvent', { type:t, x, y, button:'left',
    buttons: t==='mouseReleased'?0:1, clickCount:1 });
  await S('mousePressed', cell.x, cell.y);
  for (let k=1;k<=7;k++) await S('mouseMoved', cell.x + k*9, cell.y + k*1.5);
  await p.waitForTimeout(120);
  await p.screenshot({ path: OUT + '/v8-03-drag.png' });
  await S('mouseReleased', cell.x + 63, cell.y + 10);
  await p.waitForFunction(() => !spin && queue.length===0, undefined, {timeout:5000, polling:40});

  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1400);
  await p.screenshot({ path: OUT + '/v8-04-unfolded.png' });
  await b.close();
  console.log('shots done');
})();
