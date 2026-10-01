import sys; sys.path.insert(0,'work')
import cubelib as C
C_inset=None
import importlib
# tweak inset via build_quads default change
p='work/cubelib.py'
s=open(p,encoding='utf-8').read()
s=s.replace("def build_quads(explode, half=0.5, inset=0.045, r_body=0.085, r_stick=0.075):",
            "def build_quads(explode, half=0.5, inset=0.032, r_body=0.075, r_stick=0.055):")
open(p,'w',encoding='utf-8').write(s)
importlib.reload(C)
for tag,(o,al) in {'a':(0.6,80),'b':(0.9,95)}.items():
    img,f,cd,off = C.render((0.46,0.46,0.46), (22,-34), 900, 900, ss=3,
                            outline=o, outline_alpha=al, glow=0.10)
    img.save(f'work/q_{tag}.png')
print('ok')
