let cubies = makeSolved();
const g = assignGroups();
let okAll = true;
console.log('=== 分组结果 ===');
let total = 0;
for (const f of FACE_KEYS) {
  const n = g[f].length; total += n;
  const okN = n === 9;
  if (!okN) okAll = false;
  const onFace = g[f].every(c => {
    const nn = FACE_DEF[f].n;
    return c.p[0]*nn[0] + c.p[1]*nn[1] + c.p[2]*nn[2] === 1;
  });
  if (!onFace) okAll = false;
  console.log('  ' + f + ': ' + n + ' 块' + (okN ? '' : ' *** 应为9') +
              (onFace ? '' : ' *** 有块不在该面上'));
}
console.log('  总计 = ' + total + ' (应为 27)');
if (total !== 27) okAll = false;

console.log('');
console.log('=== 每组覆盖该面 3x3 全部格子 ===');
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
  console.log('  ' + f + ': 覆盖 ' + seen.size + '/9' + (ok ? '' : ' *** 重复或缺失'));
}

console.log('');
console.log('=== 展开后 6 组落位（应为 6 个不同位置）===');
const hinges = buildHinges();
const slots = [];
for (const f of FACE_KEYS) {
  const M = unfoldMatrix(hinges[f], 1);
  const c = m4mv(M, sheetCenter(f));
  slots.push(c[0].toFixed(1) + ',' + c[1].toFixed(1));
  console.log('  ' + f + ' -> 2D (' + c[0].toFixed(1) + ', ' + c[1].toFixed(1) + ')');
}
if (new Set(slots).size !== 6) okAll = false;

console.log('');
console.log(okAll ? '=== 分组全部正确：可以同时展开 ===' : '=== 分组有问题 ===');
