const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  /* 逐帧记录：帧间隔 + 当前 mainU + 各阶段耗时 */
  await p.evaluate(() => {
    window.__log = [];
    window.__prev = performance.now();
    window.__stop = false;
    (function tick(){
      const n = performance.now();
      window.__log.push({ gap: n - window.__prev, u: mainU,
                          cam: +cam.rx.toFixed(1), t: n });
      window.__prev = n;
      if (!window.__stop) requestAnimationFrame(tick);
    })();
  });
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1800);
  const log = await p.evaluate(() => { window.__stop = true; return window.__log; });

  console.log('帧号  间隔(ms)  mainU   相机rx');
  const t0 = log[0].t;
  log.forEach((r, i) => {
    const flag = r.gap > 20 ? '  <<< 尖峰' : '';
    if (i < 8 || r.gap > 20 || (i % 12 === 0)) {
      console.log(String(i).padStart(4) + '  ' + r.gap.toFixed(1).padStart(7) +
                  '  ' + r.u.toFixed(3).padStart(7) + '   ' + String(r.cam).padStart(6) + flag);
    }
  });
  const big = log.filter(r => r.gap > 20);
  console.log('\n尖峰帧数 =', big.length, ' 共', log.length, '帧');
  console.log('尖峰时的 mainU =', big.map(r => r.u.toFixed(3)).join(', '));
  await b.close();
})();
