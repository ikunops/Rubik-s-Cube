const fs=require('fs');
const src = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_probe2.js', src + `
;
let cs = makeSolved(); applyMoveTo(cs,'R');
const name = { '#c8102e':'red','#ff6a00':'orange','#f7f7f5':'white','#ffd500':'yellow','#0057b8':'blue','#00a05a':'green' };
const p = g => g.map(r => r.map(x => name[x]));
for (const f of ['U','F','R','B','D','L']) console.log(f, JSON.stringify(p(readFaceColors(cs,f))));
console.log();
console.log('B frame right = [-1,0,0] so B col0 is world x=+1, B col2 is world x=-1');
console.log('U frame right = [ 1,0,0] so U col2 is world x=+1');
`);
