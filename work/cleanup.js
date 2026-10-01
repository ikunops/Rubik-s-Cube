const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 移除已不需要的 syncLayers */
const a = s.indexOf("/* 图层常驻：平面块始终保留在合成树里");
const b = s.indexOf("function render(now) {");
if (a >= 0 && b > a) {
  s = s.slice(0, a) + s.slice(b);
}
s = s.replace("  syncLayers();              // 初始化图层可见性\n", "");

/* 淡化曲线：两者在 t≈0 处几乎重合，交叉淡入几乎不可见 */
s = s.replace(`  const solidFade = 1 - clamp01((unfoldT - 0.30) / 0.45);   // 小方块在展开后段淡出
  const plateOp   = clamp01((unfoldT - 0.05) / 0.22);       // 面片在前段淡入`,
`  /* 小方块与面片在 t=0 处空间重合，快速交叉淡入 -> 几乎看不出切换，
     之后只有面片沿铰链旋出，视觉上就是"魔方的六个面同时翻开" */
  const solidFade = 1 - clamp01(unfoldT / 0.13);
  const plateOp   = Math.max(0.001, clamp01(unfoldT / 0.11));`);

fs.writeFileSync('work/app.js', s);
console.log('cleanup done');
