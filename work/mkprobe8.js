const fs=require('fs');
const src = ['cube-core.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_probe8.js', src + `
;
function cam(rx, ry){ return m4mul(m4rot([1,0,0], rx), m4rot([0,1,0], ry)); }
const show = (rx, ry, tag) => {
  const c = cam(rx, ry);
  const vis = FACE_KEYS.map(f => ({ f, z: m4dir(c, FACE_DEF[f].n)[2] }))
    .filter(o => o.z > 0.02).sort((a,b)=>b.z-a.z).map(o => o.f + '(' + o.z.toFixed(2) + ')');
  console.log(tag.padEnd(28), '可见:', vis.join(' '));
};
console.log('主图相机 = Rx(rx)*Ry(ry)，z>0 朝向观察者');
show(-35.264, -45, '主图 rx=-35.3 ry=-45');
console.log();
console.log('迷你图候选（希望也是 U F R）:');
for (const [rx, ry] of [[-35.264,45],[-35.264,-45],[35.264,45],[35.264,-45],
                        [-35.264,135],[-35.264,-135],[144.736,-45]]) {
  show(rx, ry, 'Rx(' + rx + ') Ry(' + ry + ')');
}
`);
