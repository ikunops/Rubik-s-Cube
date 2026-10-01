const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* renderNet 同时刷新迷你立方体 */
s = s.replace(`function renderNet() {
  for (const f of FACE_KEYS) {
    const g = readFaceColors(cubies, f);
    const cells = netCells[f];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      cells[r*3+c].style.background = g[r][c] || '#1c1c24';
    }
  }
}`,
`function renderNet() {
  for (const f of FACE_KEYS) {
    const g = readFaceColors(cubies, f);
    const cells = netCells[f];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      cells[r*3+c].style.background = g[r][c] || '#1c1c24';
    }
  }
  drawMini();
}

/* 侧栏视图切换：主图折叠 -> 侧栏显示 3D 立方体；主图展开 -> 侧栏显示平面展开图 */
function setSideView(showNet) {
  if (viewIsNet === showNet) return;
  viewIsNet = showNet;
  paneMiniEl.classList.toggle('hidden', showNet);
  paneNetEl.classList.toggle('hidden', !showNet);
  viewTitleEl.innerHTML = (showNet ? '平面展开图' : '3D 立体图') +
    ' <span class="tag" id="netTag">实时同步</span>';
  if (!showNet) drawMini();
}`);

/* toggleUnfold 时切换侧栏视图 */
s = s.replace(`  document.getElementById('btnFold').classList.toggle('on', unfoldTarget < 0.5);
  document.getElementById('btnNet').classList.toggle('on', unfoldTarget > 0.5);
}`,
`  document.getElementById('btnFold').classList.toggle('on', unfoldTarget < 0.5);
  document.getElementById('btnNet').classList.toggle('on', unfoldTarget > 0.5);
  setSideView(unfoldTarget > 0.5);
}`);

/* init：初始化侧栏视图 + 窗口缩放时重绘迷你立方体 */
s = s.replace(`  setMode('turn');
  document.getElementById('btnFold').classList.add('on');`,
`  setMode('turn');
  document.getElementById('btnFold').classList.add('on');
  setSideView(false);        // 初始：主图是 3D，侧栏显示 3D 立体图`);

s = s.replace("  window.addEventListener('resize', layout);",
`  window.addEventListener('resize', () => { layout(); drawMini(); });`);

/* 键盘/按钮转动后也要刷新迷你立方体 */
s = s.replace(`  stateVer++;
  updateUI();
  if (queue.length) pump();`,
`  stateVer++;
  updateUI();
  if (queue.length) pump();`);

fs.writeFileSync('work/app.js', s);
console.log('view swap wired');
