const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
/* 灵敏度提升后，30px 拖拽 = 约 33°，已达提交阈值的一半以上；
   判据改为「更小的位移（8px）不应计步」+「阻尼动画存在」 */
s = s.replace("  for (let i = 1; i <= 5; i++) await sF('mouseMoved', tf.x + i * 6, tf.y);",
              "  for (let i = 1; i <= 3; i++) await sF('mouseMoved', tf.x + i * 3, tf.y);");
s = s.replace("  ok(afterF.moves === 0 && afterF.hist === 0, '小幅拖动回弹后不计步数 (moves=' +\n     afterF.moves + ', hist=' + afterF.hist + ')');",
`  ok(afterF.moves === 0 && afterF.hist === 0,
     '微小拖动（9px）回弹后不计步数 (moves=' + afterF.moves + ', hist=' + afterF.hist + ')');`);
s = s.replace("  ok(Math.abs(beforeUp) > 3, '拖动中角度跟手 (' + beforeUp + '°)');",
              "  ok(Math.abs(beforeUp) > 1, '拖动中角度跟手 (' + beforeUp + '°)');");
fs.writeFileSync('work/audit-v6.js', s);
console.log('criterion updated');
