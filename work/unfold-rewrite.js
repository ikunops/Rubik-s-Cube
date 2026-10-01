const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ============ 1. 移除有缺陷的分组逻辑，改为「面片同时旋出」 ============ */
const gs = s.indexOf("/* 每个小方块在展开时归属哪个面。");
const ge = s.indexOf("function plateBaseM(f) {");
if (gs < 0 || ge < 0) throw new Error('group anchor not found');
s = s.slice(0, gs) + s.slice(ge);

/* ============ 2. render：小方块与面片同时按 unfoldT 旋出 ============ */
const rs = s.indexOf("function render(now) {");
const re = s.indexOf("/* ============================================================\n   4. 平面展开图（侧栏）");
if (rs < 0 || re < 0) throw new Error('render anchor not found');

const NEW_RENDER = `function render(now) {
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

  frameUnfold = {};
  frameCam = cameraM();
  cubeEl.style.transform = m4css(frameCam);

  /* 折叠进度：0=立体魔方，1=完全展开的十字平面图 */
  const solidFade = 1 - clamp01((unfoldT - 0.30) / 0.45);   // 小方块在展开后段淡出
  const plateOp   = clamp01((unfoldT - 0.05) / 0.22);       // 面片在前段淡入

  /* --- 27 个小方块：只在折叠态附近渲染（展开后由面片接管） --- */
  if (solidFade > 0.01) {
    for (const c of cubies) {
      const M = m4mulAll((activeHit && activeHit.indexOf(c) >= 0) ? turnM : m4id(), baseM(c));
      c.el.style.transform = m4css(M);
      c.el.style.opacity = solidFade;
    }
  }

  /* --- 6 个面片：沿铰链同时旋出，颜色始终跟随魔方状态 --- */
  paintPlates(plateOp, paintedVer !== stateVer);
  if (paintedVer !== stateVer) { paintedVer = stateVer; renderNet(); }
}

`;
s = s.slice(0, rs) + NEW_RENDER + s.slice(re);

fs.writeFileSync('work/app.js', s);
console.log('render rewritten: simultaneous unfold');
