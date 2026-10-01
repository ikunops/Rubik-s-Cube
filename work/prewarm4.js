const fs = require('fs');

/* 加遮罩样式 */
let h = fs.readFileSync('work/part1.html','utf8');
h = h.replace(`.stage{`,
`.boot{position:absolute;inset:0;background:var(--bg);z-index:30;pointer-events:none;
  opacity:1;transition:opacity .22s ease}
.boot.done{opacity:0}

.stage{`);
fs.writeFileSync('work/part1.html', h);

/* HTML 里插入遮罩 */
let t = fs.readFileSync('work/part2.html','utf8');
t = t.replace(`        <div class="cube" id="cube"></div>`,
              `        <div class="cube" id="cube"></div>\n        <div class="boot" id="boot"></div>`);
fs.writeFileSync('work/part2.html', t);

/* 预热：全不透明跑完整路径，期间遮罩挡住 */
let s = fs.readFileSync('work/app.js','utf8');
s = s.replace(`  (function prewarm() {
    const keep = cubeEl.style.opacity;
    cubeEl.style.opacity = '0.004';
    const path = [0.08, 0.2, 0.34, 0.5, 0.66, 0.82, 1.0, 0.82, 0.5, 0.2, 0];
    let i = 0;
    const tick = () => {
      if (i < path.length) {
        unfoldT = path[i++];
        render(performance.now());
        requestAnimationFrame(tick);
      } else {
        unfoldT = 0; unfoldTarget = 0; unfoldAnim = null;
        render(performance.now());
        cubeEl.style.opacity = keep;
        lastFrame = performance.now();
      }
    };
    requestAnimationFrame(tick);
  })();`,
`  (function prewarm() {
    const boot = document.getElementById('boot');
    /* 全不透明地跑完整展开路径（遮罩挡住，用户看不到），
       让浏览器真正完成所有中间姿态的光栅化 */
    const path = [0.06, 0.18, 0.32, 0.48, 0.64, 0.80, 1.0, 0.80, 0.48, 0.16, 0];
    let i = 0;
    const tick = () => {
      if (i < path.length) {
        unfoldT = path[i++];
        render(performance.now());
        requestAnimationFrame(tick);
      } else {
        unfoldT = 0; unfoldTarget = 0; unfoldAnim = null;
        render(performance.now());
        lastFrame = performance.now();
        boot.classList.add('done');
      }
    };
    requestAnimationFrame(tick);
  })();`);

fs.writeFileSync('work/app.js', s);
console.log('boot overlay prewarm');
