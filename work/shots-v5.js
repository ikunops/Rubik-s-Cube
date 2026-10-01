const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
const OUT = 'work/shots';
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1400);
  await p.screenshot({ path: OUT + '/v5-01-folded.png' });

  /* 打乱 */
  await p.locator('#btnScramble').click();
  await p.waitForTimeout(400);

  /* 展开中途 */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(420);
  await p.screenshot({ path: OUT + '/v5-02-mid.png' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/v5-03-unfolded.png' });

  /* 折叠中途 */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(420);
  await p.screenshot({ path: OUT + '/v5-04-folding.png' });
  await p.waitForTimeout(1500);

  /* 拖拽实时跟手 */
  const t = await p.evaluate(() => {
    let best = null;
    for (const c of cubies) {
      if (!c.faces['F'] || faceNormal(c,'F').join() !== '0,0,1') continue;
      const st = c.el.children[FACE_KEYS.indexOf('F')].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      if (document.elementFromPoint(cx, cy) !== st) continue;
      const d = Math.hypot(cx - 750, cy - 470);
      if (!best || d < best.d) best = { x: cx, y: cy, d };
    }
    return best;
  });
  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  await p.mouse.move(t.x + 62, t.y + 8, { steps: 12 });
  await p.waitForTimeout(140);
  await p.screenshot({ path: OUT + '/v5-05-drag.png' });
  await p.mouse.up();
  await b.close();
  console.log('shots done');
})();
