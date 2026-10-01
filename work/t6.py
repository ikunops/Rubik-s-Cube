import sys; sys.path.insert(0,'work')
import cubelib as C
for tag, ex in [('v0',(0.0,0.0,0.0)),('v1',(0.30,0.30,0.30)),('v2',(0.48,0.48,0.48)),('v3',(0.70,0.70,0.70))]:
    img,f,cd,off = C.render(ex, (22,-34), 800, 800, ss=3)
    img.save(f'work/look_{tag}.png')
print('ok')
