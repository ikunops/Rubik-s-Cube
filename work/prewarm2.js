const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

s = s.replace(`  /* 预热：静默跑一次展开->折叠，让浏览器提前完成光栅化，
     这样用户第一次点「展开」时不会出现卡顿尖峰 */
  requestAnimationFrame(() => {
    const keep = cubeEl.style.opacity;
    cubeEl.style.opacity = '0.004';
    unfoldT = 1; render(performance.now());
    setTimeout(() => {
      unfoldT = 0; render(performance.now());
      cubeEl.style.opacity = keep;
      lastFrame = performance.now();
    }, 90);
  });`,
`  /* 预热：把展开态完整渲染两帧（不淡出、不隐藏），让浏览器真正完成光栅化，
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
  })();`);

fs.writeFileSync('work/app.js', s);
console.log('prewarm v2');
