const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
const { PNG } = (() => { try { return require('pngjs'); } catch(e) { return {}; } })();

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1000);

  const HEX = { '#c8102e':'red', '#ff6a00':'orange', '#f7f7f5':'white',
                '#ffd500':'yellow', '#0057b8':'blue', '#00a05a':'green' };

  async function audit(label) {
    /* 1. 收集所有可见贴纸的屏幕位置和期望颜色 */
    const items = await p.evaluate(() => {
      const stage = document.getElementById('stage').getBoundingClientRect();
      const out = [];
      const HEX = { '#c8102e':'red','#ff6a00':'orange','#f7f7f5':'white','#ffd500':'yellow','#0057b8':'blue','#00a05a':'green' };
      for (const c of cubies) {
        for (let i = 0; i < FACE_KEYS.length; i++) {
          const k = FACE_KEYS[i];
          const st = c.el.children[i].querySelector('.sticker');
          if (!st) continue;
          const r = st.getBoundingClientRect();
          if (r.width < 6) continue;
          const cx = r.left + r.width/2, cy = r.top + r.height/2;
          /* 是否被别的元素遮挡（elementFromPoint 命中自己或父级） */
          const top = document.elementFromPoint(cx, cy);
          const occluded = !(top && (top === st || st.contains(top) || top === c.el || c.el.contains(top)));
          out.push({ face: k, want: HEX[st.style.background] || st.style.background,
                     x: cx, y: cy, occluded });
        }
      }
      return out;
    });

    /* 2. 截图并逐点采样 */
    const buf = await p.screenshot();
    const { createCanvas, loadImage } = { createCanvas: null, loadImage: null };
    const img = await p.evaluate(async (dataUrl) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d');
      cx.drawImage(img, 0, 0);
      return { w: img.width, h: img.height, data: Array.from(cx.getImageData(0,0,cv.width,cv.height).data.slice(0)) };
    }, 'data:image/png;base64,' + buf.toString('base64'));

    const PAL = { red:[200,16,46], orange:[255,106,0], white:[247,247,245],
                  yellow:[255,213,0], blue:[0,87,184], green:[0,160,90] };
    let good = 0, bad = 0, occ = 0;
    const badList = [];
    for (const it of items) {
      if (it.occluded) { occ++; continue; }
      const px = Math.round(it.x), py = Math.round(it.y);
      if (px < 0 || py < 0 || px >= img.w || py >= img.h) continue;
      const i = (py * img.w + px) * 4;
      const got = [img.data[i], img.data[i+1], img.data[i+2]];
      /* 找最接近的调色板颜色 */
      let best = null, bd = 1e9;
      for (const k in PAL) {
        const d = (got[0]-PAL[k][0])**2 + (got[1]-PAL[k][1])**2 + (got[2]-PAL[k][2])**2;
        if (d < bd) { bd = d; best = k; }
      }
      /* 白色贴纸有渐变高光，放宽阈值 */
      const tol = it.want === 'white' ? 9000 : 4000;
      if (best === it.want && bd < tol) good++;
      else { bad++; if (badList.length < 14) badList.push(it.face + ' want ' + it.want + ' got ' + best + ' rgb(' + got + ') d=' + Math.round(bd)); }
    }
    console.log('\n--- ' + label + ' ---');
    console.log('  可见贴纸', items.length, '| 采样通过', good, '| 不匹配', bad, '| 被遮挡跳过', occ);
    badList.forEach(s => console.log('    x ' + s));
    return bad;
  }

  let total = 0;
  total += await audit('默认视角 rx=-24 ry=-36');

  for (const [rx, ry, tag] of [[0,0,'正视'],[-90,0,'俯视'],[0,-90,'右视'],[-35,-45,'等轴']]) {
    await p.evaluate(([rx,ry]) => { cam.rx=rx; cam.ry=ry; camT.rx=rx; camT.ry=ry; }, [rx,ry]);
    await p.waitForTimeout(450);
    total += await audit(tag + ' rx=' + rx + ' ry=' + ry);
    await p.screenshot({ path: 'work/shots/audit-' + tag + '.png' });
  }

  await b.close();
  console.log(total === 0 ? '\n=== 贴纸颜色全部正确 ===' : '\n=== ' + total + ' 处颜色不符 ===');
})();
