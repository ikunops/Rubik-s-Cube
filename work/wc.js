const fs = require('fs');
let s = fs.readFileSync('work/part1.html','utf8');
s = s.replace(`.plate{`,
`.plate{will-change:transform`);
/* 若 .plate 规则不存在则新增 */
if (!s.includes('.plate{will-change:transform')) {
  s = s.replace('/* 动画进行中：关闭一切非必要绘制 */',
`.plate{will-change:transform}

/* 动画进行中：关闭一切非必要绘制 */`);
}
fs.writeFileSync('work/part1.html', s);
console.log('will-change added:', s.includes('will-change:transform'));
