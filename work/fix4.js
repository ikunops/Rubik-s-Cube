const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 动态计算展开取景比例，让 12x9 的十字图充满画面 */
s = s.replace(`function layout() {
  const r = stageEl.getBoundingClientRect();
  const base = Math.min(r.width, r.height || 520);
  PX = Math.max(30, Math.min(120, base * 0.133));
  document.documentElement.style.setProperty('--u', PX + 'px');`,
`let UNFOLD_FIT = 0.62;
function layout() {
  const r = stageEl.getBoundingClientRect();
  const w = r.width || 900, h = r.height || 520;
  const base = Math.min(w, h);
  PX = Math.max(28, Math.min(130, base * 0.152));
  /* 展开图占 12x9 单位，按画布留 8% 边距取景 */
  UNFOLD_FIT = Math.min(0.84 * w / (12 * PX), 0.84 * h / (9 * PX));
  UNFOLD_FIT = Math.max(0.30, Math.min(1.6, UNFOLD_FIT));
  document.documentElement.style.setProperty('--u', PX + 'px');`);

s = s.replace("m4S(cam.zoom * lerp(1, 0.40, unfoldT)),",
              "m4S(cam.zoom * lerp(1, UNFOLD_FIT, unfoldT)),");

/* 展开时不再覆盖 zoom（交给 UNFOLD_FIT），只调正视角 */
s = s.replace(`    camT.rx = -8; camT.ry = -12; camT.zoom = 1.05;`,
              `    camT.rx = 0; camT.ry = 0; camT.zoom = 1;`);
s = s.replace(`  } else {
    camT.rx = -35.264; camT.ry = -45; camT.zoom = 1;
  }`,
`  } else {
    camT.rx = -35.264; camT.ry = -45; camT.zoom = 1;
  }`);

fs.writeFileSync('work/app.js', s);
console.log('unfold fit added');
