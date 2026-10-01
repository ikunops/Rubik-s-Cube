const fs = require('fs');
let s = fs.readFileSync('work/part1.html','utf8');
s = s.replace(".cube.animating .plate{will-change:transformbox-shadow:none}",
              ".cube.animating .plate{box-shadow:none}");
/* 在拖拽高亮规则前插入面片的 will-change */
s = s.replace("/* 拖拽锁定的层高亮 */",
`.plate{will-change:transform}

/* 拖拽锁定的层高亮 */`);
fs.writeFileSync('work/part1.html', s);
console.log('fixed');
