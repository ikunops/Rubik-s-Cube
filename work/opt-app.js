const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 每帧缓存：展开矩阵 + 相机矩阵 + 平面基础矩阵 */
s = s.replace("function render(now) {",
`let frameUnfold = {};    // 每帧的 6 个展开矩阵
let frameCam = m4id();
const PLATE_BASE = {};   // 静态：平面块基础矩阵
function plateBase(f) {
  if (!PLATE_BASE[f]) PLATE_BASE[f] = plateBaseM(f);
  return PLATE_BASE[f];
}
function unfoldM(f) {
  if (!frameUnfold[f]) frameUnfold[f] = unfoldMatrix(HINGES[f], unfoldT);
  return frameUnfold[f];
}

function render(now) {`);

s = s.replace(`  cubeEl.style.transform = m4css(cameraM());`,
`  frameUnfold = {};                       // 每帧失效缓存
  frameCam = cameraM();
  cubeEl.style.transform = m4css(frameCam);`);

s = s.replace("const M = m4mulAll(unfoldMatrix(HINGES[faceGroupOf(c)], unfoldT),\n                       inLayer ? turnM : m4id(), baseM(c));",
              "const M = m4mulAll(unfoldM(faceGroupOf(c)),\n                       inLayer ? turnM : m4id(), baseM(c));");

s = s.replace("const M = m4mul(unfoldMatrix(HINGES[pl.__face], unfoldT), plateBaseM(pl.__face));",
              "const M = m4mul(unfoldM(pl.__face), plateBase(pl.__face));");

/* projectToStage 复用每帧相机矩阵 */
s = s.replace("  const p = m4mv(cameraM(), v);", "  const p = m4mv(frameCam, v);");

/* 转动开始时也失效缓存 */
s = s.replace("  anim = { name, info, hit, t0: performance.now(), dur: TURN_MS };",
              "  anim = { name, info, hit, t0: performance.now(), dur: TURN_MS };");

fs.writeFileSync('work/app.js', s);
console.log('caching added');
