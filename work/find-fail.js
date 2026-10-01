const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  p.setDefaultTimeout(15000);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const cdp = await p.context().newCDPSession(p);
  const S = (t,x,y) => cdp.send('Input.dispatchMouseEvent', { type:t, x, y, button:'left',
    buttons: t==='mouseReleased'?0:1, clickCount:1 });

  /* 重复 200 次随机拖拽，记录每次失败的原因 */
  /* 每次拖拽前重新查询（魔方状态在变，位置会移动） */
  const getCells = () => p.evaluate(() => {
    const out = [];
    for (const c of cubies) for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      if (m4dir(frameCam, faceNormal(c,fk))[2] < 0.35) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left+r.width/2, cy = r.top+r.height/2;
      if (document.elementFromPoint(cx,cy) !== st) continue;
      out.push({x:cx, y:cy, pos:c.p.join(','), face:fk});
    }
    return out;
  });
  const cells = await getCells();
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
  let okc = 0; const fails = [];
  for (let i = 0; i < 200; i++) {
    const cellsNow = await getCells();
    const cell = cellsNow[Math.floor(Math.random()*cellsNow.length)];
    const [dx, dy] = DIRS[Math.floor(Math.random()*4)];
    const D = 140;
    const ex = Math.max(8, Math.min(1492, cell.x + dx*D));
    const ey = Math.max(8, Math.min(932, cell.y + dy*D));
    const before = await p.evaluate(() => cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|'));
    await S('mousePressed', cell.x, cell.y);
    for (let k=1;k<=5;k++) await S('mouseMoved', cell.x+(ex-cell.x)*k/5, cell.y+(ey-cell.y)*k/5);
    const pick = await p.evaluate(() => drag && drag.pick ? drag.pick.name : null);
    await S('mouseReleased', ex, ey);
    try {
      await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 4000, polling: 25 });
      const after = await p.evaluate(() => cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|'));
      if (before !== after) okc++;
      else fails.push({ pos: cell.pos, face: cell.face, dir: dx+','+dy, pick,
                        ex: Math.round(ex), ey: Math.round(ey), why: '无变化' });
    } catch (e) {
      fails.push({ pos: cell.pos, face: cell.face, dir: dx+','+dy, pick, why: '超时' });
      await p.evaluate(() => { spin = null; queue.length = 0; });
    }
  }
  console.log('成功 = ' + okc + '/200   失败 = ' + fails.length);
  for (const f of fails.slice(0, 10)) console.log('  ' + JSON.stringify(f));
  console.log('页面错误:', errs.length ? errs.slice(0,3).join(' | ') : '无');
  await b.close();
})();
