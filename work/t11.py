import sys; sys.path.insert(0,'work')
import cubelib as C
S=900
EX=(0.46,0.46,0.46); ROT=(22,-34)
for tag,al,ss in [('l1',40,3),('l2',0,3),('l3',55,4)]:
    img,_,_,_ = C.render(EX, ROT, S, S, ss=ss, fit=0.90,
                         outline=1.2 if al>0 else 0.0, outline_alpha=al, glow=0.0,
                         shadow=0.26, shadow_blur=26, shadow_off=(9,22),
                         grain=1.2, vignette=0.10,
                         bg_inner=(255,255,255), bg_outer=(226,230,238))
    img.save(f'work/lt_{tag}.png')
print('ok')
