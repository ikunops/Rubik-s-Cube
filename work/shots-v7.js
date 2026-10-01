const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
const OUT = 'work/shots';
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1600);
  await p.screenshot({ path: OUT + '/v7-01-default.png' });   // 主图立体 + 侧栏展开图

  await p.locator('#btnScramble').click();
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/v7-02-scrambled.png' });

  /* 主图展开（侧栏保持展开图） */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1400);
  await p.screenshot({ path: OUT + '/v7-03-main-net.png' });

  /* 侧栏切到 3D */
  await p.locator('#btnSideMini').click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/v7-04-both-3d.png' });

  /* 主图折叠，侧栏保持 3D */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1400);
  await p.screenshot({ path: OUT + '/v7-05-side-3d.png' });

  /* 拖拽跟手瞬间 */
  const t = await p.evaluate(() => {
    const c = [];
    for (const cu of cubies) for (const fk of FACE_KEYS) {
      if (!cu.faces[fk]) continue;
      const st = cu.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left+r.width/2, cy = r.top+r.height/2;
      if (document.elementFromPoint(cx,cy) !== st) continue;
      c.push({ x: cx, y: cy, d: Math.hypot(cx-innerWidth/2, cy-innerHeight/2) });
    }
    c.sort((a,b)=>a.d-b.d);
    return c[0];
  });
  const cdp = await p.context().newCDPSession(p);
  const S = (type, x, y) => cdp.send('Input.dispatchMouseEvent', {
    type, x, y, button:'left', buttons: type==='mouseReleased'?0:1, clickCount:1 });
  await S('mousePressed', t.x, t.y);
  for (let i = 1; i <= 8; i++) await S('mouseMoved', t.x + i*7, t.y + i*1.5);
  await p.waitForTimeout(120);
  await p.screenshot({ path: OUT + '/v7-06-drag.png' });
  await S('mouseReleased', t.x + 56, t.y + 12);
  await b.close();
  console.log('shots done');
})();
