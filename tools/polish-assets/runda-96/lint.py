# -*- coding: utf-8 -*-
"""Runda 96 — grind mot familjens fyra sista reservtak.

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
    # ☠️ Grupp A ar SAMMA duk i tva farger — samma lista med flit.
    "3f9fda98": {"3", "300", "86", "68", "174", "18", "180", "2,5", "32", "7", "42"},
    "2bfaf6dd": {"3", "300", "86", "68", "174", "18", "180", "2,5", "32", "7", "42"},
    "9a3600f8": {"2", "2,85", "286", "30", "1,9", "35", "26", "7"},
    "22dbd372": {"3", "298", "293", "180", "40", "15"},
}

# ☠️ En spec-rad som MASTE sta ordagrant, last ur HTML:en. For grupp A ar det
#    lilla taket (det som skiljer dem fran b6ebc5ba), for de tva andra det matt
#    som ensamt avgor om duken passar kundens ram.
# Storleken som MASTE sta i produktnamnet — kundens forsta filter.
NAMNKRAV = {"3f9fda98": "3 × 3 m", "2bfaf6dd": "3 × 3 m",
            "9a3600f8": "2,85 × 2 m", "22dbd372": "298 × 293 cm"}

SPECKRAV = {
    "3f9fda98": [("Lilla taket", "86 × 86 cm"), ("Dränering", "åtta hål")],
    "2bfaf6dd": [("Lilla taket", "86 × 86 cm"), ("Dränering", "åtta hål")],
    "9a3600f8": [("Dukens längd", "286 cm"), ("Dränering", "åtta hål")],
    # ☠️ SEXTON, inte atta. Rakneordet ar skrivet som ORD, sa talgrinden ser det
    #    aldrig — mutationstestet slappte igenom "sexton → atta" innan den har
    #    raden fanns.
    "22dbd372": [("Mått", "298 × 293 cm"), ("Dränering", "sexton hål")],
}

FARGORD = ["beige", "creme", "brun", "mörkbrun", "grå", "mörkgrå", "gråbrun",
           "svart", "vit", "grön", "mörkgrön", "blå", "röd", "roströd",
           "khaki", "antracit", "ljusgrå", "kolgrå", "kaffebrun", "cremevit",
           "terrakotta", "taupe"]

# ☠️ ORDLISTAN VALJS PER FAMILJ. Prefix som matchar svenska ord hor hemma i
#    TYSKA_HELORD i stallet — runda 94 fick "sku" att falla pa "skulle".
TYSKA = ["ersatzdach", "pavillon", "dach", "wasser", "stoff", "oberteil",
         "abmessungen", "farbe", "klett", "randhöhe", "randhohe", "gewicht",
         "kohlegrau", "rostrot", "cremeweiss", "kaffee", "geeignet",
         "abgeschrägte", "lieferumfang", "polyester-", "grün", "dunkelgrau",
         "gartenpavillon", "traubenspalier", "ausziehbar", "einziehbar",
         "zuordnung", "gestell", "vordach", "volant", "lüftung", "sonnensegel"]
TYSKA_HELORD = ["sku", "serie", "stück", "netz", "dach", "farbe"]

MARKEN = ["aosom", "outsunny", "homcom", "pawhut", "vinsetto", "aiyaplay",
          "dealproffsen", "aliexpress"]

LAND = ["tyskland", "spanien", "kina", "polen", "nederländerna", "tjeckien",
        "skickas från", "avsändarland", "lagerland"]

ARTIKELNUMMER = re.compile(r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b")

# ☠️ Runbookens egna markorer ar INTE kundtext.
NOTATION = re.compile(r"[⚠☠✅❌✓✗️]|TODO|☠|⚠|✅")

SLUGGAR = set(T.SLUGG.values()) | {T.ROSTROD, T.TREFYRA, T.INDRAGBART, T.CREME}


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
            (r"följer inte med", "saknar att stommen inte ingår"),
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

    # 10 — ☠️ mot kunden är VI leverantören. "Tillverkaren" är samma fälla i
    #      annan kostym: den skjuter påståendet på en part kunden inte kan
    #      fråga, och den smög in i runda 95:s utkast ("det säger tillverkaren
    #      själv i klartext") innan grinden såg den.
    for ord in ("leverantör", "tillverkar", "fabrikant", "importör"):
        if re.search(ord, allt):
            f.append("ordet %s i kundtext — mot kunden är VI leverantören" % ord)

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

    # 12 — ☠️ FARGEN AR MATT PA EN BILD MED VIT BOTTEN, inte pa bild 1 per
    #      position. `2bfaf6dd`:s bild 1 ar en miljobild och sonden svarade
    #      GRONT — det var graset. Mot pa ritningen blev den kaffebrun, precis
    #      som tyskan sager. Grinden hindrar att grasfargen nar sidan.
    if re.search(r"(?<![a-zåäö])(?:grön|olivgrön|limegrön)(?![a-zåäö])", allt):
        f.append("grön — MÄTFÄLLAN: bild 1 är en miljöbild, gräset är inte duken")
    if pid == "2bfaf6dd" and re.search(r"(?<![a-zåäö])(?:grå|mörkgrå)(?![a-zåäö])", txt):
        f.append("mörkgrå på den duk som är MÄTT kaffebrun")

    # 13 — spec-Material, LAST UR HTML:EN
    #      ☠️ 9a3600f8 far INTE bara nagon ytvikt: dess kalla anger ingen alls.
    #         De ovriga tre sager 180 g/m2 och maste bara talet.
    mm = re.search(r"<strong>Material:</strong>\s*([^<]*)", h)
    material = mm.group(1) if mm else ""
    if not material:
        f.append("spec-tabellen saknar Material")
    if pid == "9a3600f8":
        if re.search(r"\d+\s*g/m", material) or re.search(r"\d+\s*g/m", txt):
            f.append("9a3600f8 bär en ytvikt — källan anger ingen")
    elif "180" not in material:
        f.append("spec-Material saknar 180 g/m²: %r" % material)

    # 13b — de avgorande spec-raderna, LASTA UR HTML:EN
    #       ☠️ Rakneord (atta/sexton) ar OSYNLIGA for talgrinden. Den har raden
    #          ar den enda som kan se att antalet dranhal bytts.
    for etikett, vantat in SPECKRAV[pid]:
        sm = re.search(r"<strong>%s:</strong>\s*([^<]*)" % re.escape(etikett), h)
        star = (sm.group(1) if sm else "").strip()
        if star != vantat:
            f.append("spec-%s är %r, källan säger %r" % (etikett, star, vantat))
        # …och det ANDRA rakneordet far inte finnas nagonstans pa sidan.
        # ☠️ Att bara krava att det ratta ordet FINNS racker inte: spec-raden
        #    bar det redan, sa en punktlista som sager fel antal passerade.
        #    De tva orden ar omsesidigt uteslutande per sida.
        ord0 = vantat.split()[0]
        if ord0 in ("åtta", "sexton"):
            fel_ord = "sexton" if ord0 == "åtta" else "åtta"
            if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % fel_ord, txt):
                f.append("räkneordet %r står på en sida som har %r hål"
                         % (fel_ord, ord0))

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
    if NAMNKRAV[pid] not in namn:
        f.append("namnet bär inte produktens storlek %r" % NAMNKRAV[pid])

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
    bas = "3f9fda98"
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
         lambda: rakna(h=h0.replace("Kanthöjd", "Volant"))),
        ("husmärke", "leverantör/husmärke", lambda: rakna(n="Outsunny paviljongtak")),
        ("artikelnummer", "artikelnummer-mönster",
         lambda: rakna(h=h0.replace("174 cm", "84C-175 cm"))),
        ("artikelnummer-etikett", "artikelnummer-etikett",
         lambda: rakna(h=h0.replace("Kanthöjd", "Artikelnummer"))),
        ("avsändarland", "avsändarland", lambda: rakna(b=b0 + " Skickas från Tyskland.")),
        ("pris", "pris eller rabatt", lambda: rakna(h=h0.replace("Vikt", "Pris 729 kr, vikt"))),
        ("okänt tal i html", "okänt tal",
         lambda: rakna(h=h0.replace("2,5 kg", "3,4 kg"))),
        ("okänt tal i seo", "okänt tal",
         lambda: rakna(b=b0.replace("86 × 86", "88 × 88"))),
        # ☠️ b6ebc5ba:s matt pa en duk som INTE ar samma — rundans farligaste byte.
        ("syskonmodellens mått", "okänt tal",
         lambda: rakna(h=h0.replace("86 × 86 cm", "88 × 88 cm"))),
        ("främmande färg", "främmande färg",
         lambda: rakna(h=h0.replace("Kanthöjd 18 cm", "Beige kant 18 cm"))),
        ("☠️ grön — mätfällan", "MÄTFÄLLAN",
         lambda: rakna(b=b0 + " Grön duk.")),
        ("saknar mät", "uppmaningen att mäta", lambda: rakna(h=h0.replace("Mät", "Kolla"))),
        ("saknar vattenavvisande", "vattenavvisande, inte tät",
         lambda: rakna(h=h0.replace("Vattenavvisande", "Praktisk")
                       .replace("vattenavvisande", "praktisk"))),
        ("saknar stommen", "stommen inte ingår",
         lambda: rakna(h=h0.replace("följer inte med", "ingår"))),
        ("saknar måttbilden", "måttbilden i galleriet",
         lambda: rakna(h=h0.replace("måttbilden", "bilden"))),
        ("vattentät som påstående", "vattentät som PÅSTÅENDE",
         lambda: rakna(h=h0 + "<p>Duken är vattentät och tål allt.</p>")),
        ("leverantör", "mot kunden är VI leverantören",
         lambda: rakna(h=h0.replace("Ta ned duken", "Leverantören anger att duken"))),
        ("tillverkaren", "mot kunden är VI leverantören",
         lambda: rakna(h=h0.replace("Vattenavvisande, inte vattentät",
                                    "Vattenavvisande, säger tillverkaren"))),
        ("relativ länk", "icke-absolut länk",
         lambda: rakna(h=h0.replace('href="%s' % T.BAS, 'href="/'))),
        ("okänd slug", "okänd slug", lambda: rakna(h=h0.replace(T.ROSTROD, "hittepa-sida"))),
        ("spec-Material utan 180", "spec-Material saknar 180",
         lambda: rakna(h=h0.replace("<strong>Material:</strong> polyester, 180 g/m², med PA-beläggning",
                                    "<strong>Material:</strong> polyester med PA-beläggning"))),
        ("räkneordet dränering byts", "spec-Dränering är",
         lambda: rakna(pid="22dbd372",
                       h=T.beskrivning("22dbd372").replace("sexton hål", "åtta hål"),
                       n=T.namn("22dbd372"), t=T.seo_titel("22dbd372"),
                       b=T.seo_beskrivning("22dbd372"), k=T.KORT["22dbd372"])),
        ("räkneordet bara i brödtexten", "räkneordet 'åtta'",
         lambda: rakna(pid="22dbd372",
                       h=T.beskrivning("22dbd372").replace("Sexton dräneringshål",
                                                           "Åtta dräneringshål"),
                       n=T.namn("22dbd372"), t=T.seo_titel("22dbd372"),
                       b=T.seo_beskrivning("22dbd372"), k=T.KORT["22dbd372"])),
        ("avgörande spec-raden fel", "spec-Lilla taket är",
         lambda: rakna(h=h0.replace("<strong>Lilla taket:</strong> 86 × 86 cm",
                                    "<strong>Lilla taket:</strong> 88 × 88 cm"))),
        ("kortets underrad", "kortets underrad",
         lambda: rakna(k=("Paviljongtak", "Duk med litet tak"))),
        ("namn över 80 tecken", "Wix tar högst 80",
         lambda: rakna(n=n0 + " i polyester med PA-beläggning på baksidan")),
        ("osynligt tecken", "osynligt tecken",
         lambda: rakna(h=h0.replace("86 × 86", "86" + chr(0x00A0) + "× 86"))),
        ("tidslöfte", "tidslöfte", lambda: rakna(h=h0.replace("utan verktyg", "på 5 minuter"))),
        ("intern jargong", "intern jargong", lambda: rakna(b=b0 + " Ur rundan.")),
        ("intern notation", "intern notation",
         lambda: rakna(h=h0.replace("Duken är densamma", "⚠️ Duken är densamma"))),
        ("fel storlek i namnet", "bär inte produktens storlek",
         lambda: rakna(n="Paviljongtak 3 × 4 m dubbeltak – mörkgrå reservduk")),
        # ☠️ 9a3600f8 far inte bara nagon ytvikt alls
        ("ytvikt pa den utan ytvikt", "bär en ytvikt",
         lambda: rakna(pid="9a3600f8",
                       h=T.beskrivning("9a3600f8").replace(
                           "polyester med plastbeläggning",
                           "polyester, 180 g/m², med plastbeläggning"),
                       n=T.namn("9a3600f8"), t=T.seo_titel("9a3600f8"),
                       b=T.seo_beskrivning("9a3600f8"), k=T.KORT["9a3600f8"])),
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
