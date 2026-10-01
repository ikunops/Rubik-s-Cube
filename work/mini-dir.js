const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 迷你立方体：使用与主图一致的等轴朝向。
   主图视角 rx=-35.264, ry=-45 -> 看到 U(白) F(蓝) R(红)。
   之前用 MINI_ROT = Rx(-35.264)·Ry(-45) 得到的是背面，改为负角度。 */
s = s.replace("const MINI_ROT = m4mul(m4rot([1, 0, 0], -35.264), m4rot([0, 1, 0], -45));",
              "const MINI_ROT = m4mul(m4rot([1, 0, 0], -35.264), m4rot([0, 1, 0], 45));");

fs.writeFileSync('work/app.js', s);
console.log('mini orientation attempt 1');
