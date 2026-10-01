const fs = require('fs');
let s = fs.readFileSync('work/test-v4.js','utf8');

/* 用新的 pickTurnFromDrag + 抓取点弧长判据重写 D 段 */
const a = s.indexOf("  /* 正确判据：抓取点应当跟住「鼠标位移在该轴切向上的投影」。");
const b = s.indexOf("  console.log('\\n=== E. 拖拽层高亮 ===');");
if (a < 0 || b < 0) throw new Error('anchor not found');

const NEW = `  /* 判据：抓取点沿弧移动的距离 = 鼠标拖拽距离（严格跟手），
     且任意位置/方向都能找到对应层。 */
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
        for (const [label, vx, vy] of DIRS) {
          const t = pickTurnFromDrag(c, fk, [vx, vy]);
          const name = moveNameFor(t.axis, t.coord, 1);
          const D = 60;
          const ang = solveDragAngle(t.axis, P0, [vx*D, vy*D]);
          const p1 = projectToStage(m4mv(m4rot(AXIS_VEC[t.axis], ang), P0));
          const moved = Math.hypot(p1[0]-s0[0], p1[1]-s0[1]);
          out.push({ pos: c.p.join(','), face: fk, drag: label, layer: name,
                     ang: +ang.toFixed(1), err: +Math.abs(moved - D).toFixed(2) });
        }
      }
    }
    return out;
  });
  const noLayer = follow.filter(r => !r.layer);
  const errBad  = follow.filter(r => r.err > 1.5);
  console.log('    样本 = ' + follow.length + '  无对应层 = ' + noLayer.length +
              '  跟手误差>1.5px = ' + errBad.length);
  console.log('    跟手误差(弧长): 平均 ' +
    (follow.reduce((a,c)=>a+c.err,0)/follow.length).toFixed(2) + 'px  最大 ' +
    Math.max(...follow.map(r=>r.err)).toFixed(2) + 'px');
  ok(follow.length > 100, 'enough samples (' + follow.length + ')');
  ok(noLayer.length === 0, 'every position/direction has a layer');
  ok(errBad.length === 0, 'grab point follows cursor exactly');
  if (errBad.length) for (const r of errBad.slice(0,8))
    console.log('      ' + r.pos + ' ' + r.drag + ' ang=' + r.ang + ' err=' + r.err + 'px');

`;
s = s.slice(0, a) + NEW + s.slice(b);
fs.writeFileSync('work/test-v4.js', s);
console.log('test-v4 rewritten');
