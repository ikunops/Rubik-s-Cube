const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* setSideView：切换后等布局完成再绘制（避免 clientWidth 为 0） */
s = s.replace(`  if (!showNet) drawMini();
}`,
`  if (!showNet) requestAnimationFrame(() => requestAnimationFrame(drawMini));
}`);

/* drawMini：尺寸为 0 时直接跳过，避免除零 */
s = s.replace(`  const w = miniCv.clientWidth || 300, h = miniCv.clientHeight || 225;`,
`  const w = miniCv.clientWidth, h = miniCv.clientHeight;
  if (w < 8 || h < 8) return;`);

fs.writeFileSync('work/app.js', s);
console.log('drawMini guarded');
