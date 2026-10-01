from PIL import Image
im = Image.open('work/shots/v3-01-folded.png')
W, H = im.size
print('size', W, H)
crop = im.crop((int(W*0.70), int(H*0.10), int(W*0.99), int(H*0.32)))
crop = crop.resize((crop.width*3, crop.height*3), Image.LANCZOS)
crop.save('work/shots/crop-mini.png')
print('cropped', crop.size)
