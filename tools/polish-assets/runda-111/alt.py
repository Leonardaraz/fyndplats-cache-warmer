# -*- coding: utf-8 -*-
"""Runda 111 Steg 9 — alt-texter för 41 bilder, med egen grind.

☠️ ALLA SJU GALLERIER BAR LEVERANTÖRENS RÅA TYSKA TITEL SOM ALT-TEXT, och två
   av dem (1c1eb875, db70e38c) bar TOM alt-text på alla fem bilderna. Båda
   felen är osynliga för en läsare och fullt synliga för en skärmläsare och
   för Google.

⚠️ RUNDA 110:S DYRASTE BILDLÄRDOM: miljöbilderna lästes i 640 px och en
   BORDSDUK blev "en ljus pläd". Alt-texterna här beskriver därför bara det
   som går att avgöra säkert — produkten, panelantalet, materialet och
   rummets TYP — och aldrig små rekvisita. Det som inte är mätt beskrivs inte.

☠️ 99040238 BILD 4 ÄR BORTTAGEN, inte alt-satt. Den bär `Leichtes Gewicht` och
   `Lichtundurchlässiges Material` inbränt i pixlarna. En alt-text på svenska
   hade lämnat den tyska texten kvar i bilden.
"""
import re, sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import matt                                                       # noqa: E402
import texter as T                                                # noqa: E402

MAX = 125

# nyckel -> lista av (raw-index eller "KORT", alt-text), i den ordning de ska
# ligga i galleriet. Måttritningen SIST, kortet på plats 3.
ALT = {
 "e858810e": [
   (1, "Vikbar rumsavdelare med fyra paneler i furu och vit tygfyllning, sedd rakt framifrån"),
   (2, "Rumsavdelaren uppställd i vinkel i ett vardagsrum, 160 cm bred och 170 cm hög"),
   ("KORT", "Faktakort: rumsavdelare 160 × 170 cm, fyra paneler, 7,5 kg, levereras färdigmonterad"),
   (4, "Närbild på fururamen och gångjärnet mellan två paneler"),
   (5, "Rumsavdelaren i vinkel bakom en sittgrupp"),
   (3, "Måttritning: 160 cm bred, 170 cm hög, varje panel 40 cm"),
 ],
 "f641d190": [
   (1, "Vikbar rumsavdelare med tre paneler i furu och vit tygfyllning, sedd rakt framifrån"),
   (2, "Rumsavdelaren uppställd i vinkel i ett ljust vardagsrum, 120 cm bred och 170 cm hög"),
   ("KORT", "Faktakort: rumsavdelare 120 × 170 cm, tre paneler, 6 kg, levereras färdigmonterad"),
   (4, "Närbild på fururamens överkant och gångjärnet"),
   (5, "Rumsavdelaren uppställd i ett rum med gröna växter"),
   (3, "Måttritning: 120 cm bred, 170 cm hög, varje panel 40 cm"),
 ],
 "1c1eb875": [
   (1, "Vikbar rumsavdelare med fyra paneler och grönt palmbladsmönster på vit botten"),
   (2, "Rumsavdelaren med palmbladsmönster uppställd i ett vardagsrum"),
   ("KORT", "Faktakort: rumsavdelare 160 × 170 cm, fyra paneler, 8 kg, levereras färdigmonterad"),
   (4, "Fyra bilder på rumsavdelaren uppställd i vardagsrum, sovrum och vid en matplats"),
   (5, "Rumsavdelaren uppställd bredvid en fåtölj vid ett fönster"),
   (3, "Måttritning: 160 cm bred, 170 cm hög, varje panel 40 cm"),
 ],
 "23d20823": [
   (1, "Vikbar rumsavdelare med tre bågformade paneler i flätat pappersrep på ben"),
   (2, "Rumsavdelaren i flätat pappersrep uppställd i ett ljust vardagsrum"),
   ("KORT", "Faktakort: rumsavdelare 120 × 170 cm, tre paneler, 4,3 kg, levereras färdigmonterad"),
   (4, "Fyra bilder på rumsavdelaren uppställd i sovrum, vardagsrum och vid ett skrivbord"),
   (5, "Rumsavdelaren uppställd bakom en soffa vid ett fönster"),
   (3, "Måttritning: 120 cm bred, 170 cm hög, varje panel 40 cm"),
 ],
 "db70e38c": [
   (1, "Vit rumsavdelare med fyra flätade paneler och två hyllplan, sedd snett framifrån"),
   (2, "Rumsavdelaren med hyllplanen uppställd i ett vardagsrum, med små föremål på hyllorna"),
   ("KORT", "Faktakort: rumsavdelare 181 × 180 cm, fyra paneler, två hyllplan om högst 5 kg"),
   (4, "Närbild på ett hyllplan och den flätade väven bakom"),
   (5, "Närbild på de vita flätade banden och träspjälorna"),
   (3, "Måttritning: 181 cm bred, 180 cm hög, varje panel 45 cm, hyllplan 170 × 20 cm"),
 ],
 "79b349f7": [
   (1, "Rumsavdelare med fem paneler i mörkgrå polyester på stolpar med hjul"),
   (2, "Rumsavdelaren uppställd som avskärmning i ett sovrum"),
   ("KORT", "Faktakort: rumsavdelare 252 × 170 cm, fem paneler, tolv hjul, 13,7 kg"),
   (4, "Rumsavdelaren uppställd i vinkel i ett vardagsrum"),
   (5, "Rumsavdelaren uppställd mellan arbetsplatser i ett kontor"),
   (3, "Måttritning: 252 cm bred, 170 cm hög, varje panel 50 cm, fotdjup 40 cm"),
 ],
 "99040238": [
   (1, "Rumsavdelare med tre paneler i svart polyester på svart metallstomme"),
   (2, "Rumsavdelaren uppställd som avskärmning vid en matplats"),
   ("KORT", "Faktakort: rumsavdelare 253 × 182 cm, tre paneler, 6,8 kg, monteras"),
   (5, "Närbild på den tätt vävda svarta polyesterduken"),
   (3, "Måttritning: 253 cm bred, 182 cm hög, varje panel 84 cm"),
 ],
}

# Bilder som INTE ska med i galleriet, och varför.
BORTTAGNA = {
 "99040238": {4: "bär `Leichtes Gewicht` och `Lichtundurchlässiges Material` "
                 "inbränt i pixlarna"},
}

TYSKT = re.compile(r"\b(Raumteiler|Raumtrenner|Paravent|Trennwand|Sichtschutz|Kiefernholz|"
                   r"Faltbar|Gefaltete|Abmessungen|Wohnzimmer|Schlafzimmer|Weiß|Rollen)\b", re.I)
HUSMARKE = re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)
LAND = re.compile(r"\b(Tyskland|Polen|Spanien|Kina|Germany)\b", re.I)
ARTNR = re.compile(r"\b(?=[0-9A-Z-]*[A-Z])[0-9][0-9A-Z]{1,3}-[0-9A-Z]{4,}\b")
PRODUKTORD = re.compile(r"(rumsavdelare|faktakort|måttritning|närbild)", re.I)


def granska():
    fel = []
    for k, rader in ALT.items():
        v = matt.RUNDAN[k]
        # ☠️ TALEN NORMALISERAS MED SAMMA FUNKTION SOM TEXTEN. Grinden byggde
        #    först mängden med `str(40.0)` och fällde tre KORREKTA rader — den
        #    jämförde "40" mot "40.0" och "6" mot "6.0". En grind som mäter med
        #    ett annat mått än det den granskar fäller på sin egen enhet.
        tillatna = {T.tal(x) for x in (v[0], v[1], v[2], v[3], v[4], v[6])}
        tillatna |= {T.tal(x) for x in v[7]}                 # paketmåtten
        if v[5]:
            tillatna |= {T.tal(x) for x in v[5]}             # hopfällt
        tillatna |= {"2", "5", "12", "20", "170"}            # hyllor, hjul, hylldjup
        sedda = set()
        for idx, txt in rader:
            märke = f"{k}#{idx}"
            if len(txt) > MAX:
                fel.append(f"{märke}: {len(txt)} tecken (max {MAX})")
            if txt in sedda:
                fel.append(f"{märke}: identisk alt-text som en annan bild i samma galleri")
            sedda.add(txt)
            for namn, m in (("tyskt ord", TYSKT), ("husmärke", HUSMARKE),
                            ("lagerland", LAND), ("artikelnummer", ARTNR)):
                t = m.search(txt)
                if t:
                    fel.append(f"{märke}: {namn} {t.group(0)!r}")
            if not PRODUKTORD.search(txt):
                fel.append(f"{märke}: namnger varken produkten eller bildtypen")
            # Varje tal i alt-texten ska gå att peka på i matt.py
            for tal_ in re.findall(r"\d+(?:,\d+)?", txt):
                if tal_ not in tillatna:
                    fel.append(f"{märke}: talet {tal_} går inte att härleda ur matt.py")
    return fel


# Självtestfall — grinden ska fälla dessa, och släppa igenom den rätta raden.
SJALVTEST = [
    ("tyskt ord", "Raumteiler med fyra paneler", True),
    ("husmärke", "Rumsavdelare från HOMCOM med fyra paneler", True),
    ("lagerland", "Rumsavdelare som skickas från Tyskland", True),
    ("ohärlett tal", "Rumsavdelare med fyra paneler, 999 cm bred", True),
    ("för lång", "Rumsavdelare " + "x" * 130, True),
    ("utan produktord", "Fyra paneler sedda rakt framifrån", True),
    ("korrekt rad", "Vikbar rumsavdelare med fyra paneler i furu", False),
]

if __name__ == "__main__":
    sjfel = 0
    for etikett, txt, ska in SJALVTEST:
        v = matt.RUNDAN["e858810e"]
        tillatna = {str(v[0]), str(v[1]), str(v[2]), str(v[4])}
        traff = bool(len(txt) > MAX
                     or TYSKT.search(txt) or HUSMARKE.search(txt) or LAND.search(txt)
                     or ARTNR.search(txt) or not PRODUKTORD.search(txt)
                     or any(t not in tillatna for t in re.findall(r"\d+(?:,\d+)?", txt)))
        if traff != ska:
            sjfel += 1
            print(f"✗ SJÄLVTEST {etikett}: väntade {ska}, fick {traff}")
    print(f"självtest: {len(SJALVTEST)} fall, {sjfel} fel")

    fel = granska()
    for f in fel:
        print("✗", f)
    n = sum(len(v) for v in ALT.values())
    print(f"{n} alt-texter, {len(fel)} fel")
    for k in matt.RUNDAN:
        print("  %s  %d bilder%s" % (k, len(ALT[k]),
              "   (1 borttagen: %s)" % list(BORTTAGNA[k].values())[0] if k in BORTTAGNA else ""))
    sys.exit(1 if (fel or sjfel) else 0)
