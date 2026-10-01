p='work/cubelib.py'
s=open(p,encoding='utf-8').read()
old = s[s.index("def solve_view("):s.index("def shade(")]
new = '''def solve_view(allpts, R, cam_dist, W, H, fit=0.90, margin=(0.0, 0.0)):
    # projection is linear in f, so solve f in closed form from a unit-f pass
    p2, _ = project(allpts, R, cam_dist, 1.0, W, H, (0.0, 0.0))
    size = np.maximum(p2.max(axis=0) - p2.min(axis=0), 1e-9)
    avail = np.array([W * (1.0 - margin[0]), H * (1.0 - margin[1])])
    f = float(min(fit * avail[0] / size[0], fit * avail[1] / size[1]))
    # center the projected bbox exactly
    off = np.array([0.0, 0.0])
    for _ in range(3):
        p2, _ = project(allpts, R, cam_dist, f, W, H, off)
        c = (p2.min(axis=0) + p2.max(axis=0)) * 0.5
        off = off + (np.array([W * 0.5, H * 0.5]) - c)
    return f, (float(off[0]), float(off[1]))


'''
s = s.replace(old, new)
open(p,'w',encoding='utf-8').write(s)
print('ok')
