import sys; sys.path.insert(0,'work')
import numpy as np, cubelib as C
for rot in [(22,-34),(24,-36),(20,-30)]:
    R = C.rot_matrix(*rot)
    names={'U':(0,1,0),'F':(0,0,1),'R':(1,0,0),'D':(0,-1,0),'B':(0,0,-1),'L':(-1,0,0)}
    vis=[k for k,v in names.items() if (R@np.array(v,float))[2]>0.02]
    print(rot, vis)
