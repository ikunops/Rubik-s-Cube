const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 恢复 px 版基础矩阵 */
s = s.replace(`/* 小方块：局部 -> 世界（单位），不含像素缩放 */
function localToWorld(c) {
  return m4mul(m4T(c.p[0], c.p[1], c.p[2]), m3to4(c.rot));
}`,
`function baseM(c) {
  return m4mul(m4T(c.p[0]*PX, c.p[1]*PX, c.p[2]*PX), m3to4(c.rot));
}`);

s = s.replace(`/* 平面块：局部 -> 世界（单位） */
function plateLocal(f) {
  const sc = sheetCenter(f);
  return m4mul(m4T(sc[0], sc[1], sc[2]), faceRotM(f));
}`,
`function plateBaseM(f) {
  const sc = sheetCenter(f);
  return m4mul(m4T(sc[0]*PX, sc[1]*PX, sc[2]*PX), faceRotM(f));
}`);
s = s.replace("  if (!PLATE_BASE[f]) PLATE_BASE[f] = plateLocal(f);",
              "  if (!PLATE_BASE[f]) PLATE_BASE[f] = plateBaseM(f);");

/* 新增：把展开矩阵的平移分量换算到像素（旋转分量不变） */
s = s.replace(`function unfoldM(f) {
  if (!frameUnfold[f]) frameUnfold[f] = unfoldMatrix(HINGES[f], unfoldT);
  return frameUnfold[f];
}`,
`/* unfoldMatrix 的平移是世界单位，这里只把平移换算成像素 */
function scaleTranslation(M, k) {
  const o = M.slice();
  o[3] = M[3] * k; o[7] = M[7] * k; o[11] = M[11] * k;
  return o;
}
function unfoldM(f) {
  if (!frameUnfold[f]) frameUnfold[f] = scaleTranslation(unfoldMatrix(HINGES[f], unfoldT), PX);
  return frameUnfold[f];
}`);

/* 渲染：去掉 SCALE，恢复 px 链 */
s = s.replace(`  const solid = 1 - clamp01((unfoldT - 0.02) / 0.30);
  const SCALE = m4S(PX);
  for (const c of cubies) {
    const inLayer = anim && anim.hit.indexOf(c) >= 0;
    const M = m4mulAll(SCALE, unfoldM(faceGroupOf(c)),
                       inLayer ? turnM : m4id(), localToWorld(c));`,
`  const solid = 1 - clamp01((unfoldT - 0.02) / 0.30);
  for (const c of cubies) {
    const inLayer = anim && anim.hit.indexOf(c) >= 0;
    const M = m4mulAll(unfoldM(faceGroupOf(c)),
                       inLayer ? turnM : m4id(), baseM(c));`);

s = s.replace(`    const M = m4mulAll(SCALE, unfoldM(pl.__face), plateBase(pl.__face));`,
              `    const M = m4mul(unfoldM(pl.__face), plateBase(pl.__face));`);

/* 布局变化时失效展开缓存 */
s = s.replace(`  document.documentElement.style.setProperty('--u', PX + 'px');`,
`  document.documentElement.style.setProperty('--u', PX + 'px');
  frameUnfold = {};`);

fs.writeFileSync('work/app.js', s);
console.log('translation-only scaling applied');
