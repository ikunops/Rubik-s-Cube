from PIL import Image, ImageDraw
import os

src = 'work/shots'
picks = [
    ('deliver-01-solved.png',  '1. 复原 · 3D 立体'),
    ('deliver-02-scrambled.png','2. 打乱 · 状态同步'),
    ('deliver-03-unfolded.png','3. 展开 · 十字平面图'),
    ('deliver-04-unfolded-turn.png','4. 展开态转动 · 双视图联动'),
]
tiles = []
for fn, cap in picks:
    p = os.path.join(src, fn)
    if not os.path.exists(p):
        print('missing', fn); continue
    im = Image.open(p).convert('RGB')
    im = im.resize((980, int(im.height * 980 / im.width)), Image.LANCZOS)
    tiles.append((im, cap))

if tiles:
    pad, capH = 18, 40
    W = tiles[0][0].width * 2 + pad * 3
    H = (tiles[0][0].height + capH) * 2 + pad * 3
    canvas = Image.new('RGB', (W, H), (8, 9, 13))
    d = ImageDraw.Draw(canvas)
    for i, (im, cap) in enumerate(tiles):
        r, c = divmod(i, 2)
        x = pad + c * (im.width + pad)
        y = pad + r * (im.height + capH + pad)
        canvas.paste(im, (x, y))
        d.text((x + 6, y + im.height + 12), cap, fill=(190, 200, 220))
    canvas.save('outputs/electronic-cube-preview.png')
    print('preview saved', canvas.size)
