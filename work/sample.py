import numpy as np
from PIL import Image
im = Image.open('work/shots/angle-iso.png').convert('RGB')
a = np.asarray(im)
print('size', im.size)
# 顶面区域（上半部中央）、前面、右面
pts = {
 'top-center': (int(0.46*im.size[0]), int(0.30*im.size[1])),
 'top-left':   (int(0.36*im.size[0]), int(0.29*im.size[1])),
 'top-right':  (int(0.58*im.size[0]), int(0.29*im.size[1])),
 'front-mid':  (int(0.46*im.size[0]), int(0.52*im.size[1])),
 'right-mid':  (int(0.66*im.size[0]), int(0.52*im.size[1])),
 'bg':         (int(0.10*im.size[0]), int(0.10*im.size[1])),
}
for k,(x,y) in pts.items():
    print(f'{k:12s} ({x},{y}) = {a[y,x]}')
