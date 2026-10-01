const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1000);

  /* 取 F 面最靠前、且真正在最上层的贴纸 */
  const findSticker = () => p.evaluate(() => {
    let best = null;
    for (const c of cubies) {
      const i = FACE_KEYS.indexOf('F');
      if (!c.faces['F']) continue;
      const wn = faceNormal(c, 'F');
      if (wn.join() !== '0,0,1') continue;
      const st = c.el.children[i].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      if (document.elementFromPoint(cx, cy) !== st) continue;
      const d = Math.hypot(cx - 720, cy - 460);
      if (!best || d < best.d) best = { x: cx, y: cy, d, p: c.p.join() };
    }
    return best;
  });

  async function dragTest(label, dx, dy) {
    await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
    const t = await findSticker();
    if (!t) return console.log('  ' + label + ': 无可见贴纸');
    await p.mouse.move(t.x, t.y);
    await p.mouse.down();
    await p.mouse.move(t.x + dx, t.y + dy, { steps: 10 });
    await p.mouse.up();
    await p.waitForFunction(() => !anim && queue.length === 0, null, { timeout: 4000 });
    await p.waitForTimeout(120);
    const n = parseInt(await p.locator('#stMoves').textContent());
    const h = (await p.locator('#hist').textContent()).trim();
    console.log('  ' + label.padEnd(16) + ' 贴纸' + t.p + '  步数 ' + n + '  记录 ' + h + (n === 1 ? '  OK' : '  ***'));
  }

  console.log('=== 单次拖拽应只产生 1 步 ===');
  await dragTest('向右 70px', 70, 0);
  await dragTest('向下 70px', 0, 70);
  await dragTest('向左 70px', -70, 0);
  await dragTest('向上 70px', 0, -70);
  await dragTest('小幅度 30px', 30, 0);
  await dragTest('斜向 +50+50', 50, 50);

  console.log('\n=== 5px 抖动应视为点击，不转动 ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  const t = await findSticker();
  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  await p.mouse.move(t.x + 5, t.y + 3, { steps: 3 });
  await p.mouse.up();
  await p.waitForTimeout(500);
  console.log('  步数 =', (await p.locator('#stMoves').textContent()).trim(), '(应为 0)');

  await b.close();
  console.log('\nDONE');
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
