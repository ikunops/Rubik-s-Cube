const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  p.on('pageerror', e => console.log('PAGEERR:', e.message));
  p.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text()); });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1400);

  const find = (skip) => p.evaluate((skip) => {
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
    return c[Math.min(skip, c.length-1)] || null;
  }, skip);

  /* 完整复现 audit 的流程 */
  console.log('1) 点击 U');
  await p.locator('#moves .mv').first().click();
  console.log('   queue=' + await p.evaluate(()=>queue.length) + ' spin=' + await p.evaluate(()=>!!spin));

  console.log('2) 立刻找贴纸并拖 260px');
  const t = await find(0);
  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  await p.mouse.move(t.x + 260, t.y, { steps: 8 });
  console.log('   拖拽中:', JSON.stringify(await p.evaluate(() => ({
    locked: drag?drag.locked:null, kind: drag?drag.kind:null,
    spin: spin ? {a:+spin.angle.toFixed(1), n:spin.name, drag:!!spin.dragging, anim:!!spin.anim} : null,
    queue: queue.length }))));

  console.log('3) 松手');
  await p.mouse.up();

  console.log('4) 轮询状态');
  for (let i = 0; i < 20; i++) {
    await p.waitForTimeout(250);
    const st = await p.evaluate(() => ({
      spin: spin ? { a:+spin.angle.toFixed(1), t:spin.target, n:spin.name,
                     drag:!!spin.dragging, anim:!!spin.anim,
                     el: spin.anim ? Math.round(performance.now()-spin.anim.t0) : null,
                     dur: spin.anim ? spin.anim.dur : null } : null,
      queue: queue.length, mc: moveCount }));
    console.log('   ' + ((i+1)*250) + 'ms: ' + JSON.stringify(st));
    if (!st.spin && st.queue === 0) { console.log('   -> 已静止'); break; }
  }
  await b.close();
})();
