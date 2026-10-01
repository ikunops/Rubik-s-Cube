from PIL import Image
im = Image.open('work/shots/v3-01-folded.png')
W, H = im.size
# 侧栏整张卡片（CSS 约 x:1075..1490, y:60..400；dpr=2）
crop = im.crop((2150, 110, 2990, 800))
crop = crop.resize((int(crop.width*1.6), int(crop.height*1.6)), Image.LANCZOS)
crop.save('work/shots/crop-mini2.png')
print('cropped', crop.size)
