p='work/cubelib.py'
src=open(p,encoding='utf-8').read()

# --- improved shading: key + fill + rim ---
old_shade = src[src.index("def shade("):src.index("def render_rgba(")]
new_shade = '''def shade(n_view, gloss, base, key=0.42, fill=0.30):
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


'''
src = src.replace(old_shade, new_shade)

# --- render_rgba with outlines ---
old_rgba = src[src.index("def render_rgba("):src.index("def gradient_bg(")]
new_rgba = '''def render_rgba(quads, R, cam_dist, f, Wp, Hp, off=(0.0, 0.0), outline=0.0,
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


'''
src = src.replace(old_rgba, new_rgba)

# --- background with glow ---
src = src.replace("def gradient_bg(W, H, inner=(38, 44, 56), outer=(9, 10, 14), focus=(0.5, 0.44), spread=1.35):",
'''def gradient_bg(W, H, inner=(40, 46, 60), outer=(8, 9, 13), focus=(0.5, 0.44),
                spread=1.35, glow=0.0, glow_col=(150, 175, 220), glow_r=0.62):''')
src = src.replace('''    a = np.array(inner, np.float32); b = np.array(outer, np.float32)
    return a * (1 - t) + b * t''','''    a = np.array(inner, np.float32); b = np.array(outer, np.float32)
    img = a * (1 - t) + b * t
    if glow > 0:
        rr = np.sqrt(((xx - cx) / (W * glow_r)) ** 2 + ((yy - cy) / (H * glow_r)) ** 2)
        g = np.clip(1.0 - rr, 0, 1) ** 2.2
        img = img + np.array(glow_col, np.float32) * (g * glow)[..., None]
    return img''')

# --- render() pass-through for outline / glow ---
src = src.replace("""           bg=None, grain=2.0, vignette=0.30, seed=7, anchor=(0.5, 0.5),
           quads=None, zoom=1.0, cam_mul=3.4):""",
"""           bg=None, grain=2.0, vignette=0.30, seed=7, anchor=(0.5, 0.5),
           quads=None, zoom=1.0, cam_mul=3.4, outline=0.0, outline_alpha=110,
           shade_key=0.42, shade_fill=0.30, glow=0.0, glow_col=(150, 175, 220),
           glow_r=0.62, bg_inner=(40, 46, 60), bg_outer=(8, 9, 13)):""")
src = src.replace("""    rgba = render_rgba(quads, R, cam_dist, f * ss, W * ss, H * ss, (off[0] * ss, off[1] * ss))
    base = bg if isinstance(bg, np.ndarray) else gradient_bg(W, H)
    out = composite(rgba, W, H, ss, base)""",
"""    rgba = render_rgba(quads, R, cam_dist, f * ss, W * ss, H * ss, (off[0] * ss, off[1] * ss),
                       outline * ss, outline_alpha=outline_alpha,
                       shade_key=shade_key, shade_fill=shade_fill)
    base = bg if isinstance(bg, np.ndarray) else gradient_bg(W, H, bg_inner, bg_outer,
                                                             glow=glow, glow_col=glow_col, glow_r=glow_r)
    out = composite(rgba, W, H, ss, base)""")
open(p,'w',encoding='utf-8').write(src)
print('patched')
