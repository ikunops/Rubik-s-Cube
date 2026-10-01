const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

async function trial(label, css, prep) {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const runs = [];
  for (let k = 0; k < 3; k++) {
    const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
    await p.goto(FILE, { waitUntil: 'load' });
    if (css) await p.addStyleTag({ content: css });
    if (prep) await p.evaluate(prep);
    await p.waitForTimeout(1300);
    await p.evaluate(() => { unfoldT = 0; unfoldTarget = 0; unfoldAnim = null; });
    await p.waitForTimeout(400);
    await p.evaluate(() => { window.__g = []; window.__l = performance.now(); window.__s = false;
      (function t(){ const n = performance.now(); window.__g.push(n - window.__l); window.__l = n;
        if (!window.__s) requestAnimationFrame(t); })(); });
    await p.locator('#btnUnfold').click();
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { window.__s = true;
      const g = window.__g.slice(2).sort((a,b)=>a-b);
      const q = f => g[Math.floor(g.length*f)];
      return { p50:+q(.5).toFixed(1), p90:+q(.9).toFixed(1), p99:+q(.99).toFixed(1),
               max:+g[g.length-1].toFixed(1), drop: g.filter(x=>x>24).length, n: g.length }; });
    runs.push(r);
    await p.close();
  }
  const best = runs.reduce((a,c) => c.p99 < a.p99 ? c : a);
  console.log(label.padEnd(32) + 'p50=' + String(best.p50).padStart(5) +
    '  p90=' + String(best.p90).padStart(5) + '  p99=' + String(best.p99).padStart(6) +
    '  max=' + String(best.max).padStart(6) + '  掉帧=' + best.drop);
  await b.close();
}

(async () => {
  console.log('=== 展开动画（3 次取最优）===');
  await trial('A 当前');
  await trial('B 面片加 will-change', '.plate{will-change:transform}');
  await trial('C 面片 will-change + 去 backface',
    '.plate{will-change:transform;backface-visibility:visible !important}');
  await trial('D 面片加 will-change 且加载时预热',
    '.plate{will-change:transform}',
    () => {
      /* 加载后立刻跑一次不可见的展开，预热光栅化 */
      const keep = cubeEl.style.opacity;
      cubeEl.style.opacity = '0.02';
      unfoldT = 1; unfoldTarget = 1; unfoldAnim = null;
      render(performance.now());
      setTimeout(() => {
        unfoldT = 0; unfoldTarget = 0; unfoldAnim = null;
        render(performance.now());
        cubeEl.style.opacity = keep;
      }, 120);
    });
})();
