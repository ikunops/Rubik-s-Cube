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
    /* 取一个具体样本，打印全部中间量 */
    const c = cubies.find(x => x.p.join() === '-1,-1,0' && x.faces['U']);
    const nW = faceNormal(c, 'U');
    const P0 = grabPoint(c, nW);
    const s0 = projectToStage(P0);
    const dv = [-60, 0];   // 向左拖 60px
    const t = pickAxis(c, nW, dv);
    const tt = screenDeltaPerDeg(t.axis, P0);
    const tl = Math.hypot(tt[0], tt[1]);
    const along = (dv[0]*tt[0] + dv[1]*tt[1]) / tl;
    const ang = solveDragAngle(t.axis, P0, dv);
    const distAt = th => { const q = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], th), P0));
                           return Math.hypot(q[0]-s0[0], q[1]-s0[1]); };
    return { solverSrc: solveDragAngle.toString().slice(0, 120),
             axis: t.axis, coord: t.coord, tl: +tl.toFixed(3),
             along: +along.toFixed(2), target: Math.abs(along),
             ang: +ang.toFixed(2), distAtAng: +distAt(Math.abs(ang)).toFixed(2),
             err: +Math.abs(distAt(Math.abs(ang)) - Math.abs(along)).toFixed(2) };
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
})();
