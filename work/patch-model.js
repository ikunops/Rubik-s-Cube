const fs=require('fs');
let s = fs.readFileSync('work/cube-model.js','utf8');
const start = s.indexOf('/* 当前某个世界方向上的颜色矩阵');
const end = s.indexOf('if (typeof module');
s = s.slice(0, start) + `/* 读某个面的颜色网格，统一返回 [row][col]（从面外看） */
function readFaceColors(cubies, faceKey) {
  const fr = FACE_FRAME[faceKey];
  const out = [[null,null,null],[null,null,null],[null,null,null]];
  for (const c of cubies) {
    for (const f of FACE_KEYS) {
      if (!c.faces[f]) continue;
      const wn = faceNormal(c, f);
      if (wn[0] !== fr.n[0] || wn[1] !== fr.n[1] || wn[2] !== fr.n[2]) continue;
      const col = c.p[0]*fr.right[0] + c.p[1]*fr.right[1] + c.p[2]*fr.right[2];
      const row = c.p[0]*fr.down[0]  + c.p[1]*fr.down[1]  + c.p[2]*fr.down[2];
      out[row+1][col+1] = c.faces[f];
    }
  }
  return out;
}

/* 当前状态下的完整 54 贴纸表：{ face: [row][col] } */
function snapshot(cubies) {
  const o = {};
  for (const f of FACE_KEYS) o[f] = readFaceColors(cubies, f);
  return o;
}

` + s.slice(end);
fs.writeFileSync('work/cube-model.js', s);
console.log('model patched');
