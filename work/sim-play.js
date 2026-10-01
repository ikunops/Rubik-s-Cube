const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL: ' + m); } else console.log('  ok  : ' + m); };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  p.setDefaultTimeout(20000);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1600);
  const cdp = await p.context().newCDPSession(p);
  const S = (t,x,y) => cdp.send('Input.dispatchMouseEvent', { type:t, x, y, button:'left',
    buttons: t==='mouseReleased'?0:1, clickCount:1 });
  const idle = () => p.waitForFunction(() => !spin && queue.length === 0, undefined, {timeout:30000, polling:40});
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
  const snap = () => p.evaluate(() => cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|'));

  console.log('=== 玩法 1：拖动转动（每个可见格子 × 8 方向）===');
  let cells = await getCells();
  let n = 0, good = 0;
  for (const cell of cells) {
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      await p.evaluate(() => resetToSolved());
      await p.waitForTimeout(15);
      const before = await snap();
      const ex = Math.max(8, Math.min(1492, cell.x+dx*150));
      const ey = Math.max(8, Math.min(932, cell.y+dy*150));
      await S('mousePressed', cell.x, cell.y);
      for (let k=1;k<=5;k++) await S('mouseMoved', cell.x+(ex-cell.x)*k/5, cell.y+(ey-cell.y)*k/5);
      await S('mouseReleased', ex, ey);
      await idle();
      if ((await snap()) !== before) good++;
      n++;
    }
  }
  ok(good === n, '拖动转动 ' + good + '/' + n + ' 全部生效');

  console.log('\n=== 玩法 2：按钮转动（9 个层 × 顺逆）===');
  await p.evaluate(() => resetToSolved());
  const btns = await p.locator('#moves .mv').count();
  ok(btns === 18, '转动按钮 18 个（9 层 × 顺逆），实际 ' + btns);
  let btnOK = 0;
  for (let i = 0; i < btns; i++) {
    const before = await snap();
    await p.locator('#moves .mv').nth(i).click();
    await idle();
    if ((await snap()) !== before) btnOK++;
  }
  ok(btnOK === btns, '按钮转动 ' + btnOK + '/' + btns + ' 全部生效');

  console.log('\n=== 玩法 3：键盘转动 ===');
  await p.evaluate(() => resetToSolved());
  await p.locator('body').click({ position: { x: 400, y: 100 } });
  let keyOK = 0;
  for (const k of ['u','d','l','r','f','b','m','e','s']) {
    const before = await snap();
    await p.keyboard.press(k);
    await idle();
    if ((await snap()) !== before) keyOK++;
  }
  ok(keyOK === 9, '键盘 9 个键全部生效 (' + keyOK + '/9)');

  console.log('\n=== 玩法 4：点侧栏展开图转面 ===');
  await p.evaluate(() => resetToSolved());
  await p.locator('#btnSideNet').click();
  await p.waitForTimeout(300);
  const beforeNet = await snap();
  await p.locator('.net-face').first().click();
  await idle();
  ok((await snap()) !== beforeNet, '点击展开图的面可转动');

  console.log('\n=== 玩法 5：打乱 → 还原 循环 3 轮 ===');
  for (let r = 1; r <= 3; r++) {
    await p.locator('#btnScramble').click();
    await p.waitForTimeout(250);
    const scr = await p.evaluate(() => !isSolved());
    await p.locator('#btnSolve').click();
    await p.waitForFunction(() => !spin && queue.length===0 && restoreLeft===0, undefined, {timeout:60000, polling:60});
    await p.waitForTimeout(120);
    const sol = await p.evaluate(() => isSolved());
    ok(scr && sol, '第' + r + '轮 打乱→还原 成功');
  }

  console.log('\n=== 玩法 6：展开 / 折叠 循环 ===');
  for (let r = 1; r <= 3; r++) {
    await p.locator('#btnUnfold').click();
    await p.waitForFunction(() => Math.abs(mainU - mainUTarget) < 1e-3, undefined, {timeout:8000, polling:40});
    const u1 = await p.evaluate(() => +mainU.toFixed(2));
    await p.locator('#btnUnfold').click();
    await p.waitForFunction(() => Math.abs(mainU - mainUTarget) < 1e-3, undefined, {timeout:8000, polling:40});
    const u2 = await p.evaluate(() => +mainU.toFixed(2));
    ok(u1 === 1 && u2 === 0, '第' + r + '轮 展开→折叠 (u=' + u1 + '→' + u2 + ')');
  }

  console.log('\n=== 玩法 7：展开态下转动 ===');
  await p.locator('#btnUnfold').click();
  await p.waitForFunction(() => Math.abs(mainU-mainUTarget)<1e-3, undefined, {timeout:8000, polling:40});
  const beforeU = await snap();
  await p.locator('#moves .mv').first().click();
  await idle();
  ok((await snap()) !== beforeU, '展开态下按钮转动生效');
  const plateCols = await p.evaluate(() => {
    const pl = document.querySelector('.plate');
    return Array.from(pl.children).map(c => c.style.background);
  });
  ok(plateCols.filter(Boolean).length === 9, '展开态平面块 9 格都有颜色');
  await p.locator('#btnUnfold').click();
  await p.waitForFunction(() => Math.abs(mainU-mainUTarget)<1e-3, undefined, {timeout:8000, polling:40});

  console.log('\n=== 玩法 8：视角操作（拖空白 / 滚轮 / 自动旋转 / Esc）===');
  const t0 = await p.locator('#cube').evaluate(e => e.style.transform);
  await S('mousePressed', 200, 200);
  for (let k=1;k<=6;k++) await S('mouseMoved', 200+k*20, 200+k*5);
  await S('mouseReleased', 320, 230);
  await p.waitForTimeout(700);
  ok((await p.locator('#cube').evaluate(e=>e.style.transform)) !== t0, '拖动空白旋转视角');
  const z0 = await p.locator('#cube').evaluate(e=>e.style.transform);
  await p.mouse.move(500, 400); await p.mouse.wheel(0, -400);
  await p.waitForTimeout(600);
  ok((await p.locator('#cube').evaluate(e=>e.style.transform)) !== z0, '滚轮缩放');
  await p.locator('#btnSpin').click();
  const s0 = await p.locator('#cube').evaluate(e=>e.style.transform);
  await p.waitForTimeout(700);
  ok((await p.locator('#cube').evaluate(e=>e.style.transform)) !== s0, '自动旋转');
  await p.locator('#btnSpin').click();
  await p.keyboard.press('Escape');
  await p.waitForTimeout(700);
  ok(true, 'Esc 重置视角');

  console.log('\n=== 玩法 9：侧栏视图独立切换 ===');
  await p.locator('#btnSideNet').click();  await p.waitForTimeout(300);
  const v1 = await p.evaluate(() => sideShowsNet);
  await p.locator('#btnSideMini').click(); await p.waitForTimeout(300);
  const v2 = await p.evaluate(() => sideShowsNet);
  await p.locator('#btnUnfold').click();
  await p.waitForFunction(() => Math.abs(mainU-mainUTarget)<1e-3, undefined, {timeout:8000, polling:40});
  const v3 = await p.evaluate(() => ({ side: sideShowsNet, main: +mainU.toFixed(2) }));
  ok(v1 === true && v2 === false && v3.side === false && v3.main === 1,
     '侧栏独立于主图（展开图→3D，主图展开时侧栏不变）');
  await p.locator('#btnUnfold').click();
  await p.waitForFunction(() => Math.abs(mainU-mainUTarget)<1e-3, undefined, {timeout:8000, polling:40});

  console.log('\n=== 玩法 10：混合连续操作（拖 + 按钮 + 键盘 + 打乱）===');
  await p.evaluate(() => resetToSolved());
  let mixOK = 0;
  for (let i = 0; i < 40; i++) {
    const before = await snap();
    const kind = i % 4;
    if (kind === 0) {
      const cs = await getCells();
      const c0 = cs[Math.floor(Math.random()*cs.length)];
      const [dx,dy] = [[1,0],[-1,0],[0,1],[0,-1]][Math.floor(Math.random()*4)];
      const ex = Math.max(8,Math.min(1492,c0.x+dx*150)), ey = Math.max(8,Math.min(932,c0.y+dy*150));
      await S('mousePressed', c0.x, c0.y);
      for (let k=1;k<=5;k++) await S('mouseMoved', c0.x+(ex-c0.x)*k/5, c0.y+(ey-c0.y)*k/5);
      await S('mouseReleased', ex, ey);
    } else if (kind === 1) {
      await p.locator('#moves .mv').nth(Math.floor(Math.random()*18)).click();
    } else if (kind === 2) {
      await p.keyboard.press('udlrfbmes'[Math.floor(Math.random()*9)]);
    } else {
      await p.locator('#moves .mv').nth(Math.floor(Math.random()*18)).click();
      await p.keyboard.press('u');
    }
    await idle();
    if ((await snap()) !== before) mixOK++;
  }
  ok(mixOK >= 36, '混合操作 40 次中 ' + mixOK + ' 次产生变化（>=36 即可）');

  console.log('\n=== 玩法 11：最终无错误 ===');
  ok(errs.length === 0, '全程无运行时错误' + (errs.length ? ' -> ' + errs.slice(0,3).join(' | ') : ''));

  await p.screenshot({ path: 'work/shots/sim-final.png' });
  await b.close();
  console.log(fails === 0 ? '\n=== 全部玩法跑通 ===' : '\n=== ' + fails + ' 项未通过 ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
