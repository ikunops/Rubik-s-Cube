const fs = require('fs');
let s = fs.readFileSync('work/drag-stress.js','utf8');
s = s.replace("return { locked: true, hitCount: drag.hit.length,\n                 angle: +drag.angle.toFixed(1), name: drag.name,\n                 axis: drag.axis, coord: drag.coord };",
              "return { locked: true, hitCount: drag.hit.length,\n                 angle: +drag.angle.toFixed(1),\n                 name: moveNameFor(drag.axis, drag.coord, 1) || '?',\n                 hint: document.getElementById('roHint').textContent,\n                 axis: drag.axis, coord: drag.coord };");
s = s.replace("note = '锁定 ' + midState.name + ' 轴' + midState.axis + '/层' + midState.coord +\n               ' 层内' + midState.hitCount + '块 角度' + midState.angle + '° -> 步数' + n + ' [' + h + ']';",
              "note = '锁定 ' + midState.name + ' 轴' + midState.axis + '/层' + midState.coord +\n               ' 层内' + midState.hitCount + '块 角度' + midState.angle + '° 提示\"' + midState.hint +\n               '\" -> 步数' + n + ' [' + h + ']';");
fs.writeFileSync('work/drag-stress.js', s);
console.log('drag-stress updated');
