const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');
s = s.replace("PX = Math.max(28, Math.min(130, base * 0.152));",
              "PX = Math.max(28, Math.min(158, base * 0.146));");
fs.writeFileSync('work/app.js', s);
console.log('scale tuned');
