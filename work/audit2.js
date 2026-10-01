const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

const PAL = { red:[200,16,46], orange:[255,106,0], white:[247,247,245],
              yellow:[255,213,0], blue:[0,87,184], green:[0,160,90] };
function classify(r, g, b) {
  let best = null, bd = 1e9;
  for (const k in PAL) {
    const d = (r-PAL[k][0])**2 + (g-PAL[k][1])**2 + (b-PAL[k][2])**2;
    if (d < bd) { bd = d; best = k; }
  }
  return { name: best, d: bd };
}
const HEX2NAME = { '#c8102e':'red', '#ff6a00':'orange', '#f7f7f5':'white',
                   '#ffd500':'yellow', '#0057b8':'blue', '#00a05a':'green' };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1000);

  let grand = { good: 0, bad: 0 };

  async function audit(label) {
    const items = await p.evaluate(() => {
      const out = [];
      for (const c of cubies) {
        for (let i = 0; i < FACE_KEYS.length; i++) {
          const st = c.el.children[i].querySelector('.sticker');
          if (!st) continue;
          const r = st.getBoundingClientRect();
          if (r.width < 8) continue;
          const cx = Math.round(r.left + r.width/2), cy = Math.round(r.top + r.height/2);
          const top = document.elementFromPoint(cx, cy);
          const mine = (top === st) || st.contains(top);
          out.push({ face: FACE_KEYS[i], bg: st.style.background, x: cx, y: cy, mine });
        }
      }
      return out;
    });

    const shot = await p.screenshot();
    const px = await p.evaluate(async (url) => {
      const img = new Image(); img.src = url; await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, cv.width, cv.height);
      return { w: cv.width, h: cv.height, data: Array.from(d.data) };
    }, 'data:image/png;base64,' + shot.toString('base64'));

    let good = 0, bad = 0, skipped = 0;
    const bads = [];
    for (const it of items) {
      if (!it.mine) { skipped++; continue; }   // 背面/被遮挡
      const i = (it.y * px.w + it.x) * 4;
      const got = classify(px.data[i], px.data[i+1], px.data[i+2]);
      const want = classify(...Object.values(HEX2NAME).length ? hexToRgb(it.bg) : [0,0,0]);
      if (got.name === want.name) good++;
      else { bad++; if (bads.length < 8) bads.push(it.face + ' want ' + want.name + ' got ' + got.name + ' d=' + Math.round(got.d)); }
    }
    console.log('\n--- ' + label + ' ---');
    console.log('  正面贴纸采样: 通过 ' + good + ' | 不符 ' + bad + ' | 背面跳过 ' + skipped);
    bads.forEach(s => console.log('    x ' + s));
    grand.good += good; grand.bad += bad;
  }
  function hexToRgb(s) {
    const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s);
    if (m) return [+m[1], +m[2], +m[3]];
    const h = s.replace('#','');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }

  await audit('默认视角');
  for (const [rx, ry, tag] of [[0,0,'front'],[-90,0,'top'],[0,-90,'right'],[-35,-45,'iso'],[-30,60,'iso2']]) {
    await p.evaluate(([rx,ry]) => { cam.rx=rx; cam.ry=ry; camT.rx=rx; camT.ry=ry; }, [rx,ry]);
    await p.waitForTimeout(500);
    await audit(tag + ' rx=' + rx + ' ry=' + ry);
    await p.screenshot({ path: 'work/shots/audit-' + tag + '.png' });
  }

  await b.close();
  console.log('\n总计: 通过 ' + grand.good + ' / 不符 ' + grand.bad);
  console.log(grand.bad === 0 ? '=== 贴纸颜色全部正确 ===' : '=== 有 ' + grand.bad + ' 处不符 ===');
})();
