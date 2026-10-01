const fs=require('fs');
const core = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
const body = fs.readFileSync('work/algo-body.js','utf8');
fs.writeFileSync('work/_model.js', core + '\n;\n' + body);
console.log('rebuilt');
