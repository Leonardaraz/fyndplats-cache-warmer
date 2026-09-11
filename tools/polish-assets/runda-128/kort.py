# -*- coding: utf-8 -*-
"""Runda 128 Steg 11 — nio Fyndplats-kort.

☠️ STEGET HOPPADES ÖVER I ÅTTA RUNDOR. Runda 110–120 har 6–9 spårade kort var;
   runda 121–128 hade NOLL. Klart-kriteriet i runbooken är ovillkorligt —
   *"minst ett eget Fyndplats-kort finns i galleriet"* — och det föll bort
   runda efter runda utan att någon grind fångade det. Kortet är det enda i
   galleriet som är VÅRT: utan det är sidan en vidarebefordran av
   leverantörens marknadsföring, och Aosoms foton är byte-identiska hos
   varenda återförsäljare som kör samma feed.

☠️ KICKERN MÅSTE VARA UNIK INOM RUNDAN. Sex av nio är verktygsvagnar; en
   kicker som bara säger "Verktygsvagn" hjälper inte kunden att skilja
   sidorna åt i en kategorilista, och `kontroll()` fäller på det.

⚠️ RUBRIKEN BÄRS AV FOTOT, inte av specen. Varje rubrik nedan är vald mot
   bild 1 och kontrollerad i kontaktarket:

     bc2e7191  tre hyllplan och kedjorna syns rakt framifrån
     beeada22  ventilationsspringorna är dörrarnas dominerande drag
     1654dd75  lådbanken och det öppna sidoregalet står bredvid varandra
     f2495eee  den rostfria skivan är bildens ljusaste yta
     1db06f83  hålplattan sitter överst i alla tre vyerna
     b920d526  alla lådor utdragna i trappform, tvådelningen syns
     d9965552  samma komposition i blått
     fc6fdd63  två delar, fjorton lådfronter räknebara
     81c123fa  de tre zonerna syns som två dörrpar och en låda

⚠️ `fc6fdd63` fick INTE rubriken "Hålvägg och sidohylla" trots att sidan
   argumenterar för båda: hålväggen sitter på gaveln och syns bara i kant på
   bild 1. Samma avvägning som fällde runda 61:s "Skärmen 12,5 cm högre".
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortbygge as KB                                            # noqa: E402
import texter as T                                                # noqa: E402

# (kicker, rubrik) — kickern unik, rubriken buren av bild 1.
KORT = {
    "bc2e7191": ("Svetsvagn 71 cm", "Tre plan och två kedjor"),
    "beeada22": ("Plåtskåp 110 cm", "Ventilerade dörrar"),
    "1654dd75": ("Verktygsvagn 96 cm", "Sju lådor och ett sidoregal"),
    "f2495eee": ("Verktygsvagn 65,5 cm", "Rostfri bänkskiva"),
    "1db06f83": ("Verktygsskåp 133 cm", "Hålplatta, lådor och skåp"),
    "b920d526": ("Verktygsvagn i rött", "Sexton lådor i två delar"),
    "d9965552": ("Verktygsvagn i blått", "Sexton lådor i två delar"),
    "fc6fdd63": ("Verktygsvagn 109 cm", "Fjorton lådor i två delar"),
    "81c123fa": ("Verktygsskåp 180 cm", "Tre låszoner"),
}

# ☠️ ETIKETTERNA PEKAR IN I `T.SPEC`, de skrivs aldrig om. Kortet ska bära
#    SAMMA sträng som spec-tabellen — runda 60 fick en andra sanning när ett
#    kort skrev om ett värde, och runda 65 fick "Vikt: grå" av en etikett
#    som inte hörde till sin rad.
RADER = {
    "bc2e7191": ["Mått", "Hyllplan", "Kedjor", "Maxlast", "Vikt"],
    "beeada22": ["Mått", "Dörrar", "Hyllplan", "Maxlast", "Vikt"],
    "1654dd75": ["Mått", "Lådor", "Sidoregal", "Maxlast", "Vikt"],
    "f2495eee": ["Mått", "Lådor", "Bänkskiva", "Maxlast", "Vikt"],
    "1db06f83": ["Mått", "Hålplatta", "Lådor", "Maxlast", "Vikt"],
    "b920d526": ["Mått", "Överkista", "Underskåp", "Lådor", "Vikt"],
    "d9965552": ["Mått", "Överkista", "Underskåp", "Lådor", "Vikt"],
    "fc6fdd63": ["Mått", "Överkista", "Underskåp", "Lådor", "Vikt"],
    "81c123fa": ["Mått", "Zoner", "Hyllplan", "Maxlast", "Vikt"],
}


def specrad(pid, etikett):
    """Raden ur spec-tabellen — kastar hellre än gissar."""
    for e, v in T.SPEC[pid]:
        if e == etikett:
            return f"{e}: {v}"
    raise KeyError(f"{pid} saknar spec-raden {etikett!r}")


def kontroll():
    """Fäller FÖRE bygget — ett fel kort är redan uppladdat efteråt."""
    fel = []
    sedda, kickers = {}, {}
    for pid in T.NAMN:
        if pid not in KORT:
            fel.append(f"{pid}: saknas i KORT")
            continue
        kicker, rubrik = KORT[pid]
        rader = [specrad(pid, e) for e in RADER[pid]]

        if len(rader) != 5:
            fel.append(f"{pid}: {len(rader)} rader, ska ha 5")
        # ☠️ Ett overifierat fält får aldrig nå ett kort.
        for r in rader:
            if "None" in r or ": " not in r:
                fel.append(f"{pid}: trasig rad — {r!r}")
        # Måttet måste stå på varje kort — det är kortets hela poäng.
        if not any(r.startswith("Mått: ") for r in rader):
            fel.append(f"{pid}: kortet saknar Mått")

        nyckel = (kicker, rubrik, tuple(rader))
        if nyckel in sedda:
            fel.append(f"{pid} och {sedda[nyckel]} får IDENTISKA kort")
        sedda[nyckel] = pid
        # ☠️ Sex av nio är verktygsvagnar — en delad kicker gör dem
        #    oskiljbara i en kategorilista.
        if kicker in kickers:
            fel.append(f"{pid} och {kickers[kicker]} delar kicker {kicker!r}")
        kickers[kicker] = pid

        # Rubriken är kundtext och grindas som sådan.
        import grind as GR                                        # noqa: E402
        import grindar as G                                       # noqa: E402
        txt = f"{kicker}. {rubrik}."
        for monster, etikett in GR.FORBJUDET + GR.TONGRINDAR:
            if monster.search(txt):
                fel.append(f"{pid} KORT {etikett}: {txt}")
        fel += [f"{pid} KORT HOMOGLYF {c} ({n})"
                for c, n, _ in G.homoglyfer(txt)]

        foto = os.path.join(HAR, "rawbilder", f"{pid}-1.jpg")
        if not os.path.exists(foto):
            fel.append(f"{pid}: hjältebilden saknas — {foto}")
    return fel


if __name__ == "__main__":
    f = kontroll()
    print(f"kort.kontroll: {len(T.NAMN)} produkter, {len(f)} fel")
    for x in f:
        print("  ✗", x)
    if f:
        sys.exit(1)
    os.chdir(HAR)
    alla = list(T.NAMN)
    produkter = [{"kort": p, "spec": [specrad(p, e) for e in RADER[p]]}
                 for p in alla]
    kortdata = {p: (KORT[p][0], KORT[p][1],
                    [(e, i) for i, e in enumerate(RADER[p])]) for p in alla}
    namn, facit = KB.bygg(HAR, produkter, kortdata)
    json.dump(facit, open("kort-facit.json", "w"), ensure_ascii=False, indent=1)
    for n in namn:
        print(f"  {n}  {os.path.getsize('jpg/%s.jpg' % n):>7} byte")
