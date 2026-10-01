const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 状态版本号：只在状态变化时刷新颜色 ---- */
s = s.replace("let lastFrame = performance.now();",
`let lastFrame = performance.now();
let dragSnapBack = null;          // 松手回弹
let stateVer = -1;                // 状态版本（颜色缓存用）
let paintedVer = -1;              // 已绘制的版本`);

/* ---- 重写 render：支持拖拽实时预览 + 性能优化 ---- */
const oldRender = s.slice(s.indexOf("function render(now) {"),
                          s.indexOf("/* ============================================================\n   4. 平面展开图（侧栏）"));

const newRender = `function render(now) {
  /* --- 本帧的活动转动（动画 / 拖拽预览 / 回弹） --- */
  let activeHit = null, turnM = m4id();
  if (anim) {
    activeHit = anim.hit;
    turnM = m4rot(anim.info.base.axis,
                  anim.info.ang * easeInOut(clamp01((now - anim.t0) / anim.dur)));
  } else if (drag && drag.locked) {
    activeHit = drag.hit;
    turnM = m4rot(AXIS_VEC[drag.axis], drag.angle || 0);
  } else if (dragSnapBack) {
    const p = clamp01((now - dragSnapBack.t0) / dragSnapBack.dur);
    activeHit = dragSnapBack.hit;
    turnM = m4rot(AXIS_VEC[dragSnapBack.axis], dragSnapBack.from * (1 - easeOut(p)));
    if (p >= 1) dragSnapBack = null;
  }

  frameUnfold = {};                       // 每帧失效缓存
  frameCam = cameraM();
  cubeEl.style.transform = m4css(frameCam);

  const solid = 1 - clamp01((unfoldT - 0.02) / 0.30);
  const nearFold = unfoldT < 0.001;       // 完全折叠：平面块无需更新

  /* --- 小方块 --- */
  for (const c of cubies) {
    const M = m4mulAll(unfoldM(faceGroupOf(c)),
                       (activeHit && activeHit.indexOf(c) >= 0) ? turnM : m4id(),
                       baseM(c));
    c.el.style.transform = m4css(M);
    c.el.style.opacity = solid;
  }

  /* --- 平面块：折叠态跳过（不可见） --- */
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
  }
  if (paintedVer !== stateVer) { paintedVer = stateVer; renderNet(); }
}

`;
s = s.replace(oldRender, newRender);

/* ---- 提交转动时递增版本号 ---- */
s = s.replace(`  history.push(anim.name);
  moveCount++;
  anim = null;
  renderNet();
  updateUI();`,
`  history.push(anim.name);
  moveCount++;
  anim = null;
  stateVer++;
  updateUI();`);

s = s.replace(`  for (const m of seq) { applyMoveTo(cubies, m); history.push(m); moveCount++; }
  renderNet(); updateUI();`,
`  for (const m of seq) { applyMoveTo(cubies, m); history.push(m); moveCount++; }
  stateVer++;
  renderNet(); updateUI();`);

/* ---- 展开/折叠：动画期间关闭阴影绘制 ---- */
s = s.replace(`  /* 展开动画 */
  if (Math.abs(unfoldT - unfoldTarget) > 1e-4) {
    const dir = Math.sign(unfoldTarget - unfoldT);
    unfoldT = clamp01(unfoldT + dir * dt * 1000 / UNFOLD_MS);
    if (Math.abs(unfoldT - unfoldTarget) < 1e-3) unfoldT = unfoldTarget;
    document.getElementById('roUnfold').textContent = Math.round(unfoldT * 100) + '%';
    document.getElementById('stUnfold').textContent = Math.round(unfoldT * 100) + '%';
  }`,
`  /* 展开动画（用 easeInOut 让起止更柔和） */
  if (Math.abs(unfoldT - unfoldTarget) > 1e-4) {
    if (!unfoldAnim) unfoldAnim = { from: unfoldT, to: unfoldTarget, t0: now, dur: UNFOLD_MS };
    const p = clamp01((now - unfoldAnim.t0) / unfoldAnim.dur);
    unfoldT = lerp(unfoldAnim.from, unfoldAnim.to, easeInOut(p));
    if (p >= 1) { unfoldT = unfoldTarget; unfoldAnim = null; }
    const pct = Math.round(unfoldT * 100) + '%';
    roUnfoldEl.textContent = pct;
    stUnfoldEl.textContent = pct;
  }`);

fs.writeFileSync('work/app.js', s);
console.log('render rewritten');
