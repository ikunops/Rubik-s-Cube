const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

async function trial(label, prep) {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const runs = [];
  for (let k = 0; k < 3; k++) {
    const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
    await p.goto(FILE, { waitUntil: 'load' });
    if (prep) await p.evaluate(prep);
    await p.waitForTimeout(1400);           // 让光栅化在动画前完成
    await p.evaluate(() => { unfoldT = 0; unfoldTarget = 0; unfoldAnim = null; syncLayers(); });
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
    runs.push(r);
    await p.close();
  }
  const best = runs.reduce((a,c) => c.p99 < a.p99 ? c : a);
  console.log(label.padEnd(30) + 'p50=' + String(best.p50).padStart(5) +
    '  p90=' + String(best.p90).padStart(5) + '  p99=' + String(best.p99).padStart(6) +
    '  max=' + String(best.max).padStart(6) + '  掉帧=' + best.drop + '/' + best.n);
  await b.close();
}

(async () => {
  console.log('=== 展开动画策略（每次全新页面，3 次取最优）===');
  await trial('当前 visibility 切换', null);
  await trial('两图层永不隐藏', () => {
    syncLayers = function(){
      solidLayer.style.visibility = ''; plateLayer.style.visibility = '';
    };
  });
  await trial('平面块永不隐藏+预置transform', () => {
    syncLayers = function(){
      solidLayer.style.visibility = ''; plateLayer.style.visibility = '';
    };
    /* 页面加载后立刻把所有平面块 transform 写一遍，促使其光栅化 */
    paintPlates(0.001, true);
  });
})();
