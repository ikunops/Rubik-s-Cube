import sys; sys.path.insert(0,'work')
from PIL import Image
import numpy as np
im = Image.open('outputs/exploded-cube-transparent.png')
a = np.asarray(im.split()[3])
print(im.mode, im.size, 'alpha min/max', a.min(), a.max(), 'coverage', round((a>128).mean(),3))
# flatten onto white for inspection
bg = Image.new('RGB', im.size, (245,246,248))
bg.paste(im, (0,0), im)
bg.resize((1000,1000), Image.LANCZOS).save('work/trans_check.png')
