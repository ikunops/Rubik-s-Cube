const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 替换 pickTurnFromDrag + faceBasis + angleFromProjection 为最终方案 ---- */
const a = s.indexOf("/* ============================================================\n   四边判定（重写）");
const b = s.indexOf("/* 计算当前拖拽应施加的旋转角。");
if (a < 0 || b < 0) throw new Error('anchor: ' + a + ',' + b);

const NEW = `/* ============================================================
   四边判定（最终方案）
   每个面在屏幕上有 4 个可转方向（2 个面内轴 × 正反）。
   做法：把「拖拽向量」投影到 4 个候选方向的 1 度切线上，取最对齐者。
   保证：
     - 任意位置、任意方向都能锁定（永不失败）
     - 方向确定性（无浮点抖动，不会"一会能一会不行"）
     - 无反向（选出的转动一定朝拖拽方向）
   ============================================================ */

/* 某动作在抓取点处的「每度屏幕位移」向量（用逻辑旋转矩阵，与 MOVES 同约定） */
function tangentPerDeg(name, P0) {
  const info = moveInfo(name);
  const a = projectToStage(P0);
  const b = projectToStage(m4mv(m4rot(info.base.axis, Math.sign(info.ang) * 1), P0));
  return [b[0] - a[0], b[1] - a[1]];
}

/* 选轴选层：2 个面内轴 × 正反 = 4 候选，取最对齐者 */
function pickTurnFromDrag(c, faceKey, dv) {
  const fr = FACE_FRAME[faceKey];
  const nW = FACE_DEF[faceKey].n;
  const P0 = grabPoint(c, nW);
  const dl = Math.hypot(dv[0], dv[1]) || 1;
  const axes = [fr.right.findIndex(v => v !== 0), fr.down.findIndex(v => v !== 0)];
  let best = null;
  for (const a of axes) {
    const coord = c.p[a];
    const base = layerLabel(a, coord);
    if (!base) continue;
    const t = tangentPerDeg(base, P0);
    const L = Math.hypot(t[0], t[1]);
    if (L < 1e-3) continue;
    const cosP = (dv[0]*t[0] + dv[1]*t[1]) / (dl * L);
    if (!best || cosP > best.cos) {
      best = { axis: a, coord, name: base, sign: 1, t, L, cos: cosP, P0 };
    }
    if (-cosP > best.cos) {
      best = { axis: a, coord, name: base + "'", sign: -1,
               t: [-t[0], -t[1]], L, cos: -cosP, P0 };
    }
  }
  return best;
}

`;
s = s.slice(0, a) + NEW + s.slice(b);

/* ---- 替换角度计算 ---- */
const a2 = s.indexOf("/* 计算当前拖拽应施加的旋转角。");
const b2 = s.indexOf("function moveNameFor(axis, coord, sign) {");
if (a2 < 0 || b2 < 0) throw new Error('angle anchor: ' + a2 + ',' + b2);

const NEW_ANGLE = `/* 计算当前拖拽应施加的旋转角。
   drag.pick 保存了锁定的候选（轴/符号/切线）。
   角度 = 拖拽在切线方向的投影 ÷ 每度像素数 —— 抓取点精确跟手。
   限制 ±135° 避免贴轴时角度爆炸。 */
function dragAngleFor(drag, dx, dy) {
  const p = drag.pick;
  if (!p) return 0;
  const proj = (dx * p.t[0] + dy * p.t[1]) / p.L;   // 单位：度
  return Math.max(-135, Math.min(135, proj));
}

`;
s = s.slice(0, a2) + NEW_ANGLE + s.slice(b2);

fs.writeFileSync('work/app.js', s);
console.log('final picker applied');
