const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1000);

  console.log('=== 单次拖拽应只产生 1 步 ===');
  for (const [name, sel, dx, dy] of [
      ['中心块向右', 0, 70, 0],
      ['中心块向下', 0, 0, 70],
      ['中心块向左', 0, -70, 0],
  ]) {
    await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
    /* 找 F 面中心贴纸（最靠前） */
    const t = await p.evaluate(() => {
      let best = null;
      for (const c of cubies) {
        if (c.p[2] !== 1) continue;
        const i = FACE_KEYS.indexOf('F');
        const st = c.el.children[i].querySelector('.sticker');
        if (!st) continue;
        const r = st.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        const el = document.elementFromPoint(cx, cy);
        if (!(el === st || st.contains(el))) continue;
        /* 取最接近屏幕中心的那个 */
        const d = Math.hypot(cx - 720, cy - 460);
        if (!best || d < best.d) best = { x: cx, y: cy, d };
      }
      return best;
    });
    if (!t) { console.log('  ' + name + ': 找不到可见的 F 面贴纸'); continue; }
    await p.mouse.move(t.x, t.y);
    await p.mouse.down();
    await p.mouse.move(t.x + dx, t.y + dy, { steps: 12 });
    await p.mouse.up();
    await p.waitForFunction(() => !anim && queue.length === 0, null, { timeout: 5000 });
    await p.waitForTimeout(150);
    const n = parseInt(await p.locator('#stMoves').textContent());
    const h = await p.locator('#hist').textContent();
    console.log('  ' + name + ' -> 步数 ' + n + ' | 记录 ' + h.trim() + (n === 1 ? '   OK' : '   *** 应为 1'));
  }

  console.log('\n=== 一次拖拽 30px（小幅度） ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  const t2 = await p.evaluate(() => {
    for (const c of cubies) {
      if (c.p[2] !== 1) continue;
      const st = c.el.children[FACE_KEYS.indexOf('F')].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const el = document.elementFromPoint(cx, cy);
      if (el === st || st.contains(el)) return { x: cx, y: cy };
    }
    return null;
  });
  await p.mouse.move(t2.x, t2.y);
  await p.mouse.down();
  await p.mouse.move(t2.x + 30, t2.y, { steps: 6 });
  await p.mouse.up();
  await p.waitForFunction(() => !anim && queue.length === 0, null, { timeout: 5000 });
  console.log('  步数 =', await p.locator('#stMoves').textContent());

  console.log('\n=== 拖拽 5px（应视为点击，不转动） ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  await p.mouse.move(t2.x, t2.y);
  await p.mouse.down();
  await p.mouse.move(t2.x + 5, t2.y, { steps: 3 });
  await p.mouse.up();
  await p.waitForTimeout(500);
  console.log('  步数 =', await p.locator('#stMoves').textContent());

  await b.close();
})();
