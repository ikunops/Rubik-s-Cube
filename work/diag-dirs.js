const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1600);

  /* 关键：对每个可见贴纸，测试 8 个方向，看是否都能锁定转层 */
  const r = await p.evaluate(() => {
    const out = { cells: [], byDir: {}, fails: [] };
    const DIRS = [['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
                  ['右下',1,1],['右上',1,-1],['左下',-1,1],['左上',-1,-1]];
    for (const name in DIRS) out.byDir[DIRS[name][0]] = 0;
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.35) continue;   // 只测可见面
        const rec = { pos: c.p.join(','), face: fk, dirs: {} };
        for (const [label, vx, vy] of DIRS) {
          const t = pickTurnFromDrag(c, fk, [vx, vy]);
          const nm = moveNameFor(t.axis, t.coord, 1);
          rec.dirs[label] = nm || 'NULL';
          if (nm) out.byDir[label]++;
          else out.fails.push({ pos: c.p.join(','), face: fk, dir: label,
                                axis: t.axis, coord: t.coord });
        }
        out.cells.push(rec);
      }
    }
    return out;
  });

  console.log('=== 每个可见贴纸 × 8 方向的选层结果 ===');
  console.log('方向 -> 成功次数:');
  for (const k in r.byDir) console.log('  ' + k.padEnd(4) + r.byDir[k]);
  console.log('\n失败总数 =', r.fails.length);
  for (const f of r.fails.slice(0, 10)) console.log('  ' + JSON.stringify(f));

  console.log('\n=== 逐格明细（前 12 格）===');
  console.log('位置        面   右     左     下     上     右下   右上   左下   左上');
  for (const c of r.cells.slice(0, 12)) {
    const d = c.dirs;
    console.log(c.pos.padEnd(10) + ' ' + c.face + '  ' +
      [d['右'],d['左'],d['下'],d['上'],d['右下'],d['右上'],d['左下'],d['左上']]
        .map(v => String(v).padEnd(5)).join(' '));
  }
  await b.close();
})();
