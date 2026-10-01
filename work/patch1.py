import re, io
p='work/cubelib.py'
src=open(p,encoding='utf-8').read()
head = src.split("def render(explode")[0]

new = head + '''
def render_rgba(quads, R, cam_dist, f, Wp, Hp):
    img = Image.new('RGBA', (Wp, Hp), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    cam = np.array([0.0, 0.0, cam_dist])
    order = []
    for q in quads:
        cv = (q['pts'].mean(axis=0)) @ R.T
        nv = R @ q['n']
        if np.dot(nv, cam - cv) <= 0:
            continue
        order.append((float(np.linalg.norm(cam - cv)), q, nv))
    order.sort(key=lambda t: -t[0])
    for dist, q, nv in order:
        pts2d, _ = project(q['pts'], R, cam_dist, f, Wp, Hp)
        col = shade(nv, q['gloss'], q['color'])
        dr.polygon([tuple(pp) for pp in pts2d], fill=col + (255,))
    return img


def gradient_bg(W, H, inner=(38, 44, 56), outer=(9, 10, 14), focus=(0.5, 0.44), spread=1.35):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W * focus[0], H * focus[1]
    r = np.sqrt(((xx - cx) / (W * 0.62)) ** 2 + ((yy - cy) / (H * 0.62)) ** 2)
    t = np.clip(np.clip(r, 0, 1.6) / spread, 0, 1)[..., None]
    a = np.array(inner, np.float32); b = np.array(outer, np.float32)
    return a * (1 - t) + b * t


def finish(img_rgb, W, H, grain=2.0, vignette=0.30, seed=7):
    im = img_rgb if img_rgb.size == (W, H) else img_rgb.resize((W, H), Image.LANCZOS)
    a = np.asarray(im, np.float32).copy()
    if vignette > 0:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 1.414
        a *= (1.0 - vignette * np.clip(r, 0, 1) ** 2.2)[..., None]
    if grain > 0:
        a += np.random.default_rng(seed).normal(0, grain, a.shape)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB')


def composite(rgba, W, H, ss, bg):
    small = rgba.resize((W, H), Image.LANCZOS)
    fg = np.asarray(small, np.float32)
    alpha = fg[..., 3:4] / 255.0
    base = bg if isinstance(bg, np.ndarray) else gradient_bg(W, H)
    out = fg[..., :3] * alpha + base * (1 - alpha)
    return out


def render(explode, rot, W, H, ss=3, fit=0.90, cam_dist=None, f=None,
           bg=None, grain=2.0, vignette=0.30, seed=7, pad=1.0):
    quads = build_quads(explode)
    R = rot_matrix(*rot)
    allpts = np.concatenate([q['pts'] for q in quads], axis=0)
    if cam_dist is None:
        rad = float(np.linalg.norm(allpts, axis=1).max())
        cam_dist = rad * 3.4
    if f is None:
        pts2d, _ = project(allpts, R, cam_dist, 1.0, W, H)
        c = pts2d - np.array([W * 0.5, H * 0.5])
        f = min(fit * W * 0.5 / max(abs(c[:, 0]).max(), 1e-6),
                fit * H * 0.5 / max(abs(c[:, 1]).max(), 1e-6))
    rgba = render_rgba(quads, R, cam_dist, f * ss, W * ss, H * ss)
    base = bg if isinstance(bg, np.ndarray) else gradient_bg(W, H)
    out = composite(rgba, W, H, ss, base)
    return finish(Image.fromarray(np.clip(out, 0, 255).astype('uint8')), W, H, grain, vignette, seed), f, cam_dist
'''
open(p,'w',encoding='utf-8').write(new)
print('written')
