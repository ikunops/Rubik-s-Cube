const fs = require('fs');
let t = fs.readFileSync('work/test-model-body.js', 'utf8');
t = t.replace("ok(rightPt[0] > mid[0] + 2.9, f + ' col grows rightward');",
              "ok(rightPt[0] > mid[0] + 1.4, f + ' col grows rightward (edge offset = half face = ' + H + ')');");
t = t.replace("ok(downPt[1]  > mid[1] + 2.9, f + ' row grows downward');",
              "ok(downPt[1]  > mid[1] + 1.4, f + ' row grows downward');");
fs.writeFileSync('work/test-model-body.js', t);
console.log('threshold fixed');
