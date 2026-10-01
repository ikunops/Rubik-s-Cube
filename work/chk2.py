import sys; sys.path.insert(0,'work')
from PIL import Image
import numpy as np
for n in ['exploded-cube-hero','exploded-cube-transparent','exploded-cube-light']:
    im=Image.open(f'outputs/{n}.png')
    a=np.asarray(im.convert('RGBA'))
    print(n, im.mode, im.size, 'alpha>128 cov', round((a[...,3]>128).mean(),3))
im=Image.open('outputs/exploded-cube-transparent.png')
for bgc,tag in [((245,246,248),'w'),((20,22,28),'d')]:
    b=Image.new('RGB', im.size, bgc); b.paste(im,(0,0),im)
    b.resize((900,900), Image.LANCZOS).save(f'work/tcheck_{tag}.png')
