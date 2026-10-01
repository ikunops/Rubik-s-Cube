const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
let fails = 0;
const T0 = Date.now();
const ok = (c, m) => { m = '[' + ((Date.now()-T0)/1000).toFixed(1) + 's] ' + m; if (!c) { fails++; console.log('  FAIL: ' + m); } else console.log('  ok  : ' + m); };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  console.log('=== 1. 无运行时错误 ===');
  ok(errs.length === 0, 'no errors' + (errs.length ? ' -> ' + errs.join(' | ') : ''));

  console.log('\n=== 2. 侧栏初始显示 3D 迷你立方体 ===');
  ok(await p.locator('#paneMini').isVisible(), 'mini pane visible');
  ok(!(await p.locator('#paneNet').isVisible()), 'net pane hidden');
  const title = await p.locator('#viewTitle').textContent();
  ok(title.includes('3D'), 'title says 3D, got: ' + title.trim());
  const miniPainted = await p.evaluate(() => {
    const cv = document.getElementById('miniCube');
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let nonEmpty = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 10) nonEmpty++;
    return { w: cv.width, h: cv.height, nonEmpty };
  });
  ok(miniPainted.nonEmpty > 500, 'mini cube painted pixels = ' + miniPainted.nonEmpty + ' (' + miniPainted.w + 'x' + miniPainted.h + ')');

  console.log('\n=== 3. 展开后：侧栏切成平面展开图 ===');
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1400);
  ok(!(await p.locator('#paneMini').isVisible()), 'mini pane hidden after unfold');
  ok(await p.locator('#paneNet').isVisible(), 'net pane visible after unfold');
  const t2 = await p.locator('#viewTitle').textContent();
  ok(t2.includes('平面展开图'), 'title says net, got: ' + t2.trim());

  console.log('\n=== 4. 折叠回来：侧栏切回 3D ===');
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1400);
  ok(await p.locator('#paneMini').isVisible(), 'mini pane back');
  ok(!(await p.locator('#paneNet').isVisible()), 'net pane hidden again');

  console.log('\n=== 5. 拖拽转层：实时跟手 + 松手吸附 ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
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
  ok(!!t, 'found draggable sticker');

  /* 拖动中途检查是否跟手 */
  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  await p.mouse.move(t.x + 40, t.y, { steps: 8 });
  await p.waitForTimeout(60);
  const mid = await p.evaluate(() => ({
    locked: !!(drag && drag.locked), angle: drag ? +(drag.angle||0).toFixed(1) : 0,
    kind: drag ? drag.kind : null,
  }));
  ok(mid.locked && mid.kind === 'turn', 'drag locked as turn');
  ok(Math.abs(mid.angle) > 1, 'live preview angle follows drag: ' + mid.angle + 'deg');

  await p.mouse.move(t.x + 260, t.y, { steps: 14 });
  await p.waitForTimeout(60);
  const mid2 = await p.evaluate(() => +(drag ? drag.angle : 0).toFixed(1));
  ok(Math.abs(mid2) > Math.abs(mid.angle), 'angle grows with drag: ' + mid.angle + ' -> ' + mid2);
  ok(Math.abs(mid2) > 40, 'drag far enough to snap a turn (' + mid2 + 'deg)');

  await p.mouse.up();
  await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 5000 });
  await p.waitForTimeout(200);
  const n = parseInt(await p.locator('#stMoves').textContent());
  ok(n >= 1, 'committed ' + n + ' move(s) after drag');

  console.log('\n=== 6. 小位移不触发转动 ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  const tSmall = await p.evaluate(() => {
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
  await p.mouse.move(tSmall.x, tSmall.y);
  await p.mouse.down();
  await p.mouse.move(tSmall.x + 5, tSmall.y + 3, { steps: 3 });
  await p.mouse.up();
  await p.waitForTimeout(500);
  const n2 = parseInt(await p.locator('#stMoves').textContent());
  ok(n2 === 0, 'tiny drag did not turn (moves=' + n2 + ')');

  console.log('\n=== 7. 迷你立方体随转动更新 ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  const before = await p.evaluate(() => {
    const cv = document.getElementById('miniCube');
    const d = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    let h = 0; for (let i = 0; i < d.length; i += 40) h = (h * 31 + d[i]) >>> 0;
    return h;
  });
  await p.locator('#moves .mv').first().click();
  await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 5000 });
  await p.waitForTimeout(250);
  const after = await p.evaluate(() => {
    const cv = document.getElementById('miniCube');
    const d = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    let h = 0; for (let i = 0; i < d.length; i += 40) h = (h * 31 + d[i]) >>> 0;
    return h;
  });
  ok(before !== after, 'mini cube redrew after move');

  console.log('\n=== 8. 最终无错误 ===');
  ok(errs.length === 0, 'no errors at end' + (errs.length ? ' -> ' + errs.slice(0,2).join(' | ') : ''));

  await p.screenshot({ path: 'work/shots/v2-side-mini.png' });
  await b.close();
  console.log(fails === 0 ? '\n=== ALL PASSED ===' : '\n=== ' + fails + ' FAILURES ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
