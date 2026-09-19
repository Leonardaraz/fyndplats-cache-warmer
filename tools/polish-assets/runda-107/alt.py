# -*- coding: utf-8 -*-
"""Runda 107 Steg 9 — alt-texter, och grinden som saknades i runda 106.

☠️ ALT-TEXTEN PASSERAR INGEN AV DE VANLIGA GRINDARNA. `grind.py` läser `html`,
   `namn`, `titel` och `meta` ur `texter.py`; alt-texterna skrivs rakt in i Wix
   media och finns inte i den filen. Runda 106 blev grön på alla sex sidor och
   hade ändå "kaniner" i fem alt-texter — på sidor vars brödtext säger att hagen
   inte säljs som kaninbostad. Runbooken fick regeln 2026-09-08; det här är
   första rundan som kör den.

   Grinden nedan är RUNDANS EGEN lista, inte en omskriven variant: samma
   `grindar`-listor som `grind.py` plus samma `KANINORD`, och talen mot samma
   `TAL`-mängder. En kopia som "gör ungefär samma sak" är precis den tvilling
   huset förlorat tid på förr.

⚠️ BESKRIV VARAN, INTE STAJLINGEN. Leverantörens miljöbilder är iscensatta och
   flera av dem har djur i sig. Djuret är inte produktinformation — tas det med
   blir alt-texten ett påstående om användningen, och på just de här sidorna ett
   påstående brödtexten motsäger.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
import grindar as G                                     # noqa: E402
sys.path.insert(0, HAR)
import texter as T                                      # noqa: E402
from grind import TAL, TALMONSTER, KANINORD, TYSKA_HAR  # noqa: E402

# Ordningen ÄR galleriordningen efter Steg 9. "kort" är vårt eget spec-kort.
ALT = {
 "a75fcfde": [
  "Smådjursstall i natur och vitt, 230 cm brett, med huset i mitten och en löpgård åt vardera hållet.",
  "Stallet står på en gräsmatta framför ett vitt staket, med luckorna och gallerdörrarna stängda.",
  "kort",
  "Närbild på stallets takkant där den svarta asfaltpappen möter det vitmålade träet.",
  "Stallets gavel i natur och vitt med stängd trälucka under det svarta taket.",
  "Måttritning av smådjursstallet: 230 cm brett, 53 cm djupt och 93,5 cm högt.",
 ],
 "c0770388": [
  "Smådjursstall i grått, 230 cm brett, med huset i mitten och en löpgård åt vardera hållet.",
  "Stallet står på en gräsmatta i en trädgård med lavendel och låga buskar bakom.",
  "kort",
  "Stallet placerat intill en tegelfasad med krukväxter och klätterväxter runt omkring.",
  "Stallet på gräset framför en uteplats med krukväxter på rad.",
  "Måttritning av smådjursstallet: 230 cm brett, 53 cm djupt och 93,5 cm högt.",
 ],
 "2253c509": [
  "Smådjursstall i natur, 141 cm brett, med huset upptill till vänster och löpgård i hela bottenplanet.",
  "Stallet står på gräset i en trädgård med höga lövträd bakom.",
  "kort",
  "Närbild på stallets stålgångjärn som håller ihop trälucka och nätvägg.",
  "Måttritning av smådjursstallet: 141 cm brett, 60 cm djupt och 86 cm högt.",
 ],
 "2435c4d1": [
  "Smådjursstall i ljusgrått, 156 cm brett, med huset till vänster och öppen löpgård till höger.",
  "Stallet står på en gräsmatta framför ett trädäck.",
  "kort",
  "Närbild på stallets husöppning med den utdragbara brickan under i mörkgrått.",
  "Stallets tak uppfällt så att hela sovdelen ligger öppen.",
  "Måttritning av smådjursstallet: 156 cm brett, 58 cm djupt och 68 cm högt.",
 ],
 "dcdf889d": [
  "Smådjursstall i natur, 156 cm brett, med taket uppfällt och rampen ner till löpgården.",
  "Stallet står på en gräsmatta med en blomsterrabatt och buskar bakom.",
  "kort",
  "Närbild på stallets husöppning med den utdragbara brickan under i trä.",
  "Måttritning av smådjursstallet: 156 cm brett, 58 cm djupt och 68 cm högt.",
 ],
 "525e6acf": [
  "Smådjursstall i natur, 123,5 cm brett, i två plan med huset till höger och bottenlös löpgård till vänster.",
  "Stallet står på gräset framför en husvägg i sten.",
  "kort",
  "Stallet på en gräsmatta framför ett vitt spjälstaket och en ljus fasad.",
  "Måttritning av smådjursstallet: 123,5 cm brett, 62,6 cm djupt och 92,5 cm högt.",
 ],
 "079f2901": [
  "Smådjursstall i grått och vitt, 123,5 cm brett, i två plan med huset till höger och bottenlös löpgård till vänster.",
  "Stallet står på gräset framför en vägg av liggande träpanel.",
  "kort",
  "Närbild på stallets gallerdörr till löpgården, med nätet spänt i träramen.",
  "Närbild på stallets övre del med fönsterrutor under det svarta sadeltaket.",
 ],
}

# Kortets alt-text byggs ur kortets EGNA rader, inte skrivs för hand — samma
# princip som kortbygget: värdet härleds, det formuleras inte om.
import kort as K                                        # noqa: E402


def kortalt(nyckel):
    spec = K.specrader(nyckel)
    import kortbygge                                     # noqa
    delar = ["%s %s" % (e.lower(), kortbygge.varde(spec[i], e))
             for e, i in K.RADER[nyckel][:3]]
    return "Faktakort: " + ", ".join(delar) + "."


def galleri(nyckel):
    return [kortalt(nyckel) if a == "kort" else a for a in ALT[nyckel]]


def granska():
    fel = []
    for k in T.PRODUKTER:
        for i, a in enumerate(galleri(k), 1):
            plats = "%s bild %d" % (k, i)
            lag = a.lower()
            if not a.endswith("."):
                fel.append("%s: saknar avslutande punkt" % plats)
            if len(a) > 125:
                fel.append("%s: %d tecken (max 125)" % (plats, len(a)))
            if "smådjursstall" not in lag and "stallet" not in lag and not a.startswith("Faktakort"):
                fel.append("%s: varken sökordet eller 'stallet' finns" % plats)
            for ord_ in list(G.TYSKA) + TYSKA_HAR:
                if re.search(rf"\b{re.escape(ord_)}", lag):
                    fel.append("%s: tyskt ord %r" % (plats, ord_))
            for m in G.HUSMARKEN:
                if m in lag:
                    fel.append("%s: husmärke %r" % (plats, m))
            for o in G.LANDORD:
                if re.search(rf"\b{re.escape(o)}\b", lag):
                    fel.append("%s: lagerland utskrivet %r" % (plats, o))
            for f in G.LAGERFRAS:
                if f in lag:
                    fel.append("%s: lagerfras %r" % (plats, f))
            for at in G.ATTRIBUTION:
                if re.search(rf"\b{re.escape(at)}\b", lag):
                    fel.append("%s: leverantörsattribution %r" % (plats, at))
            if G.ARTNR.search(a):
                fel.append("%s: artikelnummer %r" % (plats, G.ARTNR.search(a).group(0)))
            # ☠️ Rundans egen regel — den som runda 106 var grön på och ändå bröt.
            if KANINORD.search(a):
                fel.append("%s: KANINLÖFTE i alt-texten: %s" % (plats, a))
            for tal in TALMONSTER.findall(a):
                if tal not in TAL[k]:
                    fel.append("%s: ohärlett tal %r" % (plats, tal))
    return fel


def sjalvtest():
    """Grinden ska fälla exakt det runda 106 släppte igenom."""
    prov = [
        ("kanin i miljöbild", "Stallet står i en trädgård med två kaniner inuti.", "KANINLÖFTE"),
        ("husmärke", "Smådjursstall från Outsunny på en gräsmatta.", "husmärke"),
        ("artikelnummer", "Smådjursstall 845-030CG på en gräsmatta.", "artikelnummer"),
        ("ohärlett tal", "Smådjursstall 999 cm brett på en gräsmatta.", "ohärlett tal"),
        ("tyskt ord", "Smådjursstall med Bodenwanne på en gräsmatta.", "tyskt ord"),
        ("tyskt ord, kort", "Smådjursstall med Auslauf på en gräsmatta.", "tyskt ord"),
    ]
    ok = True
    for namn, text, vantat in prov:
        sparad = ALT["a75fcfde"][1]
        ALT["a75fcfde"][1] = text
        traff = [f for f in granska() if vantat in f]
        ALT["a75fcfde"][1] = sparad
        print("  %-16s %s" % (namn, "fälls ✓" if traff else "SLÄPPS IGENOM ✗"))
        ok = ok and bool(traff)
    return ok


if __name__ == "__main__":
    print("=== självtest ===")
    if not sjalvtest():
        raise SystemExit("grinden fångar inte allt den ska")
    print("\n=== alt-texter ===")
    for k in T.PRODUKTER:
        print("  %s" % k)
        for i, a in enumerate(galleri(k), 1):
            print("    %d  %s" % (i, a))
    fel = granska()
    print("\n=== grind: %d fel ===" % len(fel))
    for f in fel:
        print("  ✗", f)
    if fel:
        raise SystemExit(1)
