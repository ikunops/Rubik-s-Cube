const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 用 visibility 代替 display：图层保持合成状态，端点处只隐藏不重建 */
s = s.replace(`/* 端点处用 display 彻底移除不必要图层：折叠时移除 6 个平面块，展开时移除 27 个小方块 */
let solidVis = true, plateVis = true;
function syncLayers() {
  const wantSolid = unfoldT <= 0.0015;
  const wantPlate = unfoldT >= 0.9985;
  const sVis = !wantPlate, pVis = !wantSolid;
  if (sVis !== solidVis) { solidLayer.style.display = sVis ? '' : 'none'; solidVis = sVis; }
  if (pVis !== plateVis) { plateLayer.style.display = pVis ? '' : 'none'; plateVis = pVis; }
}`,
`/* 端点处只切换 visibility（保持图层合成状态，避免重建光栅化导致的卡顿尖峰） */
let solidVis = true, plateVis = true;
function syncLayers() {
  const sVis = unfoldT < 0.9985;    // 完全展开时隐藏小方块
  const pVis = unfoldT > 0.0015;    // 完全折叠时隐藏平面块
  if (sVis !== solidVis) { solidLayer.style.visibility = sVis ? '' : 'hidden'; solidVis = sVis; }
  if (pVis !== plateVis) { plateLayer.style.visibility = pVis ? '' : 'hidden'; plateVis = pVis; }
}`);

/* 平面块：只要可见就更新（transform 很便宜，保持图层活跃） */
s = s.replace(`  /* --- 平面块 --- */
  if (plateVis) paintPlates(clamp01((unfoldT - 0.06) / 0.30), paintedVer !== stateVer);
  syncLayers();`,
`  /* --- 平面块 --- */
  syncLayers();
  if (plateVis) paintPlates(clamp01((unfoldT - 0.06) / 0.30), paintedVer !== stateVer);`);

/* 初始化时同步一次图层状态 */
s = s.replace(`  setSideView(false);        // 初始：主图是 3D，侧栏显示 3D 立体图`,
`  setSideView(false);        // 初始：主图是 3D，侧栏显示 3D 立体图
  syncLayers();              // 初始化图层可见性`);

fs.writeFileSync('work/app.js', s);
console.log('switched to visibility strategy');
