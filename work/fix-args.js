const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
s = s.replace("ok((await dragTest(p, '首次拖拽')).ok, '首次拖拽 ok');",
              "ok((await dragTest(p, '首次拖拽', 260, 0)).ok, '首次拖拽 ok');");
fs.writeFileSync('work/audit-v6.js', s);
console.log('args fixed');
