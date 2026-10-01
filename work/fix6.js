const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 用"世界单位 -> 最后统一缩放"的正确变换链替换 ---- */
s = s.replace(`function baseM(c) {
  return m4mul(m4T(c.p[0]*PX, c.p[1]*PX, c.p[2]*PX), m3to4(c.rot));
}`,
`/* 小方块：局部 -> 世界（单位），不含像素缩放 */
function localToWorld(c) {
  return m4mul(m4T(c.p[0], c.p[1], c.p[2]), m3to4(c.rot));
}`);

s = s.replace(`function plateBaseM(f) {
  const sc = sheetCenter(f);
  return m4mul(m4T(sc[0]*PX, sc[1]*PX, sc[2]*PX), faceRotM(f));
}`,
`/* 平面块：局部 -> 世界（单位） */
function plateLocal(f) {
  const sc = sheetCenter(f);
  return m4mul(m4T(sc[0], sc[1], sc[2]), faceRotM(f));
}`);

s = s.replace(`function plateBase(f) {
  if (!PLATE_BASE[f]) PLATE_BASE[f] = plateBaseM(f);
  return PLATE_BASE[f];
}`,
`function plateBase(f) {
  if (!PLATE_BASE[f]) PLATE_BASE[f] = plateLocal(f);
  return PLATE_BASE[f];
}`);

/* ---- 渲染：统一为 S(PX) · Unfold · Turn · World ---- */
s = s.replace(`  const solid = 1 - clamp01((unfoldT - 0.02) / 0.30);
  for (const c of cubies) {
    const inLayer = anim && anim.hit.indexOf(c) >= 0;
    const M = m4mulAll(unfoldM(faceGroupOf(c)),
                       inLayer ? turnM : m4id(), baseM(c));
    c.el.style.transform = m4css(M);
    c.el.style.opacity = solid;
  }`,
`  const solid = 1 - clamp01((unfoldT - 0.02) / 0.30);
  const SCALE = m4S(PX);
  for (const c of cubies) {
    const inLayer = anim && anim.hit.indexOf(c) >= 0;
    const M = m4mulAll(SCALE, unfoldM(faceGroupOf(c)),
                       inLayer ? turnM : m4id(), localToWorld(c));
    c.el.style.transform = m4css(M);
    c.el.style.opacity = solid;
  }`);

s = s.replace(`    const M = m4mul(unfoldM(pl.__face), plateBase(pl.__face));`,
              `    const M = m4mulAll(SCALE, unfoldM(pl.__face), plateBase(pl.__face));`);

fs.writeFileSync('work/app.js', s);
console.log('unit mismatch fixed');
