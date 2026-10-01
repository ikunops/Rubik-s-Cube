const fs=require('fs');
const src = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');

const probe = src + `
;
console.log('--- m4rot check ---');
console.log('Rx(-90) =', JSON.stringify(m4rot([1,0,0], -90)));
console.log('applied to (0,0,-1):', m4mv(m4rot([1,0,0],-90), [0,0,-1]).map(v=>+v.toFixed(4)));

console.log('--- hinge U ---');
const H = 1.0;
const hg = buildHinges(H);
console.log('U chain:', JSON.stringify(hg.U));
const M = unfoldMatrix(hg.U, 1.0);
console.log('M =', M.map(v=>+v.toFixed(4)).join(','));
console.log('M * (0,0,1) =', m4mv(M,[0,0,1]).map(v=>+v.toFixed(4)));

console.log('--- readFaceColors after U ---');
let cs = makeSolved(); applyMoveTo(cs,'U');
for (const f of ['U','F','R','B','L','D']) {
  console.log(f, JSON.stringify(readFaceColors(cs,f)));
}
`;
fs.writeFileSync('work/_probe.js', probe);
