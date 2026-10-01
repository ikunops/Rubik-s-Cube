p='work/cubelib.py'
src=open(p,encoding='utf-8').read()

src = src.replace('''def project(pts, R, cam_dist, f, W, H):
    p = pts @ R.T
    depth = cam_dist - p[:, 2]
    depth = np.maximum(depth, 1e-4)
    sx = W * 0.5 + f * p[:, 0] / depth
    sy = H * 0.5 - f * p[:, 1] / depth
    return np.stack([sx, sy], axis=1), depth''','''def project(pts, R, cam_dist, f, W, H, off=(0.0, 0.0)):
    p = pts @ R.T
    depth = cam_dist - p[:, 2]
    depth = np.maximum(depth, 1e-4)
    sx = W * 0.5 + off[0] + f * p[:, 0] / depth
    sy = H * 0.5 + off[1] - f * p[:, 1] / depth
    return np.stack([sx, sy], axis=1), depth


def solve_view(allpts, R, cam_dist, W, H, fit=0.90):
    off = (0.0, 0.0)
    f = 1.0
    for _ in range(4):
        p2, _ = project(allpts, R, cam_dist, f, W, H, off)
        lo, hi = p2.min(axis=0), p2.max(axis=0)
        size = np.maximum(hi - lo, 1e-6)
        f = min(fit * W / size[0], fit * H / size[1])
        p2, _ = project(allpts, R, cam_dist, f, W, H, off)
        lo, hi = p2.min(axis=0), p2.max(axis=0)
        c = (lo + hi) * 0.5
        off = (off[0] + (W * 0.5 - c[0]), off[1] + (H * 0.5 - c[1]))
    return f, off''')

src = src.replace("def render_rgba(quads, R, cam_dist, f, Wp, Hp):",
                  "def render_rgba(quads, R, cam_dist, f, Wp, Hp, off=(0.0, 0.0)):")
src = src.replace("        pts2d, _ = project(q['pts'], R, cam_dist, f, Wp, Hp)\n        col = shade(nv, q['gloss'], q['color'])\n        dr.polygon([tuple(pp) for pp in pts2d], fill=col + (255,))",
                  "        pts2d, _ = project(q['pts'], R, cam_dist, f, Wp, Hp, off)\n        col = shade(nv, q['gloss'], q['color'])\n        dr.polygon([tuple(pp) for pp in pts2d], fill=col + (255,))")

old_render = src[src.index("def render(explode"):]
new_render = '''def render(explode, rot, W, H, ss=3, fit=0.90, cam_dist=None, f=None, off=None,
           bg=None, grain=2.0, vignette=0.30, seed=7, anchor=(0.5, 0.5),
           quads=None, zoom=1.0, cam_mul=3.4):
    if quads is None:
        quads = build_quads(explode)
    R = rot_matrix(*rot)
    allpts = np.concatenate([q['pts'] for q in quads], axis=0)
    if cam_dist is None:
        rad = float(np.linalg.norm(allpts, axis=1).max())
        cam_dist = rad * cam_mul
    if f is None or off is None:
        f, off = solve_view(allpts, R, cam_dist, W, H, fit)
    off = (off[0] + (anchor[0] - 0.5) * W, off[1] + (anchor[1] - 0.5) * H)
    f = f * zoom
    rgba = render_rgba(quads, R, cam_dist, f * ss, W * ss, H * ss, (off[0] * ss, off[1] * ss))
    base = bg if isinstance(bg, np.ndarray) else gradient_bg(W, H)
    out = composite(rgba, W, H, ss, base)
    return finish(Image.fromarray(np.clip(out, 0, 255).astype('uint8')), W, H, grain, vignette, seed), f, cam_dist, off


def render_alpha(explode, rot, W, H, ss=3, fit=0.90, cam_dist=None, cam_mul=3.4,
                 quads=None, zoom=1.0, anchor=(0.5, 0.5), feather=0.0):
    if quads is None:
        quads = build_quads(explode)
    R = rot_matrix(*rot)
    allpts = np.concatenate([q['pts'] for q in quads], axis=0)
    if cam_dist is None:
        cam_dist = float(np.linalg.norm(allpts, axis=1).max()) * cam_mul
    f, off = solve_view(allpts, R, cam_dist, W, H, fit)
    off = (off[0] + (anchor[0] - 0.5) * W, off[1] + (anchor[1] - 0.5) * H)
    f *= zoom
    rgba = render_rgba(quads, R, cam_dist, f * ss, W * ss, H * ss, (off[0] * ss, off[1] * ss))
    small = rgba.resize((W, H), Image.LANCZOS)
    return small
'''
src = src.replace(old_render, new_render)
src = src.replace("def build_quads(explode, half=0.5, inset=0.085, r_body=0.12, r_stick=0.14):",
                  "def build_quads(explode, half=0.5, inset=0.045, r_body=0.085, r_stick=0.075):")
open(p,'w',encoding='utf-8').write(src)
print('patched')
