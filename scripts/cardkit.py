"""Fyndplats kortmotor — premium-mallen fran docs/polish/bildmetoder.md, K-metoderna.

Bygger de svenska feature-/spec-korten som ersatter leverantorens utlandska
marknadsforingscollage i produktgalleriet. Varje kort ar 1600x1600 CSS px
(renderas i 2x -> 3200 retina), med varm radial-gradient, Inter, orange
enhets-accent och kub-lockuppen i foten. VARJE kort har ett riktigt foto —
aldrig ett rent textkort.

Anvandning (kor fran en scratchpad-katalog med bilderna i ./crops):

    import sys; sys.path.insert(0, "scripts")
    import cardkit as ck
    ck.hero_white("orig/o01.jpg", "out/hjalte.jpg")      # vit studio-hjalte, plats 0
    ck.crop("orig/o05.jpg", "crops/detalj.jpg", .15, .34, .24, .43)
    ck.card_photo("k1a", "crops/detalj.jpg", "HOJD 61-84 CM",
                  "Nio lagen", "En rad brodtext.", note="9 hojdlagen")
    ck.card_grid("k1b", ["crops/a.jpg", "crops/b.jpg"], ["Vanster", "Hoger"],
                 "REGLAGE", "Tva knappar", "En rad brodtext.")
    ck.card_spec("k1s", "out/hjalte.jpg", "Specifikation", "Massagebank",
                 [("Langd", '215&nbsp;<span class=u>cm</span>')])
    ck.render(["k1a", "k1b", "k1s"])

Bildhjalpare: hero_white (vit studio-hjalte) · crop (relativa koordinater) ·
fit_pane (beskar till panelens proportion sa att cover inte zoomar in) ·
grid_overlay (rutnat for att lasa av exakta crop-granser).
Kort: card_photo (ett stort foto) · card_grid (2-4 foton) · card_spec (foto +
spec-rutnat). Rendera med render(). hero_white kraver numpy + scipy; korten
kraver bara PIL.

Assets (Inter latin-subset + kub-loggan) ligger i scripts/assets/ och behover
inte hamtas. Vill du byta dem: satt FYNDPLATS_CARD_ASSETS till en egen katalog,
eller lagg en assets/-katalog i den katalog du kor ifran.

Tva renderings-fallor som kostade tid 2026-08-04, bada lasta har inne:
  1. Chromium-viewporten blir ~87,5 CSS px LAGRE an --window-size. Lagger man
     gradienten pa <body> tilar den darfor och kortets nedre ~90 px blir vita.
     Losning: gradienten sitter pa ett fast .card-element, och render() kor med
     en hogre fonsterhojd och kapar sedan till exakt kvadrat.
  2. Utan <meta charset="utf-8"> renderas a/a/o som mojibake (Ã¤/Ã¥/Ã¶).
"""
import base64, os, re, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

# Typsnitt + logga ligger i scripts/assets/ sa motorn funkar direkt efter en
# klon. Satt FYNDPLATS_CARD_ASSETS, eller lagg en egen assets/-katalog i cwd,
# for att peka nagon annanstans.
def _assets_dir():
    for d in (os.environ.get("FYNDPLATS_CARD_ASSETS"),
              os.path.join(os.getcwd(), "assets"),
              os.path.join(HERE, "assets")):
        if d and os.path.isfile(os.path.join(d, "inter-400.woff2")):
            return d
    return os.path.join(HERE, "assets")

ASSETS = _assets_dir()
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

ORANGE = "#D9600C"      # lasbar orange for text pa gradden
ORANGE_HI = "#FF8A2F"   # loggans orange, for grafiska element
INK = "#1B1B1A"
MUTED = "#5A564F"


def _b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def _img_uri(path):
    ext = os.path.splitext(path)[1].lower()
    mime = "image/png" if ext == ".png" else "image/jpeg"
    return f"data:{mime};base64,{_b64(path)}"


_FONT = None
def _font():
    global _FONT
    if _FONT is None:
        _FONT = _b64(os.path.join(ASSETS, "inter-400.woff2"))
    return _FONT


_LOGO = None
def _logo():
    global _LOGO
    if _LOGO is None:
        _LOGO = _img_uri(os.path.join(ASSETS, "icon.png"))
    return _LOGO


def _head():
    return f"""<meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(data:font/woff2;base64,{_font()}) format('woff2');
  font-weight:100 900;font-style:normal;font-display:block}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1600px;background:#FFFFFF}}
.card{{width:1600px;height:1600px;overflow:hidden;font-family:Inter,sans-serif;color:{INK};
  -webkit-font-smoothing:antialiased;
  background:radial-gradient(130% 105% at 50% 20%, #FFFFFF 0%, #FAF7F2 50%, #ECE6DC 100%);
  display:flex;flex-direction:column;padding:88px 92px 70px}}
.stage{{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:26px}}
.pane{{flex:1;min-height:0;border-radius:40px;overflow:hidden;position:relative;
  box-shadow:0 30px 74px rgba(74,56,30,.16), 0 2px 0 rgba(255,255,255,.7) inset;background:#fff}}
.pane img{{width:100%;height:100%;object-fit:cover;display:block}}
.pane.fit{{background:#FFFFFF}}
.pane.fit img{{object-fit:contain;padding:22px}}
.row{{flex:1;min-height:0;display:flex;gap:26px}}
.row .pane{{flex:1}}
.tag{{position:absolute;left:26px;bottom:24px;background:rgba(255,255,255,.94);
  border-radius:999px;padding:13px 26px;font-size:28px;font-weight:700;letter-spacing:-.2px;
  color:{INK};box-shadow:0 6px 20px rgba(60,45,25,.16)}}
.txt{{padding-top:52px;flex:0 0 auto}}
.kicker{{font-size:29px;font-weight:700;letter-spacing:.19em;text-transform:uppercase;
  color:{ORANGE};margin-bottom:20px}}
h1{{font-size:78px;font-weight:800;letter-spacing:-2.2px;line-height:1.03}}
.cap{{font-size:37px;font-weight:400;line-height:1.42;color:{MUTED};margin-top:24px;max-width:1330px}}
.rows{{margin-top:34px;display:grid;grid-template-columns:1fr 1fr;gap:0 62px}}
.r{{display:flex;justify-content:space-between;align-items:baseline;gap:20px;
  padding:19px 2px;border-bottom:2px solid rgba(27,27,26,.09)}}
.k{{font-size:32px;font-weight:400;color:{MUTED};white-space:nowrap}}
.v{{font-size:34px;font-weight:700;letter-spacing:-.4px;text-align:right}}
.u{{color:{ORANGE};font-weight:700}}
.foot{{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;
  border-top:2px solid rgba(27,27,26,.11);padding-top:32px;margin-top:40px}}
.brandlock{{display:flex;align-items:center;gap:15px}}
.brandlock img{{width:47px;height:47px}}
.brandlock b{{font-size:37px;font-weight:700;letter-spacing:-.5px;color:{INK}}}
.foot span{{font-size:28px;font-weight:500;color:#8C877E;letter-spacing:.02em}}
</style>"""


def _foot(note=""):
    return (f'<div class=foot><div class=brandlock><img src="{_logo()}"><b>Fyndplats</b></div>'
            f'<span>{note}</span></div>')


def _pane(photo, tag=None, fit=False):
    cls = "pane fit" if fit else "pane"
    t = f'<div class=tag>{tag}</div>' if tag else ""
    return f'<div class="{cls}"><img src="{_img_uri(photo)}">{t}</div>'


def card_photo(out, photo, kicker, title, caption, note="", fit=False, tag=None):
    """Ett stort foto + rubrik + en rad."""
    html = (_head() + '<div class=card><div class=stage>' + _pane(photo, tag, fit) + '</div>'
            f'<div class=txt><div class=kicker>{kicker}</div><h1>{title}</h1>'
            f'<div class=cap>{caption}</div></div>' + _foot(note) + '</div>')
    _write(out, html)


def card_grid(out, photos, labels, kicker, title, caption, note="", rows=1, fit=False):
    """2-4 foton i rutnat + rubrik."""
    pairs = list(zip(photos, labels + [None] * len(photos)))
    if rows == 1:
        body = '<div class=row>' + "".join(_pane(p, l, fit) for p, l in pairs) + '</div>'
    else:
        half = (len(pairs) + 1) // 2
        body = ('<div class=row>' + "".join(_pane(p, l, fit) for p, l in pairs[:half]) + '</div>'
                '<div class=row>' + "".join(_pane(p, l, fit) for p, l in pairs[half:]) + '</div>')
    html = (_head() + f'<div class=card><div class=stage>{body}</div>'
            f'<div class=txt><div class=kicker>{kicker}</div><h1>{title}</h1>'
            f'<div class=cap>{caption}</div></div>' + _foot(note) + '</div>')
    _write(out, html)


def card_spec(out, photo, kicker, title, specrows, note="", fit=True):
    """Foto + verifierat spec-rutnat (siffra i svart, enhet i orange)."""
    rows = "".join(f'<div class=r><span class=k>{k}</span><span class=v>{v}</span></div>'
                   for k, v in specrows)
    html = (_head() + '<div class=card><div class=stage>' + _pane(photo, None, fit) + '</div>'
            f'<div class=txt><div class=kicker>{kicker}</div><h1>{title}</h1>'
            f'<div class=rows>{rows}</div></div>' + _foot(note) + '</div>')
    _write(out, html)


def _write(out, html):
    os.makedirs("cards", exist_ok=True)
    p = f"cards/{out}.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(html)
    return p


def render(names, scale=2):
    """Rendera HTML -> PNG med forinstallerad Chromium."""
    for n in names:
        subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox",
                        "--hide-scrollbars", f"--force-device-scale-factor={scale}",
                        "--window-size=1600,1780",
                        f"--screenshot=cards/{n}.png",
                        f"file://{os.path.abspath(f'cards/{n}.html')}"],
                       check=True, capture_output=True)
        # viewporten ar lagre an --window-size; kapa till exakt kvadrat
        im = Image.open(f"cards/{n}.png")
        side = 1600 * scale
        if im.size != (side, side):
            im.convert("RGB").crop((0, 0, side, side)).save(f"cards/{n}.png")
    return [f"cards/{n}.png" for n in names]


def hero_white(src, dst, canvas=2000, fyll=0.90, trosk=245):
    """Vit studio-hjalte ur en bild som REDAN har vit bakgrund.

    Troskla bort det gragula ljusbruset, beskar till produktens bbox, centrera pa
    en ren vit duk och skarpa lite. Gratis, deterministisk och trognare an ett
    rembg-urklipp — u2net ater tunna delar (kablar, speglar, smala ben), det har
    ror aldrig pixlarna inuti silhuetten.

    Anvand som metod H-0: prova ALLTID denna forst. Ar bakgrunden rorig,
    mork eller fotograferad i en miljo — ga till H-A (Wix generate-image).

    trosk = hur ljus en pixel maste vara for att raknas som bakgrund (min over
    R/G/B). Sank den om en ljus produkt aker med i bakgrunden; hoj den om en
    gragul studiobakgrund blir kvar. Granska ALLTID resultatet med Read.

    Returnerar (bredd, hojd) pa den inplacerade produkten.
    """
    import numpy as np
    from PIL import ImageFilter
    from scipy import ndimage

    a = np.asarray(Image.open(src).convert("RGB")).astype(np.uint8)
    mn = a.min(axis=2)
    ren = np.where((mn > trosk)[:, :, None], np.uint8(255), a)
    prod = ndimage.binary_opening(mn <= trosk, np.ones((3, 3)))
    ys, xs = np.where(prod)
    if not len(ys):
        raise ValueError(f"{src}: hittade ingen produkt — sank trosk")
    k = ren[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    ph, pw = k.shape[:2]
    s = (canvas * fyll) / max(ph, pw)
    nw, nh = int(pw * s), int(ph * s)
    pil = (Image.fromarray(k).resize((nw, nh), Image.LANCZOS)
           .filter(ImageFilter.UnsharpMask(2, 30, 3)))
    duk = Image.new("RGB", (canvas, canvas), (255, 255, 255))
    duk.paste(pil, ((canvas - nw) // 2, (canvas - nh) // 2))
    duk.save(dst, quality=96)
    return (nw, nh)


def crop(src, dst, x0, x1, y0, y1, q=95):
    """Beskar pa relativa koordinater (0-1) och sparar JPEG."""
    im = Image.open(src).convert("RGB")
    w, h = im.size
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    im.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1))).save(dst, quality=q)
    return dst


# Kortmotorns FAKTISKA panelproportioner (uppmatta med en sond-rendering
# 2026-08-26, 1-radig h1 + 2-radig bildtext). Panelen anvander object-fit:cover,
# sa ett foto med FEL proportion zoomas in tills det tacker panelen — det ar den
# vanligaste orsaken till "for inzoomade" kort. Beskar alltid kallan till
# panelens proportion forst med fit_pane().
PANEL = {
    "photo": 1416 / 1005,      # card_photo, en panel
    "spec": 1416 / 776,        # card_spec (8 specrader)
    "grid2x2": 695 / 489,      # card_grid rows=2, fyra paneler
    "grid1x2": 695 / 1005,     # card_grid rows=1, tva paneler
    "grid1x3": 455 / 1005,     # card_grid rows=1, tre paneler
    "grid1x4": 334 / 1005,     # card_grid rows=1, fyra paneler
}


def fit_pane(src, dst, panel="photo", anchor=0.5, q=95):
    """Centrumbeskar till panelens proportion sa att cover inte zoomar in.

    panel: nyckel i PANEL, eller ett tal (bredd/hojd).
    anchor: 0-1, var i den langa riktningen snittet centreras (0.5 = mitten).
    Skalar aldrig upp och lagger aldrig till vit yta — bara ett snallt snitt.
    """
    mal = PANEL[panel] if isinstance(panel, str) else float(panel)
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if w / h > mal:                      # for bred -> kapa i sidled
        nw, nh = int(round(h * mal)), h
    else:                                # for hog -> kapa i hojdled
        nw, nh = w, int(round(w / mal))
    x = int(round((w - nw) * anchor))
    y = int(round((h - nh) * anchor))
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    im.crop((x, y, x + nw, y + nh)).save(dst, quality=q)
    return dst


def grid_overlay(src, dst, step=0.05):
    """Rutnat med procent-etiketter for att lasa av exakta crop-granser."""
    from PIL import ImageDraw
    im = Image.open(src).convert("RGB")
    w, h = im.size
    d = ImageDraw.Draw(im)
    i = 0.0
    while i <= 1.0001:
        x = int(w * i); y = int(h * i)
        d.line([(x, 0), (x, h)], fill=(0, 220, 220), width=2)
        d.line([(0, y), (w, y)], fill=(255, 0, 200), width=2)
        d.text((x + 5, 8), f"{i:.2f}", fill=(0, 130, 130))
        d.text((6, y + 5), f"{i:.2f}", fill=(190, 0, 150))
        i += step
    im.save(dst, quality=90)
    return dst
