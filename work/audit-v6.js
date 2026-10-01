const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL: ' + m); } else console.log('  ok  : ' + m); };

const findSticker = (p, skip = 0) => p.evaluate((skip) => {
  const cands = [];
  for (const c of cubies) {
    for (const fk of FACE_KEYS) {
      if (!c.faces[fk]) continue;
      const st = c.el.children[FACE_KEYS.indexOf(fk)].querySelector('.sticker');
      if (!st) continue;
      const r = st.getBoundingClientRect();
      if (r.width < 14) continue;
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      if (document.elementFromPoint(cx, cy) !== st) continue;
      const d = Math.hypot(cx - innerWidth/2, cy - innerHeight/2);
      cands.push({ x: cx, y: cy, d });
    }
  }
  cands.sort((a,b) => a.d - b.d);
  return cands.length ? cands[Math.min(skip, cands.length-1)] : null;
}, skip);

const T0 = Date.now();
const LOG = (m) => console.log('      [' + ((Date.now()-T0)/1000).toFixed(1) + 's] ' + m);

async function dragTest(p, label, dx, dy, waitBefore) {
  dx = dx || 0; dy = dy || 0;
  LOG('dragTest 开始: ' + label + ' dx=' + dx + ' dy=' + dy);
  if (waitBefore) await p.waitForTimeout(waitBefore);
  LOG('找贴纸...');
  const t = await findSticker(p, Math.floor(Math.random()*6));
  LOG('找到: ' + (t ? Math.round(t.x)+','+Math.round(t.y) : 'null'));
  if (!t) return { ok: false, why: '无贴纸' };
  /* 裁剪到视口内，避免 mouse.move 参数越界 */
  const vw = 1500, vh = 940;
  const ex = Math.max(5, Math.min(vw - 5, t.x + dx));
  const ey = Math.max(5, Math.min(vh - 5, t.y + dy));
  LOG('目标点: ' + Math.round(ex) + ',' + Math.round(ey));
  if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) return { ok:false, why:'坐标无效 '+JSON.stringify(t) };
  const cdp = await p.context().newCDPSession(p);
  const send = (type, x, y, btn) => cdp.send('Input.dispatchMouseEvent', {
    type, x, y, button: btn || 'none', buttons: btn === 'left' ? 1 : 0,
    clickCount: btn === 'left' ? 1 : 0,
  });
  await send('mousePressed', t.x, t.y, 'left');
  LOG('拖动中...');
  const N = 8;
  for (let i = 1; i <= N; i++) {
    await send('mouseMoved', t.x + (ex - t.x) * i / N, t.y + (ey - t.y) * i / N);
  }
  LOG('拖动完成');
  const st = await p.evaluate(() => ({ locked: !!(drag && drag.locked),
                                       kind: drag ? drag.kind : null }));
  LOG('松手');
  await send('mouseReleased', ex, ey, 'left');
  LOG('等待静止...');
  try {
    await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 12000, polling: 50 });
  } catch (e) {
    const st = await p.evaluate(() => ({ spin: !!spin, queue: queue.length,
      angle: spin ? +spin.angle.toFixed(1) : null, anim: spin ? !!spin.anim : null }));
    return { ok: false, why: '等待超时 ' + JSON.stringify(st) };
  }
  LOG('已静止');
  await p.waitForTimeout(80);
  if (st.locked !== true) console.log('      [debug] ' + label + ' -> ' + JSON.stringify({ t: {x:Math.round(t.x),y:Math.round(t.y)}, st }));
  return { ok: st.locked && st.kind === 'turn', kind: st.kind, locked: st.locked };
}

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  p.setDefaultTimeout(10000);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1500);

  console.log('=== A. 加载无错误 ===');
  ok(errs.length === 0, 'no errors' + (errs.length ? ' -> ' + errs.join(' | ') : ''));

  console.log('\n=== B. 拖拽随时可用（问题1：有时能拖有时不能）===');
  ok((await dragTest(p, '首次拖拽', 260, 0)).ok, '首次拖拽 ok');
  /* 关键：紧接动画期间再拖 */
  LOG('点击 U 按钮...');
  await p.locator('#moves .mv').first().click();
  LOG('U 已点');
  const r2 = await dragTest(p, '转完立刻拖(0ms)', 200, 0, 0);
  ok(r2.ok, '动画期间拖拽也生效 (kind=' + r2.kind + ')');
  LOG('点击 U\' 按钮...');
  await p.locator('#moves .mv').nth(1).click();
  LOG('U\' 已点');
  const r3 = await dragTest(p, '动画期间拖(60ms)', 200, 0, 60);
  ok(r3.ok, '动画进行中 60ms 拖拽生效');
  /* 连续 6 次快速拖 */
  let okc = 0;
  for (let i = 0; i < 6; i++) {
    const r = await dragTest(p, '连拖' + (i+1), i % 2 ? -200 : 200, 0, 40);
    if (r.ok) okc++;
  }
  ok(okc === 6, '连续快速拖 6/6 成功 (实际 ' + okc + ')');

  console.log('\n=== C. 还原闭环（问题2：点还原反而更乱）===');
  /* 打乱 -> 还原 -> 必须复原 */
  for (let round = 1; round <= 3; round++) {
    await p.locator('#btnScramble').click();
    await p.waitForTimeout(250);
    const scrambled = await p.evaluate(() => !isSolved());
    await p.locator('#btnSolve').click();
    await p.waitForFunction(() => !spin && queue.length === 0 && restoreLeft === 0, undefined, { timeout: 60000, polling: 60 });
    await p.waitForTimeout(150);
    const solved = await p.evaluate(() => isSolved());
    ok(scrambled && solved, '第 ' + round + ' 轮: 打乱后未复原 -> 点还原后已复原');
  }
  /* 关键回归：连点两次还原不应把魔方弄乱 */
  await p.locator('#btnScramble').click();
  await p.waitForTimeout(250);
  await p.locator('#btnSolve').click();
  await p.waitForFunction(() => !spin && queue.length === 0 && restoreLeft === 0, null, { timeout: 40000 });
  await p.waitForTimeout(150);
  const afterFirst = await p.evaluate(() => isSolved());
  /* 还原完成后按钮应禁用（无内容可还原），因此不可能再点一次把魔方弄乱 */
  const btnDisabled = await p.evaluate(() => document.getElementById('btnSolve').disabled);
  await p.waitForTimeout(600);
  const afterSecond = await p.evaluate(() => isSolved());
  ok(afterFirst && afterSecond && btnDisabled,
     '还原后按钮禁用 + 魔方保持复原（不存在「再点一次反而更乱」）');
  /* 再验证：强行调用 solveAll() 也不应破坏状态 */
  await p.evaluate(() => solveAll());
  await p.waitForTimeout(500);
  const afterForce = await p.evaluate(() => isSolved());
  ok(afterForce, '强行再次调用 solveAll() 后仍保持复原（幂等）');

  console.log('\n=== D. 还原按钮状态闭环 ===');
  const btnState = await p.evaluate(() => ({
    text: document.getElementById('btnSolve').textContent.trim(),
    disabled: document.getElementById('btnSolve').disabled,
  }));
  ok(btnState.text === '还原' && btnState.disabled, '复原后按钮显示「还原」且禁用');

  console.log('\n=== E. 侧栏独立（问题3：不要同步）===');
  /* 默认：主图立体 + 侧栏展开图 */
  const s1 = await p.evaluate(() => ({ mainU: +mainU.toFixed(2), side: sideShowsNet }));
  ok(s1.mainU === 0 && s1.side === true, '默认 主图=立体 / 侧栏=平面展开图（两个不同视图）');
  /* 展开主图 -> 侧栏不应变化 */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1400);
  const s2 = await p.evaluate(() => ({ mainU: +mainU.toFixed(2), side: sideShowsNet }));
  ok(s2.mainU > 0.98 && s2.side === true, '主图展开后，侧栏仍是展开图（未联动）');
  /* 切侧栏到 3D */
  await p.locator('#btnSideMini').click();
  await p.waitForTimeout(400);
  const s3 = await p.evaluate(() => sideShowsNet);
  ok(s3 === false, '侧栏可独立切到 3D 立体图');
  /* 折叠主图 -> 侧栏保持 3D */
  await p.locator('#btnUnfold').click();
  await p.waitForTimeout(1400);
  const s4 = await p.evaluate(() => ({ mainU: +mainU.toFixed(2), side: sideShowsNet }));
  ok(s4.mainU < 0.02 && s4.side === false, '主图折叠后，侧栏保持 3D（未联动）');
  await p.screenshot({ path: 'work/shots/v6-both-diff.png' });

  console.log('\n=== F. 阻尼吸附（问题4：不跟手无阻尼）===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  const tf = await findSticker(p, 0);
  const cdpF = await p.context().newCDPSession(p);
  const sF = (type, x, y) => cdpF.send('Input.dispatchMouseEvent', {
    type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  await sF('mousePressed', tf.x, tf.y);
  for (let i = 1; i <= 3; i++) await sF('mouseMoved', tf.x + i * 3, tf.y);
  const beforeUp = await p.evaluate(() => spin ? +spin.angle.toFixed(1) : 0);
  await sF('mouseReleased', tf.x + 30, tf.y);
  /* 松手后立刻检查是否进入阻尼动画 */
  await p.waitForTimeout(30);
  const snapInfo = await p.evaluate(() => spin && spin.anim
    ? { from: +spin.anim.from.toFixed(1), to: +spin.anim.to.toFixed(1),
        dur: spin.anim.dur, easing: true }
    : null);
  await p.waitForFunction(() => !spin, undefined, { timeout: 5000, polling: 30 });
  await p.waitForTimeout(60);
  const afterF = await p.evaluate(() => ({ moves: moveCount, hist: history.length }));
  ok(Math.abs(beforeUp) > 1, '拖动中角度跟手 (' + beforeUp + '°)');
  ok(snapInfo !== null, '松手后进入阻尼动画 (from=' + (snapInfo&&snapInfo.from) +
     ' to=' + (snapInfo&&snapInfo.to) + ' dur=' + (snapInfo&&snapInfo.dur) + 'ms)');
  ok(snapInfo === null || snapInfo.dur >= 150, '阻尼时长合理（>=150ms）');
  ok(afterF.moves === 0 && afterF.hist === 0,
     '微小拖动（9px）回弹后不计步数 (moves=' + afterF.moves + ', hist=' + afterF.hist + ')');

  console.log('\n=== G. 快速甩动有惯性 ===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  const t2 = await findSticker(p, 2);
  if (!t2) { ok(false, '找不到贴纸'); return; }
  await p.mouse.move(t2.x, t2.y);
  await p.mouse.down();
  for (let i = 1; i <= 8; i++) await p.mouse.move(t2.x + i * 12, t2.y, { steps: 1 });
  await p.mouse.up();
  await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 10000, polling: 50 });
  await p.waitForTimeout(100);
  const flung = await p.evaluate(() => moveCount);
  ok(flung >= 1, '快速甩动触发转动 (步数 ' + flung + ')');

  console.log('\n=== H. 最终无错误 ===');
  ok(errs.length === 0, 'no errors at end' + (errs.length ? ' -> ' + errs.slice(0,2).join(' | ') : ''));

  await b.close();
  console.log(fails === 0 ? '\n=== ALL PASSED ===' : '\n=== ' + fails + ' FAILURES ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
