from PIL import Image, ImageDraw
import os
src = 'work/shots'
picks = [
    ('v7-01-default.png',  '1. 主图立体 / 侧栏平面展开图（两个独立视图）'),
    ('v7-04-both-3d.png',  '2. 侧栏可独立切成 3D（状态一致，互不联动）'),
    ('v7-03-main-net.png', '3. 主图展开 / 侧栏保持展开图'),
    ('v7-06-drag.png',     '4. 拖拽跟手（整层高亮 + 实时旋转）'),
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
