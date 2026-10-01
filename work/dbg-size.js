const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1548, height: 1027 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  console.log('folded:', await p.evaluate(() => ({ PX, UNFOLD_FIT, unfoldT, cam: {...cam}, zoom: camT.zoom })));

  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(2400);
  const d = await p.evaluate(() => {
    const st = document.getElementById('stage').getBoundingClientRect();
    const cubeEl = document.getElementById('cube');
    const plates = Array.from(document.querySelectorAll('.plate')).map(pl => {
      const r = pl.getBoundingClientRect();
      return { face: pl.__face, w: pl.style.width, tf: pl.style.transform.slice(0, 60),
               rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
    });
    return { PX, UNFOLD_FIT, unfoldT,
             stage: [Math.round(st.left), Math.round(st.top), Math.round(st.width), Math.round(st.height)],
             cubeTf: cubeEl.style.transform.slice(0, 80),
             plates };
  });
  console.log('PX =', d.PX, ' UNFOLD_FIT =', d.UNFOLD_FIT, ' unfoldT =', d.unfoldT);
  console.log('stage rect', d.stage.join(', '));
  console.log('cube transform:', d.cubeTf);
  console.log('plates:');
  for (const pl of d.plates) console.log('  ', pl.face, 'w=' + pl.w, 'rect=' + pl.rect.join(','), '\n      tf=', pl.tf);
  await b.close();
})();
