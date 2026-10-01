const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const out = [];
    const DIRS = [['右',1,0],['左',-1,0],['下',0,1],['上',0,-1]];
    /* 只取 F 面（正对相机的面）的所有 9 格 */
    for (const c of cubies) {
      if (!c.faces['F']) continue;
      const nW = faceNormal(c, 'F');
      const P0 = grabPoint(c, nW);
      const s0 = projectToStage(P0);
      for (const [label, vx, vy] of DIRS) {
        const t = pickTurnFromDrag(c, 'F', [vx, vy]);
        const nm = moveNameFor(t.axis, t.coord, 1);
        const ang = solveDragAngle(t.axis, P0, [vx*80, vy*80], 'F');
        const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
        const mx = p1[0]-s0[0], my = p1[1]-s0[1];
        const mag = Math.hypot(mx,my)||1;
        const cos = (mx*vx + my*vy)/(mag*Math.hypot(vx,vy));
        out.push({ pos: c.p.join(','), dir: label, layer: nm, ang: +ang.toFixed(1),
                   move: [+mx.toFixed(1), +my.toFixed(1)], cos: +cos.toFixed(2) });
      }
    }
    return out;
  });
  console.log('=== F 面 9 格 × 4 方向（应用真实函数）===');
  console.log('位置        方向  层    角度    屏幕位移         cos');
  for (const o of r) {
    console.log(o.pos.padEnd(10) + ' ' + o.dir.padEnd(4) + ' ' + String(o.layer).padEnd(5) +
      String(o.ang).padStart(6) + '  [' + String(o.move[0]).padStart(7) + ',' +
      String(o.move[1]).padStart(7) + ']  ' + String(o.cos).padStart(5) +
      (o.cos < 0.7 ? '  <<<' : ''));
  }
  const bad = r.filter(x => x.cos < 0.7);
  console.log('');
  console.log('总计 ' + r.length + ' 样本, 方向不一致(<0.7) = ' + bad.length);
  await b.close();
})();
