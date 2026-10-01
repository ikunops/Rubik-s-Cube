const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL: ' + m); } else console.log('  ok  : ' + m); };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  p.setDefaultTimeout(15000);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const cdp = await p.context().newCDPSession(p);
  const S = (type, x, y) => cdp.send('Input.dispatchMouseEvent', {
    type, x, y, button:'left', buttons: type==='mouseReleased'?0:1, clickCount:1 });

  console.log('=== A. 加载 ===');
  ok(errs.length === 0, '无运行时错误' + (errs.length ? ' -> ' + errs[0] : ''));

  console.log('\n=== B. 遍历魔方每个可见格子 × 4 方向，真实拖拽 ===');
  /* 取所有可见贴纸的屏幕中心 */
  const cells = await p.evaluate(() => {
    const out = [];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.35) continue;
        const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
        if (!st) continue;
        const r = st.getBoundingClientRect();
        if (r.width < 14) continue;
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        if (document.elementFromPoint(cx, cy) !== st) continue;
        out.push({ x: cx, y: cy, pos: c.p.join(','), face: fk });
      }
    }
    return out;
  });
  console.log('  可点击的可见格子数 = ' + cells.length);

  const DIRS = [[1,0,'右'],[-1,0,'左'],[0,1,'下'],[0,-1,'上']];
  let tested = 0, turned = 0, failed = [];
  for (const cell of cells) {
    for (const [dx, dy, dname] of DIRS) {
      /* 每次拖拽前重置到复原态，保证可重复 */
      await p.evaluate(() => { resetToSolved(); });
      await p.waitForTimeout(20);
      const D = 150;
      const ex = Math.max(8, Math.min(1492, cell.x + dx*D));
      const ey = Math.max(8, Math.min(932, cell.y + dy*D));
      const before = await p.evaluate(() => cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|'));
      await S('mousePressed', cell.x, cell.y);
      for (let k = 1; k <= 6; k++) await S('mouseMoved', cell.x+(ex-cell.x)*k/6, cell.y+(ey-cell.y)*k/6);
      const locked = await p.evaluate(() => !!(drag && drag.locked) ? drag.pick.name : null);
      await S('mouseReleased', ex, ey);
      /* 等静止 */
      try { await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 4000, polling: 30 }); }
      catch (e) { failed.push({ cell: cell.pos, face: cell.face, dir: dname, why: '未静止' }); continue; }
      const after = await p.evaluate(() => cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|'));
      tested++;
      if (!locked) failed.push({ cell: cell.pos, face: cell.face, dir: dname, why: '未锁定层' });
      else if (before === after) failed.push({ cell: cell.pos, face: cell.face, dir: dname, why: '魔方没变化' });
      else turned++;
    }
  }
  console.log('  测试总数 = ' + tested);
  console.log('  成功转动 = ' + turned + '  (' + (turned/tested*100).toFixed(1) + '%)');
  console.log('  失败     = ' + failed.length);
  for (const f of failed.slice(0, 12)) console.log('    ' + JSON.stringify(f));
  ok(failed.length === 0, '每个格子 × 每个方向都能转起来');

  console.log('\n=== C. 四个方向的转动结果 ===');
  /* 在中心格上分别向四个方向拖，记录层名 */
  const center = await p.evaluate(() => {
    for (const c of cubies) {
      if (!c.faces['F'] || c.p.join(',') !== '0,0,1') continue;
      const st = c.el.children[FACE_KEYS.indexOf('F')].querySelector('.sticker');
      const r = st.getBoundingClientRect();
      return { x: r.left+r.width/2, y: r.top+r.height/2 };
    }
    return null;
  });
  for (const [dx, dy, dname] of DIRS) {
    await p.evaluate(() => { resetToSolved(); });
    await p.waitForTimeout(20);
    await S('mousePressed', center.x, center.y);
    for (let k=1;k<=6;k++) await S('mouseMoved', center.x+dx*150*k/6, center.y+dy*150*k/6);
    const info = await p.evaluate(() => drag && drag.pick ? { name: drag.pick.name, axis: drag.pick.axis, cos: +drag.pick.cos.toFixed(2) } : null);
    await S('mouseReleased', center.x+dx*150, center.y+dy*150);
    await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 4000, polling: 30 });
    console.log('  拖' + dname + ' -> ' + (info ? info.name + ' (轴' + info.axis + ', 对齐' + info.cos + ')' : 'NULL'));
    ok(info !== null, '拖' + dname + ' 能锁定层');
  }

  console.log('\n=== D. 连续随机拖拽 60 次（模拟真实乱玩）===');
  let okc = 0, failc = 0;
  for (let i = 0; i < 60; i++) {
    const cell = cells[Math.floor(Math.random()*cells.length)];
    const [dx, dy] = DIRS[Math.floor(Math.random()*4)];
    const ex = Math.max(8, Math.min(1492, cell.x + dx*140));
    const ey = Math.max(8, Math.min(932, cell.y + dy*140));
    const before = await p.evaluate(() => cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|'));
    await S('mousePressed', cell.x, cell.y);
    for (let k=1;k<=5;k++) await S('mouseMoved', cell.x+(ex-cell.x)*k/5, cell.y+(ey-cell.y)*k/5);
    await S('mouseReleased', ex, ey);
    try {
      await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 4000, polling: 30 });
      const after = await p.evaluate(() => cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|'));
      if (before !== after) okc++; else failc++;
    } catch (e) { failc++; }
  }
  console.log('  成功 ' + okc + '/60  失败 ' + failc);
  ok(failc === 0, '连续 60 次随机拖拽全部成功');

  console.log('\n=== E. 最终无错误 ===');
  ok(errs.length === 0, '全程无错误' + (errs.length ? ' -> ' + errs.slice(0,2).join(' | ') : ''));

  await b.close();
  console.log(fails === 0 ? '\n=== ALL PASSED ===' : '\n=== ' + fails + ' FAILURES ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
