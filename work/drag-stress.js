const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

const CASES = [
  ['右拖 90px',   90,   0],
  ['左拖 90px',  -90,   0],
  ['下拖 90px',    0,  90],
  ['上拖 90px',    0, -90],
  ['右下 70,50',  70,  50],
  ['小拖 20px',   20,   0],
  ['半格 45px',   45,   0],
];

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  let fails = 0;

  for (const [label, dx, dy] of CASES) {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 940 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.setDefaultTimeout(8000);
    await p.goto(FILE, { waitUntil: 'load' });
    await p.waitForTimeout(1000);

    const t = await p.evaluate(() => {
      let best = null;
      for (const c of cubies) {
        if (!c.faces['F'] || faceNormal(c,'F').join() !== '0,0,1') continue;
        const st = c.el.children[FACE_KEYS.indexOf('F')].querySelector('.sticker');
        if (!st) continue;
        const r = st.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        if (document.elementFromPoint(cx, cy) !== st) continue;
        const d = Math.hypot(cx - 750, cy - 470);
        if (!best || d < best.d) best = { x: cx, y: cy, d };
      }
      return best;
    });

    let note = '', okFlag = true;
    try {
      /* 记录拖拽过程中整层是否刚性联动 */
      await p.mouse.move(t.x, t.y);
      await p.mouse.down();
      await p.mouse.move(t.x + dx * 0.5, t.y + dy * 0.5, { steps: 6 });
      const midState = await p.evaluate(() => {
        if (!drag || !drag.locked) return { locked: false };
        /* 检查 drag.hit 是否为整层（应为 9 块） */
        return { locked: true, hitCount: drag.hit.length,
                 angle: +drag.angle.toFixed(1),
                 name: moveNameFor(drag.axis, drag.coord, 1) || '?',
                 hint: document.getElementById('roHint').textContent,
                 axis: drag.axis, coord: drag.coord };
      });
      await p.mouse.move(t.x + dx, t.y + dy, { steps: 8 });
      await p.mouse.up();
      await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 6000 });
      await p.waitForTimeout(120);
      const n = parseInt(await p.locator('#stMoves').textContent());
      const h = (await p.locator('#hist').textContent()).trim();

      if (!midState.locked) { note = '未锁定转层'; okFlag = false; }
      else if (midState.hitCount !== 9) { note = '层内方块数=' + midState.hitCount + ' (应为9)'; okFlag = false; }
      else {
        const expect = Math.abs(Math.round(midState.angle * 2 / 90 / 2 * 2)) || 0;
        note = '锁定 ' + midState.name + ' 轴' + midState.axis + '/层' + midState.coord +
               ' 层内' + midState.hitCount + '块 角度' + midState.angle + '° 提示"' + midState.hint +
               '" -> 步数' + n + ' [' + h + ']';
      }
    } catch (e) { note = 'ERR: ' + e.message.split('\n')[0].slice(0,70); okFlag = false; }
    if (errs.length) { okFlag = false; note += '  PAGEERR:' + errs[0]; }
    if (!okFlag) fails++;
    console.log((okFlag ? '  ok  ' : '  FAIL') + '  ' + label.padEnd(12) + ' ' + note);
    await ctx.close();
  }

  await browser.close();
  console.log(fails === 0 ? '\n=== 拖拽压力测试全部通过 ===' : '\n=== ' + fails + ' 项失败 ===');
})();
