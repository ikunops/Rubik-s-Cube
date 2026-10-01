const fs = require('fs');
let s = fs.readFileSync('work/part1.html','utf8');
s = s.replace(`/* 动画进行中：关闭一切非必要绘制 */`,
`/* 拖拽锁定的层高亮 */
.cubie.hi .sticker{box-shadow:0 0 0 2px rgba(91,157,255,.85),0 0 14px rgba(91,157,255,.55)}
.cubie.hi .body-face{background:#1b2436}

/* 动画进行中：关闭一切非必要绘制 */`);
fs.writeFileSync('work/part1.html', s);
console.log('hi css added');
