const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* onMove：锁定时保存 basis 与 pick；跟手用 dragAngleFor */
s = s.replace(`      const t = pickTurnFromDrag(drag.c, drag.faceKey, [dx, dy]);
      drag.locked = true;
      drag.axis = t.axis; drag.coord = t.coord;
      drag.P0 = grabPoint(drag.c, drag.nWorld);
      const hit = layerCubies(t.axis, t.coord);`,
`      const t = pickTurnFromDrag(drag.c, drag.faceKey, [dx, dy]);
      drag.locked = true;
      drag.axis = t.axis; drag.coord = t.coord;
      drag.basis = faceBasis(drag.faceKey);
      drag.pick = t;
      const hit = layerCubies(t.axis, t.coord);`);

s = s.replace(`    const a0 = spin ? spin.angle : 0;
    const a1 = solveDragAngle(drag.axis, drag.P0, [dx, dy], drag.faceKey);`,
`    const a0 = spin ? spin.angle : 0;
    const a1 = dragAngleFor(drag, dx, dy);`);

/* 锁定层时也高亮提示层名 */
s = s.replace(`      roHintEl.textContent = layerLabel(t.axis, t.coord) + ' 层';`,
              `      roHintEl.textContent = layerLabel(t.axis, t.coord) + ' 层';`);

fs.writeFileSync('work/app.js', s);
console.log('interaction updated');
