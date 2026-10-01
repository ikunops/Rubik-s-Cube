const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1600);

  /* 在魔方所在区域打网格，统计每个点的命中元素与 canTurn 判定 */
  const r = await p.evaluate(() => {
    const out = { total: 0, onCube: 0, canTurn: 0, byHit: {}, badSamples: [] };
    const stage = document.getElementById('stage').getBoundingClientRect();
    for (let y = 80; y < 820; y += 14) {
      for (let x = 60; x < 1000; x += 14) {
        const el = document.elementFromPoint(x, y);
        if (!el) continue;
        out.total++;
        const cubie = el.closest ? el.closest('.cubie') : null;
        if (!cubie) continue;                 // 不在魔方上
        out.onCube++;
        const body = el.closest ? el.closest('.body-face') : null;
        const cls = el.className || el.tagName;
        out.byHit[cls] = (out.byHit[cls] || 0) + 1;
        const canTurn = !!(body && body.__face);
        if (canTurn) out.canTurn++;
        else if (out.badSamples.length < 6) {
          out.badSamples.push({ x, y, cls, hasBody: !!body,
            cubieP: cubie.__cubie ? cubie.__cubie.p.join(',') : '?' });
        }
      }
    }
    return out;
  });

  console.log('采样点总数 =', r.total);
  console.log('落在魔方上的点 =', r.onCube);
  console.log('可转动(canTurn) =', r.canTurn, '  不可转动 =', r.onCube - r.canTurn);
  console.log('失败率 =', (((r.onCube - r.canTurn) / r.onCube) * 100).toFixed(1) + '%');
  console.log('\n命中的元素类型分布:');
  for (const k in r.byHit) console.log('  ' + k.padEnd(20) + r.byHit[k]);
  console.log('\n失败样例:');
  for (const s of r.badSamples) console.log('  ' + JSON.stringify(s));
  await b.close();
})();
