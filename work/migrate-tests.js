const fs = require('fs');
const files = ['test-v4.js','test-v2.js','perf2.js','perf3.js','trace.js','browser-test.js',
               'final-verify.js','drag-stress.js','center.js','calib.js','shots-v5.js',
               'shots-final.js','audit2.js','profile.js','diag-drag.js'];
let changed = [];
for (const f of files) {
  const p = 'work/' + f;
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  const orig = s;
  /* 变量重命名 */
  s = s.replace(/\bunfoldT\b/g, 'mainU');
  s = s.replace(/\bunfoldTarget\b/g, 'mainUTarget');
  s = s.replace(/\bunfoldAnim\b/g, 'mainUAnim');
  /* 函数重命名 */
  s = s.replace(/\bsyncLayers\(\)/g, '0');
  s = s.replace(/\bcommitTurn\b/g, 'commitSpin');
  s = s.replace(/\bdoMoves\(/g, 'doMove(');
  /* 等待条件：anim/queue -> spin/queue */
  s = s.replace(/!anim && queue\.length === 0/g, '!spin && queue.length === 0');
  s = s.replace(/\banim\b(?=\s*&&)/g, 'spin');
  if (s !== orig) { fs.writeFileSync(p, s); changed.push(f); }
}
console.log('updated: ' + changed.join(', '));
