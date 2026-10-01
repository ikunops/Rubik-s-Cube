const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
const T = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  p.setDefaultTimeout(6000);
  p.on('pageerror', e => console.log('PAGEERR:', e.message));
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1400);

  const step = async (label, fn) => {
    const t0 = Date.now();
    try { const r = await fn(); console.log('  ok   ' + label + ' (' + (Date.now()-t0) + 'ms)'); return r; }
    catch (e) { console.log('  FAIL ' + label + ' (' + (Date.now()-t0) + 'ms): ' + e.message.split('\n')[0].slice(0,80)); return null; }
  };

  console.log('步骤逐个执行（每步 6s 超时）:');
  await step('evaluate 探活', () => p.evaluate(() => 1 + 1));
  await step('点击 U 按钮', () => p.locator('#moves .mv').first().click());
  await step('evaluate 探活(点后)', () => p.evaluate(() => ({ spin: !!spin, q: queue.length })));
  await step('再探活 500ms', async () => { await T(500); return p.evaluate(() => ({ spin: !!spin, q: queue.length, mc: moveCount })); });

  /* 找贴纸 */
  const t = await step('找贴纸', () => p.evaluate(() => {
    const c = [];
    for (const cu of cubies) for (const fk of FACE_KEYS) {
      if (!cu.faces[fk]) continue;
      const st = cu.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left+r.width/2, cy = r.top+r.height/2;
      if (document.elementFromPoint(cx,cy) !== st) continue;
      c.push({ x: cx, y: cy, d: Math.hypot(cx-innerWidth/2, cy-innerHeight/2) });
    }
    c.sort((a,b)=>a.d-b.d);
    return c[0] || null;
  }));

  if (t) {
    await step('mouse.move', () => p.mouse.move(t.x, t.y));
    await step('mouse.down', () => p.mouse.down());
    await step('mouse.move +260', () => p.mouse.move(t.x + 260, t.y, { steps: 8 }));
    await step('探活(拖拽中)', () => p.evaluate(() => ({ locked: drag?drag.locked:null, spin: !!spin })));
    await step('mouse.up', () => p.mouse.up());
    await step('探活(松手后)', () => p.evaluate(() => ({ spin: !!spin, q: queue.length })));
    await step('等静止', async () => {
      for (let i = 0; i < 30; i++) {
        const st = await p.evaluate(() => ({ s: !!spin, q: queue.length }));
        if (!st.s && st.q === 0) return st;
        await T(200);
      }
      throw new Error('30 次轮询仍未静止: ' + JSON.stringify(await p.evaluate(() => ({ s:!!spin, q:queue.length }))));
    });
  }
  await b.close();
  console.log('DONE');
})();
