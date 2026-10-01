const fs = require('fs');
let s = fs.readFileSync('work/verify-dir.js','utf8');
s = s.replace("const s0 = projectToStage(P0);", "const s0 = projectOrtho(P0);");
s = s.replace("const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));",
              "const p1 = projectOrtho(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));");
fs.writeFileSync('work/verify-dir.js', s);
console.log('test -> ortho');
