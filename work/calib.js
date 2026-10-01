const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(2200);

  const m = await p.evaluate(() => {
    const st = document.getElementById('stage').getBoundingClientRect();
    const rs = Array.from(document.querySelectorAll('.plate')).map(pl => pl.getBoundingClientRect());
    const x0 = Math.min(...rs.map(r => r.left)), x1 = Math.max(...rs.map(r => r.right));
    const y0 = Math.min(...rs.map(r => r.top)),  y1 = Math.max(...rs.map(r => r.bottom));
    return {
      PX, UNFOLD_FIT, camZoom: cam.zoom,
      stage: [Math.round(st.width), Math.round(st.height)],
      net: [Math.round(x1-x0), Math.round(y1-y0)],
      coverage: [ +((x1-x0)/st.width).toFixed(3), +((y1-y0)/st.height).toFixed(3) ],
      perspective: getComputedStyle(document.getElementById('stage')).perspective,
    };
  });
  console.log('PX =', m.PX.toFixed(1), ' UNFOLD_FIT =', m.UNFOLD_FIT.toFixed(4), ' camZoom =', m.camZoom);
  console.log('stage =', m.stage.join('x'), ' perspective =', m.perspective);
  console.log('net on screen =', m.net.join('x'), ' coverage =', m.coverage.join(' x '));

  /* 标定：需要放大多少倍才能达到 0.90 覆盖 */
  const want = 0.90;
  const need = Math.min(want / m.coverage[0], want / m.coverage[1]);
  console.log('建议 UNFOLD_FIT 乘数 =', need.toFixed(3));
  console.log('=> 新 UNFOLD_FIT 公式系数应为 0.84 *', need.toFixed(3), '=', (0.84*need).toFixed(3));

  await b.close();
})();
