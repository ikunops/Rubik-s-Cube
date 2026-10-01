const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 1. 平面块常驻（不隐藏），靠极低 opacity 保持光栅化 ---- */
s = s.replace(`/* 端点处只切换 visibility（保持图层合成状态，避免重建光栅化导致的卡顿尖峰） */
let solidVis = true, plateVis = true;
function syncLayers() {
  const sVis = unfoldT < 0.9985;    // 完全展开时隐藏小方块
  const pVis = unfoldT > 0.0015;    // 完全折叠时隐藏平面块
  if (sVis !== solidVis) { solidLayer.style.visibility = sVis ? '' : 'hidden'; solidVis = sVis; }
  if (pVis !== plateVis) { plateLayer.style.visibility = pVis ? '' : 'hidden'; plateVis = pVis; }
}`,
`/* 图层常驻：平面块始终保留在合成树里（折叠态用极低 opacity 维持光栅化），
   避免动画端点重建光栅化导致的卡顿尖峰。小方块完全展开后才隐藏。 */
let solidVis = true;
function syncLayers() {
  const sVis = unfoldT < 0.9985;
  if (sVis !== solidVis) { solidLayer.style.visibility = sVis ? '' : 'hidden'; solidVis = sVis; }
}`);

/* 平面块：折叠态用 0.001（保持绘制，预热光栅化），展开中正常淡入 */
s = s.replace(`  syncLayers();
  if (plateVis) paintPlates(clamp01((unfoldT - 0.06) / 0.30), paintedVer !== stateVer);`,
`  syncLayers();
  paintPlates(Math.max(0.001, clamp01((unfoldT - 0.06) / 0.30)), paintedVer !== stateVer);`);

/* ---- 2. 初始化时预热平面块光栅化 ---- */
s = s.replace(`  syncLayers();              // 初始化图层可见性`,
`  syncLayers();              // 初始化图层可见性
  paintPlates(0.001, true);  // 预热平面块光栅化，消除首次展开的尖峰`);

/* ---- 3. 修复：从「转层」回退到「转视角」时的视角跳变 ---- */
s = s.replace(`      if (!t) { drag.kind = 'orbit'; drag.rx0 = camT.rx; drag.ry0 = camT.ry; return; }`,
`      if (!t) {
        /* 中心块等无法判定层：转为旋转视角，并抵消已累积位移避免跳变 */
        drag.kind = 'orbit';
        drag.rx0 = camT.rx + dy * 0.30;
        drag.ry0 = camT.ry - dx * 0.34;
        return;
      }`);

fs.writeFileSync('work/app.js', s);
console.log('final perf strategy applied');
