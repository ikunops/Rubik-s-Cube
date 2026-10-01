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
          if (!nm) { out.push({pos:c.p.join(','),face:fk,dir:label,nm:null}); continue; }
          /* 关键：层实际转动时，面中心朝哪个方向移动 */
          const R0 = faceRefPoint(fk);
          const s0 = projectToStage(R0);
          const info = moveInfo(nm);
          const p1 = projectToStage(m4mv(m4rot(info.base.axis, info.ang), R0));
          const mx = p1[0]-s0[0], my = p1[1]-s0[1];
          const mag = Math.hypot(mx,my) || 1;
          const cos = (mx*vx + my*vy) / (mag * Math.hypot(vx,vy));
          out.push({ pos: c.p.join(','), face: fk, dir: label, layer: nm,
                     ang: info.ang, move: [+mx.toFixed(1), +my.toFixed(1)],
                     cos: +cos.toFixed(3) });
        }
      }
    }
    return out;
  });

  console.log('=== 层实际转动方向 vs 拖拽方向（含符号）===');
  const byDir = {};
  for (const o of r) if (o.cos !== undefined) (byDir[o.dir]=byDir[o.dir]||[]).push(o.cos);
  for (const k in byDir) {
    const v = byDir[k];
    console.log('  ' + k.padEnd(4) + ' 平均=' + (v.reduce((a,b)=>a+b,0)/v.length).toFixed(3) +
      '  最小=' + Math.min(...v).toFixed(3) + '  负值=' + v.filter(x=>x<0).length + '/' + v.length);
  }
  const all = r.map(x=>x.cos).filter(x=>x!==undefined);
  console.log('\n总体: 平均=' + (all.reduce((a,b)=>a+b,0)/all.length).toFixed(3) +
    '  最小=' + Math.min(...all).toFixed(3) + '  负值=' + all.filter(x=>x<0).length + '/' + all.length);
  console.log('选层失败 =', r.filter(x=>!x.layer).length);
  console.log('\n=== F 面明细 ===');
  console.log('位置        方向  层    角度   面中心位移         cos');
  for (const o of r.filter(x=>x.face==='F' && x.layer)) {
    console.log(o.pos.padEnd(10)+' '+o.dir.padEnd(4)+' '+o.layer.padEnd(5)+
      String(o.ang).padStart(5)+'  ['+String(o.move[0]).padStart(7)+','+String(o.move[1]).padStart(7)+
      ']  '+String(o.cos).padStart(5)+(o.cos<0.5?'  <<<':''));
  }
  await b.close();
})();
