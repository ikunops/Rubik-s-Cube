import sys; sys.path.insert(0,'work')
import numpy as np
from PIL import Image
import cubelib as C

OUT='outputs'
S=2048
EX=(0.46,0.46,0.46)
ROT=(22,-34)

# 1) hero, dark studio
img,_,_,_ = C.render(EX, ROT, S, S, ss=3, fit=0.90,
                     outline=1.2, outline_alpha=95, glow=0.11,
                     shadow=0.62, shadow_blur=52, shadow_off=(18,42),
                     grain=1.6, vignette=0.30,
                     bg_inner=(44,50,66), bg_outer=(7,8,12))
img.save(f'{OUT}/exploded-cube-hero.png')

# 2) transparent PNG
rgba = C.render_alpha(EX, ROT, S, S, ss=3, fit=0.92)
rgba.save(f'{OUT}/exploded-cube-transparent.png')

# 3) light background version
img3,_,_,_ = C.render(EX, ROT, S, S, ss=3, fit=0.90,
                      outline=1.2, outline_alpha=70, glow=0.0,
                      shadow=0.30, shadow_blur=48, shadow_off=(16,40),
                      grain=1.4, vignette=0.12,
                      bg_inner=(255,255,255), bg_outer=(226,230,238))
img3.save(f'{OUT}/exploded-cube-light.png')
print('done')
