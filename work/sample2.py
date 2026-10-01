import numpy as np
from PIL import Image
im = Image.open('work/shots/angle-iso.png').convert('RGB')
a = np.asarray(im).astype(int)
H, W = a.shape[:2]
print('size', W, H)

# 已知贴纸颜色
PAL = {
 'white':(247,247,245),'yellow':(255,213,0),'red':(200,16,46),
 'orange':(255,106,0),'blue':(0,87,184),'green':(0,160,90),
 'bg':(8,9,13),'body':(20,20,27),
}
# 找出魔方的包围盒（非背景像素）
bg = np.array([8,9,13])
diff = np.abs(a - bg).sum(axis=2)
mask = diff > 40
ys, xs = np.where(mask)
print('cube bbox x', xs.min(), xs.max(), ' y', ys.min(), ys.max())
print('center', (xs.min()+xs.max())//2, (ys.min()+ys.max())//2)

# 在包围盒内密集采样，统计最近调色板
x0,x1,y0,y1 = xs.min(), xs.max(), ys.min(), ys.max()
counts = {}
for y in range(y0, y1+1, 3):
    for x in range(x0, x1+1, 3):
        if not mask[y,x]: continue
        c = a[y,x]
        best, bd = None, 1e9
        for name, p in PAL.items():
            d = sum((int(c[i])-p[i])**2 for i in range(3))
            if d < bd: bd, best = d, name
        if bd > 4000: best = 'other'
        counts[best] = counts.get(best,0)+1
print('\n颜色占比:')
tot = sum(counts.values())
for k,v in sorted(counts.items(), key=lambda t:-t[1]):
    print(f'  {k:8s} {v:6d}  {100*v/tot:5.1f}%')

# 分区采样：把包围盒按 y 三等分，看每区主色
print('\n纵向三段主色:')
for i,(ya,yb) in enumerate([(y0, y0+(y1-y0)//3), (y0+(y1-y0)//3, y0+2*(y1-y0)//3), (y0+2*(y1-y0)//3, y1)]):
    cc = {}
    for y in range(ya, yb+1, 3):
        for x in range(x0, x1+1, 3):
            if not mask[y,x]: continue
            c = a[y,x]
            best, bd = None, 1e9
            for name,p in PAL.items():
                d = sum((int(c[i])-p[i])**2 for i in range(3))
                if d < bd: bd,best = d,name
            if bd > 4000: best='other'
            cc[best] = cc.get(best,0)+1
    top = sorted(cc.items(), key=lambda t:-t[1])[:4]
    print(f'  y[{ya}-{yb}] ', ', '.join(f'{k}:{v}' for k,v in top))
