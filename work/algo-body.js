/* ===== 加入第三个轴（面法向 = 面原地旋转）===== */
const PX = 129.5;
const CAM = m4mul(m4rot([1,0,0],-35.264), m4rot([0,1,0],-45));
function projP(v){ const p = m4mv(CAM, v); return [p[0], p[1]]; }
function grabP(c, nW){ return [(c.p[0]+nW[0]*0.5)*PX,(c.p[1]+nW[1]*0.5)*PX,(c.p[2]+nW[2]*0.5)*PX]; }
function layerLabel(axis, coord){
  for(const k of MOVE_KEYS){const b=MOVES[k];
    if(b.layerAxis===axis&&b.layerVal===coord) return k;}
  return null;
}
function tangentOf(name, P0){
  const info = moveInfo(name);
  const a = projP(P0);
  const b = projP(m4mv(m4rot(info.base.axis, Math.sign(info.ang) * 1), P0));
  return [b[0]-a[0], b[1]-a[1]];
}
/* 全部 3 个轴 × 正反 = 6 候选 */
function pickTurn(c, faceKey, dv, useAll3){
  const fr = FACE_FRAME[faceKey];
  const nW = FACE_DEF[faceKey].n;
  const P0 = grabP(c, nW);
  const dl = Math.hypot(dv[0], dv[1]) || 1;
  const nAxis = nW.findIndex(v=>v!==0);
  const axes = useAll3
    ? [0,1,2]
    : [fr.right.findIndex(v=>v!==0), fr.down.findIndex(v=>v!==0)];
  let best = null;
  for (const a of axes) {
    const coord = c.p[a];
    const base = layerLabel(a, coord);
    if (!base) continue;
    const t = tangentOf(base, P0);
    const L = Math.hypot(t[0], t[1]);
    if (L < 0.05) continue;
    const cosP = (dv[0]*t[0] + dv[1]*t[1]) / (dl * L);
    if (!best || cosP > best.cos) best = { axis:a, coord, name:base, cos:cosP };
    if (-cosP > best.cos) best = { axis:a, coord, name:base+"'", cos:-cosP };
  }
  return best;
}

const DIRS=[['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
            ['右下',1,1],['右上',1,-1],['左下',-1,1],['左上',-1,-1]];
function evaluate(useAll3, label){
  const cubies = makeSolved();
  const all=[]; const rows=[];
  for(const c of cubies){
    for(const fk of FACE_KEYS){
      if(!c.faces[fk]) continue;
      const nW=faceNormal(c,fk);
      if(m4dir(CAM,nW)[2]<0.35) continue;
      for(const [d,vx,vy] of DIRS){
        const t=pickTurn(c,fk,[vx,vy],useAll3);
        if(!t){ rows.push({pos:c.p.join(','),face:fk,dir:d,name:'NULL',cos:-9}); all.push(-9); continue; }
        rows.push({pos:c.p.join(','),face:fk,dir:d,name:t.name,cos:+t.cos.toFixed(3)});
        all.push(t.cos);
      }
    }
  }
  const avg=all.reduce((a,b)=>a+b,0)/all.length;
  console.log(label.padEnd(26)+'平均='+avg.toFixed(3)+
    '  最小='+String(Math.min(...all)).padStart(6)+
    '  <0.5='+String(all.filter(x=>x<0.5).length).padStart(3)+
    '  <0='+String(all.filter(x=>x<0).length).padStart(3)+
    '  失败='+all.filter(x=>x===-9).length);
  return {all, rows};
}
console.log('=== 2 轴 vs 3 轴 ===');
evaluate(false, '仅面内 2 轴');
const r3 = evaluate(true, '全部 3 轴（含法向）');
console.log('');
console.log('=== 3 轴方案的 F 面明细 ===');
console.log('位置        方向  层    对齐cos');
for(const r of r3.rows.filter(x=>x.face==='F')){
  console.log(r.pos.padEnd(10)+' '+r.dir.padEnd(4)+' '+String(r.name).padEnd(5)+
    String(r.cos).padStart(7)+(r.cos<0.5?'  <<<':''));
}
