const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 1. buildCube：小方块与平面块放进两个独立图层容器 ---- */
s = s.replace(`function buildCube() {
  cubeEl.innerHTML = '';
  for (const c of cubies) {`,
`let solidLayer = null, plateLayer = null;
function buildCube() {
  cubeEl.innerHTML = '';
  solidLayer = document.createElement('div');
  solidLayer.className = 'layer layer-solid';
  plateLayer = document.createElement('div');
  plateLayer.className = 'layer layer-plates';
  cubeEl.appendChild(solidLayer);
  cubeEl.appendChild(plateLayer);

  for (const c of cubies) {`);

s = s.replace(`    c.el = el;
    el.__cubie = c;
    cubeEl.appendChild(el);
  }
  buildPlates();
}`,
`    c.el = el;
    el.__cubie = c;
    solidLayer.appendChild(el);
  }
  buildPlates();
}`);

s = s.replace(`    pl.__face = f;
    cubeEl.appendChild(pl);
  }
  PLATE_ELS = Array.from(cubeEl.querySelectorAll('.plate'));`,
`    pl.__face = f;
    plateLayer.appendChild(pl);
  }
  PLATE_ELS = Array.from(plateLayer.querySelectorAll('.plate'));`);

/* ---- 2. 图层可见性切换（端点处彻底移除元素，省掉合成开销） ---- */
s = s.replace("function render(now) {",
`/* 端点处用 display 彻底移除不必要图层：折叠时移除 6 个平面块，展开时移除 27 个小方块 */
let solidVis = true, plateVis = true;
function syncLayers() {
  const wantSolid = unfoldT <= 0.0015;
  const wantPlate = unfoldT >= 0.9985;
  const sVis = !wantPlate, pVis = !wantSolid;
  if (sVis !== solidVis) { solidLayer.style.display = sVis ? '' : 'none'; solidVis = sVis; }
  if (pVis !== plateVis) { plateLayer.style.display = pVis ? '' : 'none'; plateVis = pVis; }
}

function render(now) {`);

s = s.replace(`  /* --- 平面块：始终写 transform（常驻合成层，避免动画首帧光栅化尖峰） --- */
  paintPlates(nearFold ? 0.001 : clamp01((unfoldT - 0.06) / 0.30),
              paintedVer !== stateVer);`,
`  /* --- 平面块 --- */
  if (plateVis) paintPlates(clamp01((unfoldT - 0.06) / 0.30), paintedVer !== stateVer);
  syncLayers();`);

/* nearFold 不再需要 */
s = s.replace("  const nearFold = unfoldT < 0.001;       // 完全折叠：平面块无需更新\n", "");

fs.writeFileSync('work/app.js', s);
console.log('layer split done');
