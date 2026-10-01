import sys; sys.path.insert(0,'work')
import numpy as np, cubelib as C
quads = C.build_quads((0.0,0.0,0.0))
R = C.rot_matrix(-22,-34)
cam = np.array([0.0,0.0,20.0])
seen={}
for q in quads:
    cv = q['pts'].mean(axis=0) @ R.T
    nv = R @ q['n']
    if np.dot(nv, cam-cv) > 0:
        seen[q['color']] = seen.get(q['color'],0)+1
for k,v in seen.items(): print(k, v)
print('---')
# which normal groups visible
names={'R':(1,0,0),'L':(-1,0,0),'U':(0,1,0),'D':(0,-1,0),'F':(0,0,1),'B':(0,0,-1)}
for k,v in names.items():
    nv = R @ np.array(v,float)
    print(k, np.round(nv,3), 'visible' if nv[2]>0 else 'hidden')
