import sys, time; sys.path.insert(0,'work')
import cubelib as C
t=time.time()
img,f,cd,off = C.render((0.46,0.46,0.46), (22,-34), 1600, 1600, ss=3,
                        outline=0.9, outline_alpha=95, glow=0.11)
img.save('work/hi1.png')
print('sec', round(time.time()-t,1))
