from PIL import Image, ImageDraw
import os
src = 'work/shots'
picks = [
    ('v3-01-folded.png',        '1. 折叠态 · 侧栏=3D 立体图'),
    ('v3-05-drag-live.png',     '2. 拖拽实时跟手（整层 9 块联动）'),
    ('v3-02-scrambled.png',     '3. 打乱 · 双视图同步'),
    ('v3-03-unfolded.png',      '4. 展开态 · 侧栏=平面展开图'),
]
tiles = []
for fn, cap in picks:
    p = os.path.join(src, fn)
    if not os.path.exists(p): print('missing', fn); continue
    im = Image.open(p).convert('RGB')
    im = im.resize((980, int(im.height*980/im.width)), Image.LANCZOS)
    tiles.append((im, cap))
if tiles:
    pad, capH = 18, 40
    W = tiles[0][0].width*2 + pad*3
    H = (tiles[0][0].height + capH)*2 + pad*3
    canvas = Image.new('RGB', (W, H), (8,9,13))
    d = ImageDraw.Draw(canvas)
    for i,(im,cap) in enumerate(tiles):
        r, c = divmod(i, 2)
        x = pad + c*(im.width+pad); y = pad + r*(im.height+capH+pad)
        canvas.paste(im, (x,y))
        d.text((x+6, y+im.height+12), cap, fill=(190,200,220))
    canvas.save('outputs/electronic-cube-preview.png')
    print('preview saved', canvas.size)
