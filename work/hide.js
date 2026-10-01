const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 小方块完全淡出后用 visibility 隐藏（只切换一次，不会在动画中途抖动） */
s = s.replace(`    solidHidden = false;
  } else if (!solidHidden) {
    for (const c of cubies) c.el.style.opacity = 0;
    solidHidden = true;
  }`,
`    if (solidHidden) { solidLayer.style.visibility = ''; solidHidden = false; }
  } else if (!solidHidden) {
    for (const c of cubies) c.el.style.opacity = 0;
    solidLayer.style.visibility = 'hidden';    // 彻底移出渲染
    solidHidden = true;
  }`);

fs.writeFileSync('work/app.js', s);
console.log('solid hide applied');
