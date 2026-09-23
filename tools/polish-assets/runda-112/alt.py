# -*- coding: utf-8 -*-
"""Runda 112 Steg 9 — alt-texter för 48 bilder, med egen grind.

☠️ RUNDANS EGNA FÖRBJUDNA ORD KÖRS MOT ALT-TEXTEN, och listorna IMPORTERAS
   ur `grind.py` — de skrivs aldrig av. Runbookens Steg 9 säger det rakt ut:
   alt-texten passerar ingen textgrind, så varje regel textgrinden vaktar är
   oskyddad där, en nivå under där regeln letar. Runda 106 mätte upp vad det
   kostar: sex sidor vars brödtext sa att hagen inte säljs som kaninbostad,
   grinden grön på alla sex, och fem av dem hade "kaniner" i en alt-text.
   Här gäller det mörkläggnings-, upplösnings- och vinkellöftena samt varje
   produkts EGET materialord — en kopia av dem hade glidit isär på första
   ändringen.

☠️ TALEN GRINDAS MOT SIDANS EGEN TEXT, inte mot en handskriven lista. Regeln
   är mekanisk och strängare än runda 111:s: ett tal får stå i alt-texten bara
   om det redan står i produktens FÄRDIGA HTML. Då kan en alt-text aldrig bli
   sidans enda källa till ett påstående — och listan kan inte glömma ett fält
   när `matt.py` växer.

☠️ FYRA BILDER ÄR SAMMA RENDER PÅ TVÅ SIDOR (bildplan.py): `422ab1bd-4` =
   `a8c82049-5` och `ddca577d-5` = `77d2b35c-4`. Deras alt-texter får därför
   INTE namnge storleken — bilden visar inte just den duken. Grinden känner
   paren och fäller om ett tumtal eller ett dukmått smyger in i dem.

☠️ GRINDEN FÄLLDE MIG PÅ EN ENHET, INTE PÅ ETT TAL. `fe11166f`:s ritning
   skriver `203 cm`; sidans spec skriver samma mått som `2,03 m`. Alt-texten
   hade alltså blivit sidans ENDA ställe där talet 203 står — precis det
   regeln finns för. Rättat till `2,03 m`, inte genom att vidga grinden.

⚠️ RUNDA 110:S DYRASTE BILDLÄRDOM GÄLLER: miljöbilderna lästes i 640 px och en
   BORDSDUK blev "en ljus pläd". Texterna här beskriver bara det som går att
   avgöra säkert — produkten, konstruktionen, rummets TYP — aldrig rekvisita.

☠️ `77e4a558` HAR BARA TRE POSTER. Tre av dess fem råbilder bär text i
   pixlarna (se bildplan.py) och är strukna, hjälten är livsstilsbilden.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import matt                                                       # noqa: E402
import texter as T                                                # noqa: E402
import bildplan                                                   # noqa: E402
import grind                                                      # noqa: E402

MAX = 125

TYSKT = re.compile(r"\b(Leinwand|Beamer|Stative|Bodenpf|Seile|Wandmontage|"
                   r"Deckenmontage|Bildschirm|und|mit|für|der|die|das)\b")
HUSMARKE = re.compile(r"\b(HOMCOM|Outsunny|PawHut|Aiyaplay|Vinsetto|Aosom|"
                      r"AliExpress)\b", re.I)
LAND = re.compile(r"\b(Tyskland|tyska?|Spanien|spansk|Polen|Kina|kines)", re.I)
ARTNR = re.compile(r"\b\d{3}-\d{3}[A-Z0-9]*\b")
PRODUKTORD = re.compile(r"(duk|Duk|stativ|kassett|hölje|Faktakort|Måttritning|"
                        r"väggfäst|fäste)", re.I)
# Bilder som är SAMMA render på två sidor — får inte namnge storleken.
DELADE = {("422ab1bd", 4), ("a8c82049", 5), ("ddca577d", 5), ("77d2b35c", 4)}
STORLEKSORD = re.compile(r"\d+\s*(tum|×)")

# nyckel -> [(råbildsindex eller "KORT", alt-text)], i galleriordning.
ALT = {
 "1b87909f": [
   (1, "Projektorduk spänd i en svart ram som bärs upp av två stativ, sedd rakt framifrån"),
   (2, "Duken uppställd på en gräsmatta en kväll, med en fotbollsmatch projicerad på den"),
   ("KORT", "Faktakort: projektorduk 263 × 148 cm i 16:9, ramöppning 275 × 159 cm, 4 kg"),
   (5, "Duken uppställd på en takterrass om kvällen med projektorn på bordet framför"),
   (3, "Måttritning: duk 263 × 148 cm, 120 tum, uppställd 309 cm bred och 217 cm hög"),
 ],
 "422ab1bd": [
   (1, "Motoriserad projektorduk i vit kassett med kvadratisk duk, väggpanel och fjärrkontroll"),
   (2, "Duken nedkörd på en mörk vägg i ett vardagsrum medan två personer ser på från soffan"),
   ("KORT", "Faktakort: motoriserad projektorduk 165 × 165 cm i 1:1, bildyta 162 × 162 cm, 8,5 kg"),
   (4, "Duken nedkörd över en mediabänk med ett vinterlandskap projicerat"),
   (5, "Duken nedkörd i ett mötesrum med diagram projicerade och projektorn på bordet"),
   (3, "Måttritning: kassett 189,5 cm bred, duk 92 tum, bildyta 162 × 162 cm"),
 ],
 "a8c82049": [
   (1, "Motoriserad projektorduk i vit kassett med kvadratisk duk, väggpanel och fjärrkontroll"),
   (2, "Duken nedkörd på en mörk vägg i ett vardagsrum medan två personer ser på från soffan"),
   ("KORT", "Faktakort: motoriserad projektorduk 152 × 152 cm i 1:1, bildyta 149 × 149 cm, 8 kg"),
   (4, "Duken nedkörd i ett vardagsrum med en surfare projicerad och soffa framför"),
   (5, "Duken nedkörd över en mediabänk med ett vinterlandskap projicerat"),
   (3, "Måttritning: kassett 176,5 cm bred, duk 85 tum, bildyta 149 × 149 cm"),
 ],
 "ddca577d": [
   (1, "Manuell projektorduk i svart kassett med draghandtag i nederkant, sedd rakt framifrån"),
   (2, "Duken nedkörd i ett vardagsrum med indirekt ljus bakom och två personer framför"),
   ("KORT", "Faktakort: manuell projektorduk 171 × 128 cm i 4:3, bildyta 165 × 124 cm, 7,5 kg"),
   (5, "Duken nedkörd i ett mötesrum med diagram projicerade och två personer vid bordet"),
   (3, "Måttritning: kassett 181 cm bred, duk 84 tum, bildyta 165 × 124 cm"),
 ],
 "77d2b35c": [
   (1, "Manuell projektorduk i svart kassett med kvadratisk duk och draghandtag i nederkant"),
   (2, "Duken nedkörd i ett vardagsrum med indirekt ljus bakom och två personer framför"),
   ("KORT", "Faktakort: manuell projektorduk 178 × 178 cm i 1:1, bildyta 172 × 172 cm, 8 kg"),
   (4, "Duken nedkörd i ett mötesrum med diagram projicerade och två personer vid bordet"),
   (5, "Närbild på den svarta kassettens gavel och väggfästet"),
   (3, "Måttritning: kassett 189 cm bred, duk 99 tum, bildyta 172 × 172 cm"),
 ],
 "0370673c": [
   (1, "Projektorduk på trebent stativ med svart hölje, uppfälld och sedd rakt framifrån"),
   (2, "Stativduken uppställd i ett vardagsrum med projektorn på bordet framför"),
   ("KORT", "Faktakort: projektorduk på stativ 171 × 131 cm i 4:3, bildyta 165 × 125 cm, svart"),
   (4, "Stativduken uppställd i ett mötesrum med diagram projicerade och två personer vid bordet"),
   (5, "Stativduken uppställd på en gräsmatta i skymningen med en ljusslinga över"),
   (3, "Måttritning: hölje 180 cm brett, duk 84 tum, bildyta 165 × 125 cm"),
 ],
 "fe11166f": [
   (1, "Projektorduk på trebent stativ med vitt hölje, uppfälld med tom duk"),
   (2, "Stativduken uppställd i ett ljust rum medan en person pekar på den projicerade bilden"),
   ("KORT", "Faktakort: projektorduk på stativ 171 × 131 cm i 4:3, bildyta 165 × 125 cm, vit"),
   (4, "Närbild på det vita fästet i höljets överkant"),
   (5, "Närbild på stativets vita rör där det möter höljet"),
   (3, "Måttritning: duk 171 × 131 cm, 84 tum, bildyta 165 × 125 cm, 2,03 m total höjd"),
 ],
 "623b6504": [
   (1, "Motoriserad projektorduk med svart hölje, väggpanel på sladden och trådlös fjärrkontroll"),
   (2, "Duken nedkörd i ett vardagsrum medan fyra personer ser på från soffan"),
   ("KORT", "Faktakort: motoriserad projektorduk 171 × 130 cm i 4:3, hölje 191 cm, 7,4 kg, svart"),
   (5, "Duken nedkörd över en mediabänk med högtalare i ett ljust rum"),
   (3, "Måttritning: hölje 191 cm brett, duk 84 tum, 171 × 130 cm"),
 ],
 "77e4a558": [
   (2, "Duken nedkörd på en vardagsrumsvägg med en fotbollsmatch projicerad framför fyra personer"),
   ("KORT", "Faktakort: motoriserad projektorduk 171 × 130 cm i 4:3, hölje 191 cm, 7,4 kg, vit"),
   (3, "Måttritning: hölje 191 cm brett, duk 84 tum, 171 × 130 cm"),
 ],
}


def sidans_tal(k):
    """Talen produktens FÄRDIGA sida faktiskt skriver ut."""
    txt = re.sub(r"<[^>]+>", " ", T.bygg(k)["html"])
    return set(re.findall(r"\d+(?:,\d+)?", txt))


def granska():
    fel = []
    for k, rader in ALT.items():
        if [i for i, _ in rader] != bildplan.GALLERI[k]:
            fel.append(f"{k}: alt-ordningen är inte galleriets ordning")
        tillatna = sidans_tal(k)
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
            # ☠️ Rundans egna löftesgrindar, importerade ur grind.py.
            for etikett, monster in (("MÖRKLÄGGNINGSLÖFTE", grind.MORKLAGGNING),
                                     ("UPPLÖSNINGSLÖFTE", grind.UPPLOSNING),
                                     ("VINKELLÖFTE", grind.VINKELLOFTE)) + grind.TONGRINDAR:
                t = monster.search(txt)
                if t:
                    fel.append(f"{märke}: {etikett} {t.group(0)!r}")
            if k in grind.FORBJUDET_ORD:
                t = grind.FORBJUDET_ORD[k].search(txt)
                if t:
                    fel.append(f"{märke}: FEL MATERIAL {t.group(0)!r}")
            if not PRODUKTORD.search(txt):
                fel.append(f"{märke}: namnger varken produkten eller bildtypen")
            for tal_ in re.findall(r"\d+(?:,\d+)?", txt):
                if tal_ not in tillatna:
                    fel.append(f"{märke}: talet {tal_} står inte i sidans egen text")
            # ☠️ En delad render får inte namnge storleken — den visar inte
            #    just den här duken.
            if (k, idx) in DELADE and STORLEKSORD.search(txt):
                fel.append(f"{märke}: delad render namnger en storlek")
    # Båda halvorna av ett delat par ska beskriva SAMMA bild likadant.
    for a, b in (("422ab1bd", 4), ("a8c82049", 5)), (("ddca577d", 5), ("77d2b35c", 4)):
        ta = dict(ALT[a[0]])[a[1]]
        tb = dict(ALT[b[0]])[b[1]]
        if ta != tb:
            fel.append(f"{a[0]}#{a[1]} och {b[0]}#{b[1]} är samma render men "
                       f"beskrivs olika")
    return fel


# Självtestfall — grinden ska fälla dessa, och släppa igenom den rätta raden.
SJALVTEST = [
    ("tyskt ord", "Leinwand med kvadratisk duk", True),
    ("husmärke", "Projektorduk från HOMCOM i vit kassett", True),
    ("lagerland", "Projektorduk som skickas från Tyskland", True),
    ("artikelnummer", "Projektorduk 845-030CG i vit kassett", True),
    ("tal som inte står på sidan", "Projektorduk med 999 cm bred duk", True),
    ("för lång", "Projektorduk " + "x" * 130, True),
    ("utan produktord", "Fyra personer i en soffa en kväll", True),
    ("upplösningslöfte", "Projektorduk för 4K och 8K i svart kassett", True),
    ("mörkläggningslöfte", "Projektorduk som blockerar ljus, i svart kassett", True),
    ("leverantörsattribution", "Projektorduk som leverantören anger som matt", True),
    ("korrekt rad", "Manuell projektorduk i svart kassett med draghandtag", False),
]


def _sjalvtest():
    tillatna = sidans_tal("ddca577d")
    fel = 0
    for etikett, txt, ska in SJALVTEST:
        traff = bool(len(txt) > MAX or TYSKT.search(txt) or HUSMARKE.search(txt)
                     or LAND.search(txt) or ARTNR.search(txt)
                     or not PRODUKTORD.search(txt)
                     or grind.MORKLAGGNING.search(txt) or grind.UPPLOSNING.search(txt)
                     or grind.VINKELLOFTE.search(txt)
                     or any(m.search(txt) for _, m in grind.TONGRINDAR)
                     or any(t not in tillatna
                            for t in re.findall(r"\d+(?:,\d+)?", txt)))
        if traff != ska:
            fel += 1
            print(f"✗ SJÄLVTEST {etikett}: väntade {ska}, fick {traff}")
    print(f"självtest: {len(SJALVTEST)} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    sjfel = _sjalvtest()
    fel = granska()
    for f in fel:
        print("✗", f)
    n = sum(len(v) for v in ALT.values())
    for k in matt.RUNDAN:
        borta = len(bildplan.BORTTAGNA.get(k, {}))
        print("  %s  %d bilder%s" % (k, len(ALT[k]),
              "   (%d borttagna)" % borta if borta else ""))
    print(f"\n{n} alt-texter, {len(fel)} fel")
    sys.exit(1 if (fel or sjfel) else 0)
