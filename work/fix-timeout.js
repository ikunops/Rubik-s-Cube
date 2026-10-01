const fs = require('fs');
let s = fs.readFileSync('work/audit-v6.js','utf8');
s = s.replace("  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });\n  const errs = [];",
              "  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });\n  p.setDefaultTimeout(10000);\n  const errs = [];");
fs.writeFileSync('work/audit-v6.js', s);
console.log('default timeout set');
