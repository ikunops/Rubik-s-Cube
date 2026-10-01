const fs=require('fs');
const src = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_probe3.js', src + `
;
const nm = { '#c8102e':'red','#ff6a00':'orange','#f7f7f5':'white','#ffd500':'yellow','#0057b8':'blue','#00a05a':'green' };
const p = g => g.map(r => r.map(x => nm[x]).join(' ')).join(' | ');
let cs = makeSolved(); applyMoveTo(cs,'F');
console.log('=== after F ===');
for (const f of ['U','D','F','B','L','R']) console.log(f, p(readFaceColors(cs,f)));
console.log('\\n=== famous order identities (convention-independent) ===');
function seq(cs, moves) { for (const m of moves) applyMoveTo(cs, m); }
function solvedQ(cs) { return cs.every(c => c.p.join() === c.home.join() && c.rot.join() === I3.join()); }
function repeat(n, moves) { let cs = makeSolved(); for (let i=0;i<n;i++) seq(cs, moves); return solvedQ(cs); }
console.log('(R U R\\' U\\')^6  = identity :', repeat(6, ['R','U',"R'","U'"]));
console.log('(R U)^105        = identity :', repeat(105, ['R','U']));
console.log('(R U2 D\\' B D\\')^... skip');
console.log('(R F\\' U F)^... skip');
console.log('(L D L\\' D\\')^6  = identity :', repeat(6, ['L','D',"L'","D'"]));
console.log('(F R U R\\' U\\' F\\')^6 :', repeat(6, ['F','R','U',"R'","U'","F'"]));
console.log('(B L U L\\' U\\' B\\')^6 :', repeat(6, ['B','L','U',"L'","U'","B'"]));
console.log('(R U)^4 != identity      :', !repeat(4, ['R','U']));
`);
