# -*- coding: utf-8 -*-
"""Runda 95 — grind mot de fyra dubbeltakstexterna.

`python3 lint.py` lintar, `python3 lint.py --sjalvtest` bevisar att varje regel
faller pa SIN EGEN skada. En grind som aldrig provats ar skriven, inte matt.

☠️ TALGRINDEN AR PER PRODUKT, INTE PER GRUPP (runda 95:s egen lardom). De tva
   3 x 3-taken ar INTE samma duk: 88 x 88 cm mot 86 x 86 cm, 174 cm mot en
   oppning pa 68 x 68 cm. En grupp-gemensam vitlista hade slappt igenom
   grannens matt i den egna spec-tabellen — precis den forvaxling runbooken
   varnar for.

☠️ TALGRINDEN AR ZONERAD (runda 92). Ett stycke med `<a href` namner
   syskonet och far bara stan.

☠️ YTVIKTEN GRINDAS SEPARAT OCH AT BADA HALLEN. 271327e1:s kalla motsager sig
   sjalv (170 i punktlistan, 180 i tabellen) — den sidan far darfor INTE bara
   nagon g/m2 alls. De ovriga tre MASTE bara 180 i spec-Material. Regeln laser
   HTML:EN, inte texter.py: runda 94 matte att en grind som provar sin egen
   kalla inte kan se en skada i utdatan.

☠️ LILLA TAKET LASES UR HTML:EN och jamfors mot produktens EGET matt. Det ar
   det enda talet som skiljer de tva syskonen at i klartext.

☠️ INTERN NOTATION AR KUNDTEXT SA FORT DEN NAR HTML:EN. Utkastet bar ett
   varningsemoji mitt i en syskonlank — runbookens egen markering, kopierad
   rakt in i en saljande mening. Regel 18 falla pa det.
"""
import re
import sys

import texter as T

TAL = re.compile(r"\d+(?:[,.]\d+)?")
STYCKE = re.compile(r"<(?:p|li)\b[^>]*>.*?</(?:p|li)>", re.S)

# ☠️ EN UPPSATTNING PER PRODUKT. Syskonen delar inte matt.
TAL_OK = {
    "b6ebc5ba": {"3", "88", "174", "18", "180", "2,6", "32", "43", "7"},
    "271327e1": {"3", "300", "86", "68", "18", "2,5", "32", "7", "42"},
    "ef0a812d": {"3", "4", "94", "47", "20", "180", "2,7", "35", "9", "42"},
    "dc7d2513": {"3", "4", "94", "47", "20", "180", "2,7", "35", "9", "42"},
}

# Lilla taket, ur varje produkts EGEN mattritning.
LILLA_TAKET = {"b6ebc5ba": "88 × 88 cm", "271327e1": "86 × 86 cm",
               "ef0a812d": "94 × 47 cm", "dc7d2513": "94 × 47 cm"}

FARGORD = ["beige", "creme", "brun", "mörkbrun", "grå", "mörkgrå", "gråbrun",
           "svart", "vit", "grön", "mörkgrön", "blå", "röd", "roströd",
           "khaki", "antracit", "ljusgrå", "kolgrå", "kaffebrun", "cremevit"]

# ☠️ ORDLISTAN VALJS PER FAMILJ. Prefix som matchar svenska ord hor hemma i
#    TYSKA_HELORD i stallet — runda 94 fick "sku" att falla pa "skulle".
TYSKA = ["ersatzdach", "pavillon", "dach", "wasser", "stoff", "oberteil",
         "abmessungen", "farbe", "klett", "randhöhe", "randhohe", "gewicht",
         "kohlegrau", "rostrot", "cremeweiss", "kaffee", "geeignet",
         "abgeschrägte", "lieferumfang", "polyester-", "grün"]
TYSKA_HELORD = ["sku", "serie", "stück", "netz", "dach", "farbe"]

MARKEN = ["aosom", "outsunny", "homcom", "pawhut", "vinsetto", "aiyaplay",
          "dealproffsen", "aliexpress"]

LAND = ["tyskland", "spanien", "kina", "polen", "nederländerna", "tjeckien",
        "skickas från", "avsändarland", "lagerland"]

ARTIKELNUMMER = re.compile(r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b")

# ☠️ Runbookens egna markorer ar INTE kundtext.
NOTATION = re.compile(r"[⚠☠✅❌✓✗️]|TODO|☠|⚠|✅")

SLUGGAR = set(T.SLUGG.values()) | {T.CREME}


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def stycken(h):
    return STYCKE.findall(h)


def granska(pid, h, namn, seo_t, seo_b, kort):
    f = []
    grupp = T.GRUPP[pid]
    egen_farg = T.FARG[pid]
    txt = synlig(h).lower()
    kortext = "%s %s" % (kort[0], kort[1])
    allt = " ".join([txt, namn.lower(), seo_t.lower(), seo_b.lower(),
                     kortext.lower()])

    # 1 — tyska ordstammar, med ordgräns
    for ord in TYSKA:
        if re.search(r"(?<![a-zåäöüß])%s" % re.escape(ord), allt):
            f.append("tysk term %r" % ord)
    for ord in TYSKA_HELORD:
        if re.search(r"(?<![a-zåäöüß])%s(?![a-zåäöüß])" % re.escape(ord), allt):
            f.append("tysk term %r" % ord)

    # 2 — leverantör och husmärken
    for m in MARKEN:
        if m in allt:
            f.append("leverantör/husmärke %r" % m)

    # 3 — artikelnummer i någon form
    if ARTIKELNUMMER.search(allt):
        f.append("artikelnummer-mönster: %r" % ARTIKELNUMMER.search(allt).group(0))
    for etikett in ("artikelnummer", "modellreferens", "artikelnr", "referens"):
        if etikett in allt:
            f.append("artikelnummer-etikett %r" % etikett)

    # 4 — avsändarland
    for l in LAND:
        if l in allt:
            f.append("avsändarland %r" % l)

    # 5 — pris
    if re.search(r"\d+\s*(?:kr\b|kronor|:-)", allt) or "rabatt" in allt:
        f.append("pris eller rabatt i texten")

    # 6 — zonerad talgrind i HTML:en
    for st in stycken(h):
        if "<a href" in st:
            continue
        for tal in TAL.findall(synlig(st)):
            if tal not in TAL_OK[pid]:
                f.append("okänt tal %r utanför ett länkstycke" % tal)

    # 6b — namn, SEO och kort bär inga länkar och grindas ozonerat
    for etikett, s in (("namnet", namn), ("seo-titeln", seo_t),
                       ("seo-beskrivningen", seo_b), ("kortet", kortext)):
        for tal in TAL.findall(s):
            if tal not in TAL_OK[pid]:
                f.append("okänt tal %r i %s" % (tal, etikett))

    # 7 — zonerad färggrind
    for st in stycken(h):
        if "<a href" in st:
            continue
        s = synlig(st).lower()
        for farg in FARGORD:
            if farg == egen_farg:
                continue
            if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % farg, s):
                f.append("främmande färg %r utanför ett länkstycke" % farg)

    # 8 — obligatoriska påståenden
    #     ☠️ Imperativen läses MED VERSAL — ett gement "mät" mitt i en mening
    #        uppfyllde kravet i runda 94 utan att sidan bar en uppmaning.
    if not re.search(r"(?<![A-Za-zÅÄÖåäö])Mät(?![a-zåäö])", synlig(h)):
        f.append("saknar uppmaningen att mäta stommen")
    krav = [(r"vattenavvisande", "saknar att duken är vattenavvisande, inte tät"),
            (r"stommen följer inte med", "saknar att stommen inte ingår"),
            (r"måttbilden", "saknar hänvisningen till måttbilden i galleriet")]
    for m, txtfel in krav:
        if not re.search(m, txt):
            f.append(txtfel)

    # 9 — "vattentät" får BARA stå som fråga eller förnekande
    for st in stycken(h):
        s = synlig(st).lower()
        if "vattentät" not in s:
            continue
        if not (s.rstrip().endswith("?") or s.lstrip().startswith("nej")
                or re.search(r"(?:inte|aldrig) vattentät", s)):
            f.append("vattentät som PÅSTÅENDE: %r" % s[:60])

    # 10 — mot kunden är VI leverantören
    if re.search(r"leverantör", allt):
        f.append("ordet leverantör i kundtext")

    # 11 — länkar: absoluta, kända sluggar, aldrig till sig själv
    for href in re.findall(r'href="([^"]+)"', h):
        if not href.startswith(T.BAS):
            f.append("icke-absolut länk %r" % href)
            continue
        slug = href[len(T.BAS):]
        if slug not in SLUGGAR:
            f.append("länk till okänd slug %r" % slug)
        if slug == T.SLUGG[pid]:
            f.append("sidan länkar till sig själv")
    if "https:/produkt" in h:
        f.append("trasig relativ länk (https:/produkt)")

    # 12 — mätt färg: tyskan säger "Kohlegrau" om en duk som är MÄTT grön
    if re.search(r"(?<![a-zåäö])(?:kolgrå|mörkgrå|grå)(?![a-zåäö])", allt) \
            and pid == "b6ebc5ba":
        f.append("grå på den duk som är MÄTT mörkgrön (tyskan säger fel)")
    if re.search(r"(?<![a-zåäö])kaffe\w*", allt) and pid == "ef0a812d":
        f.append("kaffefärg på den duk som är MÄTT roströd (namnet säger fel)")

    # 13 — spec-Material, LAST UR HTML:EN
    #      ☠️ 271327e1 far INTE bara nagon ytvikt: kallan sager 170 pa ett
    #         stalle och 180 pa ett annat i SAMMA dokument.
    mm = re.search(r"<strong>Material:</strong>\s*([^<]*)", h)
    material = mm.group(1) if mm else ""
    if not material:
        f.append("spec-tabellen saknar Material")
    if pid == "271327e1":
        if re.search(r"\d+\s*g/m", material) or re.search(r"\d+\s*g/m", txt):
            f.append("271327e1 bär en ytvikt — källan motsäger sig själv (170 vs 180)")
    elif "180" not in material:
        f.append("spec-Material saknar 180 g/m²: %r" % material)

    # 13b — lilla taket, LAST UR HTML:EN, mot produktens EGEN ritning
    lm = re.search(r"<strong>Lilla taket:</strong>\s*([^<]*)", h)
    lilla = (lm.group(1) if lm else "").strip()
    if lilla != LILLA_TAKET[pid]:
        f.append("spec-Lilla taket är %r, ritningen säger %r"
                 % (lilla, LILLA_TAKET[pid]))

    # 14a — ☠️ WIX TAR HOGST 80 TECKEN I product.name (uppmatt runda 94)
    if len(namn) > 80:
        f.append("namnet är %d tecken — Wix tar högst 80" % len(namn))

    # 14b — kortets underrad måste namnge den här dukens färg
    if egen_farg[:4].lower() not in kort[1].lower():
        f.append("kortets underrad namnger inte dukens färg: %r" % kort[1])

    # 15 — inga osynliga tecken (skrivna som kodpunkter, aldrig som tecken)
    for kod, vad in ((0x00A0, "hårt blanksteg"), (0x200B, "nollbreddsmellanrum"),
                     (0x2060, "word joiner"), (0x00AD, "mjukt bindestreck")):
        if chr(kod) in h + namn + seo_t + seo_b + kortext:
            f.append("osynligt tecken: %s (U+%04X)" % (vad, kod))

    # 16 — inga tidslöften
    if re.search(r"\d+\s*minut", txt) or "på fem minuter" in txt:
        f.append("tidslöfte om montering")

    # 17 — ingen intern jargong
    for j in ("rundan", "utkast", "poleras", "mappning", "batch"):
        if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % j, allt):
            f.append("intern jargong %r" % j)

    # 18 — ☠️ RUNBOOKENS EGEN NOTATION AR INTE KUNDTEXT
    m = NOTATION.search(h + namn + seo_t + seo_b + kortext)
    if m:
        f.append("intern notation i kundtext: %r" % m.group(0))

    # 19 — storleken i namnet måste vara produktens egen
    if T.STORLEK[grupp] not in namn:
        f.append("namnet bär inte produktens storlek %r" % T.STORLEK[grupp])

    return f


def kor():
    fel = 0
    for pid in T.PRODUKTER:
        h = T.beskrivning(pid)
        f = granska(pid, h, T.namn(pid), T.seo_titel(pid), T.seo_beskrivning(pid),
                    T.KORT[pid])
        print("%s  %s  %d tecken html  %d synliga tecken  %s"
              % (pid, T.GRUPP[pid], len(h), len(synlig(h)),
                 "OK" if not f else "%d BRISTER" % len(f)))
        for x in f:
            print("    ✗", x)
            fel += 1
    print("\n%s" % ("0 brister" if not fel else "%d brister" % fel))
    return fel


# ---------------------------------------------------------------- självtest

def sjalvtest():
    """Varje regel ska falla pa SIN EGEN skada — annars ar den inte matt."""
    bas = "b6ebc5ba"
    h0 = T.beskrivning(bas)
    n0, t0, b0 = T.namn(bas), T.seo_titel(bas), T.seo_beskrivning(bas)
    k0 = T.KORT[bas]

    def rakna(h=None, n=None, t=None, b=None, k=None, pid=bas):
        return granska(pid, h or h0, n or n0, t or t0, b or b0, k or k0)

    if rakna():
        print("SJÄLVTEST AVBRUTET: basen är inte ren")
        for x in rakna():
            print("   ", x)
        return 1

    fall = [
        ("tysk term", "tysk term",
         lambda: rakna(h=h0.replace("Kanthöjd", "Randhöhe"))),
        ("husmärke", "leverantör/husmärke", lambda: rakna(n="Outsunny paviljongtak")),
        ("artikelnummer", "artikelnummer-mönster",
         lambda: rakna(h=h0.replace("174 cm", "84C-741 cm"))),
        ("artikelnummer-etikett", "artikelnummer-etikett",
         lambda: rakna(h=h0.replace("Kanthöjd", "Artikelnummer"))),
        ("avsändarland", "avsändarland", lambda: rakna(b=b0 + " Skickas från Tyskland.")),
        ("pris", "pris eller rabatt", lambda: rakna(h=h0.replace("Vikt", "Pris 749 kr, vikt"))),
        ("okänt tal i html", "okänt tal",
         lambda: rakna(h=h0.replace("2,6 kg", "3,4 kg"))),
        ("okänt tal i seo", "okänt tal",
         lambda: rakna(b=b0.replace("174 cm", "218 cm"))),
        # ☠️ Syskonets matt i den egna texten — rundans farligaste forvaxling.
        ("syskonets mått", "okänt tal",
         lambda: rakna(h=h0.replace("88 × 88 cm", "86 × 86 cm"))),
        ("främmande färg", "främmande färg",
         lambda: rakna(h=h0.replace("Fast tak", "Beige tak"))),
        ("saknar mät", "uppmaningen att mäta", lambda: rakna(h=h0.replace("Mät", "Kolla"))),
        ("saknar vattenavvisande", "vattenavvisande, inte tät",
         lambda: rakna(h=h0.replace("Vattenavvisande", "Praktisk")
                       .replace("vattenavvisande", "praktisk"))),
        ("saknar stommen", "stommen inte ingår",
         lambda: rakna(h=h0.replace("stommen följer inte med", "allt behövs"))),
        ("saknar måttbilden", "måttbilden i galleriet",
         lambda: rakna(h=h0.replace("måttbilden", "bilden"))),
        ("vattentät som påstående", "vattentät som PÅSTÅENDE",
         lambda: rakna(h=h0 + "<p>Duken är vattentät och tål allt.</p>")),
        ("leverantör", "ordet leverantör",
         lambda: rakna(h=h0.replace("Ta ned duken", "Leverantören anger att duken"))),
        ("relativ länk", "icke-absolut länk",
         lambda: rakna(h=h0.replace('href="%s' % T.BAS, 'href="/'))),
        ("okänd slug", "okänd slug", lambda: rakna(h=h0.replace(T.CREME, "hittepa-sida"))),
        ("grå på den gröna", "MÄTT mörkgrön", lambda: rakna(b=b0 + " Grå duk.")),
        ("kaffe på den roströda", "MÄTT roströd",
         lambda: rakna(pid="ef0a812d", h=T.beskrivning("ef0a812d"),
                       n=T.namn("ef0a812d"), t=T.seo_titel("ef0a812d"),
                       b=T.seo_beskrivning("ef0a812d") + " Kaffebrun duk.",
                       k=T.KORT["ef0a812d"])),
        ("spec-Material utan 180", "spec-Material saknar 180",
         lambda: rakna(h=h0.replace("polyester, 180 g/m², med PA-beläggning på baksidan</li>",
                                    "polyester med PA-beläggning</li>"))),
        ("lilla taket fel i spec", "spec-Lilla taket är",
         lambda: rakna(h=h0.replace("<strong>Lilla taket:</strong> 88 × 88 cm",
                                    "<strong>Lilla taket:</strong> 86 × 86 cm"))),
        ("kortets underrad", "kortets underrad",
         lambda: rakna(k=("Paviljongtak", "Duk med litet tak"))),
        ("namn över 80 tecken", "Wix tar högst 80",
         lambda: rakna(n=n0 + " i polyester med PA-beläggning på baksidan")),
        # ☠️ Skadan skrivs som KODPUNKT, aldrig som tecken.
        ("osynligt tecken", "osynligt tecken",
         lambda: rakna(h=h0.replace("88 × 88", "88" + chr(0x00A0) + "× 88"))),
        ("tidslöfte", "tidslöfte", lambda: rakna(h=h0.replace("utan verktyg", "på 5 minuter"))),
        ("intern jargong", "intern jargong", lambda: rakna(b=b0 + " Ur rundan.")),
        ("intern notation", "intern notation",
         lambda: rakna(h=h0.replace("Måtten på", "⚠️ Måtten på"))),
        ("fel storlek i namnet", "bär inte produktens storlek",
         lambda: rakna(n="Paviljongtak 3 × 4 m dubbeltak – mörkgrön reservduk")),
    ]
    dalig = 0
    for namn_, vantat, kor_ in fall:
        brister = kor_()
        traff = [b for b in brister if vantat in b]
        if traff:
            print("  %-26s fäller: %s" % (namn_, traff[0][:66]))
        else:
            print("  %-26s ☠️ FEL REGEL ELLER INGEN: %s"
                  % (namn_, brister[0][:60] if brister else "inga brister alls"))
            dalig += 1
    print("\n%d/%d regler faller PÅ SIN EGEN skada" % (len(fall) - dalig, len(fall)))
    return dalig


if __name__ == "__main__":
    if "--sjalvtest" in sys.argv:
        sys.exit(1 if sjalvtest() else 0)
    sys.exit(1 if kor() else 0)
