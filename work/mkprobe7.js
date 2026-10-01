const fs=require('fs');
const src = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_probe7.js', src + `
;
const PX = 142.204;
const HINGES = buildHinges();
console.log('unfoldMatrix(HINGES.U, 1)  [世界单位]:');
console.log(' ', unfoldMatrix(HINGES.U, 1).map(v=>+v.toFixed(4)).join(', '));
console.log();
console.log('sheetCenter(U) =', sheetCenter('U'), ' -> 乘以 PX =', sheetCenter('U').map(v=>+(v*PX).toFixed(2)));
console.log();
console.log('结论：unfoldMatrix 的平移量是世界单位(±1.5)，');
console.log('      而 baseM/plateBaseM 的平移量是像素(±213)。两者相加 = 错。');
console.log();
console.log('展开面中心应落在（世界单位）:');
for (const f of FACE_KEYS) {
  const o = netOffset2D(f);
  console.log('  ', f, '->', [o[0], o[1], CUBE_HALF].join(', '), '  (像素:', [o[0]*PX, o[1]*PX, CUBE_HALF*PX].map(v=>+v.toFixed(0)).join(', '), ')');
}
`);
