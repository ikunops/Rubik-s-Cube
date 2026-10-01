const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1600);

  /* 逐格验证：拖动方向与「抓取点实际移动方向」是否一致 */
  const r = await p.evaluate(() => {
    const out = [];
    const DIRS = [['右',1,0],['左',-1,0],['下',0,1],['上',0,-1]];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.35) continue;
        const P0 = grabPoint(c, nW);
        const s0 = projectOrtho(P0);
        const rec = { pos: c.p.join(','), face: fk, ok: {}, layer: {} };
        for (const [label, vx, vy] of DIRS) {
          const t = pickTurnFromDrag(c, fk, [vx, vy]);
          const nm = moveNameFor(t.axis, t.coord, 1);
          rec.layer[label] = nm || '?';
          /* 该层转动时，抓取点朝哪个方向移动 */
          const ang = solveDragAngle(t.axis, P0, [vx*80, vy*80], fk);
          const p1 = projectOrtho(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
          const mx = p1[0]-s0[0], my = p1[1]-s0[1];
          const mag = Math.hypot(mx, my) || 1;
          /* 与拖拽方向的余弦 */
          const cos = (mx*vx + my*vy) / (mag * Math.hypot(vx,vy));
          rec.ok[label] = +cos.toFixed(2);
        }
        out.push(rec);
      }
    }
    return out;
  });

  /* 统计：每个方向的「方向一致性」 */
  console.log('=== 拖动方向 -> 抓取点移动方向的一致性（1.0=完全同向）===');
  const agg = {};
  for (const rec of r) {
    for (const k in rec.ok) {
      (agg[k] = agg[k] || []).push(rec.ok[k]);
    }
  }
  for (const k in agg) {
    const v = agg[k];
    const avg = v.reduce((a,b)=>a+b,0)/v.length;
    const bad = v.filter(x => x < 0.7).length;
    console.log('  ' + k.padEnd(4) + ' 平均 cos=' + avg.toFixed(3) +
                '  最小=' + Math.min(...v).toFixed(2) + '  不一致(<0.7)=' + bad + '/' + v.length);
  }
  console.log('\n=== 明细（前 12 格）===');
  console.log('位置        面   右      左      下      上      | 层(右/下)');
  for (const rec of r.slice(0, 12)) {
    console.log(rec.pos.padEnd(10) + ' ' + rec.face + '  ' +
      [rec.ok['右'],rec.ok['左'],rec.ok['下'],rec.ok['上']].map(v=>String(v).padEnd(6)).join(' ') +
      ' | ' + rec.layer['右'] + '/' + rec.layer['下']);
  }
  await b.close();
})();
