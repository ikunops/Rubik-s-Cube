const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  for (const [w,h,tag] of [[1920,1080,'1920'],[1440,900,'1440'],[1280,800,'1280']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.goto(FILE, { waitUntil: 'load' });
    await p.waitForTimeout(1100);
    await p.screenshot({ path: 'work/shots/size-' + tag + '-folded.png' });
    await p.locator('#btnUnfold').click();
    await p.waitForTimeout(2000);
    await p.screenshot({ path: 'work/shots/size-' + tag + '-net.png' });
    const info = await p.evaluate(() => {
      const st = document.getElementById('stage').getBoundingClientRect();
      const cubies = document.querySelectorAll('.cubie');
      let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
      for (const c of cubies) { const r=c.getBoundingClientRect(); if(r.width<2)continue;
        x0=Math.min(x0,r.left); x1=Math.max(x1,r.right); y0=Math.min(y0,r.top); y1=Math.max(y1,r.bottom); }
      const plates = Array.from(document.querySelectorAll('.plate')).map(pl=>pl.getBoundingClientRect());
      let px0=1e9,px1=-1e9,py0=1e9,py1=-1e9;
      for (const r of plates) { px0=Math.min(px0,r.left); px1=Math.max(px1,r.right); py0=Math.min(py0,r.top); py1=Math.max(py1,r.bottom); }
      return { PX, st:[Math.round(st.width),Math.round(st.height)],
        cube:[Math.round(x1-x0),Math.round(y1-y0)],
        net:[Math.round(px1-px0),Math.round(py1-py0)] };
    });
    console.log(tag.padEnd(5), 'PX='+info.PX.toFixed(0).padStart(3),
      'stage='+info.st.join('x').padEnd(9),
      'cube='+info.cube.join('x').padEnd(9),
      'net='+info.net.join('x').padEnd(9),
      'net/stage='+(info.net[0]/info.st[0]*100).toFixed(0)+'%');
    await p.close();
  }
  await b.close();
})();
