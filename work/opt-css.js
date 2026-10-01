const fs = require('fs');
let s = fs.readFileSync('work/part1.html','utf8');

/* 1) 去掉 backdrop-filter（3D 变换时反复重算，是最大性能杀手） */
s = s.replace("  background:rgba(10,11,16,.72);backdrop-filter:blur(14px);z-index:20;",
              "  background:rgba(13,14,20,.94);z-index:20;");
s = s.replace("  background:rgba(12,13,19,.78);border:1px solid var(--line);backdrop-filter:blur(12px);",
              "  background:rgba(16,17,24,.92);border:1px solid var(--line);");
s = s.replace(`  background:rgba(12,13,19,.78);border:1px solid var(--line);backdrop-filter:blur(12px);
  padding:8px 11px;border-radius:10px;min-width:132px;text-align:right;`,
`  background:rgba(16,17,24,.92);border:1px solid var(--line);
  padding:8px 11px;border-radius:10px;min-width:132px;text-align:right;`);
s = s.replace(`  font-size:12px;color:var(--dim);background:rgba(12,13,19,.7);
  border:1px solid var(--line);padding:6px 12px;border-radius:999px;
  backdrop-filter:blur(10px);pointer-events:none;white-space:nowrap;`,
`  font-size:12px;color:var(--dim);background:rgba(16,17,24,.9);
  border:1px solid var(--line);padding:6px 12px;border-radius:999px;
  pointer-events:none;white-space:nowrap;`);
s = s.replace(`  border-left:1px solid var(--line);background:rgba(10,11,16,.62);
  backdrop-filter:blur(14px);overflow-y:auto;`,
`  border-left:1px solid var(--line);background:rgba(13,14,20,.9);
  overflow-y:auto;`);

/* 2) 贴纸：用 border 替代多层 inset 阴影（光栅化便宜得多） */
s = s.replace(`  border-radius:calc(var(--u) * .10);
  backface-visibility:hidden;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.30),
             inset 0 -2px 6px rgba(0,0,0,.22),
             0 0 0 1px rgba(0,0,0,.35);
  will-change:transform,opacity;`,
`  border-radius:calc(var(--u) * .10);
  backface-visibility:hidden;
  box-shadow:0 0 0 1px rgba(0,0,0,.32);
  contain:strict;`);

/* 3) 舞台地面阴影用静态渐变（去掉 blur 滤镜） */
s = s.replace(`  background:radial-gradient(ellipse at center,rgba(0,0,0,.62),transparent 70%);
  filter:blur(10px);pointer-events:none;`,
`  background:radial-gradient(ellipse at center,rgba(0,0,0,.5),transparent 72%);
  pointer-events:none;`);

/* 4) 新增：动画期间降级样式 + 迷你立方体预览容器 */
s = s.replace(`/* 舞台浮层控件 */`,
`/* 动画进行中：关闭一切非必要绘制 */
.cube.animating .sticker{box-shadow:none}
.cube.animating .plate{box-shadow:none}

/* 舞台浮层控件 */`);

s = s.replace(`.net-wrap{display:flex;justify-content:center}`,
`/* 侧栏双视图容器：平面展开图 <-> 迷你 3D 立方体 */
.view-swap{position:relative}
.view-swap .pane{transition:opacity .34s ease,transform .34s ease}
.view-swap .pane.hidden{opacity:0;pointer-events:none;position:absolute;inset:0;transform:scale(.96)}
.mini-wrap{display:flex;justify-content:center;align-items:center}
#miniCube{width:100%;max-width:300px;aspect-ratio:4/3;display:block}
.net-wrap{display:flex;justify-content:center}`);

fs.writeFileSync('work/part1.html', s);
console.log('css optimized');
