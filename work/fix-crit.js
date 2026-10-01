const fs = require('fs');
/* 判据修正：比较位置 + 朝向（面内旋转只改朝向） */
for (const f of ['sim-all.js','find-fail.js']) {
  let s = fs.readFileSync('work/'+f,'utf8');
  s = s.replace(/cubies\.map\(c=>c\.p\.join\(','\)\)\.join\('\|'\)/g,
                "cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|')");
  s = s.replace(/cubies\.map\(c => c\.p\.join\(','\)\)\.join\('\|'\)/g,
                "cubies.map(c=>c.p.join(',')+'/'+c.rot.flat().join('')).join('|')");
  fs.writeFileSync('work/'+f, s);
}
console.log('criterion fixed: pos + orientation');
