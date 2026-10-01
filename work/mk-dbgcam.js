const fs=require('fs');
const core = ['cube-core.js','cube-model.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_dbgcam.js', core + `
;
/* 检查：正视时 U 面「向右拖」应该绕哪个轴、符号如何 */
const CAM = m4mul(m4rot([1,0,0],0), m4rot([0,1,0],0));  // 正视
function projO(v){ const p = m4mv(CAM, v); return [p[0], p[1]]; }
const AX=[[1,0,0],[0,1,0],[0,0,1]];

console.log('=== 正视（rx=0, ry=0），看 F 面 ===');
console.log('屏幕坐标：x 右为正，y 下为正（与鼠标一致）');
const PX=100;
/* F 面中心点 */
const P0 = [0,0,1.5*PX];
console.log('F 面中心投影 =', projO(P0).map(v=>+v.toFixed(1)));

/* 绕各轴转 +10 度，看点在屏幕上怎么动 */
for (let a=0;a<3;a++){
  const p1 = projO(m4mv(m4rot(AX[a],10), P0));
  const s0 = projO(P0);
  console.log('  绕轴'+a+' 转+10度 -> 屏幕位移 = [' +
    (p1[0]-s0[0]).toFixed(1) + ', ' + (p1[1]-s0[1]).toFixed(1) + ']');
}
console.log('');
console.log('期望：向右拖(+x) 应该让点向右动(+x)');
console.log('期望：向下拖(+y) 应该让点向下动(+y)');

console.log('');
console.log('=== 用 U 面（顶面）验证 ===');
const CAM2 = m4mul(m4rot([1,0,0],-35.264), m4rot([0,1,0],-45));
function proj2(v){ const p = m4mv(CAM2, v); return [p[0], p[1]]; }
const U0 = [0,-1.5*PX,0];
console.log('U 面中心投影 =', proj2(U0).map(v=>+v.toFixed(1)));
for (let a=0;a<3;a++){
  const s0=proj2(U0), p1=proj2(m4mv(m4rot(AX[a],10),U0));
  console.log('  绕轴'+a+' +10度 -> [' + (p1[0]-s0[0]).toFixed(1)+', '+(p1[1]-s0[1]).toFixed(1)+']');
}
console.log('');
console.log('面坐标系: U 面 right=', JSON.stringify(FACE_FRAME.U.right),
            ' down=', JSON.stringify(FACE_FRAME.U.down));
console.log('U 面 right 是轴', FACE_FRAME.U.right.findIndex(v=>v!==0),
            ', down 是轴', FACE_FRAME.U.down.findIndex(v=>v!==0));
`);
