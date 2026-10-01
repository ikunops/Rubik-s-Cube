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
    const rows = [];
    /* 遍历可见面上的所有贴纸 × 8 个方向 */
    const DIRS = [['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
                  ['右下',0.71,0.71],['右上',0.71,-0.71],['左下',-0.71,0.71],['左上',-0.71,-0.71]];
    let total = 0, noLayer = 0, noFollow = 0, unreachable = 0;
    const bad = [];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.35) continue;
        const P0 = grabPoint(c, nW);
        const s0 = projectToStage(P0);
        for (const [label, vx, vy] of DIRS) {
          const t = pickTurnFromDrag(c, fk, [vx, vy]);
          const name = moveNameFor(t.axis, t.coord, 1);
          total++;
          if (!name) { noLayer++; bad.push({ pos: c.p.join(','), fk, drag: label, why: '无层' }); continue; }
          const D = 60;
          const ang = solveDragAngle(t.axis, P0, [vx*D, vy*D]);
          if (Math.abs(ang) < 0.01) { noLayer++; bad.push({ pos:c.p.join(','), fk, drag: label, why:'角度0' }); continue; }
          const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
          const moved = Math.hypot(p1[0]-s0[0], p1[1]-s0[1]);
          const err = Math.abs(moved - D);
          if (err > 1.5) { noFollow++; bad.push({ pos:c.p.join(','), fk, drag:label, why:'跟手 '+err.toFixed(1)+'px', ang:+ang.toFixed(1), moved:+moved.toFixed(1) }); }
          /* 是否 90 度可达 */
          const ang90 = solveDragAngle(t.axis, P0, [vx*400, vy*400]);
          if (Math.abs(ang90) < 88) { unreachable++; bad.push({ pos:c.p.join(','), fk, drag:label, why:'90度需拖>400px', ang90:+ang90.toFixed(1) }); }
        }
      }
    }
    return { total, noLayer, noFollow, unreachable, bad: bad.slice(0, 14) };
  });

  console.log('总样本 =', r.total);
  console.log('无对应层 =', r.noLayer);
  console.log('跟手误差>1.5px =', r.noFollow);
  console.log('拖 400px 仍转不到 90 度 =', r.unreachable);
  if (r.bad.length) {
    console.log('\n问题样例:');
    for (const o of r.bad) console.log('  ' + o.pos + ' 面' + o.fk + ' 拖' + o.drag + ' -> ' + o.why);
  }
  await b.close();
})();
