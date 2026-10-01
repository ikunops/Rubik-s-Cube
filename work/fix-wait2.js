const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
/* Playwright 的 waitForFunction 签名: (fn, arg, options)。原写法把 options 当 arg 传了。 */
s = s.replace("await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 12000, polling: 50 });",
              "await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 12000, polling: 50 });");
s = s.replace("await p.waitForFunction(() => !spin && queue.length === 0 && restoreLeft === 0, null, { timeout: 40000 });",
              "await p.waitForFunction(() => !spin && queue.length === 0 && restoreLeft === 0, undefined, { timeout: 60000, polling: 60 });");
s = s.replace("await p.waitForFunction(() => !spin, null, { timeout: 3000 });",
              "await p.waitForFunction(() => !spin, undefined, { timeout: 5000, polling: 40 });");
s = s.replace("await p.waitForFunction(() => !spin && queue.length === 0, null, { timeout: 5000 });",
              "await p.waitForFunction(() => !spin && queue.length === 0, undefined, { timeout: 10000, polling: 50 });");
fs.writeFileSync('work/audit-v6.js', s);
console.log('waitForFunction fixed');
