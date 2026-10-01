const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');
/* 改为全部 3 轴（含面法向），对齐度更高 */
s = s.replace(`  const axes = [fr.right.findIndex(v => v !== 0), fr.down.findIndex(v => v !== 0)];`,
`  /* 全部 3 个轴都参与候选（含面法向 —— 即"面原地旋转"），
     取与拖拽方向最对齐者，最大化"往哪拖就往哪转"的直觉 */
  const axes = [0, 1, 2];`);
fs.writeFileSync('work/app.js', s);
console.log('3-axis enabled');
