const fs=require('fs');
const src = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_probe4.js', src + `
;
function solvedQ(cs){ return cs.every(c => c.p.join()===c.home.join() && c.rot.join()===I3.join()); }
function order(moves){ let cs = makeSolved(); for (let n=1; n<=2000; n++){ for (const m of moves) applyMoveTo(cs,m); if (solvedQ(cs)) return n; } return -1; }
console.log('order(R U)      =', order(['R','U']), '(known 105)');
console.log('order(R U2)     =', order(['R','U2'.slice(0,1)]), '(R,U)');
console.log('order(R U R\\' U\\') =', order(['R','U',"R'","U'"]), '(known 6)');
console.log('order(R2 U2)    =', order(['R','R','U','U']), '(known 6)');
console.log('order(F R)      =', order(['F','R']), '(known 105)');
console.log('order(F U)      =', order(['F','U']), '(known 105)');
console.log('order(L D)      =', order(['L','D']), '(known 105)');
console.log('order(B R)      =', order(['B','R']), '(known 105)');
console.log('order(R U L D)  =', order(['R','U','L','D']));
console.log('order(sune R U R\\' U R U2 R\\') =', order(['R','U',"R'",'U','R','U','U',"R'"]), '(known 6)');
console.log('order(T-perm R U R\\' U\\' R\\' F R2 U\\' R\\' U\\' R U R\\' F\\') =',
  order(['R','U',"R'","U'","R'",'F','R','R',"U'","R'","U'",'R','U',"R'","F'"]), '(known 2)');
`);
