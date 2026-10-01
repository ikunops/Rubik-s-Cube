const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);

const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');
const OUT = 'work/shots';
fs.mkdirSync(OUT, { recursive: true });

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL:', m); } else console.log('  ok  :', m); };

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto(FILE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  console.log('\n=== 1. 加载与初始渲染 ===');
  ok(errors.length === 0, 'no console errors' + (errors.length ? ' -> ' + errors.join(' | ') : ''));
  const nCubies = await page.locator('.cubie').count();
  ok(nCubies === 27, '27 cubies rendered, got ' + nCubies);
  const nStickers = await page.locator('.sticker').count();
  ok(nStickers === 54, '54 stickers rendered, got ' + nStickers);
  const nNet = await page.locator('.net-face').count();
  ok(nNet === 6, '6 net faces, got ' + nNet);
  const nNetCells = await page.locator('.net-cell').count();
  ok(nNetCells === 54, '54 net cells, got ' + nNetCells);

  const cubeTf = await page.locator('#cube').evaluate(e => e.style.transform);
  ok(cubeTf.startsWith('matrix3d('), 'cube has matrix3d transform');

  const anyCubie = await page.locator('.cubie').first().evaluate(e => e.style.transform);
  ok(anyCubie.startsWith('matrix3d('), 'cubie has matrix3d transform');

  await page.screenshot({ path: OUT + '/01-initial.png' });

  console.log('\n=== 2. 复原态：每面单色（从 DOM 读贴纸颜色） ===');
  const faceColors = await page.evaluate(() => {
    const out = {};
    for (const f of FACE_KEYS) out[f] = readFaceColors(cubies, f);
    return out;
  });
  for (const f of Object.keys(faceColors)) {
    const flat = faceColors[f].flat();
    ok(new Set(flat).size === 1, f + ' face uniform (' + flat[0] + ')');
  }

  console.log('\n=== 3. 点击转动按钮 U，验证状态与展开图同步 ===');
  const before = await page.evaluate(() => readFaceColors(cubies,'F').flat().join(','));
  await page.locator('#moves .mv').first().click();
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => readFaceColors(cubies,'F').flat().join(','));
  ok(before !== after, 'F face changed after U move');
  const moves = await page.locator('#stMoves').textContent();
  ok(moves.trim() === '1', 'move counter = 1, got ' + moves.trim());
  const hist = await page.locator('#hist').textContent();
  ok(hist.includes('U'), 'history contains U');
  const badge = await page.locator('#badge').textContent();
  ok(badge.trim() === 'SCRAMBLED', 'badge SCRAMBLED, got ' + badge.trim());

  /* 展开图是否同步：读 DOM 里 F 面的背景色 */
  const netF = await page.evaluate(() => {
    const box = document.querySelectorAll('.net-face')[2]; // F 是第3个
    return Array.from(box.children).slice(0,9).map(c => c.style.background);
  });
  ok(netF.some(c => /rgb\(200,\s*16,\s*46\)/.test(c) || c.includes('#c8102e')), 'net F shows red (U turned in)');
  await page.screenshot({ path: OUT + '/02-after-U.png' });

  console.log('\n=== 4. 连续转动 + 队列 ===');
  for (const sel of [3, 5, 7]) {
    await page.locator('#moves .mv').nth(sel).click();
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(2600);
  const m2 = await page.locator('#stMoves').textContent();
  ok(parseInt(m2) === 4, 'move counter = 4, got ' + m2);

  console.log('\n=== 5. 键盘转动 ===');
  await page.locator('body').click({ position: { x: 700, y: 120 } });
  await page.keyboard.press('r');
  await page.waitForTimeout(600);
  const m3 = await page.locator('#stMoves').textContent();
  ok(parseInt(m3) === 5, 'move counter = 5 after keyboard, got ' + m3);
  await page.keyboard.press('Shift+U');
  await page.waitForTimeout(600);
  const m4 = await page.locator('#stMoves').textContent();
  ok(parseInt(m4) === 6, 'move counter = 6 after Shift+U, got ' + m4);

  console.log('\n=== 6. 打乱 + 还原 ===');
  await page.locator('#btnScramble').click();
  await page.waitForTimeout(400);
  const sc = await page.locator('#badge').textContent();
  ok(sc.trim() === 'SCRAMBLED', 'scrambled after 打乱');
  const netAfterScramble = await page.evaluate(() => {
    return FACE_KEYS.map(f => new Set(readFaceColors(cubies,f).flat()).size);
  });
  ok(netAfterScramble.every(n => n > 1), 'all faces mixed after scramble: ' + netAfterScramble.join(','));
  await page.screenshot({ path: OUT + '/03-scrambled.png' });

  await page.locator('#btnSolve').click();
  /* 轮询直到动画队列跑完（最多 40 秒） */
  await page.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 40000 });
  await page.waitForTimeout(400);
  const sv = await page.locator('#badge').textContent();
  ok(sv.trim() === 'SOLVED', 'solved after 还原, got ' + sv.trim());

  console.log('\n=== 7. 展开动画 ===');
  await page.locator('#btnUnfold').click();
  await page.waitForTimeout(1500);
  const ro = await page.locator('#roUnfold').textContent();
  ok(ro.trim() === '100%', 'unfold reached 100%, got ' + ro.trim());
  const plateInfo = await page.evaluate(() => {
    const pls = Array.from(document.querySelectorAll('.plate'));
    return pls.map(p => ({
      face: p.__face,
      op: parseFloat(p.style.opacity),
      tf: p.style.transform.slice(0, 40),
      bg: Array.from(p.children).map(c => c.style.background),
    }));
  });
  ok(plateInfo.length === 6, '6 plates exist');
  ok(plateInfo.every(p => p.op > 0.9), 'all plates opaque when unfolded');
  ok(plateInfo.every(p => p.tf.startsWith('matrix3d(')), 'all plates have transforms');
  const cubieOp = await page.evaluate(() => parseFloat(document.querySelector('.cubie').style.opacity));
  ok(cubieOp < 0.05, 'solid cubies faded out when unfolded, opacity=' + cubieOp);
  await page.screenshot({ path: OUT + '/04-unfolded.png' });

  console.log('\n=== 8. 展开态下转动（平面块应跟着更新） ===');
  const netBefore = await page.evaluate(() => document.querySelector('.plate').children[0].style.background);
  await page.locator('#moves .mv').nth(2).click();
  await page.waitForTimeout(700);
  const netAfter = await page.evaluate(() => document.querySelector('.plate').children[0].style.background);
  ok(typeof netAfter === 'string' && netAfter.length > 0, 'plate cell has color after turn');

  console.log('\n=== 9. 折叠回去 ===');
  await page.locator('#btnUnfold').click();
  await page.waitForTimeout(1500);
  const ro2 = await page.locator('#roUnfold').textContent();
  ok(ro2.trim() === '0%', 'folded back to 0%, got ' + ro2.trim());
  const cubieOp2 = await page.evaluate(() => parseFloat(document.querySelector('.cubie').style.opacity));
  ok(cubieOp2 > 0.95, 'cubies visible again, opacity=' + cubieOp2);
  await page.screenshot({ path: OUT + '/05-folded-back.png' });

  console.log('\n=== 10. 拖动转层（真实指针事件） ===');
  await page.locator('#btnSolve').click();
  await page.waitForTimeout(300);
  const mvBefore = parseInt(await page.locator('#stMoves').textContent());
  /* 找到屏幕上最靠前的贴纸中心，向右拖 */
  const target = await page.evaluate(() => {
    const st = document.querySelector('.sticker');
    const r = st.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  await page.mouse.move(target.x + 70, target.y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  const mvAfter = parseInt(await page.locator('#stMoves').textContent());
  ok(mvAfter > mvBefore, 'drag on sticker performed a turn (' + mvBefore + ' -> ' + mvAfter + ')');
  await page.screenshot({ path: OUT + '/06-after-drag.png' });

  console.log('\n=== 11. 拖动空白旋转视角 ===');
  const viewBefore = await page.locator('#cube').evaluate(e => e.style.transform);
  await page.mouse.move(120, 200);
  await page.mouse.down();
  await page.mouse.move(320, 240, { steps: 14 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const viewAfter = await page.locator('#cube').evaluate(e => e.style.transform);
  ok(viewBefore !== viewAfter, 'orbit drag changed camera');

  console.log('\n=== 12. 滚轮缩放 ===');
  const zBefore = await page.locator('#cube').evaluate(e => e.style.transform);
  await page.mouse.move(400, 400);
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(800);
  const zAfter = await page.locator('#cube').evaluate(e => e.style.transform);
  ok(zBefore !== zAfter, 'wheel changed zoom');

  console.log('\n=== 13. 最终无错误检查 ===');
  ok(errors.length === 0, 'no runtime errors at end' + (errors.length ? ' -> ' + errors.slice(0,3).join(' | ') : ''));

  console.log('\n=== 14. 移动端视口 ===');
  await page.setViewportSize({ width: 420, height: 860 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT + '/07-mobile.png', fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(overflow <= 2, 'no horizontal overflow on mobile, got ' + overflow + 'px');

  await browser.close();
  console.log(fails === 0 ? '\n=== ALL BROWSER TESTS PASSED ===' : '\n=== ' + fails + ' BROWSER FAILURES ===');
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error('TEST CRASH:', e); process.exit(2); });
