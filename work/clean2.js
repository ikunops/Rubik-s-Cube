const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');
/* 移除已不存在的 faceBasis 调用 */
s = s.replace("      drag.basis = faceBasis(drag.faceKey);\n", "");
/* 用新的 name/sign 提交 */
s = s.replace(`      drag.axis = t.axis; drag.coord = t.coord;
      drag.pick = t;`,
`      drag.axis = t.axis; drag.coord = t.coord;
      drag.pick = t;               // 保存候选（轴/符号/切线/抓取点）`);
fs.writeFileSync('work/app.js', s);
console.log('cleaned');
