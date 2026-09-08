# -*- coding: utf-8 -*-
"""Runda 101 — grind före skrivning.

Varje regel är TVÅVÄGS: den ska släppa igenom den riktiga texten OCH fälla en
muterad text där faktumet är borttaget eller felaktigt. En regel som bara
testas åt ena hållet är skriven, inte mätt.
"""
import re
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets/runda-101")
import texter as T

SYSKONRUBRIK = "<h2>Fler massagefåtöljer hos oss"


def lasform(h):
    """Tag-strippad, mellanslagsnormaliserad synlig text."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def ytor(h):
    """kropp = allt utom syskonlistan; prosa = kropp utan <ul>."""
    fore = h.split(SYSKONRUBRIK)[0]
    return lasform(fore), lasform(re.sub(r"<ul>.*?</ul>", " ", fore, flags=re.S))


# ---------------------------------------------------------------- reglerna

def r1_lieferumfang(pid, h, meta, namn, titel):
    """A och D saknar Fernbedienung i Lieferumfang -> lova ingen.
       B och C listar den -> den SKA nämnas."""
    m = T.MODELL[pid]
    allt = (h + " " + meta + " " + namn + " " + titel).lower()
    har = "fjärrkontroll" in allt
    if m in ("A", "D") and har:
        return "lovar fjärrkontroll trots att Lieferumfang inte listar en"
    if m in ("B", "C") and not har:
        return "nämner ingen fjärrkontroll fast Lieferumfang listar en"
    return None


def r2_mikrolasning(pid, h, *_):
    """Noten finns i A, B och C:s källor — INTE i D:s."""
    kropp, _ = ytor(h)
    har = "mikrolåsning" in kropp.lower()
    if T.MIKROLAS[T.MODELL[pid]] and not har:
        return "saknar mikrolåsningsnoten"
    if not T.MIKROLAS[T.MODELL[pid]] and har:
        return "bär en mikrolåsningsnot som inte finns i dess källa"
    return None


def r3_fotpallslast(pid, h, *_):
    """A anger ingen fotpallslast. B=100, C=20, D=60."""
    kropp, _ = ytor(h)
    last = T.PALLAST[T.MODELL[pid]]
    talen = {100, 20, 60}
    # ☠️ (?<!\d) behövs: "20 kg" matchar INUTI "120 kg", och modell A bär 120 kg.
    def bar(n):
        t = r"(?<!\d)%d kg" % n
        return (re.search(r"(?:fotpall|pall|ottoman)[^.]{0,60}" + t, kropp, re.I)
                or re.search(t + r"[^.]{0,40}(?:fotpall|pall|ottoman)", kropp, re.I))
    if last is None:
        for n in talen:
            if bar(n):
                return f"anger en fotpallslast ({n} kg) som källan inte har"
        return None
    if not re.search(r"(?<!\d)%d kg" % last, kropp):
        return f"saknar fotpallens maxlast {last} kg"
    for n in talen - {last}:
        if bar(n):
            return f"anger FEL fotpallslast ({n} kg, ska vara {last} kg)"
    return None


def r4_ryggvinkel(pid, h, *_):
    """A/B/C = 145°, D = 135°. Fel vinkel får aldrig stå."""
    kropp, _ = ytor(h)
    ratt, fel = ("135°", "145°") if T.MODELL[pid] == "D" else ("145°", "135°")
    if ratt not in kropp:
        return f"saknar ryggvinkeln {ratt}"
    if fel in kropp:
        return f"bär FEL ryggvinkel {fel}"
    return None


def r5_punkter(pid, h, *_):
    """A/B/C har tio punkter/lägen, D har åtta."""
    kropp, _ = ytor(h)
    if T.MODELL[pid] == "D":
        if "åtta vibrationspunkter" not in kropp.lower():
            return "saknar 'åtta vibrationspunkter'"
        if re.search(r"tio (?:vibrationslägen|massagepunkter)", kropp, re.I):
            return "bär tio punkter fast modellen har åtta"
    else:
        if not re.search(r"tio (?:vibrationslägen|massagepunkter)", kropp, re.I):
            return "saknar 'tio vibrationslägen/massagepunkter'"
        if "åtta vibrationspunkter" in kropp.lower():
            return "bär åtta punkter fast modellen har tio"
    return None


HALSA = re.compile(
    r"lindra|botar|behandla|läker|smärt|värk|blodcirkulation|muskelspänning|"
    r"terapeut|medicinsk|hälsoeffekt|stelhet", re.I)


def r6_halsopastaende(pid, h, meta, *_):
    """Steg 2: en vibrationsfåtölj är ingen medicinteknisk produkt."""
    tr = HALSA.search(lasform(h) + " " + meta)
    return f"hälsopåstående: {tr.group(0)!r}" if tr else None


LAND = re.compile(r"\bTyskland\b|\btyska lagret\b|\bskickas från\b|\bavsänds från\b", re.I)


def r7_land(pid, h, meta, *_):
    tr = LAND.search(lasform(h) + " " + meta)
    return f"skriver ut avsändarland: {tr.group(0)!r}" if tr else None


HUSET = re.compile(r"leverantör|tillverkaren uppger|vi vet inte|vi har inga uppgifter", re.I)


def r8_vi_ar_leverantoren(pid, h, meta, *_):
    tr = HUSET.search(lasform(h) + " " + meta)
    return f"husregelbrott: {tr.group(0)!r}" if tr else None


def r9_sifferstil(pid, h, meta, *_):
    txt = lasform(h) + " " + meta
    tr = re.search(r"\d+\.\d", txt)
    if tr:
        return f"decimalpunkt: {tr.group(0)!r}"
    tr = re.search(r"\d+\s*[x×]\s*\d+\s*[x×]", txt.replace(" × ", "§"))
    if tr:
        return f"mått utan mellanslag runt ×: {tr.group(0)!r}"
    tr = re.search(r"\d+,\s\d+\s+och\s+\d+\s*(cm|kg|mm)", txt)
    if tr:
        return f"kommalista av tal med enheten sist: {tr.group(0)!r}"
    return None


def r10_lankar(pid, h, *_):
    for tr in re.finditer(r'href="([^"]+)"', h):
        if not tr.group(1).startswith("https://www.fyndplats.se/produkt/"):
            return f"relativ eller felformad länk: {tr.group(1)!r}"
    return None


ARTNR = re.compile(r"\b\d{3}-\d{3}[A-Z0-9]*\b")


def r11_artikelnummer(pid, h, meta, namn, titel):
    tr = ARTNR.search(h + " " + meta + " " + namn + " " + titel)
    return f"artikelnummer läcker: {tr.group(0)!r}" if tr else None


def r12_korslankar(pid, h, *_):
    slugs = re.findall(r'href="https://www\.fyndplats\.se/produkt/([^"]+)"', h)
    if T.SLUGG[pid] in slugs:
        return "länkar till sig själv"
    vantat = {T.SLUGG[p] for p in T.PRODUKTER if p != pid}
    if set(slugs) != vantat:
        saknas = vantat - set(slugs)
        return f"korslänkar saknas: {sorted(saknas)}"
    return None


TYSKA = re.compile(
    r"\b(?:Sessel|Hocker|Relaxsessel|Massagesessel|Fußhocker|Rückenlehne|"
    r"Kunstleder|Fernbedienung|Lieferumfang|Neigungswinkel|Sitzhöhe|"
    r"Gesamtmaße|Schaumstoff|Ottomane|und|mit|der|die|das)\b")


def r13_tyska(pid, h, meta, namn, titel):
    tr = TYSKA.search(lasform(h) + " " + meta + " " + namn + " " + titel)
    return f"tyskt ord kvar: {tr.group(0)!r}" if tr else None


def r14_h2_rena(pid, h, *_):
    for tr in re.finditer(r"<h2>(.*?)</h2>", h, flags=re.S):
        if "<" in tr.group(1):
            return f"h2 innehåller markup: {tr.group(1)[:40]!r}"
    for rubrik in ("Tekniska specifikationer", "Vanliga frågor",
                   "Användning och skötsel"):
        if f"<h2>{rubrik}</h2>" not in h:
            return f"saknar fliken {rubrik!r}"
    return None


def r15_faq_form(pid, h, *_):
    if "<br" in h:
        return "innehåller <br> — Wix strippar den"
    fragor = re.findall(r"<p><strong>([^<]*\?)</strong></p><p>", h)
    if len(fragor) < 5:
        return f"färre än fem FAQ-frågor i rätt form ({len(fragor)})"
    return None


REGLER = [
    ("1 Lieferumfang: fjärrkontroll", r1_lieferumfang),
    ("2 mikrolåsningsnoten", r2_mikrolasning),
    ("3 fotpallens maxlast", r3_fotpallslast),
    ("4 ryggvinkel", r4_ryggvinkel),
    ("5 antal punkter", r5_punkter),
    ("6 inga hälsopåståenden", r6_halsopastaende),
    ("7 inget avsändarland", r7_land),
    ("8 vi är leverantören", r8_vi_ar_leverantoren),
    ("9 svensk sifferstil", r9_sifferstil),
    ("10 absoluta länkar", r10_lankar),
    ("11 inget artikelnummer", r11_artikelnummer),
    ("12 korslänkar kompletta", r12_korslankar),
    ("13 ingen tyska", r13_tyska),
    ("14 rena h2-rubriker", r14_h2_rena),
    ("15 FAQ-formen", r15_faq_form),
]


def granska(pid):
    h = T.bygg(pid)
    return [(namn, f) for namn, regel in REGLER
            for f in [regel(pid, h, T.SEO_BESKRIVNING[pid], T.NAMN[pid],
                            T.SEO_TITEL[pid])] if f]


# ------------------------------------------------------- mutationstesterna
# Varje mutation ska fälla EXAKT den regel den siktar på.

MUTATIONER = [
    ("1", "cd7e9036", lambda h: h.replace("handkontrollen", "fjärrkontrollen")),
    ("1", "1932abe1", lambda h: re.sub("(?i)fjärrkontroll", "reglag", h)),
    ("2", "b8b6fee1", lambda h: h.replace("<h2>Vanliga frågor</h2>",
        "<p>Ryggen har en mikrolåsning.</p><h2>Vanliga frågor</h2>")),
    ("2", "cd7e9036", lambda h: h.replace("mikrolåsning", "spärr")),
    ("3", "cd7e9036", lambda h: h.replace("<h2>Vanliga frågor</h2>",
        "<p>Fotpallen bär 100 kg.</p><h2>Vanliga frågor</h2>")),
    ("3", "54d25930", lambda h: h.replace("20 kg", "60 kg")),
    ("4", "b8b6fee1", lambda h: h.replace("135°", "145°")),
    ("4", "cd7e9036", lambda h: h.replace("145°", "138°")),
    ("5", "b8b6fee1", lambda h: h.replace("åtta vibrationspunkter", "tio massagepunkter")),
    ("5", "1932abe1", lambda h: h.replace("Tio massagepunkter", "Åtta vibrationspunkter")
                                 .replace("tio massagepunkter", "åtta vibrationspunkter")),
    ("6", "9c8a7a80", lambda h: h.replace("</p><h2>Tekniska",
        " Massagen lindrar värk i ryggen.</p><h2>Tekniska")),
    ("7", "89fead7d", lambda h: h.replace("</p><h2>Tekniska",
        " Varan skickas från Tyskland.</p><h2>Tekniska")),
    ("8", "c50fa916", lambda h: h.replace("</p><h2>Tekniska",
        " Leverantören anger 160 kg.</p><h2>Tekniska")),
    ("9", "7062dc79", lambda h: h.replace("51,5 cm", "51.5 cm").replace("1,2 A", "1.2 A")),
    ("10", "cd7e9036", lambda h: h.replace('href="https://www.fyndplats.se/produkt/',
                                           'href="/produkt/')),
    ("11", "b8b6fee1", lambda h: h.replace("</p><h2>Tekniska",
        " Artikelnummer 700-164V90BK.</p><h2>Tekniska")),
    ("12", "1932abe1", lambda h: re.sub(
        r'<li><a href="https://www\.fyndplats\.se/produkt/massagefatolj-tyg[^<]*</a>[^<]*</li>',
        "", h)),
    ("13", "54d25930", lambda h: h.replace("Fotpallen", "Fußhocker")),
    ("14", "89fead7d", lambda h: h.replace("<h2>Vanliga frågor</h2>",
        '<h2><span style="font-weight: 700">Vanliga frågor</span></h2>')),
    ("15", "9c8a7a80", lambda h: h.replace("</strong></p><p>", "</strong><br>")),
]


def sjalvtest():
    ok = fel = 0
    for regelnr, pid, mutera in MUTATIONER:
        h = mutera(T.bygg(pid))
        traffar = {namn.split()[0] for namn, _ in
                   [(n, f) for n, r in REGLER
                    for f in [r(pid, h, T.SEO_BESKRIVNING[pid], T.NAMN[pid],
                                T.SEO_TITEL[pid])] if f]}
        if regelnr in traffar:
            ok += 1
        else:
            fel += 1
            print(f"  ☠️ mutation mot regel {regelnr} på {pid} FÅNGADES INTE "
                  f"(fällde i stället: {sorted(traffar) or 'ingenting'})")
    return ok, fel


if __name__ == "__main__":
    print("=== självtest: varje mutation ska fälla sin regel ===")
    ok, fel = sjalvtest()
    print(f"  {ok}/{ok + fel} mutationer fångade\n")

    print("=== den riktiga texten ===")
    brister = 0
    for pid in T.PRODUKTER:
        f = granska(pid)
        brister += len(f)
        status = "✅" if not f else "☠️"
        print(f"  {status} {pid} {T.MODELL[pid]}")
        for namn, txt in f:
            print(f"       regel {namn}: {txt}")
    print(f"\n  {brister} brister i {len(T.PRODUKTER)} texter")
    sys.exit(1 if (fel or brister) else 0)
