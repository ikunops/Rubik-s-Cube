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
    const DIRS = [['右',1,0],['下',0,1],['右下',0.71,0.71]];
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
          const ang = solveDragAngle(t.axis, P0, [dvx, dvy]);
          const tt = screenDeltaPerDeg(t.axis, P0);
          const tl = Math.hypot(tt[0], tt[1]);
          const tx = tt[0]/tl, ty = tt[1]/tl;
          const along = dvx*tx + dvy*ty;
          out.push({ pos: c.p.join(','), face: nW.join(','), drag: label,
                     axis: t.axis, coord: t.coord, proj: +t.proj.toFixed(2),
                     len: +t.len.toFixed(2), ang: +ang.toFixed(1),
                     along: +along.toFixed(2), tl: +tl.toFixed(3) });
        }
      }
    }
    return out;
  });
  console.log('样本数 =', r.length);
  console.log('位置        面        拖拽  轴 层  proj    len    ang    along  |d1|');
  for (const o of r.slice(0, 25)) {
    console.log(o.pos.padEnd(10) + ' ' + o.face.padEnd(8) + ' ' + o.drag.padEnd(4) +
      ' ' + o.axis + ' ' + String(o.coord).padStart(2) + '  ' +
      String(o.proj).padStart(6) + ' ' + String(o.len).padStart(6) + ' ' +
      String(o.ang).padStart(6) + ' ' + String(o.along).padStart(7) + ' ' + o.tl);
  }
  const alongVals = r.map(o => Math.abs(o.along));
  console.log('\nalong 绝对值: 最大', Math.max(...alongVals).toFixed(1), ' 最小', Math.min(...alongVals).toFixed(1));
  console.log('along>8 的数量 =', alongVals.filter(v=>v>8).length);
  await b.close();
})();
