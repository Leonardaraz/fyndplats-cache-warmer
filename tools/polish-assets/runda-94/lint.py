# -*- coding: utf-8 -*-
"""Runda 94 — grind mot de fyra reservtakstexterna.

Kor `python3 lint.py` for att linta, `python3 lint.py --sjalvtest` for att
bevisa att varje regel FALLER pa en avsiktlig skada. En grind som aldrig
provats ar skriven, inte matt.

☠️ TALGRINDEN AR ZONERAD (runda 92:s lardom). Ett tal som bara hor hemma i en
   korslank far stan bara i ett stycke som innehaller `<a href`. Utanfor
   galler produktens egen uppsattning ensam.

☠️ FARGGRINDEN AR ZONERAD av samma skal — syskonlanken namner syskonets farg.

☠️ SPEC-TABELLENS YTVIKT GRINDAS SEPARAT. Grupp B far namna 180 g/m² i en
   FAQ-jamforelse mot vart eget sortiment, men spec-tabellen maste sага 370
   och far aldrig bara 180. Det ar just den forvaxlingen zonregeln inte kan
   fanga, eftersom bada talen da ar tillatna pa sidan.
"""
import re
import sys

import texter as T

TAL = re.compile(r"\d+(?:[,.]\d+)?")
STYCKE = re.compile(r"<(?:p|li)\b[^>]*>.*?</(?:p|li)>", re.S)

# Egna tal per grupp. Grupp B far 180 for FAQ-jamforelsen mot vart sortiment;
# spec-tabellen skyddas av en egen regel i stallet.
TAL_OK = {
    "C": {"3", "300", "90", "59", "173", "51", "100", "180", "30", "8",
          "2,9", "50", "29"},
    "B": {"3", "298", "218", "370", "30", "4,8", "42", "35", "9", "180", "100"},
}

FARGORD = ["beige", "creme", "brun", "mörkbrun", "grå", "mörkgrå", "gråbrun",
           "svart", "vit", "grön", "blå", "röd", "khaki", "antracit", "ljusgrå"]

# ☠️ ORDLISTAN VALJS PER FAMILJ. "material:" ströks: det ar svenska i var egen
#    spec-tabell. "sku" ströks som PREFIX — det matchade "skulle" och "skugga";
#    det provas i stallet som helt ord nedan.
TYSKA = ["ersatzdach", "pavillon", "dach", "wasser", "stoff", "oberteil",
         "abmessungen", "farbe", "klett", "netzgewebe", "ösen",
         "vordach", "gartenlaube", "abgeschrägte", "lieferumfang"]
TYSKA_HELORD = ["sku", "serie", "stück"]

MARKEN = ["aosom", "outsunny", "homcom", "pawhut", "vinsetto", "aiyaplay",
          "dealproffsen", "aliexpress"]

LAND = ["tyskland", "spanien", "kina", "polen", "nederländerna", "tjeckien",
        "skickas från", "avsändarland", "lagerland"]

ARTIKELNUMMER = re.compile(r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b")

SLUGGAR = set(T.SLUGG.values()) | {T.CREME, T.POLYESTER}


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def stycken(h):
    return STYCKE.findall(h)


def granska(pid, h, namn, seo_t, seo_b, kort):
    f = []
    grupp = T.GRUPP[pid]
    egen_duk, egen_topp = T.FARG[pid]
    egna_farger = {egen_duk, egen_topp} - {None}
    txt = synlig(h).lower()
    allt = " ".join([txt, namn.lower(), seo_t.lower(), seo_b.lower(),
                     kort[0].lower(), kort[1].lower()])

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

    # 6 — zonerad talgrind
    for st in stycken(h):
        har_lank = "<a href" in st
        if har_lank:
            continue
        for tal in TAL.findall(synlig(st)):
            if tal not in TAL_OK[grupp]:
                f.append("okänt tal %r utanför ett länkstycke" % tal)

    # 7 — zonerad färggrind
    for st in stycken(h):
        har_lank = "<a href" in st
        s = synlig(st).lower()
        for farg in FARGORD:
            if farg in egna_farger:
                continue
            if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % farg, s) and not har_lank:
                f.append("främmande färg %r utanför ett länkstycke" % farg)

    # 8 — obligatoriska påståenden
    #     ☠️ imperativen "Mät", INTE "mäter" — runda 93:s grind godkändes av
    #        ordet "mäter" i en måttmening och krävde alltså ingenting alls.
    # ☠️ IMPERATIVEN LASES MED VERSAL. Ett gement "mät" mitt i en mening
    #    ("mät båda på din egen paviljong") uppfyllde kravet utan att sidan bar
    #    en enda uppmaning — mutationstestet visade det.
    if not re.search(r"(?<![A-Za-zÅÄÖåäö])Mät(?![a-zåäö])", synlig(h)):
        f.append("saknar uppmaningen att mäta stommen")
    krav = [(r"vattenavvisande", "saknar att duken är vattenavvisande, inte tät"),
            (r"stommen följer inte med", "saknar att stommen inte ingår"),
            (r"upf 30\+", "saknar UPF-klassningen")]
    for m, txtfel in krav:
        if not re.search(m, txt):
            f.append(txtfel)

    # 9 — "vattentät" får BARA stå som fråga eller förnekande
    for st in stycken(h):
        s = synlig(st).lower()
        if "vattentät" not in s:
            continue
        if not (s.rstrip().endswith("?") or s.lstrip().startswith("nej")):
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

    # 12 — mätt färg: "ljusgrå" är falskt på båda gråa dukarna
    if "ljusgrå" in allt:
        f.append("ljusgrå — färgen är MÄTT mörk i bilden")

    # 13 — spec-tabellens ytvikt, LAST UR HTML:EN
    #      ☠️ Regeln las forst ur texter.py:s spec-funktion. Da kunde en skada i
    #         HTML:en aldrig ses — grinden provade sin egen kalla. Mutationstestet
    #         "370 → 180" gick rakt igenom.
    mm = re.search(r"<strong>Material:</strong>\s*([^<]*)", h)
    material = mm.group(1) if mm else ""
    if grupp == "B" and ("370" not in material or "180" in material):
        f.append("grupp B:s spec-Material saknar 370 g/m² eller bär 180: %r" % material)
    if grupp == "C" and "180" not in material:
        f.append("grupp C:s spec-Material saknar 180 g/m²: %r" % material)

    # 14a — ☠️ WIX TAR HOGST 80 TECKEN I product.name (uppmatt 2026-09-07)
    if len(namn) > 80:
        f.append("namnet är %d tecken — Wix tar högst 80" % len(namn))

    # 14 — kortets underrad måste vara sann om den här duken
    if egen_duk.split()[0][:4].lower() not in kort[1].lower():
        f.append("kortets underrad namnger inte dukens färg: %r" % kort[1])

    # 15 — inga osynliga tecken (skrivna som kodpunkter, aldrig som tecken)
    for kod, vad in ((0x00A0, "hårt blanksteg"), (0x200B, "nollbreddsmellanrum"),
                     (0x2060, "word joiner"), (0x00AD, "mjukt bindestreck")):
        if chr(kod) in h + namn + seo_t + seo_b + kort[0] + kort[1]:
            f.append("osynligt tecken: %s (U+%04X)" % (vad, kod))

    # 16 — inga tidslöften
    if re.search(r"\d+\s*minut", txt) or "på fem minuter" in txt:
        f.append("tidslöfte om montering")

    # 17 — ingen intern jargong
    for j in ("rundan", "utkast", "poleras", "mappning", "batch"):
        if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % j, allt):
            f.append("intern jargong %r" % j)

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
    """Varje regel ska falla pa sin egen skada — annars ar den inte matt."""
    bas = "df5a7190"
    h0 = T.beskrivning(bas)
    n0, t0, b0 = T.namn(bas), T.seo_titel(bas), T.seo_beskrivning(bas)
    k0 = T.KORT[bas]

    def rakna(h=None, n=None, t=None, b=None, k=None, pid=bas):
        """Returnerar LISTAN av brister — sjalvtestet kraver ratt regel."""
        return granska(pid, h or h0, n or n0, t or t0, b or b0, k or k0)

    if rakna():
        print("SJÄLVTEST AVBRUTET: basen är inte ren"); return 1

    fall = [
        ("tysk term", "tysk term", lambda: rakna(h=h0.replace("Öppning", "Öffnung Wasser"))),
        ("husmärke", "leverantör/husmärke", lambda: rakna(n="Outsunny paviljongtak")),
        ("artikelnummer", "artikelnummer-mönster", lambda: rakna(h=h0.replace("173 cm", "84C-741 cm"))),
        ("artikelnummer-etikett", "artikelnummer-etikett", lambda: rakna(h=h0.replace("Öljetter", "Artikelnummer"))),
        ("avsändarland", "avsändarland", lambda: rakna(b=b0 + " Skickas från Tyskland.")),
        ("pris", "pris eller rabatt", lambda: rakna(h=h0.replace("Vikt", "Pris 899 kr, vikt"))),
        ("okänt tal", "okänt tal", lambda: rakna(h=h0.replace("2,9 kg", "3,4 kg"))),
        ("främmande färg", "främmande färg", lambda: rakna(h=h0.replace("nätvävd springa",
                                                      "creme springa"))),
        ("saknar mät", "uppmaningen att mäta", lambda: rakna(h=h0.replace("Mät", "Kolla"))),
        ("saknar vattenavvisande", "vattenavvisande, inte tät", lambda: rakna(h=h0.replace("vattenavvisande",
                                                              "praktisk"))),
        ("saknar stommen", "stommen inte ingår", lambda: rakna(h=h0.replace("stommen följer inte med",
                                                      "allt behövs"))),
        ("saknar UPF", "UPF-klassningen", lambda: rakna(h=h0.replace("UPF 30+", "solskydd"))),
        ("vattentät som påstående", "vattentät som PÅSTÅENDE",
         lambda: rakna(h=h0.replace("<p>Vågskuren kappa", "<p>Duken är vattentät.</p><p>Vågskuren kappa")
                       if "<p>Vågskuren kappa" in h0
                       else h0 + "<p>Duken är vattentät.</p>")),
        ("leverantör", "ordet leverantör", lambda: rakna(h=h0.replace("Väven på 180",
                                                  "Leverantören anger att väven på 180"))),
        ("relativ länk", "icke-absolut länk", lambda: rakna(h=h0.replace('href="%s' % T.BAS, 'href="/'))),
        ("okänd slug", "okänd slug", lambda: rakna(h=h0.replace(T.CREME, "hittepa-sida"))),
        ("ljusgrå", "MÄTT mörk", lambda: rakna(b=b0 + " Ljusgrå duk.")),
        ("kortets underrad", "kortets underrad", lambda: rakna(k=("Paviljongtak", "Blå duk"))),
        ("namn över 80 tecken", "Wix tar högst 80",
         lambda: rakna(n=n0 + " i tvåfärgat utförande med vågskuren kappa")),
        # ☠️ Skadan skrivs som KODPUNKT, aldrig som tecken. En grind mot
        #    osynliga tecken far inte provas med ett osynligt tecken i
        #    kallkoden — forsta forsoket har bar ETT, och gick inte att lasa.
        ("osynligt tecken", "osynligt tecken",
         lambda: rakna(h=h0.replace("300 × 300", "300" + chr(0x00A0) + "× 300"))),
        ("tidslöfte", "tidslöfte", lambda: rakna(h=h0.replace("utan verktyg", "på 5 minuter"))),
        ("intern jargong", "intern jargong", lambda: rakna(b=b0 + " Ur rundan.")),
    ]
    dalig = 0
    for namn_, vantat, kor_ in fall:
        brister = kor_()
        traff = [b for b in brister if vantat in b]
        if traff:
            print("  %-26s fäller: %s" % (namn_, traff[0][:64]))
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
