import numpy as np
from PIL import Image
im = Image.open('work/shots/audit-iso.png').convert('RGB')
a = np.asarray(im).astype(int)
H, W = a.shape[:2]
print('size', W, H)
PAL = {'white':(247,247,245),'yellow':(255,213,0),'red':(200,16,46),
       'orange':(255,106,0),'blue':(0,87,184),'green':(0,160,90),
       'body':(20,20,27),'bg':(8,9,13)}
def cls(c):
    best,bd=None,1e9
    for k,p in PAL.items():
        d=sum((int(c[i])-p[i])**2 for i in range(3))
        if d<bd: bd,best=d,k
    return best if bd<6000 else 'other'
# 垂直扫描线，取魔方水平中心
cx = 700
print(f'\n垂直扫描 x={cx}:')
prev=None
for y in range(80, 820, 6):
    c = cls(a[y,cx])
    if c != prev:
        print(f'  y={y:4d}  {c:7s} rgb={tuple(a[y,cx])}')
        prev = c
# 水平扫描线
cy = 470
print(f'\n水平扫描 y={cy}:')
prev=None
for x in range(300, 1150, 6):
    c = cls(a[cy,x])
    if c != prev:
        print(f'  x={x:4d}  {c:7s} rgb={tuple(a[cy,x])}')
        prev = c
