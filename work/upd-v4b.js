const fs = require('fs');
let s = fs.readFileSync('work/test-v4.js','utf8');

const a = s.indexOf("  const follow = await p.evaluate(() => {");
const b = s.indexOf("  console.log('\\n=== E. 拖拽层高亮 ===');");
if (a < 0 || b < 0) throw new Error('anchor not found');

const NEW = `  /* 正确判据：抓取点应当跟住「鼠标位移在该轴切向上的投影」。
     绕轴旋转在屏幕上走圆弧，垂直于切向的分量物理上不可达。 */
  const follow = await p.evaluate(() => {
    const out = [];
    const DIRS = [['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
                  ['右下',0.71,0.71],['右上',0.71,-0.71],['左下',-0.71,0.71],['左上',-0.71,-0.71]];
    for (const c of cubies) {
      for (const fk of FACE_KEYS) {
        if (!c.faces[fk]) continue;
        const nW = faceNormal(c, fk);
        if (m4dir(frameCam, nW)[2] < 0.35) continue;
        const P0 = grabPoint(c, nW);
        const s0 = projectToStage(P0);
        const t1 = screenDeltaPerDeg(0, P0); // 占位，实际按选中的轴取
        for (const [label, vx, vy] of DIRS) {
          const t = pickAxis(c, nW, [vx, vy]);
          if (!t) continue;
          const dvx = vx * 60, dvy = vy * 60;
          const ang = solveDragAngle(t.axis, P0, [dvx, dvy]);
          if (Math.abs(ang) < 0.01) continue;
          /* 该轴切向 */
          const tt = screenDeltaPerDeg(t.axis, P0);
          const tl = Math.hypot(tt[0], tt[1]);
          if (tl < 1e-6) continue;
          const tx = tt[0]/tl, ty = tt[1]/tl;
          /* 目标点 = 起点 + 拖拽在切向上的投影 */
          const along = dvx*tx + dvy*ty;
          const gx = s0[0] + tx*along, gy = s0[1] + ty*along;
          /* 实际落点 */
          const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
          const err = Math.hypot(p1[0]-gx, p1[1]-gy);
          /* 该轴是否确实是主导轴（投影应最大） */
          let maxAbs = 0;
          const nAxis = nW.findIndex(v => v !== 0);
          for (let a2 = 0; a2 < 3; a2++) {
            if (a2 === nAxis || c.p[a2] === 0) continue;
            const d2 = screenDeltaPerDeg(a2, P0);
            const l2 = Math.hypot(d2[0], d2[1]);
            if (l2 < 1e-3) continue;
            maxAbs = Math.max(maxAbs, Math.abs((dvx*d2[0] + dvy*d2[1]) / l2));
          }
          const isMain = Math.abs(t.proj) >= maxAbs - 1e-6;
          out.push({ pos: c.p.join(','), face: nW.join(','), drag: label,
                     ang: +ang.toFixed(1), err: +err.toFixed(2),
                     along: +Math.abs(along).toFixed(1), isMain });
        }
      }
    }
    return out;
  });
  /* 只看「主导轴」样本，且拖拽有足够可达分量 */
  const meaningful = follow.filter(r => r.isMain && r.along > 8);
  const errBad = meaningful.filter(r => r.err > 1.5);
  console.log('    样本 = ' + follow.length + '  有意义样本(主导轴且可达分量>8px) = ' + meaningful.length);
  console.log('    跟手误差: 平均 ' +
    (meaningful.reduce((a,c)=>a+c.err,0)/Math.max(1,meaningful.length)).toFixed(2) +
    'px  最大 ' + Math.max(...meaningful.map(r=>r.err), 0).toFixed(2) + 'px');
  ok(meaningful.length > 30, 'enough meaningful samples (' + meaningful.length + ')');
  ok(errBad.length === 0, 'grab point follows cursor within 1.5px');
  if (errBad.length) {
    console.log('    误差过大样例:');
    for (const r of errBad.slice(0, 10))
      console.log('      ' + r.pos + ' ' + r.drag + ' ang=' + r.ang + ' err=' + r.err + 'px');
  }
  /* 方向一致性：角度符号应与可达分量同号（正拖正转） */
  const signBad = meaningful.filter(r => Math.sign(r.ang) !== Math.sign(r.along * 1));
  ok(signBad.length === 0, 'turn direction matches drag direction');

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/test-v4.js', s);
console.log('test criterion fixed');
