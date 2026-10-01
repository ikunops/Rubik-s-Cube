const fs = require('fs');
let s = fs.readFileSync('work/test-v4.js','utf8');

/* 修正 isMain 计算：与所有候选轴比较，且用同一 P0 */
s = s.replace(`          /* 该轴是否确实是主导轴（投影应最大） */
          let maxAbs = 0;
          const nAxis = nW.findIndex(v => v !== 0);
          for (let a2 = 0; a2 < 3; a2++) {
            if (a2 === nAxis || c.p[a2] === 0) continue;
            const d2 = screenDeltaPerDeg(a2, P0);
            const l2 = Math.hypot(d2[0], d2[1]);
            if (l2 < 1e-3) continue;
            maxAbs = Math.max(maxAbs, Math.abs((dvx*d2[0] + dvy*d2[1]) / l2));
          }
          const isMain = Math.abs(t.proj) >= maxAbs - 1e-6;`,
`          /* 该轴是否确实是主导轴：把拖拽投影到每个候选轴，取绝对值最大者 */
          const nAxis = nW.findIndex(v => v !== 0);
          let maxAbs = 0, bestAxis = -1;
          for (let a2 = 0; a2 < 3; a2++) {
            if (a2 === nAxis || c.p[a2] === 0) continue;
            const d2 = screenDeltaPerDeg(a2, P0);
            const l2 = Math.hypot(d2[0], d2[1]);
            if (l2 < 1e-3) continue;
            const pr = Math.abs((dvx*d2[0] + dvy*d2[1]) / l2);
            if (pr > maxAbs) { maxAbs = pr; bestAxis = a2; }
          }
          const isMain = (bestAxis === t.axis);`);

fs.writeFileSync('work/test-v4.js', s);
console.log('isMain fixed');
