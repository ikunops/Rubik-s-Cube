import sys; sys.path.insert(0,'work')
import cubelib as C
img,f,cd,off = C.render((0.46,0.46,0.46), (22,-34), 900, 900, ss=3,
                        outline=1.1, outline_alpha=95, glow=0.10)
img.save('work/q1.png')
print('ok')
