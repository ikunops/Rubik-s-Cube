const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1000);

  /* 1. render() 纯 JS 耗时 */
  const jsCost = await p.evaluate(() => {
    const t = [];
    for (let i = 0; i < 30; i++) {
      const a = performance.now();
      render(performance.now());
      t.push(performance.now() - a);
    }
    t.sort((x, y) => x - y);
    return { median: +t[15].toFixed(2), max: +t[29].toFixed(2) };
  });
  console.log('折叠态 render() 中位耗时 =', jsCost.median, 'ms  (最大', jsCost.max + ')');

  /* 2. 展开中每帧 render 耗时 */
  await p.locator('#btnUnfold').click();
  const during = await p.evaluate(() => new Promise(res => {
    const t = [];
    let frames = 0, last = performance.now();
    const gaps = [];
    function tick() {
      const now = performance.now();
      gaps.push(now - last); last = now;
      const a = performance.now();
      render(now);
      t.push(performance.now() - a);
      if (++frames < 60) requestAnimationFrame(tick);
      else {
        t.sort((x,y)=>x-y); gaps.sort((x,y)=>x-y);
        res({ median: +t[30].toFixed(2), max: +t[59].toFixed(2),
              gapMedian: +gaps[30].toFixed(2), gapMax: +gaps[59].toFixed(2) });
      }
    }
    requestAnimationFrame(tick);
  }));
  console.log('展开中 render() 中位 =', during.median, 'ms  最大 =', during.max, 'ms');
  console.log('展开中帧间隔 中位 =', during.gapMedian, 'ms  最大 =', during.gapMax, 'ms');

  /* 3. 逐项拆解展开中 render 的开销 */
  await p.waitForTimeout(1200);
  await p.evaluate(() => { mainU = 0.5; mainUTarget = 0.5; });
  const breakdown = await p.evaluate(() => {
    const N = 200;
    const timeIt = fn => { const a = performance.now(); for (let i=0;i<N;i++) fn(); return +((performance.now()-a)/N).toFixed(3); };
    const out = {};
    out.readFaceColors_x6 = timeIt(() => { for (const f of FACE_KEYS) readFaceColors(cubies, f); });
    out.unfoldMatrix_x6 = timeIt(() => { for (const f of FACE_KEYS) unfoldMatrix(HINGES[f], mainU); });
    out.m4css_x33 = timeIt(() => { for (let i=0;i<33;i++) m4css(m4id()); });
    out.queryPlates = timeIt(() => cubeEl.querySelectorAll('.plate'));
    out.buildHinges = timeIt(() => buildHinges());
    return out;
  });
  console.log('\n单次调用耗时 (ms):');
  for (const k in breakdown) console.log('  ' + k.padEnd(22), breakdown[k]);

  await b.close();
})();
