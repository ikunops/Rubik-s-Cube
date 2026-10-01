const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');
s = s.replace("function resetView() {",
`/* 重置到复原态（复用已有 DOM 元素，仅改逻辑状态与贴纸颜色） */
function resetToSolved() {
  spin = null; queue.length = 0; drag = null;
  history = []; moveCount = 0; restoreLeft = 0; historyFrozen = false;
  const fresh = makeSolved();
  for (let i = 0; i < cubies.length; i++) {
    const c = cubies[i], f = fresh[i];
    c.p = f.p.slice(); c.rot = f.rot.map(r => r.slice()); c.faces = Object.assign({}, f.faces);
    /* 更新贴纸颜色 */
    for (let k = 0; k < FACE_KEYS.length; k++) {
      const st = c.el.children[k].querySelector('.sticker');
      if (st) { const col = c.faces[FACE_KEYS[k]]; st.style.background = col || ''; }
    }
  }
  stateVer++;
  updateUI();
  renderNet(); drawMini();
  render(performance.now());
}

function resetView() {`);
fs.writeFileSync('work/app.js', s);
console.log('resetToSolved added');
