const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 平面块：常驻光栅化（静止时 opacity=0.001 而非 0），并在状态变化时预写 transform，
   消除展开动画第一帧的光栅化尖峰 */
s = s.replace(`  /* --- 平面块：折叠态跳过（不可见） --- */
  if (!nearFold) {
    const plateOp = clamp01((unfoldT - 0.06) / 0.30);
    const dirty = paintedVer !== stateVer;
    for (const pl of cubeEl.querySelectorAll('.plate')) {
      const M = m4mul(unfoldM(pl.__face), plateBase(pl.__face));
      pl.style.transform = m4css(M);
      pl.style.opacity = plateOp;
      if (dirty) {
        const g = readFaceColors(cubies, pl.__face);
        const cells = pl.children;
        for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 3; c2++) {
          cells[r*3+c2].style.background = g[r][c2] || '#1c1c24';
        }
      }
    }
  }`,
`  /* --- 平面块：始终写 transform（常驻合成层，避免动画首帧光栅化尖峰） --- */
  paintPlates(nearFold ? 0.001 : clamp01((unfoldT - 0.06) / 0.30),
              paintedVer !== stateVer);`);

/* 新增 paintPlates：集中管理平面块的 transform / opacity / 颜色 */
s = s.replace("function render(now) {",
`/* 平面块绘制：op 为不透明度；paintColor 为真时才刷新 9 格颜色 */
function paintPlates(op, paintColor) {
  for (const pl of PLATE_ELS) {
    if (!PLATE_CACHE[pl.__face]) {
      PLATE_CACHE[pl.__face] = {
        base: plateBase(pl.__face),
        cells: Array.from(pl.children),
      };
    }
    const cc = PLATE_CACHE[pl.__face];
    pl.style.transform = m4css(m4mul(unfoldM(pl.__face), cc.base));
    pl.style.opacity = op;
    if (paintColor) {
      const g = readFaceColors(cubies, pl.__face);
      for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 3; c2++) {
        cc.cells[r*3+c2].style.background = g[r][c2] || '#1c1c24';
      }
    }
  }
}

function render(now) {`);

/* 缓存平面块元素列表 */
s = s.replace("const PLATE_BASE = {};   // 静态：平面块基础矩阵",
`const PLATE_BASE = {};   // 静态：平面块基础矩阵
let PLATE_ELS = [];      // 平面块元素（buildCube 后填充）
const PLATE_CACHE = {};  // 每个平面块的 base 矩阵与格子元素`);

s = s.replace(`    pl.__face = f;
    cubeEl.appendChild(pl);
  }
}`,
`    pl.__face = f;
    cubeEl.appendChild(pl);
  }
  PLATE_ELS = Array.from(cubeEl.querySelectorAll('.plate'));
  for (const k in PLATE_CACHE) delete PLATE_CACHE[k];
}`);

fs.writeFileSync('work/app.js', s);
console.log('plate prewarm added');
