const fs=require('fs');
const src = ['cube-core.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_probe6.js', src + `
;
function camM(rx, ry, zoom) {
  return m4mulAll(m4S(zoom), m4rot([1,0,0], rx), m4rot([0,1,0], ry));
}
function vis(rx, ry) {
  const cm = camM(rx, ry, 1);
  const out = [];
  for (const f of FACE_KEYS) {
    const n = FACE_DEF[f].n;
    const nv = m4dir(cm, n);
    out.push(f + ':' + nv[2].toFixed(2));
  }
  return out.join('  ');
}
console.log('CSS 相机 = S * Rx(rx) * Ry(ry)，z>0 表示朝向观察者');
console.log();
for (const [rx, ry] of [[-24,-36],[24,-36],[-24,36],[24,36],[0,0],[-24,0],[24,0],[0,-36]]) {
  console.log('rx=' + String(rx).padStart(4), 'ry=' + String(ry).padStart(4), ' -> ', vis(rx, ry));
}
console.log();
console.log('期望：看到 U(白) F(蓝) R(红) 三面，z 都 > 0');
`);
