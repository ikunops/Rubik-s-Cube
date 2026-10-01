const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const info = await p.evaluate(() => {
    const vis = miniVisibleFaces();
    const all = FACE_KEYS.map(f => ({
      f, z: +m4dir(MINI_ROT, FACE_DEF[f].n)[2].toFixed(3),
      ctr: m4mv(MINI_ROT, sheetCenter(f)).map(v => +v.toFixed(2)),
    }));
    return { vis, all, minirot: MINI_ROT.map(v=>+v.toFixed(3)) };
  });
  console.log('miniVisibleFaces() =', info.vis.join(', '));
  console.log('\n各面在迷你相机下的 z 与投影中心 (x,y):');
  for (const o of info.all) {
    console.log('  ' + o.f + '  z=' + String(o.z).padStart(6) + '  ctr=(' + o.ctr[0] + ', ' + o.ctr[1] + ')' +
                (o.z > 0.02 ? '   <- 可见' : ''));
  }
  console.log('\n期望：U 在屏幕上方(y 负)，F 在左下，R 在右下');

  /* 采样迷你画布三个区域的像素颜色 */
  const px = await p.evaluate(() => {
    const cv = document.getElementById('miniCube');
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    const at = (fx, fy) => {
      const d = ctx.getImageData(Math.round(w*fx), Math.round(h*fy), 1, 1).data;
      return '#' + [d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
    };
    return { top: at(0.5, 0.18), left: at(0.3, 0.68), right: at(0.72, 0.68),
             w, h, cssW: cv.clientWidth, cssH: cv.clientHeight };
  });
  console.log('\n迷你画布采样:', JSON.stringify(px));
  await b.close();
})();
