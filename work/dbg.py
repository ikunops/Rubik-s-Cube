import sys; sys.path.insert(0,'work')
import numpy as np, cubelib as C
from PIL import Image

quads = C.build_quads((0.46,0.46,0.46))
R = C.rot_matrix(22,-34)
allpts = np.concatenate([q['pts'] for q in quads], axis=0)
W=H=400; ss=1
cam_dist = float(np.linalg.norm(allpts,axis=1).max())*3.4
f, off = C.solve_view(allpts, R, cam_dist, W, H, 0.90)
print('cam',cam_dist,'f',f,'off',off)
p2,_ = C.project(allpts, R, cam_dist, f, W, H, off)
print('bbox', p2.min(axis=0).round(1), p2.max(axis=0).round(1))
rgba = C.render_rgba(quads, R, cam_dist, f*ss, W*ss, H*ss, (off[0]*ss, off[1]*ss))
a=np.asarray(rgba.split()[3]); print('alpha max', a.max(), 'cov', (a>128).mean())
