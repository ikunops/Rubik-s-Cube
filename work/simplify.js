const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');
s = s.replace(`  /* 用锁定时选定的轴对应的分量 */
  const proj = drag.pick.axis === aDown ? projD : projR;
  return drag.pick.sign * angleFromProjection(Math.abs(proj)) * (proj >= 0 ? 1 : -1);`,
`  /* 用锁定时选定的轴对应的分量（线性映射，符号自带方向） */
  const proj = drag.pick.axis === aDown ? projD : projR;
  return angleFromProjection(proj);`);
fs.writeFileSync('work/app.js', s);
console.log('simplified');
