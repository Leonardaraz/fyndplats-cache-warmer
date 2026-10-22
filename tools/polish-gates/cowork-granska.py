#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# cowork-granska.py (2026-10-22): granskar Cowork-chattens JSON-svar med bildlistor ur aosom.de:s gallerier, före något skrivs i Wix.
#
#   python3 tools/polish-gates/cowork-granska.py <svarfil> --rader <rader.json> [--rader <rader2.json>] --ut <katalog> \
#       [--hamta] [--live <livekatalog>] [--ocr <python med rapidocr>]
#
#   svarfil   text med ett eller flera JSON-block (chattens svar klistrat som det är; kodstaket och "Klart till och med nr N" tas bort)
#   --rader   uppdragsfilens rader: [{nr, id8, pid, namn, farg|(opt,val), nu, lank}] (☠️ bär Aosoms länkar: bara scratchpad, aldrig repot)
#   --ut      arbetskatalog (privat): svar/<nr>/NN.img, galleri/<id8>/, ark_<nr>.jpg, nu_<nr>.jpg
#   --hamta   laddar ner varje bild ur den öppna bildservern (img.aosomcdn.com) och mäter byte, pixlar, byte-lika och likadana foton (dHash)
#   --live    katalog med <id8>.json från live-bilder.mjs (eller live-farg-vy.mjs för tvåaxliga sidor): sidans nuvarande bilder per val.
#             Varje kandidat jämförs med ALLA bilder på sidan (färgmedveten dHash, avstånd högst 12 = samma foto) och får NY eller FINNS.
#   --ocr     python-tolk med RapidOCR (se ocr-forgranska.py): REN, SIFFROR eller TEXT per kandidat. TEXT är oftast tysk säljgrafik.
#
# Skriver en rad per svarsrad (form, antal, vad sidan sade) och en rad per kandidat. Skriver ALDRIG länkar eller artikelnummer.
# Kontaktarken (ark_<nr>.jpg) ritar kandidaterna med etikett; nu_<nr>.jpg ritar valets nuvarande bilder. Titta på dem: OCR och dHash är en
# förgranskning, aldrig ett bevis (en logotyp utan bokstäver, fel färg och en kollage syns inte där).
#
# Det rundan lärde (rad 1–5, 2026-10-22):
#   · Chatten gav rätt färg på 5 av 5 och bilder i full storlek (1 600–2 000 px). Den lade själv bort Aosoms infobanner och en dubblett.
#   · Aosoms galleri börjar med flödets tio bilder (som redan är körda). De rena nya bilderna ligger på plats 11 och uppåt:
#     8 detaljfoton, 4 produktfoton och 1 packshot på tre av fem färger. De andra två gav bara tyska säljgrafiker och foton med texten
#     "Nur Kissen" / "Cushions Only" (de rena bilderna fanns redan).
import hashlib, json, os, re, subprocess, sys, time, warnings

warnings.filterwarnings('ignore')
VARD = 'https://img.aosomcdn.com/'
TROSKEL = 12

DE = {'weiss': 'vit', 'weiß': 'vit', 'schwarz': 'svart', 'grau': 'grå', 'hellgrau': 'ljusgrå', 'dunkelgrau': 'mörkgrå', 'braun': 'brun',
      'dunkelbraun': 'mörkbrun', 'hellbraun': 'ljusbrun', 'beige': 'beige', 'rot': 'röd', 'blau': 'blå', 'hellblau': 'ljusblå',
      'dunkelblau': 'mörkblå', 'grün': 'grön', 'dunkelgrün': 'mörkgrön', 'hellgrün': 'ljusgrön', 'gelb': 'gul', 'rosa': 'rosa', 'pink': 'rosa',
      'orange': 'orange', 'creme': 'gräddvit', 'cremeweiß': 'gräddvit', 'natur': 'natur', 'lila': 'lila', 'violett': 'lila', 'silber': 'silver',
      'gold': 'guld', 'türkis': 'turkos', 'anthrazit': 'antracit', 'khaki': 'khaki', 'marineblau': 'marinblå', 'navy': 'marinblå',
      'bordeaux': 'vinröd', 'sand': 'sand', 'petrol': 'petrol', 'holz': 'trä', 'eiche': 'ek', 'walnuss': 'valnöt', 'weinrot': 'vinröd',
      'burgunder': 'vinröd', 'mintgrün': 'mintgrön'}


def args():
    a = sys.argv[1:]
    if not a or a[0].startswith('--'):
        print(__doc__ or 'användning: cowork-granska.py <svarfil> --rader <rader.json> --ut <katalog> [--hamta] [--live <dir>] [--ocr <python>]')
        sys.exit(2)
    ut = dict(svar=a[0], rader=[], ut=None, hamta=False, live=None, ocr=None)
    i = 1
    while i < len(a):
        if a[i] == '--rader':
            ut['rader'].append(a[i + 1]); i += 2
        elif a[i] == '--ut':
            ut['ut'] = a[i + 1]; i += 2
        elif a[i] == '--live':
            ut['live'] = a[i + 1]; i += 2
        elif a[i] == '--ocr':
            ut['ocr'] = a[i + 1]; i += 2
        elif a[i] == '--hamta':
            ut['hamta'] = True; i += 1
        else:
            print('okänd flagga', a[i]); sys.exit(2)
    if not ut['rader'] or not ut['ut']:
        print('--rader och --ut krävs'); sys.exit(2)
    return ut


def hitta_block(text):
    dec = json.JSONDecoder()
    ut, i = [], 0
    while True:
        j = text.find('[', i)
        if j < 0:
            break
        try:
            obj, end = dec.raw_decode(text, j)
        except ValueError:
            i = j + 1
            continue
        if isinstance(obj, list) and obj and all(isinstance(x, dict) and 'nr' in x for x in obj):
            ut.extend(obj)
            i = end
        else:
            i = j + 1
    return ut


def mal(r):
    """(optionens namn, valets namn) som raden gäller i butiken."""
    if 'farg' in r:
        return 'Färg', re.sub(r' \(variant \d+\)$', '', r['farg'].split(' · ')[0]).strip()
    return r.get('opt', 'Storlek'), re.sub(r' \(variant \d+\)$', '', r['val']).strip()


def sv_farger(de):
    ut = set()
    for ord_ in re.findall(r'[A-Za-zÄÖÜäöüß]+', de or ''):
        w = ord_.lower()
        if w in DE:
            ut.add(DE[w])
        else:
            for k, v in DE.items():
                if len(k) >= 4 and w.startswith(k):
                    ut.add(v)
    return ut


def farg_stammer(r, sida):
    """True, False eller None (None = ordlistan avgör inte: bedöm med ögat)."""
    if 'farg' not in r:
        return None
    exp = mal(r)[1].lower()
    m = sv_farger(sida)
    if not m:
        return None
    return any(x == exp or x in exp or exp in x for x in m)


def dhash(f):
    from PIL import Image
    try:
        im = Image.open(f).convert('RGB').resize((9, 8), Image.LANCZOS)
    except Exception:
        return None
    ut = []
    for kanal in im.split():
        px = list(kanal.tobytes())
        bits = 0
        for y in range(8):
            for x in range(8):
                bits = (bits << 1) | (1 if px[y * 9 + x] > px[y * 9 + x + 1] else 0)
        ut.append(bits)
    return tuple(ut)


def av(a, b):
    return sum(bin(x ^ y).count('1') for x, y in zip(a, b))


def curl(url, fil):
    c = subprocess.run(['curl', '-sS', '-L', '--max-time', '60', '-o', fil, '-w', '%{http_code} %{content_type}', url], capture_output=True, text=True)
    kod, _, typ = (c.stdout or '').partition(' ')
    return kod, typ


def hamta_svar(ut, nr, urls):
    from PIL import Image
    d = '%s/svar/%s' % (ut, nr)
    os.makedirs(d, exist_ok=True)
    res = []
    for i, u in enumerate(urls, 1):
        fil = '%s/%02d.img' % (d, i)
        if not os.path.exists(fil) or os.path.getsize(fil) < 2000:
            kod, typ = curl(u, fil)
            time.sleep(0.15)
        else:
            kod, typ = '200', 'image/cached'
        p = dict(i=i, kod=kod, typ=typ, bytes=os.path.getsize(fil) if os.path.exists(fil) else 0, w=0, h=0, md5='', dh=None, ok=False, fil=fil)
        if kod == '200' and (typ.startswith('image/')):
            try:
                with Image.open(fil) as im:
                    p['w'], p['h'] = im.size
                p['dh'] = dhash(fil)
                p['md5'] = hashlib.md5(open(fil, 'rb').read()).hexdigest()
                p['ok'] = True
            except Exception as e:
                p['typ'] += ' ILLASAKTIG:' + type(e).__name__
        res.append(p)
    return res


def hamta_galleri(ut, id8, ids):
    d = '%s/galleri/%s' % (ut, id8)
    os.makedirs(d, exist_ok=True)
    ut_ = {}
    for fid in ids:
        f = '%s/%s.jpg' % (d, fid[7:13])
        if not os.path.exists(f) or os.path.getsize(f) < 500:
            curl('https://static.wixstatic.com/media/' + fid, f)
        ut_[fid] = (f, dhash(f))
    return ut_


def tumme(f, s):
    from PIL import Image, ImageOps
    im = ImageOps.contain(Image.open(f).convert('RGB'), (s, s))
    r = Image.new('RGB', (s, s), (255, 255, 255))
    r.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    return r


def ark(poster, fil, kol=6, s=230):
    from PIL import Image, ImageDraw
    rader = (len(poster) + kol - 1) // kol
    b = Image.new('RGB', (kol * (s + 6), rader * (s + 34)), (245, 245, 245))
    d = ImageDraw.Draw(b)
    for i, (f, t) in enumerate(poster):
        x, y = (i % kol) * (s + 6), (i // kol) * (s + 34)
        b.paste(tumme(f, s), (x, y + 30))
        d.text((x + 3, y + 3), t[:44], fill=(0, 0, 0))
        d.text((x + 3, y + 15), t[44:88], fill=(0, 0, 0))
    b.save(fil, quality=85)


def ocr(python, filer):
    """{basnamn: (status, ord)}. ocr-forgranska.py skriver bara filens basnamn, så filerna ska komma från EN katalog (en rad)."""
    ocr_py = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr-forgranska.py')
    ut = {}
    c = subprocess.run([python, '-W', 'ignore', ocr_py] + filer, capture_output=True, text=True)
    for l in c.stdout.splitlines():
        m = re.match(r'(.*?)\s+(REN|SIFFROR|TEXT)\s*\|\s*(.*)$', l.strip())
        if m:
            ut[os.path.basename(m.group(1))] = (m.group(2), m.group(3))
    return ut


def main():
    A = args()
    ROWS = {}
    for fil in A['rader']:
        for r in json.load(open(fil, encoding='utf-8')):
            ROWS[r['nr']] = r
    poster = hitta_block(open(A['svar'], encoding='utf-8').read())
    if not poster:
        print('hittade inget JSON-block med "nr"'); sys.exit(1)
    nrs = [p['nr'] for p in poster]
    os.makedirs(A['ut'], exist_ok=True)
    os.chmod(A['ut'], 0o700)
    print('block lästa: %d rader (nr %s–%s)%s\n' % (len(poster), min(nrs), max(nrs), '' if len(set(nrs)) == len(nrs) else ' ☠️ nr förekommer två gånger'))
    print('%-4s %-8s %-30s %-9s %-26s %s' % ('nr', 'id8', 'raden vill ha', 'antal/adr', 'sidan säger', 'anmärkning'))
    svar = []
    for p in poster:
        nr = p['nr']
        r = ROWS.get(nr)
        if r is None:
            print('%-4s ☠️ okänt radnummer' % nr); continue
        want = mal(r)[1] + (' · ' + r['farg'].split(' · ')[1] if ' · ' in r.get('farg', '') else '')
        if 'fel' in p:
            print('%-4s %-8s %-30s %-9s %-26s FEL: %s' % (nr, r['id8'], want[:30], '-', '-', str(p['fel'])[:90])); continue
        urls = p.get('bilder') or []
        sida = p.get('farg_pa_sidan', p.get('val_pa_sidan', ''))
        anm = []
        if p.get('antal') != len(urls):
            anm.append('antal %s ≠ %d adresser' % (p.get('antal'), len(urls)))
        if len(set(urls)) != len(urls):
            anm.append('%d dubbletter i listan' % (len(urls) - len(set(urls))))
        if [u for u in urls if not str(u).startswith(VARD)]:
            anm.append('adresser utanför img.aosomcdn.com')
        if not sida:
            anm.append('sidans färg/storlek saknas')
        st = farg_stammer(r, sida)
        if st is False:
            anm.append('☠️ FÄRGEN STÄMMER INTE (raden vill ha %s)' % mal(r)[1])
        elif st is None and 'farg' in r:
            anm.append('färgen: bedöm med ögat')
        if p.get('anmarkning'):
            anm.append('chatten: ' + str(p['anmarkning'])[:60])
        print('%-4s %-8s %-30s %-9s %-26s %s' % (nr, r['id8'], want[:30], '%s/%d' % (p.get('antal'), len(urls)), str(sida)[:26], '; '.join(anm) or '-'))
        svar.append((nr, r, urls))
    if not A['hamta']:
        return

    live = {}
    print('\nNedladdning och jämförelse:')
    hamtat = {}
    for nr, r, urls in svar:
        hamtat[nr] = hamta_svar(A['ut'], nr, urls)
    ocr_rader = {}
    if A['ocr']:
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=3) as pool:
            fut = {nr: pool.submit(ocr, A['ocr'], [x['fil'] for x in hamtat[nr] if x['ok']]) for nr, _, _ in svar}
            ocr_rader = {nr: f.result() for nr, f in fut.items()}
    for nr, r, urls in svar:
        h = hamtat[nr]
        ok = [x for x in h if x['ok']]
        info = []
        if len(ok) != len(h):
            info.append('☠️ %d ej bild/ej 200' % (len(h) - len(ok)))
        sma = [x['i'] for x in ok if max(x['w'], x['h']) < 700 or x['bytes'] < 15000]
        if sma:
            info.append('☠️ små/miniatyrer: ' + ','.join(map(str, sma)))
        if len(ok) != len({x['md5'] for x in ok}):
            info.append('byte-lika bilder i listan')
        langd = [max(x['w'], x['h']) for x in ok]
        print('\n== rad %s · %s · %s · %d kandidater, %s–%s px %s' % (nr, r['id8'], mal(r)[1], len(h), min(langd) if langd else '-', max(langd) if langd else '-', '; '.join(info)))

        gall, vy = {}, []
        if A['live']:
            jf = '%s/%s.json' % (A['live'], r['id8'])
            if not os.path.exists(jf):
                # live-par.sh skriver <prefix>_<id8>.json
                import glob
                traff = glob.glob('%s/*_%s.json' % (A['live'], r['id8']))
                jf = traff[0] if traff else jf
            if not os.path.exists(jf):
                print('  (ingen live-mätning för %s: kör live-par.sh eller live-bilder.mjs för sidan)' % r['id8'])
            else:
                if r['id8'] not in live:
                    j = json.load(open(jf))
                    live[r['id8']] = (j, hamta_galleri(A['ut'], r['id8'], j['unika']))
                j, gall = live[r['id8']]
                etikett = mal(r)[1].lower()
                k = next((k for k in j['kombos'] if k['val'].split('=')[-1].strip().lower() == etikett), None)
                vy = k['ids'] if k else []
                if not k:
                    print('  (valet %s finns inte i live-mätningen: %s)' % (mal(r)[1], ', '.join(x['val'] for x in j['kombos'])))
        ocrut = ocr_rader.get(nr, {})
        nya = 0
        sheet = []
        for x in h:
            etikett = 'k%d' % x['i']
            klass = '?'
            if x['ok'] and gall:
                best = min(((av(x['dh'], g[1]), fid) for fid, g in gall.items() if g[1] and x['dh']), default=(999, None))
                d, fid = best
                if d <= TROSKEL:
                    klass = 'FINNS%s g=%s d%d (%s)' % ('?' if d >= 8 else '', fid[7:13], d, 'i vyn' if fid in vy else 'annan vy/gemensam')
                else:
                    klass = 'NY (närmast d%d)' % d
                    nya += 1
            o = ocrut.get(os.path.basename(x['fil']), ('', ''))
            if x['ok']:
                sheet.append((x['fil'], ('%s %s %s' % (etikett, klass, o[0])).strip()))
            print('  k%-2d %-36s %-8s %5d px %s' % (x['i'], klass, o[0], max(x['w'], x['h']), o[1][:50]))
        if gall:
            print('  nya %d av %d' % (nya, len(h)))
        if sheet:
            ark(sheet, '%s/ark_%s.jpg' % (A['ut'], nr))
        if vy and gall:
            ark([(gall[fid][0], 'nu g=%s' % fid[7:13]) for fid in vy if fid in gall], '%s/nu_%s.jpg' % (A['ut'], nr))
    print('\nArk och bilder ligger i %s (bara scratchpad).' % A['ut'])


if __name__ == '__main__':
    main()
