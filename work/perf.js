const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  console.log('=== 帧率（静止 + 自动旋转）===');
  const fps = await p.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    function tick() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); }
    requestAnimationFrame(tick);
  }));
  console.log('  静止 FPS =', fps.toFixed(1));

  await p.locator('#btnSpin').click();
  const fps2 = await p.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    function tick() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); }
    requestAnimationFrame(tick);
  }));
  console.log('  自动旋转 FPS =', fps2.toFixed(1));
  await p.locator('#btnSpin').click();

  console.log('\n=== 展开动画帧率 ===');
  const fpsP = p.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    function tick() { n++; if (performance.now() - t0 < 1400) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); }
    requestAnimationFrame(tick);
  }));
  await p.locator('#btnUnfold').click();
  console.log('  展开中 FPS =', (await fpsP).toFixed(1));

  await p.waitForTimeout(1500);

  console.log('\n=== 展开态帧率 ===');
  const fps3 = await p.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    function tick() { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); }
    requestAnimationFrame(tick);
  }));
  console.log('  展开态 FPS =', fps3.toFixed(1));

  console.log('\n=== 各视口尺寸下的布局 ===');
  for (const [w, h] of [[1920,1080],[1440,900],[1280,800],[1024,768],[900,700],[420,860],[375,700]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(350);
    const info = await p.evaluate(() => {
      const st = document.getElementById('stage').getBoundingClientRect();
      const cu = document.querySelector('.cubie').getBoundingClientRect();
      return {
        px: PX,
        stage: [Math.round(st.width), Math.round(st.height)],
        cubie: Math.round(cu.width),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    console.log('  ' + String(w).padStart(4) + 'x' + String(h).padEnd(5) +
      ' PX=' + info.px.toFixed(1).padStart(5) +
      ' stage=' + info.stage.join('x').padEnd(9) +
      ' cubie=' + String(info.cubie).padStart(3) + 'px' +
      ' overflow=' + info.overflow);
  }

  await b.close();
  console.log('\nDONE');
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
