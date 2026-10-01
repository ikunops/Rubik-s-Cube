const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  /* 对每个可见贴纸，测量「水平拖动多少 px 才能转 45 度（提交一格）」 */
  const r = await p.evaluate(() => {
    const out = [];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.5) continue;
        const P0 = grabPoint(c, nW);
        const t = pickAxis(c, nW, [1, 0]);
        if (!t) continue;
        /* 二分找让 |angle| 达到 45 的拖拽距离 */
        let lo = 0, hi = 600;
        for (let i = 0; i < 20; i++) {
          const mid = (lo + hi) / 2;
          const a = Math.abs(solveDragAngle(t.axis, P0, [mid, 0]));
          if (a < 45) lo = mid; else hi = mid;
        }
        out.push({ pos: c.p.join(','), face: nW.join(','),
                   px45: Math.round((lo+hi)/2),
                   px90: Math.round((lo+hi)/2 * 2) });
      }
    }
    return out;
  });
  console.log('水平拖动多少 px 才提交一格（45度）:');
  console.log('  位置        面        需拖 px  (90度约)');
  const vals = r.map(o => o.px45);
  for (const o of r) console.log('  ' + o.pos.padEnd(10) + ' ' + o.face.padEnd(8) + ' ' +
    String(o.px45).padStart(6) + '    ' + String(o.px90).padStart(6));
  console.log('');
  console.log('  最小 ' + Math.min(...vals) + 'px  最大 ' + Math.max(...vals) +
              'px  中位 ' + vals.sort((a,b)=>a-b)[Math.floor(vals.length/2)] + 'px');
  console.log('  视口宽 1500px，即需拖动约 ' +
              (Math.min(...vals)/1500*100).toFixed(1) + '%~' +
              (Math.max(...vals)/1500*100).toFixed(1) + '% 的宽度');
  await b.close();
})();
