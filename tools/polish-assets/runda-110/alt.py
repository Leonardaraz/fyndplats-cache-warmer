# -*- coding: utf-8 -*-
"""Runda 110, Steg 9 — 30 alt-texter, skrivna ur BILDEN och inte ur mallen.

☠️ RUNDA 109:s DYRASTE FEL var en alt-text lånad från ett SYSKONS foto: "ett
bord med en ljus pläd över kanten" skrevs om ett rumsfoto där tyget i själva
verket är en BORDSDUK och skärmen orörd. Felet syntes först i FULL STORLEK.

Regeln som följer av det: kontaktarket säger vilken TYP av bild det är, inte
vad som finns i den. Rundans åtta miljöbilder lästes därför ur `miljoark.jpg`
(640 px styck) och närbilderna ur `zoom.jpg` (1,3–1,5× förstoring), inte ur
kontaktarkets miniatyrer.

⚠️ OCH GALLERIERNA ÄR INTE LIKA. `c35f9d4f` har TRE miljöbilder och ingen enda
närbild, medan familjens övriga fem har en miljöbild och två närbilder. En
ärvd alt-rad hade skrivit "närbild på väven" om ett rumsfoto — exakt runda
109:s fel en gång till.

☠️ INGEN BESLAGSFÄRG SKRIVS. Zoomen visade ett MÄSSINGSFÄRGAT gångjärn på
`a999f2b1` bild 4 och en SILVERFÄRGAD beslagsplatta på `316f9945` bild 5 —
två olika metaller i samma familj. Färgen på de övriga fyra sidornas beslag
är inte uppmätt, och ett påstående om en detalj kräver en egen mätning
(runbookens regel efter runda 89/90/91). Beslagen nämns därför som beslag.
"""
import re

ALT = {
 "a999f2b1": [
  "Vit rumsavdelare med fyra bågformade paneler i flätad väv, mot vit bakgrund",
  "Vit rumsavdelare uppställd i vinkel i ett vardagsrum, mellan en soffa och ett runt sidobord",
  "Måttritning av rumsavdelaren: 180 cm bred, 180 cm hög och 45 cm per panel",
  "Närbild på panelernas bågformade överkant och gångjärnet i skarven mellan två vita ramar",
  "Närbild på den vita flätningen, där breda band löper över lodräta lister, med en skruv i ramen",
 ],
 "c35f9d4f": [
  "Gråbrun rumsavdelare med fyra bågformade paneler i flätad väv, mot vit bakgrund",
  "Gråbrun rumsavdelare uppställd i vinkel framför en säng med ljus gavel i ett sovrum",
  "Måttritning av rumsavdelaren utfälld och hopfälld: 180 cm bred, 180 cm hög, 45 cm per panel",
  "Gråbrun rumsavdelare uppställd intill en dörröppning framför en bädd och en byrå",
  "Gråbrun rumsavdelare uppställd i ett hörn av ett vardagsrum, mellan ett sidobord och en soffa",
 ],
 "d72bde5e": [
  "Rumsavdelare med fyra raka paneler i ljus bambuväv och träram, mot vit bakgrund",
  "Rumsavdelare i ljus bambu uppställd framför ett fönster intill en säng i ett sovrum",
  "Måttritning av rumsavdelaren: 180 cm bred, 180 cm hög och 45 cm per panel",
  "Närbild på panelens ljusa träram och den rutmönstrade bambuväven innanför",
  "Närbild på bambuväven, där gräddvita och grå spjälor växlar i ett fint rutmönster",
 ],
 "316f9945": [
  "Rumsavdelare med fyra paneler i mörk bambuväv och svartmålad ram, mot vit bakgrund",
  "Svart rumsavdelare uppställd i vinkel i ett vardagsrum, bredvid en låg hylla på hjul",
  "Måttritning av rumsavdelaren utfälld och från sidan: 180 cm bred, 180 cm hög, 45 cm per panel",
  "Närbild på väven med svarta spjälor, gräddvita band och kopparbruna trådar",
  "Närbild på den svartmålade ramens kant med beslag, och den flätade panelen innanför",
 ],
 "f8fd1b62": [
  "Rumsavdelare med fyra paneler i flätad bambu, mot vit bakgrund",
  "Rumsavdelare i bambu uppställd i ett rum med mörk gardin, bredvid en byrå med bordslampa",
  "Måttritning av rumsavdelaren: 160 cm bred, 170 cm hög och 40 cm per panel",
  "Närbild på bambuflätningen med breda, flata spjälor lagda i korgmönster",
  "Närbild på ramens hörn där tvärslån möter den lodräta stolpen",
 ],
 "309076e2": [
  "Rumsavdelare med tre paneler i flätad bambu, mot vit bakgrund",
  "Rumsavdelare i bambu med tre paneler uppställd framför en gardin, bredvid en soffa",
  "Måttritning av rumsavdelaren: 120 cm bred, 170 cm hög och 40 cm per panel",
  "Närbild på bambuflätningen med breda, flata spjälor lagda i korgmönster",
  "Närbild på ramens hörn där tvärslån möter den lodräta stolpen",
 ],
}

MAX = 125
TYSKA = ["raumteiler", "raumtrenner", "paravent", "trennwand", "sichtschutz",
         "kiefernholz", "bambus", "naturholz", "weiß", "schwarz", "braun"]
HUSMARKEN = ["homcom", "outsunny", "pawhut", "aiyaplay", "vinsetto", "aosom"]
LANDORD = ["tyskland", "kina", "polen", "spanien", "tjeckien", "nederländerna"]
ARTNR = re.compile(r"\b(?=[0-9A-Z-]*[A-Z])[0-9][0-9A-Z]{1,3}-[0-9A-Z]{4,}\b")
# Talen varje sida får bära — hämtade ur matt.py, inte handskrivna.
import matt                                              # noqa: E402
TAL = {k: {str(v[0]), str(v[1]), str(v[3]),
           str(matt.PANELBREDD[matt.GRUPPER[k]])} for k, v in matt.RUNDAN.items()}
TALMONSTER = re.compile(r"\d+(?:,\d+)?")


def granska(nyckel, rader):
    fel = []
    if len(rader) != 5:
        fel.append(f"{len(rader)} alt-texter, väntade 5")
    for i, t in enumerate(rader, 1):
        m = f"{nyckel} bild {i}"
        if len(t) > MAX:
            fel.append(f"{m}: {len(t)} tecken (max {MAX})")
        lag = t.lower()
        for o in TYSKA + HUSMARKEN + LANDORD:
            if re.search(rf"\b{re.escape(o)}\b", lag):
                fel.append(f"{m}: förbjudet ord {o!r}")
        if ARTNR.search(t):
            fel.append(f"{m}: artikelnummer")
        if "rumsavdelare" not in lag and "närbild" not in lag and "måttritning" not in lag:
            fel.append(f"{m}: säger varken vad varan är eller vilken sorts bild det är")
        for tal in TALMONSTER.findall(t):
            if tal not in TAL[nyckel]:
                fel.append(f"{m}: ohärlett tal {tal!r}")
    # ☠️ Två bilder på SAMMA sida får inte dela alt-text — då beskriver den
    #    ena bilden inte sig själv. (Över sidor är det däremot väntat: grupp
    #    C:s två närbilder visar samma konstruktion.)
    for i, t in enumerate(rader):
        if t in rader[:i]:
            fel.append(f"{nyckel}: alt-text upprepad inom samma galleri: {t[:50]}")
    return fel


def sjalvtest():
    prov = [
        ("för lång", "x" * 200, "tecken (max"),
        ("tyskt ord", "Ett Raumteiler i vardagsrummet", "förbjudet ord"),
        ("husmärke", "Rumsavdelare från Outsunny i vitt", "förbjudet ord"),
        ("artikelnummer", "Rumsavdelare 830-816V01WT mot vit bakgrund", "artikelnummer"),
        ("ohärlett tal", "Rumsavdelare 999 cm bred mot vit bakgrund", "ohärlett tal"),
        ("säger ingenting", "Ett ljust rum med en soffa och en lampa", "varken vad varan är"),
    ]
    ok = True
    for namn, text, vantat in prov:
        traff = [f for f in granska("a999f2b1", [text] + ALT["a999f2b1"][1:])
                 if vantat in f]
        print("  %-18s %s" % (namn, "fälls ✓" if traff else "SLÄPPS IGENOM ✗"))
        ok = ok and bool(traff)
    dubbel = granska("a999f2b1", [ALT["a999f2b1"][0]] * 5)
    traff = [f for f in dubbel if "upprepad inom samma galleri" in f]
    print("  %-18s %s" % ("upprepad i galleri", "fälls ✓" if traff else "SLÄPPS IGENOM ✗"))
    return ok and bool(traff)


if __name__ == "__main__":
    print("=== självtest ===")
    if not sjalvtest():
        raise SystemExit("alt-grinden fångar inte allt den ska")
    print("\n=== grind ===")
    fel_totalt = 0
    for k in sorted(ALT, key=lambda x: (matt.GRUPPER[x], -matt.RUNDAN[x][1])):
        fel = granska(k, ALT[k])
        fel_totalt += len(fel)
        print("%s %s %-9s  %d texter, längst %d tecken"
              % ("OK " if not fel else "FEL", matt.GRUPPER[k], k,
                 len(ALT[k]), max(len(t) for t in ALT[k])))
        for f in fel:
            print("      ✗", f)
    print("\n%d texter, %d fel" % (sum(len(v) for v in ALT.values()), fel_totalt))
    raise SystemExit(1 if fel_totalt else 0)
