const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1400);

  /* 找一个可拖的贴纸 */
  const findSticker = () => p.evaluate(() => {
    let best = null;
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
        if (!st) continue;
        const r = st.getBoundingClientRect();
        if (r.width < 10) continue;
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        if (document.elementFromPoint(cx, cy) !== st) continue;
        const d = Math.hypot(cx - 700, cy - 460);
        if (!best || d < best.d) best = { x: cx, y: cy, d };
      }
    }
    return best;
  });

  async function attempt(label, waitBefore) {
    if (waitBefore) await p.waitForTimeout(waitBefore);
    const t = await findSticker();
    const st0 = await p.evaluate(() => ({ anim: !!anim, mainU: +mainU.toFixed(3),
                                          mode, queue: queue.length }));
    await p.mouse.move(t.x, t.y);
    await p.mouse.down();
    await p.mouse.move(t.x + 40, t.y, { steps: 6 });
    const st1 = await p.evaluate(() => ({ locked: !!(drag && drag.locked),
                                          kind: drag ? drag.kind : null }));
    await p.mouse.up();
    await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 6000 });
    const okFlag = st1.locked && st1.kind === 'turn';
    console.log((okFlag ? '  ok  ' : '  FAIL') + '  ' + label.padEnd(28) +
      ' 按下前: anim=' + st0.anim + ' mainU=' + st0.mainU + ' mode=' + st0.mode +
      ' queue=' + st0.queue + '  ->  ' + st1.kind + (okFlag ? '' : '  <<< 拖不动'));
    return okFlag;
  }

  console.log('=== 场景 A：加载后立刻拖（预热期间）===');
  {
    const p2 = await b.newPage({ viewport: { width: 1500, height: 940 } });
    await p2.goto(FILE, { waitUntil: 'load' });
    await p2.waitForTimeout(120);
    const t = await p2.evaluate(() => {
      for (const c of cubies) for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
        if (!st) continue;
        const r = st.getBoundingClientRect();
        if (r.width < 10) continue;
        const cx = r.left+r.width/2, cy = r.top+r.height/2;
        if (document.elementFromPoint(cx,cy) !== st) continue;
        return { x: cx, y: cy };
      }
      return null;
    });
    const st0 = await p2.evaluate(() => ({ mainU: +mainU.toFixed(3), mode, anim: !!anim }));
    if (t) {
      await p2.mouse.move(t.x, t.y); await p2.mouse.down();
      await p2.mouse.move(t.x + 40, t.y, { steps: 6 });
      const st1 = await p2.evaluate(() => ({ locked: !!(drag&&drag.locked), kind: drag?drag.kind:null }));
      await p2.mouse.up();
      console.log('    加载 120ms 后: 按下前 mainU=' + st0.mainU + ' anim=' + st0.anim +
                  '  ->  ' + st1.kind + (st1.locked ? '  ok' : '  <<< 拖不动'));
    } else console.log('    找不到贴纸');
    await p2.close();
  }

  console.log('');
  console.log('=== 场景 B：刚转完一步，立刻拖（动画进行中）===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  await p.locator('#moves .mv').first().click();   // 触发 240ms 动画
  await attempt('转完立刻拖 (等0ms)', 0);

  console.log('');
  console.log('=== 场景 C：等动画结束再拖 ===');
  await attempt('等 400ms 后拖', 400);

  console.log('');
  console.log('=== 场景 D：连续快速拖 5 次 ===');
  let okCount = 0;
  for (let i = 0; i < 5; i++) {
    const r = await attempt('第 ' + (i+1) + ' 次 (等80ms)', 80);
    if (r) okCount++;
  }
  console.log('    连续 5 次成功 ' + okCount + ' 次');

  await b.close();
})();
