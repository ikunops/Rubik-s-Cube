const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 修复 A：小幅拖动被惯性放大成 1 格（6.3° 拖拽 -> 48° 提交）
   原因：velocity 阈值 1.1 太低，慢拖也会触发「至少一格」。
   改为：只有真正的快速甩动才补格，且需位移足够。 */
s = s.replace(`  const inertia = Math.max(-0.45, Math.min(0.45, (velocity || 0) * 0.18));
  const projected = angle + inertia * SNAP_DEG;
  let steps = Math.round(projected / SNAP_DEG);
  /* 快速甩动至少一格 */
  if (steps === 0 && Math.abs(velocity || 0) > 1.1) steps = Math.sign(velocity);`,
`  const inertia = Math.max(-0.30, Math.min(0.30, (velocity || 0) * 0.12));
  const projected = angle + inertia * SNAP_DEG;
  let steps = Math.round(projected / SNAP_DEG);
  /* 只有「明显甩动」才补一格：需要速度快 且 已拖出一定角度 */
  if (steps === 0 && Math.abs(velocity || 0) > 2.2 && Math.abs(angle) > 18) {
    steps = Math.sign(velocity);
  }`);

/* 修复 B：还原后按钮应禁用（restoreLeft=0 但 history 为空 -> 应禁用） */
s = s.replace(`  const btnSolve = document.getElementById('btnSolve');
  btnSolve.textContent = restoreLeft > 0 ? ('还原中 ' + restoreLeft) : '还原';
  btnSolve.disabled = restoreLeft > 0 || isBusy();`,
`  const btnSolve = document.getElementById('btnSolve');
  btnSolve.textContent = restoreLeft > 0 ? ('还原中 ' + restoreLeft) : '还原';
  /* 无可还原内容时禁用，避免无效点击 */
  btnSolve.disabled = restoreLeft > 0 || isBusy() || history.length === 0;`);

/* 修复 C：松手后先走一小段惯性滑行，再吸附（阻尼感） */
s = s.replace(`  /* 第一格：从当前角度阻尼吸附到 ±90，提交后由 pumpQueue 接着播剩余格 */
  spin.name = name;
  spin.target = dir * SNAP_DEG;
  const dur = Math.min(380, SNAP_MS + Math.abs(spin.target - angle) * 1.0);
  spin.anim = { from: angle, to: dir * SNAP_DEG, t0: performance.now(), dur };`,
`  /* 第一格：从当前角度阻尼吸附到 ±90，提交后由 pumpQueue 接着播剩余格。
     时长随角度差缩放，角度差越大回弹越久，形成阻尼感。 */
  spin.name = name;
  spin.target = dir * SNAP_DEG;
  const dur = Math.max(160, Math.min(420, 150 + Math.abs(spin.target - angle) * 1.6));
  spin.anim = { from: angle, to: dir * SNAP_DEG, t0: performance.now(), dur };`);

fs.writeFileSync('work/app.js', s);
console.log('3 fixes applied');
