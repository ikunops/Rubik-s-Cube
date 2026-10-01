const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 900, height: 900 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(800);

  for (const [rx, ry, tag] of [[0,0,'front'],[-90,0,'top'],[0,-90,'right'],[-24,-36,'iso']]) {
    await p.evaluate(([rx, ry]) => {
      cam.rx = rx; cam.ry = ry; camT.rx = rx; camT.ry = ry; cam.zoom = camT.zoom = 1;
    }, [rx, ry]);
    await p.waitForTimeout(500);
    await p.screenshot({ path: 'work/shots/angle-' + tag + '.png' });
    console.log('shot', tag, 'rx=' + rx, 'ry=' + ry);
  }

  /* 报告各面在屏幕上的中心位置 */
  const info = await p.evaluate(() => {
    const stage = document.getElementById('stage').getBoundingClientRect();
    const out = {};
    for (const f of FACE_KEYS) {
      const pts = [];
      for (const c of cubies) {
        for (const k of FACE_KEYS) {
          if (c.faces[k] !== FACE_DEF[f].color) continue;
          const wn = faceNormal(c, k);
          if (wn.join() !== FACE_DEF[f].n.join()) continue;
          const st = c.el.children[FACE_KEYS.indexOf(k)].querySelector('.sticker');
          if (!st) continue;
          const r = st.getBoundingClientRect();
          pts.push([r.left + r.width/2 - stage.left, r.top + r.height/2 - stage.top]);
        }
      }
      if (pts.length) {
        out[f] = {
          n: pts.length,
          cx: Math.round(pts.reduce((a,p)=>a+p[0],0)/pts.length),
          cy: Math.round(pts.reduce((a,p)=>a+p[1],0)/pts.length),
        };
      }
    }
    return { out, stage: { w: Math.round(stage.width), h: Math.round(stage.height) } };
  });
  console.log('\nstage', info.stage);
  console.log('当前角度下各面贴纸的屏幕中心：');
  for (const k of Object.keys(info.out)) console.log(' ', k, JSON.stringify(info.out[k]));
  await b.close();
})();
