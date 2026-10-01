const fs = require('fs');
let s = fs.readFileSync('work/verify-dir.js','utf8');
s = s.replace("const ang = solveDragAngle(t.axis, P0, [vx*80, vy*80]);",
              "const ang = solveDragAngle(t.axis, P0, [vx*80, vy*80], fk);");
fs.writeFileSync('work/verify-dir.js', s);
console.log('test updated');
