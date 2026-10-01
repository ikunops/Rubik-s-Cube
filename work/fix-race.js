const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 拖拽接管时：先把在播动画落定，并清空剩余队列（用户接管手动控制），
   避免 commitSpin -> pumpQueue 又起一个新 spin 被随后的 beginSpin 覆盖，
   导致该步永远不落子（状态与画面脱节）。 */
s = s.replace(`      /* 若正有队列动画在播，先把它落定，避免冲突 */
      if (spin && spin.anim) { spin.angle = spin.target; spin.anim = null; commitSpin(); }
      if (spin && spin.dragging) spin = null;
      beginSpin(t.axis, t.coord, hit);`,
`      /* 用户开始拖拽 = 接管控制：先落定在播动画，再清空剩余队列 */
      queue.length = 0;
      if (spin && spin.anim) { spin.angle = spin.target; spin.anim = null; commitSpin(); }
      spin = null;
      beginSpin(t.axis, t.coord, hit);`);

/* 吸附回零后也要继续消费队列 */
s = s.replace(`    if (spin.name) commitSpin();
    else spin = null;`,
`    if (spin.name) commitSpin();
    else { spin = null; pumpQueue(); }`);

fs.writeFileSync('work/app.js', s);
console.log('race fixed');
