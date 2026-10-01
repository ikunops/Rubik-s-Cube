const fs = require('fs');
const parts = ['cube-core.js','cube-model.js'].map(f => fs.readFileSync('work/'+f,'utf8'));
const body = fs.readFileSync('work/algo-body.js','utf8');
fs.writeFileSync('work/_algo.js', parts.join('\n;\n') + '\n;\n' + body);
console.log('bundle ok');
