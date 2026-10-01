const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 修复：命中 .cubie（方块边缘/间隙）时，回退到该方块朝向相机最正的那个面，
   避免 faceKey 为 null 导致拖拽静默降级为转视角。 */
s = s.replace(`  const cubieEl = e.target.closest ? e.target.closest('.cubie') : null;
  const c = cubieEl ? cubieEl.__cubie : null;
  const bodyEl = e.target.closest ? e.target.closest('.body-face') : null;
  const faceKey = bodyEl ? bodyEl.__face : null;`,
`  const cubieEl = e.target.closest ? e.target.closest('.cubie') : null;
  const c = cubieEl ? cubieEl.__cubie : null;
  const bodyEl = e.target.closest ? e.target.closest('.body-face') : null;
  /* 优先用精确命中的面；若点在方块边缘/间隙（命中 .cubie 本身），
     回退到该方块朝向相机最正的那个面，保证拖拽总能转层。 */
  let faceKey = bodyEl ? bodyEl.__face : null;
  if (!faceKey && c) faceKey = frontFaceOf(c);`);

/* 新增：取该方块朝向相机最正的面 */
s = s.replace("function clearHi() { for (const c of cubies) c.el.classList.remove('hi'); }",
`function clearHi() { for (const c of cubies) c.el.classList.remove('hi'); }

/* 该小方块朝向相机最正的那个面（用于命中方块边缘时的回退） */
function frontFaceOf(c) {
  let best = null;
  for (const k of FACE_KEYS) {
    if (!c.faces[k]) continue;
    const nz = m4dir(frameCam, faceNormal(c, k))[2];
    if (!best || nz > best.nz) best = { nz, k };
  }
  return best ? best.k : null;
}`);

fs.writeFileSync('work/app.js', s);
console.log('cubie-edge fallback added');
