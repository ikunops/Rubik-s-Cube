const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });

  async function run(label) {
    const runs = [];
    for (let k = 0; k < 3; k++) {
      const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
      await p.goto(FILE, { waitUntil: 'load' });
      await p.waitForTimeout(1000);
      /* 先让平面块完成一次光栅化（模拟用户看过展开态） */
      if (k > 0) { await p.evaluate(() => { mainU = 1; mainUTarget = 1; mainUAnim = null; }); await p.waitForTimeout(400); }
      await p.evaluate(() => { mainU = 0; mainUTarget = 0; mainUAnim = null; });
      await p.waitForTimeout(500);
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
      runs.push({ k, ...r });
      await p.close();
    }
    console.log(label);
    for (const r of runs) console.log('   第' + (r.k+1) + '次: p50=' + String(r.p50).padStart(5) +
      '  p90=' + String(r.p90).padStart(5) + '  p99=' + String(r.p99).padStart(6) +
      '  max=' + String(r.max).padStart(6) + '  掉帧=' + r.drop + '/' + r.n);
    const best = runs.reduce((a,c) => c.p99 < a.p99 ? c : a);
    console.log('   最好: p99=' + best.p99 + 'ms  max=' + best.max + 'ms  掉帧=' + best.drop);
  }

  await run('=== 展开动画（每次全新页面，冷启动）===');
  await b.close();
})();
