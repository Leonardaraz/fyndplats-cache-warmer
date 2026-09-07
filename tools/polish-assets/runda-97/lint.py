# -*- coding: utf-8 -*-
"""Runda 97 — mekanisk grind mot texterna i filen.

☠️ REGEL 1 ÄR RUNDANS EGEN: INGA HÄLSOPÅSTÅENDEN. Fem av sex utkast säljer
   den upphöjda skålen på hälsa, och den största studien pekar åt motsatt
   håll (se `texter.py`). Grinden är en ORDLISTA, inte en bedömning — en
   bedömning glider, en ordlista gör det inte.

☠️ REGEL 2: TALEN FÖRANKRAS I SPEC-TABELLEN. Vitlistan byggs ur `SPEC`, som
   är de MÄTTA värdena. Ett tal i brödtexten som inte står i spec-tabellen
   måste stå i `EXTRA` med en motivering — annars är det ohärlett, och ett
   ohärlett tal är precis vad #326 handlar om.

☠️ REGEL 3: MATERIALET SKA VARA TVÅDELAT PÅ MÖBLERNA. Fyra av sex är byggda
   i träfiberskiva men importens spec-rad säger "rostfritt stål". Sidan ska
   säga BÅDA delarna, aldrig bara den ena.
"""
import re
import sys

import texter as T

SLUGGAR = set(T.SLUGG.values())

# ---------------------------------------------------------------- ordlistor

HALSA = [
    r"magomvridn", r"uppblåsthet", r"matsmältn", r"matspjälkn",
    r"nack(e|en|ar)", r"rygg(en|rad)?", r"led(er|erna)", r"artros",
    r"höftled", r"hållning", r"skonsam", r"skonar", r"avlastar",
    r"belastning", r"veterinär", r"hälsosam", r"nyttigare", r"bättre för",
    r"ergonomisk", r"kroppshållning", r"sväljer", r"äter långsammare",
]
FORBJUDET = [
    (r"aosom|outsunny|homcom|pawhut|vinsetto|aiyaplay", "leverantör/husmärke"),
    (r"leverantör|tillverkar|fabrikant|importör", "mot kunden är VI leverantören"),
    (r"tyskland|spanien|skickas från", "avsändarland"),
    (r"futterstation|n[äa]pf|edelstahl|schulterhöhe|hinweis|stauraum", "tyska"),
    (r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b", "artikelnummer"),
    (r"artikelnummer|modellreferens|artikelnr", "artikelnummer som etikett"),
    (r"[\U0001F300-\U0001FAFF☀-➿]", "emoji i kundtext"),
    (r"runda \d|steg \d", "intern jargong (#318)"),
]

# ⚠️ Tal som INTE står i spec-tabellen men ändå är riktiga. Varje rad är en
#    motivering; en tom motivering är inte tillåten.
EXTRA = {
    "e8102582": {"2": "två skålar", "34": "korslänk, skåpets höjd",
                 "42": "korslänk", "47": "korslänk"},
    "1fc55b3d": {"2": "två skålar", "3": "tre lutningar", "4": "fyra höjder",
                 "11": "korslänk till 11–33 cm", "33": "korslänk",
                 "34": "korslänk", "42": "korslänk", "47": "korslänk"},
    "2e2b2366": {"2": "två skålar", "3": "tre höjder", "11": "korslänk",
                 "33": "korslänk", "34": "korslänk", "42": "korslänk"},
    "868cc038": {"2": "två skålar", "11": "korslänk", "33": "korslänk",
                 "42": "korslänk", "47": "korslänk"},
    "7628983b": {"2": "två skålar", "11": "korslänk", "33": "korslänk",
                 "34": "korslänk", "47": "korslänk"},
    "75556831": {"2": "två skålar", "3": "tre krokar", "11": "korslänk",
                 "33": "korslänk", "42": "korslänk", "30": "korslänk, 30 liter"},
}


def tal_i(txt):
    return set(re.findall(r"\d+(?:[,.]\d+)?", txt))


def vitlista(pid):
    ut = set()
    for k, v in T.SPEC[pid]:
        ut |= tal_i(v)
    ut |= set(EXTRA[pid])
    return ut


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def lasform(h):
    """Inline-taggar bort UTAN blanksteg — se runda 96:s lärdom."""
    h = re.sub(r"</?(?:a|span|strong|em|b|i)\b[^>]*>", "", h)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def granska(pid, h, namn, titel, meta):
    f = []
    txt = lasform(h)
    allt = (txt + " " + namn + " " + titel + " " + meta).lower()

    # 1 — hälsopåståenden
    for m in HALSA:
        tr = re.search(m, allt)
        if tr:
            f.append("HÄLSOPÅSTÅENDE %r — Steg 2-grinden" % tr.group(0))

    # 2 — förbjudna ord
    for m, vad in FORBJUDET:
        tr = re.search(m, allt)
        if tr:
            f.append("%s: %r" % (vad, tr.group(0)))

    # ☠️ DUBBELT BLANKSTEG MÅSTE MÄTAS PÅ RÅ HTML. Låg tidigare i FORBJUDET,
    #    som körs på lasform() — och lasform() normaliserar bort just det den
    #    letade efter. En regel som mäter sin egen normalisering fäller aldrig.
    if re.search(r"(?<!>)  (?!<)", re.sub(r"<[^>]+>", "", h)):
        f.append("dubbelt blanksteg i brödtexten")

    # 3 — ohärledda tal
    vit = vitlista(pid)
    for tal in tal_i(txt + " " + namn + " " + titel + " " + meta):
        if tal not in vit:
            f.append("ohärlett tal %r (står inte i spec och inte i EXTRA)" % tal)

    # 4 — materialet tvådelat
    if not re.search(r"skålar(na)?.{0,40}rostfritt", txt, re.S) and \
       not re.search(r"rostfria skålar", txt):
        f.append("skålarnas material sägs inte")
    stomme = dict(T.SPEC[pid]).get("Stomme", "")
    if "träfiberskiva" in stomme and "träfiberskiva" not in txt:
        f.append("stommen är träfiberskiva men ordet står inte i texten")
    if "träfiberskiva" in stomme and re.search(
            r"\bmöbel i (rostfritt|stål)\b", txt):
        f.append("möbeln kallas stål trots träfiberstomme")

    # 5 — spec-tabellen ska stå ordagrant i html
    for k, v in T.SPEC[pid]:
        if ("<strong>%s:</strong> %s" % (k, v)) not in h:
            f.append("spec-raden %r saknas eller avviker" % k)

    # 6 — länkar
    for href in re.findall(r'href="([^"]+)"', h):
        if not href.startswith(T.BAS):
            f.append("icke-absolut länk %r" % href)
            continue
        slug = href[len(T.BAS):]
        if slug not in SLUGGAR:
            f.append("länk till okänd slug %r" % slug)
        if slug == T.SLUGG[pid]:
            f.append("länkar till sig själv")

    # 7 — längder
    if len(namn) > 80:
        f.append("namnet är %d tecken (max 80)" % len(namn))
    if len(titel) > 60:
        f.append("seo-titeln är %d tecken" % len(titel))
    if not (110 <= len(meta) <= 165):
        f.append("meta är %d tecken (110–165)" % len(meta))

    # 8 — sökordet ska stå i namn och meta
    huvud = T.SOKORD[pid].split()[0]
    if huvud not in namn.lower() or huvud not in meta.lower():
        f.append("sökordet %r saknas i namn eller meta" % huvud)

    # 9 — struktur
    for rubrik in ("Tekniska specifikationer", "Användning och skötsel",
                   "Vanliga frågor"):
        if ("<h2>%s</h2>" % rubrik) not in h:
            f.append("rubriken %r saknas" % rubrik)
    return f


# ------------------------------------------------------------- självtest

def sjalvtest():
    """Varje regel ska fälla när den bryts. En grind ingen testat är ingen."""
    pid = "868cc038"
    h0 = T.beskrivning(pid)
    n0, t0, m0 = T.namn(pid), T.seo_titel(pid), T.seo_beskrivning(pid)

    def kor(h=h0, n=n0, t=t0, m=m0):
        return granska(pid, h, n, t, m)

    fall = [
        ("hälsa: nacke", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=h0.replace("Kaffebrun", "Skonar hundens nacke"))),
        ("hälsa: magomvridning", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=h0 + "<p>Minskar risken för magomvridning.</p>")),
        ("hälsa: bättre för", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=h0 + "<p>Det är bättre för hunden.</p>")),
        ("hälsa: ergonomisk", "HÄLSOPÅSTÅENDE",
         lambda: kor(m=m0.replace("Kaffebrun", "Ergonomisk"))),
        ("husmärke", "leverantör/husmärke",
         lambda: kor(h=h0.replace("Kaffebrun", "PawHut kaffebrun"))),
        ("leverantören anger", "mot kunden är VI",
         lambda: kor(h=h0.replace("Två rostfria", "Leverantören anger två rostfria"))),
        ("avsändarland", "avsändarland",
         lambda: kor(h=h0 + "<p>Skickas från Tyskland.</p>")),
        ("tyska", "tyska",
         lambda: kor(h=h0.replace("skålar", "Näpfe"))),
        ("artikelnummer", "artikelnummer",
         lambda: kor(h=h0 + "<p>Artikelnummer: 845-030CG.</p>")),
        ("emoji", "emoji",
         lambda: kor(h=h0 + "<p>Bra val ✅</p>")),
        ("jargong", "intern jargong",
         lambda: kor(h=h0 + "<p>Se runda 4.</p>")),
        ("ohärlett tal", "ohärlett tal",
         lambda: kor(h=h0.replace("9,8 kg", "9,9 kg"))),
        ("ohärlett tal i meta", "ohärlett tal",
         lambda: kor(m=m0.replace("9,8 kg", "8,7 kg"))),
        ("spec-rad ändrad", "spec-raden",
         lambda: kor(h=h0.replace("<strong>Vikt:</strong> 9,8 kg",
                                  "<strong>Vikt:</strong> 9,7 kg"))),
        ("skålmaterial borta", "skålarnas material",
         lambda: kor(h=h0.replace("rostfri", "blank").replace("rostfritt", "blankt"))),
        ("relativ länk", "icke-absolut länk",
         lambda: kor(h=h0.replace('href="%s' % T.BAS, 'href="/'))),
        ("okänd slug", "okänd slug",
         lambda: kor(h=h0.replace(T.SLUGG["7628983b"], "hittepa"))),
        ("självlänk", "länkar till sig själv",
         lambda: kor(h=h0.replace(T.SLUGG["7628983b"], T.SLUGG[pid]))),
        ("för långt namn", "namnet är",
         lambda: kor(n=n0 + " " + "x" * 40)),
        ("för lång titel", "seo-titeln är",
         lambda: kor(t=t0 + " " + "x" * 40)),
        ("för kort meta", "meta är",
         lambda: kor(m="Kort.")),
        ("sökord borta ur namn", "sökordet",
         lambda: kor(n=n0.replace("Matskåp", "Möbel"))),
        ("rubrik borta", "rubriken",
         lambda: kor(h=h0.replace("<h2>Vanliga frågor</h2>", ""))),
        ("dubbelt blanksteg", "dubbelt blanksteg",
         lambda: kor(h=h0.replace("Kaffebrun", "Kaffe  brun"))),
    ]
    ok = 0
    for namn_t, vantat, f in fall:
        brister = f()
        traff = any(vantat in b for b in brister)
        print("  %s %-24s %s" % ("✓" if traff else "✗", namn_t,
                                 "" if traff else "FÄLLDE INTE"))
        ok += traff
    rent = granska(pid, h0, n0, t0, m0)
    print("  %s %-24s %s" % ("✓" if not rent else "✗", "ren text passerar",
                             "" if not rent else rent[:2]))
    ok += not rent
    print("\n%d/%d självtest" % (ok, len(fall) + 1))
    return ok == len(fall) + 1


if __name__ == "__main__":
    print("=== självtest ===")
    allt_ok = sjalvtest()
    print("\n=== granskning ===")
    fel = 0
    for pid in T.PRODUKTER:
        h = T.beskrivning(pid)
        b = granska(pid, h, T.namn(pid), T.seo_titel(pid), T.seo_beskrivning(pid))
        print("%s  %s  %4d tecken  %s" % (pid, T.GRUPP[pid], len(synlig(h)),
                                          "OK" if not b else "%d BRISTER" % len(b)))
        for x in b:
            print("    ✗", x)
            fel += 1
    print("\n%d brister" % fel)
    sys.exit(0 if (allt_ok and not fel) else 1)
