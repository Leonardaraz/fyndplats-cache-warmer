# -*- coding: utf-8 -*-
"""Runda 132 Steg 9 — galleriets ORDNING och alt-texterna.

☠️ ALT-TEXTEN PASSERAR INGEN AV TEXTGRINDENS VANLIGA VÄGAR. Den skrivs rakt
   in i Wix media och finns aldrig i `texter.py`, alltså är varje regel
   grinden vaktar oskyddad här — och det är det sämsta stället att ha ett
   hål, för alt-texten är vad Google och skärmläsaren läser. Runbokens svar
   är att köra rundans EGEN förbjudna-ord-lista mot texterna före
   skrivningen; `granska()` längst ned gör det.

☠️ BESKRIV VARAN, INTE STAJLINGEN. Sex av femtio bilder är iscensatta med
   ett djur i. Djuret är inte produktinformation: tas det med blir
   alt-texten ett påstående om användningen. Varje sådan bild beskrivs
   därför på det som är VARAN i den — placeringen mot möbeln, stegens
   riktning, ytan.

☠️ MÅTTRITNINGEN LIGGER PÅ PLATS 3 HOS ALLA TIO, inte sist. Ordningen nedan
   flyttar den till slutet och lägger vårt kort på plats 3, enligt Steg 9:
   1 hjälte · 2 verklighet · 3 eget kort · sedan detaljerna · sist måttet.

⚠️ `Faktakort: ` är den form live-grinden (`grindar.kortfel`) kräver — inte
   `Fyndplats-kort:`, som lägger vårt varumärke i ett fält som ska beskriva
   innehåll.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import bilder as B                                               # noqa: E402
import grind as GR                                               # noqa: E402
import grindar as G                                              # noqa: E402
import texter as T                                               # noqa: E402

# Positionen i det RÅA galleriet (1-indexerat) i den ordning de ska ligga.
# "K" är rundans eget kort. Måttritningen (3) sist hos alla tio.
ORDNING = [1, 2, "K", 4, 5, 3]

ALT = {
 "8f6147b5": {
  1: "Husdjurstrappa i tre steg med ljusgrå plyschklädda steg och sisallindade stolpar, sedd snett framifrån mot vit bakgrund",
  2: "Trappan uppställd intill en ljusgrå soffa, med understa steget fritt ut mot golvet",
  "K": "Faktakort: husdjurstrappa 34 cm i tre steg, 46 × 35,5 cm, med sisalstolpar och 50 kg maxlast",
  4: "Trappan placerad mot en möbelkant, med alla tre steg synliga från sidan",
  5: "Närbild på de sisallindade stolparna under de plyschklädda stegen",
  3: "Måttritning för husdjurstrappan: 46 cm lång, 35,5 cm bred och 34 cm hög",
 },
 "4c25eb86": {
  1: "Husdjurstrappa i fyra steg med mörkgrå plyschsteg på gräddvita sisalstolpar, sedd snett framifrån",
  2: "Den fyrstegs trappan uppställd intill en fåtölj, med översta steget i nivå med sitsen",
  "K": "Faktakort: husdjurstrappa 59 cm i fyra steg, stegyta 40,5 × 15 cm, maxlast 50 kg",
  4: "Närbild på ett mörkgrått plyschsteg och dess kant, ovanifrån",
  5: "Närbild på en sisallindad stolpe med synlig repvirning",
  3: "Måttritning för husdjurstrappan: steghöjder 15, 29,5, 45 och 59,5 cm på en 60 × 40,5 cm bottenplatta",
 },
 "762cc411": {
  1: "Kattrappa i tre steg klädd i gräddvit bouclé över både steg och stolpar, sedd snett framifrån",
  2: "Kattrappan uppställd intill en ljus soffa, med understa steget ut mot rummet",
  "K": "Faktakort: kattrappa 34 cm i tre steg, 45 × 35 cm, klädd i bouclé med 10 kg maxlast",
  4: "Trappan står på en matta intill en soffkant, sedd rakt från sidan",
  5: "Kattrappan sedd snett bakifrån, med bottenplattan och de tre stegens undersidor",
  3: "Måttritning för kattrappan: 45 cm lång, 35 cm bred och 34 cm hög",
 },
 "f384c51d": {
  1: "Hundtrappa i fyra steg med stomme i ljus trälook och gräddvita stegdynor, sedd snett framifrån",
  2: "Trappan uppställd mot en sängkant, med de fyra stegen vända ut mot golvet",
  "K": "Faktakort: hundtrappa 54,2 cm i fyra steg, stegyta 40 × 17 cm, maxlast 30 kg",
  4: "Närbild på kardborrebanden som håller stegdynan på plats mot trästeget",
  5: "Närbild på trappans hörn, där den gräddvita dynan möter kanten i ljus trälook",
  3: "Måttritning för hundtrappan: 40 cm bred, 59 cm djup och 54,2 cm hög, med 17 cm djupa steg",
 },
 "3ff2bc32": {
  1: "Hundtrappa i fyra steg med mörkbrun stomme och bruna stegdynor, sedd snett framifrån",
  2: "Den mörkbruna trappan uppställd intill en ljusgrå soffa, sedd från sidan",
  "K": "Faktakort: hundtrappa 54,2 cm i fyra steg, mörkbrun med bruna dynor, maxlast 30 kg",
  4: "De bruna stegdynorna sedda uppifrån, med trappans mörka kanter runt om",
  5: "Närbild på översta steget, där den bruna dynan ligger an mot den mörka stommen",
  3: "Måttritning för hundtrappan: steghöjder 14,3, 27,6, 40,9 och 54,2 cm på ett 40 × 59 cm underrede",
 },
 "03715963": {
  1: "Hopfällbar hundtrappa i tre steg med gräddvit tygstomme och vita stegdynor, sedd snett framifrån",
  2: "Trappan uppställd intill en fåtölj, med det översta stegets dyna i nivå med sitsen",
  "K": "Faktakort: hopfällbar hundtrappa 48 cm i tre steg, 40 × 54 cm, gräddvit och 4,2 kg",
  4: "Närbild på en vit stegdyna och den gräddvita tygkanten under den",
  5: "Trappans hörn ovanifrån, med tygsömmen och det ihåliga utrymmet under steget",
  3: "Måttritning för hundtrappan: steghöjder 16, 32 och 48 cm på en 40 × 54 cm stomme",
 },
 "c38f929e": {
  1: "Hopfällbar hundtrappa i tre steg med mörk tygstomme och bruna stegdynor, sedd snett framifrån",
  2: "Den mörka trappan uppställd intill en fåtölj, med de tre stegen ut mot rummet",
  "K": "Faktakort: hopfällbar hundtrappa 48 cm i tre steg, 40 × 54 cm, mörkblå och 4,2 kg",
  4: "Närbild på två tryckknappar i metall som håller ihop tygmodulerna",
  5: "Insidan av en tygmodul, med det ihåliga förvaringsutrymmet under steget",
  3: "Måttritning för hundtrappan: 48 cm hög med 18 cm djupa steg på en 54 × 40 cm stomme",
 },
 "96d2803c": {
  1: "Husdjurstrappa i två steg av grått konstläder med skumstoppning, sedd snett framifrån",
  2: "Den grå trappan uppställd på en matta, med båda stegen vända ut mot rummet",
  "K": "Faktakort: husdjurstrappa i två steg, 45 × 39 × 20 cm och utfälld 67 × 39 × 10 cm, 0,81 kg",
  4: "Trappan står mot en sängkant, med understa steget ner mot trägolvet",
  5: "Trappan sedd från sidan mot sängen, där översta steget möter madrasskanten",
  3: "Måttritning i två vyer: som trappa 45 × 39 × 20 cm och utfälld till 67 × 39 × 10 cm",
 },
 "11436227": {
  1: "Husdjurstrappa i två steg av mörkt konstläder med skumstoppning, sedd snett framifrån",
  2: "Den mörka trappan uppställd framför en ljus soffa, med båda stegen synliga",
  "K": "Faktakort: husdjurstrappa i två steg, 45 × 39 × 20 cm och utfälld 67 × 39 × 10 cm, 0,81 kg",
  4: "Trappan står mot en sängkant, med det övre steget i nivå med madrassen",
  5: "Trappan utfälld till en plan bädd på golvet, 67 cm lång och 10 cm tjock",
  3: "Måttritning i två vyer: som trappa 45 × 39 × 20 cm och utfälld till 67 × 39 × 10 cm",
 },
 "71e8e879": {
  1: "Husdjurstrappa i skum med tre steg, gräddvita gångytor och bruna sidor, sedd snett framifrån",
  2: "Skumtrappan uppställd mot en soffkant, med de tre stegen ut mot golvet",
  "K": "Faktakort: husdjurstrappa i skum, 39 cm i tre steg och 26 cm utan det översta, maxlast 15 kg",
  4: "Det översta steget lyft från trappan, så att skarven mot de två undre stegen syns",
  5: "Det avtagna översta steget liggande bredvid den kvarvarande tvåstegstrappan",
  3: "Måttritning för skumtrappan: 39 cm hög, 26 cm utan översta steget, 54 × 40 cm i botten",
 },
}


def granska():
    """Rundans EGEN förbjudna-ord-lista + husets grindar, mot alt-texterna."""
    fel = []
    for pid, d in ALT.items():
        if sorted(d, key=str) != sorted(ORDNING, key=str):
            fel.append(f"{pid}: alt-texterna täcker inte exakt {ORDNING}")
        for plats, txt in d.items():
            var = f"{pid} plats {plats}"
            if plats == "K" and not txt.startswith("Faktakort: "):
                fel.append(f"{var}: kortets alt måste börja med 'Faktakort: '")
            if plats != "K" and txt.startswith("Faktakort"):
                fel.append(f"{var}: bara kortet får heta Faktakort")
            for m in GR.FORBJUDET:
                monster, etikett = m if isinstance(m, tuple) else (m, m.pattern)
                if monster.search(txt):
                    fel.append(f"{var}: fälls av {etikett}")
            if GR.FORBJUDEN_TYP.search(txt):
                fel.append(f"{var}: FEL PRODUKTTYP i alt-texten — {txt!r}")
            if G.ARTNR.search(txt):
                fel.append(f"{var}: ARTIKELNUMMER i alt-texten")
            for c, n, s in G.homoglyfer(txt):
                fel.append(f"{var}: HOMOGLYF {c} ({n}) — …{s}…")
            for tysk in G.TYSKA:
                if re.search(r"\b" + re.escape(tysk) + r"\b", txt, re.I):
                    fel.append(f"{var}: TYSKT ORD {tysk!r} — {txt!r}")
            # ☠️ Talgrinden gäller HÄR OCKSÅ. Varje tal i alt-texten måste
            #    finnas i produktens egna mått — annars är det ett påstående
            #    utan täckning, en nivå under där textgrinden letar.
            kallo = " ".join(v for _, v in T.SPEC[pid]) + " " + T.SLUG[pid]
            for tal in re.findall(r"\d+(?:,\d+)?", txt):
                if tal not in kallo:
                    fel.append(f"{var}: TALET {tal} finns inte i spec-tabellen")
            # ☠️ Djur och stajling är inte produktinformation.
            for ord_ in ("katt", "hund", "valp", "kattunge", "husdjuret"):
                if re.search(r"\b" + ord_ + r"(?:en|ar|arna|ens)?\b", txt.lower()):
                    if not txt.lower().startswith(("hundtrappa", "kattrappa",
                                                   "husdjurstrappa")) \
                       and "hundtrappa" not in txt.lower() \
                       and "kattrappa" not in txt.lower() \
                       and "husdjurstrappa" not in txt.lower():
                        fel.append(f"{var}: DJUR i alt-texten — {txt!r}")
    return fel


if __name__ == "__main__":
    f = granska()
    print(f"alttexter.granska(): {sum(len(d) for d in ALT.values())} alt-texter, "
          f"{len(f)} fel")
    for x in f:
        print("  ✗", x)
    raise SystemExit(1 if f else 0)
