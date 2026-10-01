import sys; sys.path.insert(0,'work')
import cubelib as C
img,f,cd = C.render((0.0,0.0,0.0), (-22, -34), 700, 700, ss=3)
img.save('work/test_solid.png')
print('f',round(f,1),'cam',round(cd,2))
