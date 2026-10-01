/* 模型层：cubie 状态 / 转动 / 打乱 / 复原 / 展开映射 */
/* 依赖 cube-core.js */

function makeSolved() {
  const cubies = [];
  let id = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        const faces = {};
        for (const k of FACE_KEYS) {
          const n = FACE_DEF[k].n;
          if (x*n[0] + y*n[1] + z*n[2] === 1) faces[k] = FACE_DEF[k].color;
        }
        cubies.push({ id: id++, home: [x,y,z], p: [x,y,z], rot: I3.slice(), faces });
      }
  return cubies;
}

/* 某转动影响的层 */
function moveLayer(mv) {
  const b = MOVES[mv[0]];
  return cubies => cubies.filter(c => c.p[b.layerAxis] === b.layerVal);
}

/* 对一组 cubie 应用逻辑转动 */
function applyMoveTo(cubies, name) {
  const { base, rot } = moveInfo(name);
  const axis = base.layerAxis, val = base.layerVal;
  const hit = cubies.filter(c => c.p[axis] === val);
  for (const c of hit) {
    c.p = m3tv(rot, c.p).map(v => Math.round(v));
    c.rot = m3snap(m3mul(rot, c.rot));
  }
  return hit;
}

/* 面 -> 该面中心块的方向（世界坐标） */
function faceNormal(c, f) {
  return m4dir(m3to4(c.rot), FACE_DEF[f].n).map(v => Math.round(v));
}

/* 读某个面的颜色网格，统一返回 [row][col]（从面外看） */
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

if (typeof module !== 'undefined') module.exports = { makeSolved, applyMoveTo, readFaceColors, faceNormal };
