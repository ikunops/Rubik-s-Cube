const fs = require('fs');
let s = fs.readFileSync('work/algo-body.js','utf8');
/* 用 moveInfo 处理逆时针动作 */
s = s.replace("function moveDelta(name, P0){\n  const R = m3to4(MOVES[name].rot);",
              "function moveDelta(name, P0){\n  const R = m3to4(moveInfo(name).rot);");
s = s.replace("      const cssAng=MOVES[t.name].ang;", "      const cssAng=moveInfo(t.name).ang;");
s = s.replace("      const R=m3to4(MOVES[t.name].rot);", "      const R=m3to4(moveInfo(t.name).rot);");
s = s.replace("      const p1=projP(m4mv(m4rot(MOVES[t.name].axis, ang), P0));",
              "      const p1=projP(m4mv(m4rot(moveInfo(t.name).base.axis, ang), P0));");
fs.writeFileSync('work/algo-body.js', s);
console.log('moveInfo applied');
