const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 平面块：去掉大模糊外阴影（3D 旋转时反复重算） */
s = s.replace("    pl.style.boxShadow = '0 10px 34px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.07)';",
              "    pl.style.boxShadow = '0 0 0 1px rgba(255,255,255,.08)';");

/* 54 个格子的内阴影 -> 单层细边框（便宜得多） */
s = s.replace("      cell.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,.3),inset 0 -1px 4px rgba(0,0,0,.25)';",
              "      cell.style.boxShadow = '0 0 0 1px rgba(0,0,0,.18)';");

fs.writeFileSync('work/app.js', s);
console.log('plate raster cost reduced');
