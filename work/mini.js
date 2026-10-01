const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* ---- 补充缺失的状态与缓存引用 ---- */
s = s.replace("let stateVer = -1;                // 状态版本（颜色缓存用）",
`let unfoldAnim = null;            // 展开动画时间轴
let stateVer = 0;                 // 状态版本（颜色缓存用）`);
s = s.replace("let paintedVer = -1;              // 已绘制的版本",
`let paintedVer = -1;              // 已绘制的版本
let viewIsNet = null;             // 侧栏当前显示哪个视图

/* 常用 DOM 引用（避免每帧查询） */
const roUnfoldEl = document.getElementById('roUnfold');
const stUnfoldEl = document.getElementById('stUnfold');
const viewTitleEl = document.getElementById('viewTitle');
const paneMiniEl = document.getElementById('paneMini');
const paneNetEl  = document.getElementById('paneNet');
const miniCv     = document.getElementById('miniCube');`);

/* ---- 迷你 3D 立方体：2D canvas 等轴测绘制（极快） ---- */
s = s.replace("/* ============================================================\n   5. 转动",
`/* ============================================================
   4b. 侧栏迷你 3D 立方体（等轴测，2D canvas）
   ============================================================ */
const MINI_ROT = m4mul(m4rot([1, 0, 0], -35.264), m4rot([0, 1, 0], -45));
const MINI_VISIBLE = ['U', 'F', 'R'];   // 等轴视角下可见的三个面

function drawMini() {
  if (!miniCv) return;
  const w = miniCv.clientWidth || 300, h = miniCv.clientHeight || 225;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (miniCv.width !== Math.round(w * dpr) || miniCv.height !== Math.round(h * dpr)) {
    miniCv.width = Math.round(w * dpr);
    miniCv.height = Math.round(h * dpr);
  }
  const ctx = miniCv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  /* 等轴测正交投影 */
  const proj = v => { const p = m4mv(MINI_ROT, v); return [p[0], p[1]]; };

  /* 自适应缩放：先量出整个立方体的投影包围盒 */
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const sx of [-1.5, 1.5]) for (const sy of [-1.5, 1.5]) for (const sz of [-1.5, 1.5]) {
    const p = proj([sx, sy, sz]);
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
  }
  const pad = 16;
  const k = Math.min((w - pad * 2) / (x1 - x0), (h - pad * 2) / (y1 - y0));
  const cx = w / 2 - ((x0 + x1) / 2) * k;
  const cy = h / 2 - ((y0 + y1) / 2) * k;
  const toScreen = v => { const p = proj(v); return [cx + p[0] * k, cy + p[1] * k]; };

  /* 绘制一个 3x3 面 */
  const drawFace = (f, colors, gap) => {
    const fr = FACE_FRAME[f], c = sheetCenter(f);
    /* 面底板 */
    ctx.beginPath();
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dr, dc]) => {
      const o = [0, 1, 2].map(i => dc * fr.right[i] * 1.5 + dr * fr.down[i] * 1.5);
      const p = toScreen([c[0] + o[0], c[1] + o[1], c[2] + o[2]]);
      return p;
    });
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#15151d';
    ctx.fill();

    /* 9 个贴纸 */
    for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 3; c2++) {
      const o = [0, 1, 2].map(i =>
        (c2 - 1) * fr.right[i] + (r - 1) * fr.down[i]);
      const ctr = [c[0] + o[0], c[1] + o[1], c[2] + o[2]];
      const e = 0.5 - gap;
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dr, dc]) => {
        const oo = [0, 1, 2].map(i => dc * fr.right[i] * e + dr * fr.down[i] * e);
        return toScreen([ctr[0] + oo[0], ctr[1] + oo[1], ctr[2] + oo[2]]);
      });
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = colors[r][c2] || '#1c1c24';
      ctx.fill();
    }
  };

  /* 远的先画：按面中心在投影后的深度排序 */
  const order = MINI_VISIBLE.slice().sort((a, b) => {
    const ca = m4mv(MINI_ROT, sheetCenter(a)), cb = m4mv(MINI_ROT, sheetCenter(b));
    return ca[2] - cb[2];
  });
  for (const f of order) drawFace(f, readFaceColors(cubies, f), 0.055);
}

/* ============================================================
   5. 转动`);

fs.writeFileSync('work/app.js', s);
console.log('mini cube added');
