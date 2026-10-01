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
  await p.waitForTimeout(2000);
  const info = await p.evaluate(() => {
    const c0 = cubies[0];
    const out = {
      err: null,
      bootDone: document.getElementById('boot').classList.contains('done'),
      mainU: +mainU.toFixed(3),
      nCubies: cubies.length,
      cubie0op: c0.el ? c0.el.style.opacity : 'no-el',
      solidVis: (() => { const l = document.querySelector('.layer'); return l ? l.style.visibility : 'none'; })(),
      cubeTf: document.getElementById('cube').style.transform.slice(0,40),
      stickers: 0, visible: 0, sample: [],
    };
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
        if (!st) continue;
        out.stickers++;
        const r = st.getBoundingClientRect();
        if (r.width < 10) continue;
        const cx = r.left+r.width/2, cy = r.top+r.height/2;
        const top = document.elementFromPoint(cx, cy);
        if (top === st) out.visible++;
        if (out.sample.length < 5) out.sample.push({
          fk, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width)],
          top: top ? (top.className || top.tagName) : 'null'
        });
      }
    }
    return out;
  });
  console.log(JSON.stringify(info, null, 2));
  console.log('errors:', errs);
  await b.close();
})();
