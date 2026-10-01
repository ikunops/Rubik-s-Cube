const fs = require('fs');
const parts = ['cube-core.js','cube-model.js','test-model-body.js'].map(f => fs.readFileSync('work/'+f,'utf8'));
fs.writeFileSync('work/_bundle-test.js', parts.join('\n;\n'));
