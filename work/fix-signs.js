const fs = require('fs');
let s = fs.readFileSync('work/test-v4.js','utf8');
/* 存带符号的 along 供方向一致性检查 */
s = s.replace("                     along: +Math.abs(along).toFixed(1), isMain });",
              "                     along: +along.toFixed(1), absAlong: +Math.abs(along).toFixed(1), isMain });");
s = s.replace("  const meaningful = follow.filter(r => r.isMain && r.along > 8);",
              "  const meaningful = follow.filter(r => r.isMain && r.absAlong > 8);");
s = s.replace("    '    跟手误差: 平均 ' +",
              "    '    跟手误差(弧长): 平均 ' +");
s = s.replace("  const signBad = meaningful.filter(r => Math.sign(r.ang) !== Math.sign(r.along * 1));",
              "  const signBad = meaningful.filter(r => Math.sign(r.ang) !== Math.sign(r.along));");
fs.writeFileSync('work/test-v4.js', s);
console.log('test signs fixed');
