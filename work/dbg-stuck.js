const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1400);

  /* 复现：点一次转动，立刻拖拽 */
  await p.locator('#moves .mv').first().click();
  const t = await p.evaluate(() => {
    const cands = [];
    for (const c of cubies) for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left+r.width/2, cy = r.top+r.height/2;
      if (document.elementFromPoint(cx,cy) !== st) continue;
      cands.push({ x: cx, y: cy, d: Math.hypot(cx-innerWidth/2, cy-innerHeight/2) });
    }
    cands.sort((a,b)=>a.d-b.d);
    return cands[0] || null;
  });
  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  await p.mouse.move(t.x + 260, t.y, { steps: 8 });
  const mid = await p.evaluate(() => ({
    spin: spin ? { angle: spin.angle, target: spin.target, name: spin.name,
                   dragging: !!spin.dragging, hasAnim: !!spin.anim,
                   animDur: spin.anim ? spin.anim.dur : null } : null,
    vel: drag ? drag.vel : null, locked: drag ? drag.locked : null,
  }));
  console.log('拖拽中:', JSON.stringify(mid));
  await p.mouse.up();
  await p.waitForTimeout(120);
  const after = await p.evaluate(() => ({
    spin: spin ? { angle: spin.angle, target: spin.target, name: spin.name,
                   dragging: !!spin.dragging, hasAnim: !!spin.anim,
                   animDur: spin.anim ? spin.anim.dur : null,
                   animFrom: spin.anim ? spin.anim.from : null,
                   animTo: spin.anim ? spin.anim.to : null } : null,
    queue: queue.length,
  }));
  console.log('松手 120ms 后:', JSON.stringify(after));
  await p.waitForTimeout(2000);
  const later = await p.evaluate(() => ({
    spin: spin ? { angle: spin.angle, name: spin.name, dragging: !!spin.dragging, hasAnim: !!spin.anim } : null,
    queue: queue.length, moveCount,
  }));
  console.log('松手 2s 后:', JSON.stringify(later));
  await b.close();
})();
