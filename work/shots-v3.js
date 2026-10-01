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
  await p.screenshot({ path: OUT + '/v3-01-folded.png' });

  await p.locator('#btnScramble').click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/v3-02-scrambled.png' });

  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/v3-03-unfolded.png' });

  /* 展开中拖拽转层 */
  await p.locator('#moves .mv').nth(3).click();
  await p.waitForFunction(() => !anim && queue.length === 0, null, { timeout: 5000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/v3-04-unfolded-turn.png' });

  /* 折叠后拖拽跟手瞬间 */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1500);
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
  await p.mouse.move(t.x + 55, t.y, { steps: 10 });
  await p.waitForTimeout(120);
  await p.screenshot({ path: OUT + '/v3-05-drag-live.png' });
  await p.mouse.up();
  await b.close();
  console.log('shots done');
})();
