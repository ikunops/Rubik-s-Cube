import sys; sys.path.insert(0,'work')
import cubelib as C
for tag, ex in [('e40',(0.40,0.40,0.40)), ('e55',(0.55,0.55,0.55))]:
    img,f,cd,off = C.render(ex, (-22,-34), 760, 760, ss=3)
    img.save(f'work/test_{tag}.png')
print('ok')
