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
    const DIRS = [['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
                  ['右下',1,1],['右上',1,-1],['左下',-1,1],['左上',-1,-1]];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.35) continue;
        for (const [label, vx, vy] of DIRS) {
          const t = pickTurnFromDrag(c, fk, [vx, vy]);
          const nm = moveNameFor(t.axis, t.coord, t.sign);
          /* 该层转动时，面中心的屏幕移动方向 */
          const R0 = faceRefPoint(fk);
          const s0 = projectToStage(R0);
          const ang = angleFromProjection((vx*(faceBasis(fk).tDown[0]) + vy*faceBasis(fk).tDown[1]) / 1);
          /* 直接用选中轴算：面中心位移方向与拖拽方向的 cos */
          const t2 = screenDeltaPerDeg(t.axis, R0);
          const L = Math.hypot(t2[0],t2[1]) || 1;
          const cos = (vx*t2[0] + vy*t2[1]) / (L * Math.hypot(vx,vy));
          out.push({ pos: c.p.join(','), face: fk, dir: label, layer: nm,
                     axis: t.axis, coord: t.coord, cos: +cos.toFixed(3) });
        }
      }
    }
    return out;
  });
  console.log('=== 新算法：拖拽方向 vs 层运动方向 一致性 ===');
  const byDir = {};
  for (const o of r) (byDir[o.dir] = byDir[o.dir] || []).push(o.cos);
  for (const k in byDir) {
    const v = byDir[k];
    console.log('  ' + k.padEnd(4) + ' 平均=' + (v.reduce((a,b)=>a+b,0)/v.length).toFixed(3) +
      '  最小=' + Math.min(...v).toFixed(3) + '  <0=' + v.filter(x=>x<0).length + '/' + v.length);
  }
  const all = r.map(x=>x.cos);
  console.log('\n总体: 平均=' + (all.reduce((a,b)=>a+b,0)/all.length).toFixed(3) +
    '  最小=' + Math.min(...all).toFixed(3) + '  负值=' + all.filter(x=>x<0).length + '/' + all.length);
  console.log('\n=== F 面明细 ===');
  console.log('位置        方向  轴  层    cos');
  for (const o of r.filter(x=>x.face==='F')) {
    console.log(o.pos.padEnd(10)+' '+o.dir.padEnd(4)+' '+o.axis+'  '+
      String(o.coord).padStart(2)+'  '+String(o.cos).padStart(6)+(o.cos<0.9?'  <<<':''));
  }
  await b.close();
})();
