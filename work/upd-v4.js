const fs = require('fs');
let s = fs.readFileSync('work/test-v4.js','utf8');
s = s.replace("          const ang = angleFromDrag(t.d1, [vx * 60, vy * 60]);   // 60px 的拖拽",
              "          const ang = solveDragAngle(t.axis, P0, [vx * 60, vy * 60]);   // 60px 的拖拽");
fs.writeFileSync('work/test-v4.js', s);
console.log('test updated');
