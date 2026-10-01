const fs=require('fs');
const core = ['cube-core.js'].map(f=>fs.readFileSync('work/'+f,'utf8')).join('\n;\n');
fs.writeFileSync('work/_algo.js', core + `
;
/* ===== 算法实验台：不依赖浏览器 ===== */
const PX = 129.5;
const RX = -35.264, RY = -45;
function camM(){ return m4mul(m4rot([1,0,0],RX), m4rot([0,1,0],RY)); }
const CAM = camM();
function projO(v){ const p = m4mv(CAM, v); return [p[0], p[1]]; }
const AX = [[1,0,0],[0,1,0],[0,0,1]];
function tangAt(axis, P0){
  const a = projO(P0), b = projO(m4mv(m4rot(AX,axis), P0));
  return [b[0]-a[0], b[1]-a[1]];
}
function grabP(c, nW){ return [(c.p[0]+nW[0]*0.5)*PX,(c.p[1]+nW[1]*0.5)*PX,(c.p[2]+nW[2]*0.5)*PX]; }

/* 候选算法 A：按主方向选轴 + 面中心定符号（当前实现） */
function algA(c, faceKey, dv){
  const fr = FACE_FRAME[faceKey];
  const len = Math.hypot(dv[0],dv[1])||1, ux=dv[0]/len, uy=dv[1]/len;
  const cands=[{vec:fr.down,w:Math.abs(ux)},{vec:fr.right,w:Math.abs(uy)}];
  let pick=cands[0]; if(cands[1].w>cands[0].w+1e-9) pick=cands[1];
  const axis=pick.vec.findIndex(v=>v!==0);
  const nW=FACE_DEF[faceKey].n;
  const P0=grabP(c,nW);
  const R0=[sheetCenter(faceKey)[0]*PX,sheetCenter(faceKey)[1]*PX,sheetCenter(faceKey)[2]*PX];
  const rt=tangAt(axis,R0); const rl=Math.hypot(rt[0],rt[1]);
  const along = rl<1e-6?0: dv[0]*(rt[0]/rl)+dv[1]*(rt[1]/rl);
  return {axis, coord:c.p[axis], sgn: along>=0?1:-1};
}

/* 候选算法 B：在 (轴,符号) 中选「对齐度 × 运动幅度」最大者 */
function algB(c, faceKey, dv){
  const nW = FACE_DEF[faceKey].n;
  const nAxis = nW.findIndex(v=>v!==0);
  const P0 = grabP(c, nW);
  const dl = Math.hypot(dv[0],dv[1])||1;
  let best=null;
  for(let a=0;a<3;a++){
    if(a===nAxis) continue;
    const d1=tangAt(a,P0); const L=Math.hypot(d1[0],d1[1]);
    if(L<1e-6) continue;
    const cos=(dv[0]*d1[0]+dv[1]*d1[1])/(dl*L);
    const score = cos * Math.min(L, 6);     // 对齐度 × 幅度（限幅避免过拟合）
    if(!best || score>best.score) best={axis:a, coord:c.p[a], sgn: cos>=0?1:-1, score, cos, L};
  }
  return best;
}

/* 候选算法 C：主方向选轴，但符号取「使抓取点对齐拖拽」的那个 */
function algC(c, faceKey, dv){
  const fr=FACE_FRAME[faceKey];
  const len=Math.hypot(dv[0],dv[1])||1, ux=dv[0]/len, uy=dv[1]/len;
  const cands=[{vec:fr.down,w:Math.abs(ux)},{vec:fr.right,w:Math.abs(uy)}];
  let pick=cands[0]; if(cands[1].w>cands[0].w+1e-9) pick=cands[1];
  const axis=pick.vec.findIndex(v=>v!==0);
  const nW=FACE_DEF[faceKey].n;
  const P0=grabP(c,nW);
  const d1=tangAt(axis,P0); const L=Math.hypot(d1[0],d1[1]);
  const cos=(dv[0]*d1[0]+dv[1]*d1[1])/(len*(L||1));
  return {axis, coord:c.p[axis], sgn: cos>=0?1:-1};
}

/* 评估：给定算法，算「拖动方向 -> 抓取点实际移动方向」的 cos */
function evalAlg(alg, name){
  const DIRS=[['右',1,0],['左',-1,0],['下',0,1],['上',0,-1],
              ['右下',1,1],['右上',1,-1],['左下',-1,1],['左上',-1,-1]];
  const cubies = makeSolved();
  const rows=[]; const agg={};
  for(const c of cubies){
    for(const fk of FACE_KEYS){
      if(!c.faces[fk]) continue;
      const nW=faceNormal(c,fk);
      if(m4dir(CAM,nW)[2]<0.35) continue;
      const P0=grabP(c,nW);
      for(const [label,vx,vy] of DIRS){
        const t=alg(c,fk,[vx,vy]);
        if(!t){ rows.push({pos:c.p.join(','),face:fk,dir:label,cos:-9}); continue; }
        const D=80;
        const s0=projO(P0);
        /* 用弧长解角度（正交） */
        const t1=tangAt(t.axis,P0); const L1=Math.hypot(t1[0],t1[1]);
        const target=Math.hypot(vx*D,vy*D);
        let ang=0;
        if(L1>1e-6){
          const distAt=th=>{const p=projO(m4mv(m4rot(AX[t.axis],th),P0));return Math.hypot(p[0]-s0[0],p[1]-s0[1]);};
          let lo=0,hi=180,hitM=-1,maxD=0,maxM=0,prevM=0;
          for(let m=1;m<=180;m++){const d=distAt(t.sgn*m);if(d>maxD){maxD=d;maxM=m;}if(d>=target){hitM=m;break;}prevM=m;}
          if(hitM<0) ang=t.sgn*maxM; else {let a2=prevM,b2=hitM;for(let i=0;i<26;i++){const mid=(a2+b2)/2;if(distAt(t.sgn*mid)<target)a2=mid;else b2=mid;}ang=t.sgn*((a2+b2)/2);}
        }
        const p1=projO(m4mv(m4rot(AX[t.axis],ang),P0));
        const mx=p1[0]-s0[0],my=p1[1]-s0[1];
        const mag=Math.hypot(mx,my)||1;
        const cos=(mx*vx+my*vy)/(mag*Math.hypot(vx,vy));
        rows.push({pos:c.p.join(','),face:fk,dir:label,cos:+cos.toFixed(3),ang:+ang.toFixed(1)});
        (agg[label]=agg[label]||[]).push(cos);
      }
    }
  }
  console.log('=== ' + name + ' ===');
  let all=[];
  for(const k in agg){const v=agg[k];all=all.concat(v);
    console.log('  '+k.padEnd(4)+' 平均='+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(3)+
      '  最小='+Math.min(...v).toFixed(2)+'  <0.7='+v.filter(x=>x<0.7).length+'/'+v.length);}
  console.log('  总体: 平均='+(all.reduce((a,b)=>a+b,0)/all.length).toFixed(3)+
    '  <0.7='+all.filter(x=>x<0.7).length+'/'+all.length+
    '  <0='+all.filter(x=>x<0).length);
  return {rows, all};
}

const rA=evalAlg(algA,'A 主方向 + 面中心定符号（当前）');
console.log('');
const rB=evalAlg(algB,'B (轴,符号) 联合最优');
console.log('');
const rC=evalAlg(algC,'C 主方向选轴 + 抓取点定符号');
console.log('');
console.log('=== 各算法最差样本 ===');
for(const [nm,r] of [['A',rA],['B',rB],['C',rC]]){
  const bad=r.rows.filter(x=>x.cos<0.7).slice(0,6);
  console.log(nm+': ' + bad.map(x=>x.pos+'/'+x.face+'/'+x.dir+'='+x.cos).join('  '));
}
`);
