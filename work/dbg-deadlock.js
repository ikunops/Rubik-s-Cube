const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  p.on('pageerror', e => console.log('PAGEERR:', e.message));
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1400);

  const find = () => p.evaluate(() => {
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
  });

  console.log('--- 场景：点转动后立刻拖 ---');
  await p.locator('#moves .mv').first().click();
  const t = await find();
  console.log('找到贴纸:', t ? 'ok' : 'null');
  if (!t) { await b.close(); return; }

  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  await p.mouse.move(t.x + 260, t.y, { steps: 8 });
  console.log('拖拽中:', JSON.stringify(await p.evaluate(() => ({
    spin: spin ? { angle: +spin.angle.toFixed(1), name: spin.name, dragging: !!spin.dragging, anim: !!spin.anim } : null,
    locked: drag ? drag.locked : null, kind: drag ? drag.kind : null, queue: queue.length,
  }))));
  await p.mouse.up();
  for (let i = 1; i <= 6; i++) {
    await p.waitForTimeout(300);
    const st = await p.evaluate(() => ({
      spin: spin ? { angle: +spin.angle.toFixed(1), target: spin.target, name: spin.name,
                     dragging: !!spin.dragging, anim: !!spin.anim,
                     t0: spin.anim ? Math.round(performance.now()-spin.anim.t0) : null,
                     dur: spin.anim ? spin.anim.dur : null } : null,
      queue: queue.length, moveCount, histLen: history.length,
    }));
    console.log('  +' + (i*300) + 'ms:', JSON.stringify(st));
    if (!st.spin && st.queue === 0) break;
  }
  await b.close();
})();
