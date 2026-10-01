import sys; sys.path.insert(0,'work')
from PIL import Image
import numpy as np
import cubelib as C

OUT='outputs'
EX=(0.46,0.46,0.46)
ROT=(22,-34)

def save(img, name, size=None):
    if size: img = img.resize((size,size), Image.LANCZOS)
    img.save(f'{OUT}/{name}')

# ---- 1. HERO 2048 (dark studio) ----
hero,_,_,_ = C.render(EX, ROT, 2048, 2048, ss=3, fit=0.90,
                      outline=1.2, outline_alpha=95, glow=0.11,
                      shadow=0.62, shadow_blur=52, shadow_off=(18,42),
                      grain=1.6, vignette=0.30,
                      bg_inner=(44,50,66), bg_outer=(7,8,12))
save(hero, 'exploded-cube-hero.png')
save(hero, 'exploded-cube-hero-1024.png', 1024)

# ---- 2. TRANSPARENT PNG 2048 ----
rgba = C.render_alpha(EX, ROT, 2048, 2048, ss=3, fit=0.92)
save(rgba, 'exploded-cube-transparent.png')
save(rgba, 'exploded-cube-transparent-1024.png', 1024)

# ---- 3. LIGHT 2048 ----
light,_,_,_ = C.render(EX, ROT, 2048, 2048, ss=3, fit=0.90,
                       outline=1.2, outline_alpha=55, glow=0.0,
                       shadow=0.26, shadow_blur=44, shadow_off=(15,36),
                       grain=1.2, vignette=0.10,
                       bg_inner=(255,255,255), bg_outer=(224,228,237))
save(light, 'exploded-cube-light.png')
save(light, 'exploded-cube-light-1024.png', 1024)
print('delivered')
