const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
const OUT = 'work/shots';

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  await p.screenshot({ path: OUT + '/final-01-solved.png' });
  console.log('shot: solved');

  /* 打乱 */
  await p.locator('#btnScramble').click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/final-02-scrambled.png' });
  console.log('shot: scrambled');

  /* 展开 */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(2200);
  await p.screenshot({ path: OUT + '/final-03-unfolded.png' });
  console.log('shot: unfolded');

  /* 展开中途 */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(2200);
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(380);
  await p.screenshot({ path: OUT + '/final-04-mid.png' });
  console.log('shot: mid-animation');

  await b.close();
})();
