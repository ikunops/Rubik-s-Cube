p='work/cubelib.py'
s=open(p,encoding='utf-8').read()

s = s.replace('''def render(explode, rot, W, H, ss=3, fit=0.90, cam_dist=None, f=None, off=None,''',
'''def shadow_layer(rgba_small, blur=26.0, offset=(0.0, 0.0), strength=0.55, tint=(0, 0, 0)):
    W, H = rgba_small.size
    a = rgba_small.split()[3]
    sh = Image.new('L', (W, H), 0)
    sh.paste(a, (int(round(offset[0])), int(round(offset[1]))))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    arr = np.asarray(sh, np.float32) / 255.0 * strength
    layer = np.zeros((H, W, 3), np.float32) + np.array(tint, np.float32)
    return layer, arr[..., None]


def render(explode, rot, W, H, ss=3, fit=0.90, cam_dist=None, f=None, off=None,''')

s = s.replace("""           shade_key=0.42, shade_fill=0.30, glow=0.0, glow_col=(150, 175, 220),
           glow_r=0.62, bg_inner=(40, 46, 60), bg_outer=(8, 9, 13)):""",
"""           shade_key=0.42, shade_fill=0.30, glow=0.0, glow_col=(150, 175, 220),
           glow_r=0.62, bg_inner=(40, 46, 60), bg_outer=(8, 9, 13),
           shadow=0.0, shadow_blur=30.0, shadow_off=(0.0, 0.0)):""")

s = s.replace("""    base = bg if isinstance(bg, np.ndarray) else gradient_bg(W, H, bg_inner, bg_outer,
                                                             glow=glow, glow_col=glow_col, glow_r=glow_r)
    out = composite(rgba, W, H, ss, base)""",
"""    base = bg if isinstance(bg, np.ndarray) else gradient_bg(W, H, bg_inner, bg_outer,
                                                             glow=glow, glow_col=glow_col, glow_r=glow_r)
    if shadow > 0:
        small = rgba.resize((W, H), Image.LANCZOS)
        sl, sa = shadow_layer(small, shadow_blur, (shadow_off[0], shadow_off[1]), shadow)
        base = base * (1.0 - sa) + sl * sa
    out = composite(rgba, W, H, ss, base)""")
open(p,'w',encoding='utf-8').write(s)
print('ok')
