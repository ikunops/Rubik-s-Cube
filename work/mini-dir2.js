const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

s = s.replace("const MINI_ROT = m4mul(m4rot([1, 0, 0], -35.264), m4rot([0, 1, 0], 45));",
              "const MINI_ROT = m4mul(m4rot([1, 0, 0], -35.264), m4rot([0, 1, 0], -45));");

/* MINI_VISIBLE 不再写死：动态取朝向观察者的三个面 */
s = s.replace("const MINI_VISIBLE = ['U', 'F', 'R'];   // 等轴视角下可见的三个面",
`/* 等轴视角下朝向观察者的面（动态计算，避免与相机不一致） */
function miniVisibleFaces() {
  return FACE_KEYS
    .map(f => ({ f, z: m4dir(MINI_ROT, FACE_DEF[f].n)[2] }))
    .filter(o => o.z > 0.02)
    .sort((a, b) => a.z - b.z)      // 远的先画
    .map(o => o.f);
}`);

s = s.replace(`  /* 远的先画：按面中心在投影后的深度排序 */
  const order = MINI_VISIBLE.slice().sort((a, b) => {
    const ca = m4mv(MINI_ROT, sheetCenter(a)), cb = m4mv(MINI_ROT, sheetCenter(b));
    return ca[2] - cb[2];
  });
  for (const f of order) drawFace(f, readFaceColors(cubies, f), 0.055);`,
`  for (const f of miniVisibleFaces()) drawFace(f, readFaceColors(cubies, f), 0.055);`);

fs.writeFileSync('work/app.js', s);
console.log('mini faces dynamic');
