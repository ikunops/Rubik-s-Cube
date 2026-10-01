const fs=require('fs');
const src = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
/* 抽出 app.js 里的分组逻辑做纯逻辑测试 */
const app = fs.readFileSync('work/app.js','utf8');
const i = app.indexOf('function assignGroups()');
const j = app.indexOf('let GROUP_OF = {};');
const groupFn = app.slice(i, j);

fs.writeFileSync('work/_probe9.js', src + `
;
let cubies = makeSolved();
let FACE_KEYS_ = FACE_KEYS;
` + groupFn + `
;
const g = assignGroups();
console.log('=== 分组结果 ===');
let total = 0, okAll = true;
for (const f of FACE_KEYS) {
  const n = g[f].length; total += n;
  const okN = n === 9;
  if (!okN) okAll = false;
  /* 检查每组是否都真的贴在该面上 */
  const onFace = g[f].every(c => {
    const n2 = FACE_DEF[f].n;
    return c.p[0]*n2[0] + c.p[1]*n2[1] + c.p[2]*n2[2] === 1;
  });
  if (!onFace) okAll = false;
  console.log('  ' + f + ': ' + n + ' 块' + (okN ? '' : ' *** 应为9') +
              (onFace ? '' : ' *** 有块不在该面上'));
}
console.log('  总计 =', total, '(应为 27)');

/* 每组内 9 块的格子位置必须恰好覆盖该面 3x3 的 9 个位置 */
console.log('\n=== 每组覆盖该面 3x3 全部格子 ===');
for (const f of FACE_KEYS) {
  const fr = FACE_FRAME[f];
  const seen = new Set();
  for (const c of g[f]) {
    const col = c.p[0]*fr.right[0] + c.p[1]*fr.right[1] + c.p[2]*fr.right[2];
    const row = c.p[0]*fr.down[0] + c.p[1]*fr.down[1] + c.p[2]*fr.down[2];
    seen.add(row + ',' + col);
  }
  const ok = seen.size === 9;
  if (!ok) okAll = false;
  console.log('  ' + f + ': 覆盖 ' + seen.size + '/9' + (ok ? '' : ' *** 有重复或缺失'));
}

/* 展开后各组是否落在不同的 2D 位置（不重叠） */
console.log('\n=== 展开后 6 组的 2D 落位 ===');
const hinges = buildHinges();
for (const f of FACE_KEYS) {
  const M = unfoldMatrix(hinges[f], 1);
  const c = m4mv(M, sheetCenter(f));
  console.log('  ' + f + ' -> 2D (' + c[0].toFixed(1) + ', ' + c[1].toFixed(1) + ')');
}
console.log(okAll ? '\n=== 分组全部正确：可以同时展开 ===' : '\n=== 分组有问题 ===');
`);
