const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* commitSpin：还原期间不写回 history，并递减剩余步数 */
s = s.replace(`function commitSpin() {
  if (!spin) return;
  const name = spin.name;
  const done = spin.angle;
  spin = null;
  applyMoveTo(cubies, name);
  if (name) history.push(name);
  moveCount++;
  stateVer++;
  updateUI();
  pumpQueue();
}`,
`function commitSpin() {
  if (!spin) return;
  const name = spin.name;
  spin = null;
  applyMoveTo(cubies, name);
  if (name) {
    if (historyFrozen) {
      /* 还原播放中：不写回 history，只递减剩余步数 */
      restoreLeft = Math.max(0, restoreLeft - 1);
      if (restoreLeft === 0 && queue.length === 0) historyFrozen = false;
    } else {
      history.push(name);
      moveCount++;
    }
  }
  stateVer++;
  updateUI();
  pumpQueue();
}`);

/* historyFrozen 声明提前 */
s = s.replace("let restoreLeft = 0; // 还原剩余步数（用于计数显示）",
              "let restoreLeft = 0; // 还原剩余步数（用于计数显示）\nlet historyFrozen = false; // 还原播放中：冻结 history 写入");
s = s.replace("let historyFrozen = false;\n\nfunction resetView()", "\nfunction resetView()");

fs.writeFileSync('work/app.js', s);
console.log('commitSpin fixed');
