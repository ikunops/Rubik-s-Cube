const fs = require('fs');
let s = fs.readFileSync('work/part1.html','utf8');

/* 1) 去掉每个贴纸的 ::after 高光层（54 个伪元素 = 54 个额外合成层），
      改为贴纸自身的 background-image 渐变 */
s = s.replace(`.sticker::after{
  content:"";position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(150deg,rgba(255,255,255,.20),rgba(255,255,255,0) 46%);
}`,
`.sticker{
  background-image:linear-gradient(150deg,rgba(255,255,255,.18),rgba(255,255,255,0) 46%);
}`);

/* 2) contain 收紧为 paint（避免 size containment 的额外约束） */
s = s.replace("  contain:strict;", "  contain:layout paint;");

fs.writeFileSync('work/part1.html', s);
console.log('css layer reduction done');
