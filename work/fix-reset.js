const fs = require('fs');
let s = fs.readFileSync('work/sim-all.js','utf8');
/* 用「反复还原」代替重建 cubies（避免元素引用失效） */
s = s.replace(/await p\.evaluate\(\(\) => \{ cubies = makeSolved\(\); stateVer\+\+; spin = null; queue\.length = 0;\s*history = \[\]; moveCount = 0; render\(performance\.now\(\)\); \}\);/g,
  "await p.evaluate(() => { resetToSolved(); });");
s = s.replace(/await p\.evaluate\(\(\) => \{ cubies = makeSolved\(\); stateVer\+\+; spin=null; queue\.length=0; render\(performance\.now\(\)\); \}\);/g,
  "await p.evaluate(() => { resetToSolved(); });");
fs.writeFileSync('work/sim-all.js', s);
console.log('reset fixed');
