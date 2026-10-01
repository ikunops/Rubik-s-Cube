from PIL import Image
im = Image.open('work/shots/v5-05-drag.png')
W,H = im.size
crop = im.crop((int(W*0.20), int(H*0.03), int(W*0.48), int(H*0.42)))
crop = crop.resize((crop.width*2, crop.height*2), Image.LANCZOS)
crop.save('work/shots/crop-hi.png')
print('saved', crop.size)
