import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math

PLASTIC = (16, 16, 20)
STICKER = {
    'R': (196, 30, 58),    # +X red
    'L': (255, 92, 0),     # -X orange
    'U': (246, 246, 244),  # +Y white
    'D': (255, 214, 10),   # -Y yellow
    'F': (0, 82, 186),     # +Z blue
    'B': (0, 158, 96),     # -Z green
}
FACES = [
    ('R', (1, 0, 0), (0, 1, 0), (0, 0, 1)),
    ('L', (-1, 0, 0), (0, 0, 1), (0, 1, 0)),
    ('U', (0, 1, 0), (0, 0, 1), (1, 0, 0)),
    ('D', (0, -1, 0), (1, 0, 0), (0, 0, 1)),
    ('F', (0, 0, 1), (1, 0, 0), (0, 1, 0)),
    ('B', (0, 0, -1), (0, 1, 0), (1, 0, 0)),
]


def rrect(hw, hh, r, n=7):
    pts = []
    for cx, cy, a0 in ((hw - r, hh - r, 0.0), (-hw + r, hh - r, 90.0),
                       (-hw + r, -hh + r, 180.0), (hw - r, -hh + r, 270.0)):
        for t in range(n):
            a = math.radians(a0 + 90.0 * t / (n - 1))
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def rot_matrix(rx_deg, ry_deg):
    rx, ry = math.radians(rx_deg), math.radians(ry_deg)
    Rx = np.array([[1, 0, 0], [0, math.cos(rx), -math.sin(rx)], [0, math.sin(rx), math.cos(rx)]])
    Ry = np.array([[math.cos(ry), 0, math.sin(ry)], [0, 1, 0], [-math.sin(ry), 0, math.cos(ry)]])
    return Rx @ Ry


def build_quads(explode, half=0.5, inset=0.032, r_body=0.075, r_stick=0.055):
    ex, ey, ez = explode
    quads = []
    span = 2 * (1.0 + 1.0)  # unused
    for i in range(3):
        for j in range(3):
            for k in range(3):
                c = np.array([(i - 1) * (1.0 + ex), (j - 1) * (1.0 + ey), (k - 1) * (1.0 + ez)])
                for key, n, u, v in FACES:
                    n = np.array(n, float); u = np.array(u, float); v = np.array(v, float)
                    outer = ((key == 'R' and i == 2) or (key == 'L' and i == 0) or
                             (key == 'U' and j == 2) or (key == 'D' and j == 0) or
                             (key == 'F' and k == 2) or (key == 'B' and k == 0))
                    # plastic body face
                    body = [(c + n * half + u * a + v * b) for a, b in rrect(half, half, r_body)]
                    quads.append({'pts': np.array(body), 'n': n, 'color': PLASTIC, 'gloss': 0.05})
                    if outer:
                        s = half - inset
                        st = [(c + n * (half + 0.004) + u * a + v * b) for a, b in rrect(s, s, r_stick)]
                        quads.append({'pts': np.array(st), 'n': n, 'color': STICKER[key], 'gloss': 0.16})
    return quads


def project(pts, R, cam_dist, f, W, H, off=(0.0, 0.0)):
    p = pts @ R.T
    depth = cam_dist - p[:, 2]
    depth = np.maximum(depth, 1e-4)
    sx = W * 0.5 + off[0] + f * p[:, 0] / depth
    sy = H * 0.5 + off[1] - f * p[:, 1] / depth
    return np.stack([sx, sy], axis=1), depth


def solve_view(allpts, R, cam_dist, W, H, fit=0.90, margin=(0.0, 0.0)):
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


def shade(n_view, gloss, base, key=0.42, fill=0.30):
    L1 = np.array([-0.40, 0.66, 0.64]); L1 /= np.linalg.norm(L1)
    L2 = np.array([0.72, 0.16, 0.68]); L2 /= np.linalg.norm(L2)
    V = np.array([0.0, 0.0, 1.0])
    n = np.array(n_view, float)
    lam1 = max(0.0, float(np.dot(n, L1)))
    lam2 = max(0.0, float(np.dot(n, L2)))
    k = 0.20 + 0.86 * (lam1 ** 0.80) + fill * (lam2 ** 1.5)
    H1 = L1 + V; H1 /= np.linalg.norm(H1)
    spec = max(0.0, float(np.dot(n, H1))) ** 34 * gloss
    spec += max(0.0, float(np.dot(n, (L2 + V) / np.linalg.norm(L2 + V)))) ** 60 * gloss * 0.45
    col = np.array(base, float) * k + 255.0 * spec
    return tuple(int(min(255, max(0, x))) for x in col)


def render_rgba(quads, R, cam_dist, f, Wp, Hp, off=(0.0, 0.0), outline=0.0,
                outline_col=(0, 0, 0), outline_alpha=110, shade_key=0.42, shade_fill=0.30):
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
        pts2d, _ = project(q['pts'], R, cam_dist, f, Wp, Hp, off)
        col = shade(nv, q['gloss'], q['color'], shade_key, shade_fill)
        poly = [tuple(pp) for pp in pts2d]
        dr.polygon(poly, fill=col + (255,))
        if outline > 0:
            dr.line(poly + [poly[0]], fill=outline_col + (outline_alpha,),
                    width=max(1, int(round(outline))), joint='curve')
    return img


def gradient_bg(W, H, inner=(40, 46, 60), outer=(8, 9, 13), focus=(0.5, 0.44),
                spread=1.35, glow=0.0, glow_col=(150, 175, 220), glow_r=0.62):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W * focus[0], H * focus[1]
    r = np.sqrt(((xx - cx) / (W * 0.62)) ** 2 + ((yy - cy) / (H * 0.62)) ** 2)
    t = np.clip(np.clip(r, 0, 1.6) / spread, 0, 1)[..., None]
    a = np.array(inner, np.float32); b = np.array(outer, np.float32)
    img = a * (1 - t) + b * t
    if glow > 0:
        rr = np.sqrt(((xx - cx) / (W * glow_r)) ** 2 + ((yy - cy) / (H * glow_r)) ** 2)
        g = np.clip(1.0 - rr, 0, 1) ** 2.2
        img = img + np.array(glow_col, np.float32) * (g * glow)[..., None]
    return img


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


def shadow_layer(rgba_small, blur=26.0, offset=(0.0, 0.0), strength=0.55, tint=(0, 0, 0)):
    W, H = rgba_small.size
    a = rgba_small.split()[3]
    sh = Image.new('L', (W, H), 0)
    sh.paste(a, (int(round(offset[0])), int(round(offset[1]))))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    arr = np.asarray(sh, np.float32) / 255.0 * strength
    layer = np.zeros((H, W, 3), np.float32) + np.array(tint, np.float32)
    return layer, arr[..., None]


def render(explode, rot, W, H, ss=3, fit=0.90, cam_dist=None, f=None, off=None,
           bg=None, grain=2.0, vignette=0.30, seed=7, anchor=(0.5, 0.5),
           quads=None, zoom=1.0, cam_mul=3.4, outline=0.0, outline_alpha=110,
           shade_key=0.42, shade_fill=0.30, glow=0.0, glow_col=(150, 175, 220),
           glow_r=0.62, bg_inner=(40, 46, 60), bg_outer=(8, 9, 13),
           shadow=0.0, shadow_blur=30.0, shadow_off=(0.0, 0.0)):
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
    rgba = render_rgba(quads, R, cam_dist, f * ss, W * ss, H * ss, (off[0] * ss, off[1] * ss),
                       outline * ss, outline_alpha=outline_alpha,
                       shade_key=shade_key, shade_fill=shade_fill)
    base = bg if isinstance(bg, np.ndarray) else gradient_bg(W, H, bg_inner, bg_outer,
                                                             glow=glow, glow_col=glow_col, glow_r=glow_r)
    if shadow > 0:
        small = rgba.resize((W, H), Image.LANCZOS)
        sl, sa = shadow_layer(small, shadow_blur, (shadow_off[0], shadow_off[1]), shadow)
        base = base * (1.0 - sa) + sl * sa
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
