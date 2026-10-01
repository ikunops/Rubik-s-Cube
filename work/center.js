const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  for (const [w,h] of [[1500,940],[1280,800],[1920,1080]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(FILE, { waitUntil: 'load' });
    await p.waitForTimeout(1100);
    await p.locator('#btnUnfold').click();
    await p.waitForTimeout(1600);
    const m = await p.evaluate(() => {
      const st = document.getElementById('stage').getBoundingClientRect();
      const rs = Array.from(document.querySelectorAll('.plate')).map(pl => pl.getBoundingClientRect());
      const x0 = Math.min(...rs.map(r=>r.left)), x1 = Math.max(...rs.map(r=>r.right));
      const y0 = Math.min(...rs.map(r=>r.top)),  y1 = Math.max(...rs.map(r=>r.bottom));
      return {
        stage: [Math.round(st.left), Math.round(st.top), Math.round(st.width), Math.round(st.height)],
        net: [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)],
        netCtr: [Math.round((x0+x1)/2), Math.round((y0+y1)/2)],
        stageCtr: [Math.round(st.left + st.width/2), Math.round(st.top + st.height*0.46)],
        size: [Math.round(x1-x0), Math.round(y1-y0)],
        cov: [ +((x1-x0)/st.width).toFixed(2), +((y1-y0)/st.height).toFixed(2) ],
      };
    });
    const dx = m.netCtr[0] - m.stageCtr[0], dy = m.netCtr[1] - m.stageCtr[1];
    console.log(w + 'x' + h + '  stage=' + m.stage.join(',') + '  net=' + m.net.join(','));
    console.log('   展开图中心偏移 dx=' + dx + 'px  dy=' + dy + 'px   尺寸=' + m.size.join('x') +
                '  覆盖率=' + m.cov.join('x'));
    await p.close();
  }
  await b.close();
})();
