from PIL import Image, ImageDraw
import os
src = 'work/shots'
picks = [
    ('v8-01-default.png',  '1. 默认：主图立体 / 侧栏平面展开图（独立视图）'),
    ('v8-03-drag.png',     '2. 拖拽跟手：整层高亮，精确跟随鼠标方向'),
    ('v8-02-scrambled.png','3. 打乱：两边状态一致，视图互不联动'),
    ('v8-04-unfolded.png', '4. 主图展开成十字平面图'),
]
tiles = []
for fn, cap in picks:
    p = os.path.join(src, fn)
    if not os.path.exists(p): continue
    im = Image.open(p).convert('RGB')
    im = im.resize((980, int(im.height*980/im.width)), Image.LANCZOS)
    tiles.append((im, cap))
if tiles:
    pad, capH = 18, 40
    W = tiles[0][0].width*2 + pad*3
    H = (tiles[0][0].height + capH)*2 + pad*3
    cv = Image.new('RGB', (W, H), (8,9,13))
    d = ImageDraw.Draw(cv)
    for i,(im,cap) in enumerate(tiles):
        r, c = divmod(i, 2)
        x = pad + c*(im.width+pad); y = pad + r*(im.height+capH+pad)
        cv.paste(im, (x,y))
        d.text((x+6, y+im.height+12), cap, fill=(190,200,220))
    cv.save('outputs/electronic-cube-preview.png')
    print('preview saved', cv.size)
