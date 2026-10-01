import sys; sys.path.insert(0,'work')
import numpy as np
from PIL import Image
import cubelib as C

OUT = 'outputs'
EX = (0.46, 0.46, 0.46)
ROT = (22, -34)
S = 2048

# ---- 1. main hero, dark studio background ----
img, f, cd, off = C.render(EX, ROT, S, S, ss=3, fit=0.90,
                           outline=1.2, outline_alpha=95, glow=0.11,
                           shadow=0.62, shadow_blur=52, shadow_off=(18, 42),
                           grain=1.6, vignette=0.30, bg_inner=(44, 50, 66),
                           bg_outer=(7, 8, 12))
img.save(f'{OUT}/exploded-cube-hero.png')
print('hero done')

# ---- 2. transparent background PNG ----
rgba = C.render_alpha(EX, ROT, S, S, ss=3, fit=0.92)
rgba.save(f'{OUT}/exploded-cube-transparent.png')
print('transparent done', rgba.mode)
