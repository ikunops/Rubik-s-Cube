const fs = require('fs');
let h = fs.readFileSync('work/part1.html','utf8');
/* 转动按钮 9 个（6 面 + 3 切片）改为 6 列自适应 */
h = h.replace(".moves{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}",
              ".moves{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}\n.mv.slice{color:#9fb6d8}");
/* 迷你画布可拖动 */
h = h.replace("#miniCube{width:100%;max-width:300px;aspect-ratio:4/3;display:block}",
              "#miniCube{width:100%;max-width:300px;aspect-ratio:4/3;display:block;cursor:grab;touch-action:none}\n#miniCube:active{cursor:grabbing}");
fs.writeFileSync('work/part1.html', h);
console.log('css updated');
