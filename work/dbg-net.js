const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(900);

  await p.locator('#moves .mv').first().click();   // U
  await p.waitForTimeout(900);

  const info = await p.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('.net-face'));
    return boxes.map(box => ({
      face: box.__face,
      grid: box.style.gridColumn + ',' + box.style.gridRow,
      cells: Array.from(box.children).map(c => c.className + '=' + (c.style.background || 'none')),
    }));
  });
  for (const i of info) {
    console.log('net face', i.face, 'grid', i.grid);
    console.log('  ', i.cells.join(' | '));
  }
  console.log('\n--- model F face after U ---');
  console.log(JSON.stringify(await p.evaluate(() => readFaceColors(cubies,'F'))));
  await b.close();
})();
