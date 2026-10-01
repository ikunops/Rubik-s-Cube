const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
const OUT = 'work/shots';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL: ' + m); } };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1300);

  console.log('=== A. 展开态：平面块布局 = 十字形，且与侧栏展开图一致 ===');
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(2200);

  const layout = await p.evaluate(() => {
    const rs = {};
    for (const pl of document.querySelectorAll('.plate')) {
      const r = pl.getBoundingClientRect();
      rs[pl.__face] = { cx: Math.round(r.left + r.width/2), cy: Math.round(r.top + r.height/2),
                        w: Math.round(r.width), h: Math.round(r.height) };
    }
    return rs;
  });
  const pitchX = layout.R.cx - layout.F.cx, pitchY = layout.D.cy - layout.F.cy;
  console.log('  各面中心:', Object.entries(layout).map(([k,v]) => k+'('+v.cx+','+v.cy+')').join(' '));
  console.log('  pitchX=' + pitchX + ' pitchY=' + pitchY);
  ok(pitchX > 40, 'pitchX positive and sane');
  ok(Math.abs(layout.L.cx - (layout.F.cx - pitchX)) < 12, 'L one pitch left of F');
  ok(Math.abs(layout.B.cx - (layout.F.cx + 2*pitchX)) < 24, 'B two pitches right of F (col3 - col1)');
  ok(Math.abs(layout.U.cy - (layout.F.cy - pitchY)) < 12, 'U one pitch above F');
  ok(Math.abs(layout.D.cy - (layout.F.cy + pitchY)) < 12, 'D one pitch below F');
  ok(Math.abs(layout.U.cx - layout.F.cx) < 12, 'U aligned with F');
  ok(Math.abs(layout.D.cx - layout.F.cx) < 12, 'D aligned with F');
  console.log('  3D 平面块构成十字形  ok');

  /* 3D 平面块的颜色 vs 侧栏展开图颜色 */
  const cmp = await p.evaluate(() => {
    const norm = s => { const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s);
      if (m) return m[1]+','+m[2]+','+m[3];
      const h = s.replace('#','');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(','); };
    const out = [];
    for (const pl of document.querySelectorAll('.plate')) {
      const f = pl.__face;
      const model = readFaceColors(cubies, f);
      const plateCells = Array.from(pl.children).map(c => c.style.background);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const a = plateCells[r*3+c];
        const b = model[r][c];
        out.push({ f, r, c, same: norm(a) === norm(b) });
      }
    }
    return { total: out.length, bad: out.filter(o => !o.same).length };
  });
  ok(cmp.bad === 0, 'all 54 plate cells match model colors (bad=' + cmp.bad + ')');
  console.log('  54 个平面格颜色与模型一致  ok');

  /* 侧栏展开图 vs 模型 */
  const cmp2 = await p.evaluate(() => {
    const norm = s => { const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s);
      if (m) return m[1]+','+m[2]+','+m[3];
      const h = s.replace('#','');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(','); };
    let bad = 0, total = 0;
    for (const box of document.querySelectorAll('.net-face')) {
      const f = box.__face;
      const model = readFaceColors(cubies, f);
      const cells = Array.from(box.children).slice(0, 9).map(c => c.style.background);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        total++;
        if (norm(cells[r*3+c]) !== norm(model[r][c])) bad++;
      }
    }
    return { total, bad };
  });
  ok(cmp2.bad === 0, 'sidebar net matches model (bad=' + cmp2.bad + '/' + cmp2.total + ')');
  console.log('  侧栏展开图 ' + cmp2.total + ' 格全部一致  ok');

  await p.screenshot({ path: OUT + '/deliver-03-unfolded.png' });

  console.log('\n=== B. 展开态下转动：两个视图同时更新 ===');
  const before = await p.evaluate(() => readFaceColors(cubies,'F').flat().join(','));
  await p.locator('#moves .mv').first().click();
  await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 6000 });
  await p.waitForTimeout(200);
  const after = await p.evaluate(() => readFaceColors(cubies,'F').flat().join(','));
  ok(before !== after, 'model changed after turn while unfolded');
  const cmp3 = await p.evaluate(() => {
    const norm = s => { const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s);
      if (m) return m[1]+','+m[2]+','+m[3];
      const h = s.replace('#','');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(','); };
    let bad = 0;
    for (const box of document.querySelectorAll('.net-face')) {
      const model = readFaceColors(cubies, box.__face);
      const cells = Array.from(box.children).slice(0,9).map(c => c.style.background);
      for (let i = 0; i < 9; i++) if (norm(cells[i]) !== norm(model[Math.floor(i/3)][i%3])) bad++;
    }
    return bad;
  });
  ok(cmp3 === 0, 'sidebar net synced after turn (bad=' + cmp3 + ')');
  console.log('  展开态转动后，3D 平面块 + 侧栏展开图同步更新  ok');
  await p.screenshot({ path: OUT + '/deliver-04-unfolded-turn.png' });

  console.log('\n=== C. 折叠回去 ===');
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(2200);
  ok(errs.length === 0, 'no errors: ' + errs.slice(0,2).join(' | '));
  console.log('  折叠动画无错误  ok');

  console.log('\n=== D. 还原 + 最终截图 ===');
  await p.locator('#btnSolve').click();
  await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 40000 });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/deliver-01-solved.png' });
  await p.locator('#btnScramble').click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/deliver-02-scrambled.png' });

  await b.close();
  console.log(fails === 0 ? '\n=== 最终验收全部通过 ===' : '\n=== ' + fails + ' 项未通过 ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
