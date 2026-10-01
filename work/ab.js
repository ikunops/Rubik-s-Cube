const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

async function trial(label, css, prep) {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1100);
  if (css) await p.addStyleTag({ content: css });
  if (prep) await p.evaluate(prep);
  await p.waitForTimeout(300);

  const runs = [];
  for (let k = 0; k < 3; k++) {
    await p.evaluate(() => { unfoldT = 0; unfoldTarget = 0; unfoldAnim = null;
      window.__g = []; window.__l = performance.now(); window.__s = false;
      (function t(){ const n = performance.now(); window.__g.push(n - window.__l); window.__l = n;
        if (!window.__s) requestAnimationFrame(t); })(); });
    await p.waitForTimeout(250);
    await p.evaluate(() => { window.__g = []; window.__l = performance.now(); });
    await p.locator('#btnUnfold').click();
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { window.__s = true;
      const g = window.__g.slice(2).sort((a,b)=>a-b);
      const q = f => g[Math.floor(g.length*f)];
      return { p50:+q(.5).toFixed(1), p90:+q(.9).toFixed(1), p99:+q(.99).toFixed(1),
               max:+g[g.length-1].toFixed(1), drop: g.filter(x=>x>24).length, n: g.length }; });
    runs.push(r);
    await p.evaluate(() => { unfoldT = 0; unfoldTarget = 0; unfoldAnim = null; syncLayers(); });
    await p.waitForTimeout(500);
  }
  const best = runs.reduce((a,c) => c.p99 < a.p99 ? c : a);
  console.log(label.padEnd(34) + 'p50=' + String(best.p50).padStart(5) +
    '  p90=' + String(best.p90).padStart(5) + '  p99=' + String(best.p99).padStart(6) +
    '  max=' + String(best.max).padStart(6) + '  掉帧=' + best.drop + '/' + best.n);
  await b.close();
}

(async () => {
  console.log('=== 展开动画：不同策略对比（取 3 次最好）===');
  await trial('A 当前（分层 + display 切换）', null, null);
  await trial('B 平面块常驻不切换 display',
    '.layer-plates{display:block !important}',
    () => { syncLayers = function(){ solidLayer.style.display=''; plateLayer.style.display=''; }; });
  await trial('C 去掉 cubie 的 will-change',
    '.cubie{will-change:auto !important}');
  await trial('D 去掉 body-face 的 backface-visibility',
    '.body-face{backface-visibility:visible !important}');
  await trial('E 平面块用 visibility 代替 display',
    null,
    () => { syncLayers = function(){
        const wantPlate = unfoldT >= 0.9985, wantSolid = unfoldT <= 0.0015;
        solidLayer.style.visibility = wantPlate ? 'hidden' : '';
        plateLayer.style.visibility = wantSolid ? 'hidden' : '';
      }; });
})();
