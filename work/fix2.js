const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 修复 1：默认视角改为标准等轴（三面等大） ---- */
s = s.replace("let cam = { rx: -24, ry: -36, zoom: 1 };          // 当前视角",
              "let cam = { rx: -35.264, ry: -45, zoom: 1 };      // 当前视角（标准等轴）");
s = s.replace("let camT = { rx: -24, ry: -36, zoom: 1 };         // 目标视角",
              "let camT = { rx: -35.264, ry: -45, zoom: 1 };     // 目标视角（标准等轴）");

/* ---- 修复 2：自适应尺寸（原来魔方太小） ---- */
s = s.replace("const PX = 62;                      // 1 单位 = 62px（与 CSS --u 保持一致）",
              "let PX = 62;                        // 1 单位 = Npx（由 layout() 自适应）");

s = s.replace("/* ---------- 缓动 ---------- */",
`/* ---------- 自适应尺寸 ---------- */
function layout() {
  const r = stageEl.getBoundingClientRect();
  const base = Math.min(r.width, r.height || 520);
  PX = Math.max(30, Math.min(120, base * 0.133));
  document.documentElement.style.setProperty('--u', PX + 'px');
  for (const pl of cubeEl.querySelectorAll('.plate')) {
    const s = 3 * PX;
    pl.style.width = s + 'px';
    pl.style.height = s + 'px';
    pl.style.marginLeft = (-s / 2) + 'px';
    pl.style.marginTop = (-s / 2) + 'px';
  }
}

/* ---------- 缓动 ---------- */`);

/* ---- 修复 3：动画期间不再丢输入（交给队列） ---- */
s = s.replace("box.addEventListener('click', () => { if (!busy()) doMove(f); });",
              "box.addEventListener('click', () => doMove(f));");
s = s.replace("b.addEventListener('click', () => { if (!busy()) doMove(base + p); });",
              "b.addEventListener('click', () => doMove(base + p));");
s = s.replace("      if (!busy()) doMove(k + (e.shiftKey ? \"'\" : ''));",
              "      doMove(k + (e.shiftKey ? \"'\" : ''));");
s = s.replace("function scramble() {\n  if (busy()) return;", "function scramble() {\n  if (anim) return;");

/* ---- 修复 4：折叠/展开的相机目标同步新默认值 ---- */
s = s.replace("  } else {\n    camT.rx = -24; camT.ry = -36; camT.zoom = 1;\n  }",
              "  } else {\n    camT.rx = -35.264; camT.ry = -45; camT.zoom = 1;\n  }");
s = s.replace("function resetView() {\n  camT.rx = -24; camT.ry = -36; camT.zoom = 1;",
              "function resetView() {\n  camT.rx = -35.264; camT.ry = -45; camT.zoom = 1;");

/* ---- 修复 5：init 里调用 layout + resize 监听 ---- */
s = s.replace("function init() {\n  buildCube();",
              "function init() {\n  layout();\n  buildCube();");
s = s.replace("  requestAnimationFrame(frame);\n}\ndocument.addEventListener('DOMContentLoaded', init);",
`  window.addEventListener('resize', layout);
  requestAnimationFrame(frame);
}
document.addEventListener('DOMContentLoaded', init);`);

fs.writeFileSync('work/app.js', s);
console.log('5 fixes applied');
