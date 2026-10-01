const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 加载后静默跑一次完整展开/折叠，预热光栅化，消除首次展开的尖峰 */
s = s.replace(`  syncLayers();              // 初始化图层可见性
  paintPlates(0.001, true);  // 预热平面块光栅化，消除首次展开的尖峰`,
`  paintPlates(0.001, true);  // 预热平面块光栅化`);
s = s.replace("  syncLayers();              // 初始化图层可见性\n", "");

s = s.replace(`  window.addEventListener('resize', () => { layout(); drawMini(); });
  requestAnimationFrame(frame);`,
`  window.addEventListener('resize', () => { layout(); drawMini(); });

  /* 预热：静默跑一次展开->折叠，让浏览器提前完成光栅化，
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
  });

  requestAnimationFrame(frame);`);

fs.writeFileSync('work/app.js', s);
console.log('prewarm added');
