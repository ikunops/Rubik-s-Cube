const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

const CASES = [
  ['向右 70px',  70,   0],
  ['向下 70px',   0,  70],
  ['向左 70px', -70,   0],
  ['向上 70px',   0, -70],
  ['小幅度 30px', 30,  0],
  ['斜向 50,50',  50,  50],
];

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });

  for (const [label, dx, dy] of CASES) {
    /* 每个用例用独立页面，避免状态串扰 */
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.setDefaultTimeout(8000);
    await p.goto(FILE, { waitUntil: 'load' });
    await p.waitForTimeout(900);

    const t = await p.evaluate(() => {
      let best = null;
      for (const c of cubies) {
        if (!c.faces['F']) continue;
        if (faceNormal(c, 'F').join() !== '0,0,1') continue;
        const st = c.el.children[FACE_KEYS.indexOf('F')].querySelector('.sticker');
        if (!st) continue;
        const r = st.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
        if (document.elementFromPoint(cx, cy) !== st) continue;
        const d = Math.hypot(cx - 720, cy - 460);
        if (!best || d < best.d) best = { x: cx, y: cy, d };
      }
      return best;
    });

    if (!t) { console.log(label.padEnd(14) + ' 无可见贴纸'); await ctx.close(); continue; }

    let note = '';
    try {
      await p.mouse.move(t.x, t.y);
      await p.mouse.down();
      await p.mouse.move(t.x + dx, t.y + dy, { steps: 10 });
      await p.mouse.up();
      await p.waitForFunction(() => !anim && queue.length === 0, null, { timeout: 5000 });
      await p.waitForTimeout(100);
      const n = parseInt(await p.locator('#stMoves').textContent());
      const h = (await p.locator('#hist').textContent()).trim();
      note = '步数 ' + n + '  记录 ' + h + (n === 1 ? '  OK' : '  ***');
    } catch (e) {
      note = 'HANG/ERR: ' + e.message.split('\n')[0].slice(0, 90);
    }
    console.log(label.padEnd(14) + ' ' + note + (errs.length ? '  PAGEERR: ' + errs[0] : ''));
    await ctx.close();
  }

  await browser.close();
  console.log('\nDONE');
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
