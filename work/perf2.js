const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  async function measure(label, action) {
    await p.evaluate(() => { window.__gaps = []; window.__last = performance.now();
      window.__stop = false;
      (function tick(){ const n = performance.now(); window.__gaps.push(n - window.__last);
        window.__last = n; if (!window.__stop) requestAnimationFrame(tick); })();
    });
    if (action) await action();
    await p.waitForTimeout(1600);
    const r = await p.evaluate(() => {
      window.__stop = true;
      const g = window.__gaps.slice(3).sort((a,b)=>a-b);
      const q = f => g[Math.floor(g.length*f)];
      return { n: g.length, p50: +q(.5).toFixed(1), p90: +q(.9).toFixed(1),
               p99: +q(.99).toFixed(1), max: +g[g.length-1].toFixed(1),
               dropped: g.filter(x => x > 24).length };
    });
    console.log('  ' + label.padEnd(18) +
      'p50=' + String(r.p50).padStart(5) + 'ms  p90=' + String(r.p90).padStart(5) +
      'ms  p99=' + String(r.p99).padStart(6) + 'ms  max=' + String(r.max).padStart(6) +
      'ms  掉帧=' + r.dropped + '/' + r.n);
    return r;
  }

  console.log('=== 帧间隔统计（越小越流畅；16.7ms=60fps，8.3ms=120fps）===');
  await measure('静止');
  await measure('自动旋转', () => p.locator('#btnSpin').click());
  await p.locator('#btnSpin').click();
  await measure('展开动画', () => p.locator('#btnUnfold').click());
  await p.waitForTimeout(400);
  await measure('展开态静止');
  await measure('折叠动画', () => p.locator('#btnUnfold').click());
  await p.waitForTimeout(600);

  console.log('\n=== 拖拽实时跟手的帧率 ===');
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
  await p.evaluate(() => { window.__gaps = []; window.__last = performance.now(); window.__stop = false;
    (function tick(){ const n = performance.now(); window.__gaps.push(n - window.__last);
      window.__last = n; if (!window.__stop) requestAnimationFrame(tick); })(); });
  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  for (let i = 1; i <= 20; i++) { await p.mouse.move(t.x + i * 4, t.y, { steps: 2 }); }
  const dragR = await p.evaluate(() => {
    window.__stop = true;
    const g = window.__gaps.slice(3).sort((a,b)=>a-b);
    const q = f => g[Math.floor(g.length*f)];
    return { p50: +q(.5).toFixed(1), p90: +q(.9).toFixed(1), max: +g[g.length-1].toFixed(1),
             dropped: g.filter(x => x > 24).length, n: g.length };
  });
  console.log('  拖拽跟手           p50=' + dragR.p50 + 'ms  p90=' + dragR.p90 +
              'ms  max=' + dragR.max + 'ms  掉帧=' + dragR.dropped + '/' + dragR.n);
  await p.mouse.up();

  console.log('\n=== 渲染耗时 ===');
  const js = await p.evaluate(() => {
    const t = [];
    for (let i = 0; i < 40; i++) { const a = performance.now(); render(performance.now()); t.push(performance.now()-a); }
    t.sort((x,y)=>x-y);
    return { median: +t[20].toFixed(2), max: +t[39].toFixed(2) };
  });
  console.log('  render() 中位 =', js.median, 'ms  最大 =', js.max, 'ms');

  await b.close();
})();
