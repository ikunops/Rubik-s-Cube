const fs = require('fs');
let s = fs.readFileSync('work/perf3.js','utf8');
s = s.replace(/await p\.evaluate\(\(\) => \{ unfoldT = 1; unfoldTarget = 1; unfoldAnim = null; syncLayers\(\); \}\);/,
              "await p.evaluate(() => { unfoldT = 1; unfoldTarget = 1; unfoldAnim = null; });");
s = s.replace(/await p\.evaluate\(\(\) => \{ unfoldT = 0; unfoldTarget = 0; unfoldAnim = null; syncLayers\(\); \}\);/,
              "await p.evaluate(() => { unfoldT = 0; unfoldTarget = 0; unfoldAnim = null; });");
fs.writeFileSync('work/perf3.js', s);
console.log('perf3 fixed');
