import sys; sys.path.insert(0,'work')
import cubelib as C
for tag, ex in [('solid',(0.0,0.0,0.0)), ('mid',(0.10,0.10,0.10)), ('open',(0.26,0.26,0.26))]:
    img,f,cd,off = C.render(ex, (-22,-34), 760, 760, ss=3)
    img.save(f'work/test_{tag}.png')
    print(tag,'ok')
