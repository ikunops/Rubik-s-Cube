const fs = require('fs');
let s = fs.readFileSync('work/test-v4.js','utf8');
s = s.replace(`          /* 实际落点 */
          const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
          const err = Math.hypot(p1[0]-gx, p1[1]-gy);`,
`          /* 实际落点：应与目标弧长一致（误差 = 实际屏幕位移 - 目标位移） */
          const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
          const moved = Math.hypot(p1[0]-s0[0], p1[1]-s0[1]);
          const err = Math.abs(moved - Math.abs(along));`);
fs.writeFileSync('work/test-v4.js', s);
console.log('criterion -> arc length');
