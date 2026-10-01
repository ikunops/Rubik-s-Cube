from PIL import Image
im = Image.open('work/shots/final-01-solved.png')
W, H = im.size
print('size', W, H)
# 侧栏在右侧，展开图在侧栏顶部
crop = im.crop((int(W*0.715), int(H*0.10), W, int(H*0.36)))
crop = crop.resize((crop.width*2, crop.height*2), Image.LANCZOS)
crop.save('work/shots/crop-net.png')
print('cropped', crop.size)
