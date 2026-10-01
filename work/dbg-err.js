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
    const DIRS = [['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
                  ['右下',0.71,0.71],['右上',0.71,-0.71],['左下',-0.71,0.71],['左上',-0.71,-0.71]];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.35) continue;
        const P0 = grabPoint(c, nW);
        const s0 = projectToStage(P0);
        for (const [label, vx, vy] of DIRS) {
          const t = pickAxis(c, nW, [vx, vy]);
          if (!t) continue;
          const dvx = vx*60, dvy = vy*60;
          const tt = screenDeltaPerDeg(t.axis, P0);
          const tl = Math.hypot(tt[0], tt[1]);
          if (tl < 1e-6) continue;
          const tx = tt[0]/tl, ty = tt[1]/tl;
          const along = dvx*tx + dvy*ty;
          const ang = solveDragAngle(t.axis, P0, [dvx, dvy]);
          const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
          const moved = Math.hypot(p1[0]-s0[0], p1[1]-s0[1]);
          const err = Math.abs(moved - Math.abs(along));
          if (err > 1.5) {
            out.push({ pos: c.p.join(','), face: nW.join(','), fk, drag: label,
                       axis: t.axis, coord: t.coord, ang: +ang.toFixed(2),
                       target: +Math.abs(along).toFixed(2), moved: +moved.toFixed(2),
                       err: +err.toFixed(2), tl: +tl.toFixed(3),
                       proj: +t.proj.toFixed(2) });
          }
        }
      }
    }
    return out;
  });
  console.log('err>1.5 的样本数 =', r.length);
  console.log('位置        面        面名 拖拽   轴 层   ang    target  moved   err    |d1|');
  for (const o of r.slice(0, 18)) {
    console.log(o.pos.padEnd(10) + ' ' + o.face.padEnd(8) + ' ' + o.fk + '   ' + o.drag.padEnd(5) +
      ' ' + o.axis + ' ' + String(o.coord).padStart(2) + '  ' + String(o.ang).padStart(7) +
      ' ' + String(o.target).padStart(7) + ' ' + String(o.moved).padStart(6) +
      ' ' + String(o.err).padStart(6) + ' ' + String(o.tl).padStart(6));
  }
  await b.close();
})();
