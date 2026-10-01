import sys; sys.path.insert(0,'work')
import cubelib as C
img,f,cd,off = C.render((0.46,0.46,0.46), (22,-34), 1600, 1600, ss=3,
                        outline=0.9, outline_alpha=95, glow=0.11,
                        shadow=0.62, shadow_blur=42, shadow_off=(14, 34))
img.save('work/hi2.png')
print('ok')
