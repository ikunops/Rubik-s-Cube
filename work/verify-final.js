const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  console.log('加载错误:', errs.length ? errs.join(' | ') : '无');

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
          out.push({ pos: c.p.join(','), face: fk, dir: label,
                     name: t ? t.name : 'NULL', cos: t ? +t.cos.toFixed(3) : -9 });
        }
      }
    }
    return out;
  });
  const all = r.map(x => x.cos);
  console.log('');
  console.log('=== 选层结果 ===');
  console.log('样本 =', r.length, ' 失败 =', r.filter(x=>x.name==='NULL').length);
  console.log('对齐度: 平均=' + (all.reduce((a,b)=>a+b,0)/all.length).toFixed(3) +
    '  最小=' + Math.min(...all).toFixed(3) +
    '  负值=' + all.filter(x=>x<0).length +
    '  <0.5=' + all.filter(x=>x<0.5).length);
  const byDir = {};
  for (const o of r) (byDir[o.dir] = byDir[o.dir] || []).push(o.cos);
  for (const k in byDir) {
    const v = byDir[k];
    console.log('  ' + k.padEnd(4) + ' 平均=' + (v.reduce((a,b)=>a+b,0)/v.length).toFixed(3) +
      '  最小=' + Math.min(...v).toFixed(3) + '  负值=' + v.filter(x=>x<0).length);
  }
  await b.close();
})();
