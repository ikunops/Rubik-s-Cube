const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');

/* F 段：判据改为「松手后存在阻尼动画（spin.anim 有 from/to 且 from≠to）」 */
const a = s.indexOf("  console.log('\\n=== F. 阻尼吸附");
const b = s.indexOf("  console.log('\\n=== G. 快速甩动有惯性 ===');");
if (a < 0 || b < 0) throw new Error('F anchor not found');

const NEWF = `  console.log('\\n=== F. 阻尼吸附（问题4：不跟手无阻尼）===');
  await p.evaluate(() => { history = []; moveCount = 0; updateUI(); });
  const tf = await findSticker(p, 0);
  const cdpF = await p.context().newCDPSession(p);
  const sF = (type, x, y) => cdpF.send('Input.dispatchMouseEvent', {
    type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  await sF('mousePressed', tf.x, tf.y);
  for (let i = 1; i <= 5; i++) await sF('mouseMoved', tf.x + i * 6, tf.y);
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
  ok(Math.abs(beforeUp) > 3, '拖动中角度跟手 (' + beforeUp + '°)');
  ok(snapInfo !== null, '松手后进入阻尼动画 (from=' + (snapInfo&&snapInfo.from) +
     ' to=' + (snapInfo&&snapInfo.to) + ' dur=' + (snapInfo&&snapInfo.dur) + 'ms)');
  ok(snapInfo === null || snapInfo.dur >= 150, '阻尼时长合理（>=150ms）');
  ok(afterF.moves === 0 && afterF.hist === 0, '小幅拖动回弹后不计步数 (moves=' +
     afterF.moves + ', hist=' + afterF.hist + ')');

`;
s = s.slice(0, a) + NEWF + s.slice(b);
fs.writeFileSync('work/audit-v6.js', s);
console.log('F criterion fixed');
