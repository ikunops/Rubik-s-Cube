const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

s = s.replace(`  /* 预热：把展开态完整渲染两帧（不淡出、不隐藏），让浏览器真正完成光栅化，
     然后复位。这样用户第一次点「展开」时不会出现冷启动卡顿。 */
  (function prewarm() {
    const keepStage = stageEl.style.opacity;
    stageEl.style.opacity = '0';       // 不可见但仍在合成树中，会正常光栅化
    let step = 0;
    const tick = () => {
      step++;
      if (step === 1) { unfoldT = 1; render(performance.now()); requestAnimationFrame(tick); }
      else if (step === 2) { unfoldT = 0; render(performance.now()); requestAnimationFrame(tick); }
      else {
        stageEl.style.opacity = keepStage;
        unfoldT = 0; unfoldTarget = 0; unfoldAnim = null;
        render(performance.now());
        lastFrame = performance.now();
      }
    };
    requestAnimationFrame(tick);
  })();`,
`  /* 预热：沿整个展开路径逐帧静默渲染一遍（画面几乎不可见但会真正光栅化），
     让浏览器提前把所有中间姿态的图层都栅格化好，
     这样用户第一次点「展开」时不会出现冷启动卡顿。 */
  (function prewarm() {
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
  })();`);

fs.writeFileSync('work/app.js', s);
console.log('prewarm v3: full path');
