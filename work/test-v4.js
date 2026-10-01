const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL: ' + m); } else console.log('  ok  : ' + m); };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1300);

  console.log('=== A. 无运行时错误 ===');
  ok(errs.length === 0, 'no errors' + (errs.length ? ' -> ' + errs.join(' | ') : ''));

  console.log('\n=== B. 同时展开：6 个面片一起旋出 ===');
  await p.locator('#btnUnfold').click();
  /* 抓取展开动画中途的一帧，检查 6 个面片是否都在移动 */
  const mid = await p.evaluate(() => new Promise(res => {
    const samples = [];
    let n = 0;
    (function tick() {
      const t = mainU;
      if (t > 0.15 && t < 0.85 && samples.length < 3) {
        samples.push({
          t: +t.toFixed(3),
          plates: Array.from(document.querySelectorAll('.plate')).map(pl => {
            const r = pl.getBoundingClientRect();
            return [pl.__face, Math.round(r.left), Math.round(r.top), +(pl.style.opacity||0)];
          }),
        });
      }
      if (++n < 400 && samples.length < 3) requestAnimationFrame(tick);
      else res(samples);
    })();
  }));
  await p.waitForTimeout(1600);
  ok(mid.length >= 1, 'captured mid-animation frames (' + mid.length + ')');
  if (mid.length) {
    const s0 = mid[0];
    console.log('    中途 t=' + s0.t + ' 各面片位置与不透明度:');
    for (const [f, x, y, op] of s0.plates) console.log('      ' + f + '  (' + x + ',' + y + ')  op=' + op);
    /* 6 个面片应各在不同位置（同时散开），且都可见 */
    const pos = s0.plates.map(v => v[1] + ',' + v[2]);
    ok(new Set(pos).size === 6, '6 plates at 6 distinct positions mid-animation');
    ok(s0.plates.every(v => v[3] > 0.1), 'all 6 plates visible mid-animation');
  }

  /* 展开完成后 6 个面片构成十字形 */
  const layout = await p.evaluate(() => {
    const o = {};
    for (const pl of document.querySelectorAll('.plate')) {
      const r = pl.getBoundingClientRect();
      o[pl.__face] = { cx: Math.round(r.left + r.width/2), cy: Math.round(r.top + r.height/2),
                       w: Math.round(r.width), op: +(pl.style.opacity||0) };
    }
    return o;
  });
  const pitchX = layout.R.cx - layout.F.cx, pitchY = layout.D.cy - layout.F.cy;
  console.log('    展开完成: pitchX=' + pitchX + ' pitchY=' + pitchY);
  ok(Math.abs(layout.L.cx - (layout.F.cx - pitchX)) < 12, 'L one pitch left of F');
  ok(Math.abs(layout.B.cx - (layout.F.cx + 2*pitchX)) < 24, 'B two pitches right of F');
  ok(Math.abs(layout.U.cy - (layout.F.cy - pitchY)) < 12, 'U one pitch above F');
  ok(Math.abs(layout.D.cy - (layout.F.cy + pitchY)) < 12, 'D one pitch below F');
  ok(Object.values(layout).every(v => v.op > 0.9), 'all plates fully opaque');
  const solidOp = await p.evaluate(() => {
    const c = cubies[0].el; return parseFloat(c.style.opacity);
  });
  ok(solidOp < 0.02, 'solid cubies faded out when unfolded (op=' + solidOp + ')');
  await p.screenshot({ path: 'work/shots/v4-unfolded.png' });

  console.log('\n=== C. 折叠：6 个面片一起转回 ===');
  await p.locator('#btnUnfold').click();
  const mid2 = await p.evaluate(() => new Promise(res => {
    const out = []; let n = 0;
    (function tick() {
      if (mainU > 0.2 && mainU < 0.8 && out.length < 2) {
        out.push({ t: +mainU.toFixed(3),
          plates: Array.from(document.querySelectorAll('.plate')).map(pl => {
            const r = pl.getBoundingClientRect(); return [pl.__face, Math.round(r.left), Math.round(r.top)]; }) });
      }
      if (++n < 400 && out.length < 2) requestAnimationFrame(tick); else res(out);
    })();
  }));
  await p.waitForTimeout(1600);
  if (mid2.length) {
    const pos = mid2[0].plates.map(v => v[1] + ',' + v[2]);
    ok(new Set(pos).size === 6, 'fold: 6 plates distinct positions mid-animation');
  }
  const solidOp2 = await p.evaluate(() => parseFloat(cubies[0].el.style.opacity));
  ok(solidOp2 > 0.98, 'cubies back when folded (op=' + solidOp2 + ')');
  await p.screenshot({ path: 'work/shots/v4-folded.png' });

  console.log('\n=== D. 拖拽跟手（核心：抓取点必须跟着鼠标走）===');
  /* 判据：抓取点沿弧移动的距离 = 鼠标拖拽距离（严格跟手），
     且任意位置/方向都能找到对应层。 */
  const follow = await p.evaluate(() => {
    const out = [];
    const DIRS = [['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
                  ['右下',0.71,0.71],['右上',0.71,-0.71],['左下',-0.71,0.71],['左上',-0.71,-0.71]];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.35) continue;
        const P0 = grabPoint(c, nW);
        const s0 = projectToStage(P0);
        for (const [label, vx, vy] of DIRS) {
          const t = pickTurnFromDrag(c, fk, [vx, vy]);
          const name = moveNameFor(t.axis, t.coord, 1);
          const D = 60;
          const ang = solveDragAngle(t.axis, P0, [vx*D, vy*D]);
          const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
          const moved = Math.hypot(p1[0]-s0[0], p1[1]-s0[1]);
          out.push({ pos: c.p.join(','), face: fk, drag: label, layer: name,
                     ang: +ang.toFixed(1), err: +Math.abs(moved - D).toFixed(2) });
        }
      }
    }
    return out;
  });
  const noLayer = follow.filter(r => !r.layer);
  const errBad  = follow.filter(r => r.err > 1.5);
  console.log('    样本 = ' + follow.length + '  无对应层 = ' + noLayer.length +
              '  跟手误差>1.5px = ' + errBad.length);
  console.log('    跟手误差(弧长): 平均 ' +
    (follow.reduce((a,c)=>a+c.err,0)/follow.length).toFixed(2) + 'px  最大 ' +
    Math.max(...follow.map(r=>r.err)).toFixed(2) + 'px');
  ok(follow.length > 100, 'enough samples (' + follow.length + ')');
  ok(noLayer.length === 0, 'every position/direction has a layer');
  ok(errBad.length === 0, 'grab point follows cursor exactly');
  if (errBad.length) for (const r of errBad.slice(0,8))
    console.log('      ' + r.pos + ' ' + r.drag + ' ang=' + r.ang + ' err=' + r.err + 'px');

  console.log('\n=== E. 拖拽层高亮 ===');
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
  await p.mouse.move(t.x, t.y);
  await p.mouse.down();
  await p.mouse.move(t.x + 45, t.y, { steps: 8 });
  await p.waitForTimeout(60);
  const hiN = await p.locator('.cubie.hi').count();
  ok(hiN === 9, 'locked layer highlighted with 9 cubies, got ' + hiN);
  await p.screenshot({ path: 'work/shots/v4-drag-hi.png' });
  await p.mouse.up();
  await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 6000 });
  await p.waitForTimeout(200);
  const hiAfter = await p.locator('.cubie.hi').count();
  ok(hiAfter === 0, 'highlight cleared after release');

  console.log('\n=== F. 最终无错误 ===');
  ok(errs.length === 0, 'no errors at end' + (errs.length ? ' -> ' + errs.slice(0,2).join(' | ') : ''));

  await b.close();
  console.log(fails === 0 ? '\n=== ALL PASSED ===' : '\n=== ' + fails + ' FAILURES ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
