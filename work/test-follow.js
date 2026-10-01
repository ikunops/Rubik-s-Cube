const path = require('path');
const PW = 'C:/Users/31807/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const FILE = 'file:///' + path.resolve('outputs/electronic-cube.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await p.goto(FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  /* 核心测试：抓取点是否沿鼠标方向移动（瞬时导数） */
  const res = await p.evaluate(() => {
    const out = [];
    const DIRS = [
      ['右',  1,  0], ['左', -1,  0], ['下', 0,  1], ['上', 0, -1],
      ['右下', 0.71, 0.71], ['右上', 0.71, -0.71], ['左下', -0.71, 0.71], ['左上', -0.71, -0.71],
    ];
    /* 遍历所有可见的贴纸 */
    for (const c of cubies) {
      const nWorld = nearestFaceNormal(c);
      if (!nWorld) continue;
      const nAxis = nWorld.findIndex(v => v !== 0);
      /* 只测可见面（朝向相机） */
      if (m4dir(frameCam, nWorld)[2] < 0.3) continue;

      for (const [label, dvx, dvy] of DIRS) {
        const t = pickTurn(c, nWorld, [dvx, dvy]);
        if (!t) continue;
        const name = turnName(t);
        /* 复现 onMove 的角度计算 */
        const P0 = [
          (c.p[0] + nWorld[0] * 0.5) * PX,
          (c.p[1] + nWorld[1] * 0.5) * PX,
          (c.p[2] + nWorld[2] * 0.5) * PX,
        ];
        const dir = screenDirOfAxis(t.axis, P0);
        const dl = Math.hypot(dvx, dvy);
        const along = (dvx * dir[0] + dvy * dir[1]) * t.sign;
        const degPerPx = 90 / PX;
        const angle = along * degPerPx;

        /* 抓取点应用该旋转后的屏幕位置 */
        const s0 = projectToStage(P0);
        const P1 = m4mv(m4rot(AXIS_VEC[t.axis], angle), P0);
        const s1 = projectToStage(P1);
        const mvx = s1[0] - s0[0], mvy = s1[1] - s0[1];
        const mag = Math.hypot(mvx, mvy);
        /* 是否跟随：移动方向与拖拽方向同向 */
        const dot = mag > 1e-6 ? (mvx * dvx + mvy * dvy) / (mag * dl) : 0;
        out.push({ pos: c.p.join(','), face: nWorld.join(','), drag: label,
                   move: name, angle: +angle.toFixed(1),
                   follow: +dot.toFixed(3), mag: +mag.toFixed(2) });
      }
    }
    return out;
  });

  const bad = res.filter(r => r.follow < 0.85);
  console.log('总样本 =', res.length, ' 不跟随(cos<0.85) =', bad.length,
              ' 完全反向(cos<0) =', res.filter(r => r.follow < 0).length);
  console.log('\n不跟随的样本（前 20）:');
  console.log('  位置        面        拖拽   动作  角度     跟随cos  位移');
  for (const r of bad.slice(0, 20)) {
    console.log('  ' + r.pos.padEnd(10) + ' ' + r.face.padEnd(8) + ' ' + r.drag.padEnd(5) +
                ' ' + r.move.padEnd(5) + ' ' + String(r.angle).padStart(6) + '  ' +
                String(r.follow).padStart(7) + '  ' + r.mag);
  }
  console.log('\n跟随良好的样本（前 8）:');
  for (const r of res.filter(x => x.follow > 0.9).slice(0, 8)) {
    console.log('  ' + r.pos.padEnd(10) + ' ' + r.face.padEnd(8) + ' ' + r.drag.padEnd(5) +
                ' ' + r.move.padEnd(5) + ' ' + String(r.angle).padStart(6) + '  ' +
                String(r.follow).padStart(7));
  }
  await b.close();
})();
