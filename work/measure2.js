const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const out = [];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.5) continue;
        const P0 = grabPoint(c, nW);
        const t = pickTurnFromDrag(c, fk, [1, 0]);
        /* 拖多少 px 达到 45 度 */
        let lo = 0, hi = 500;
        for (let i = 0; i < 20; i++) {
          const mid = (lo+hi)/2;
          if (Math.abs(solveDragAngle(t.axis, P0, [mid, 0])) < 45) lo = mid; else hi = mid;
        }
        out.push({ pos: c.p.join(','), face: fk, layer: moveNameFor(t.axis,t.coord,1),
                   px45: Math.round((lo+hi)/2) });
      }
    }
    return out;
  });
  console.log('水平拖动提交一格所需距离:');
  console.log('  位置        面   层   需拖');
  for (const o of r) console.log('  ' + o.pos.padEnd(10) + ' ' + o.face.padEnd(4) + ' ' +
    String(o.layer).padEnd(4) + String(o.px45).padStart(5) + 'px');
  const v = r.map(o=>o.px45).sort((a,b)=>a-b);
  console.log('');
  console.log('  范围 ' + v[0] + '~' + v[v.length-1] + 'px   中位 ' + v[Math.floor(v.length/2)] + 'px');
  console.log('  (视口 1500px，即约 ' + (v[0]/1500*100).toFixed(0) + '%~' + (v[v.length-1]/1500*100).toFixed(0) + '% 宽度)');
  await b.close();
})();
