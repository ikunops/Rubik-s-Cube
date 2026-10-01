const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 灵敏度：拖动一个小方块宽度(PX) = 转 90°，符合直觉 */
s = s.replace(`    /* 屏幕上 1px 约等于多少度：用层宽（PX）对应 90 度估算，手感自然 */
    const degPerPx = 90 / (PX * 1.15);`,
`    /* 手感标定：拖动一个小方块宽度（PX）对应 90 度 */
    const degPerPx = 90 / PX;`);

fs.writeFileSync('work/app.js', s);
console.log('sensitivity tuned');
