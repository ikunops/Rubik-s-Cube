from PIL import Image
im = Image.open('work/shots/v3-01-folded.png')
crop = im.crop((2150, 110, 2990, 800))
crop = crop.resize((int(crop.width*1.5), int(crop.height*1.5)), Image.LANCZOS)
crop.save('work/shots/sidebar-check-v2.png')
print('saved', crop.size)
