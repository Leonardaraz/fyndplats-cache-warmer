# -*- coding: utf-8 -*-
"""Runda 142 — galleriets ordning och alt-texter.

☠️ ALT-TEXTEN PASSERAR INGEN AV RUNDANS VANLIGA GRINDAR. Textgrinden läser
   `texter.py` och `brodtext.py`; alt-texten skrivs här och finns inte i
   någon av dem. Varje regel grinden vaktar är alltså oskyddad — och det är
   det sämsta stället att ha ett hål, för alt-texten är vad Google och
   skärmläsaren läser. Runda 106 mätte upp det: fem sidor vars brödtext
   sa "säljs inte som kaninbostad" hade "kaniner" i en alt-text.

   Runbokens svar, och det som körs här: SAMMA lista, inte en omskriven
   variant. `granska()` kör `grind.FORBJUDET` över varenda alt-text.

⚠️ BESKRIV VARAN, INTE STAJLINGEN. Leverantörens miljöbilder är iscensatta.
   Barnet på `56cca82a` bild 02, boxaren på `93073695` bild 02 och växten på
   `f0430bc5` bild 02 är inte produktinformation — utelämnas de är texten
   fortfarande sann och fullständig.

☠️ HOMCOM syns TRYCKT på a8daef42:s säck och SPORT/YOUR SAFETY på
   95f6280b:s. Bilderna rörs inte (Leonards regel), men orden når aldrig
   hit.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

GALLERI = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

# Rundans egna kort, kvitterade på md5 av `kortkvitto.py` före den här filen.
KORT_FIL = {
    "56cca82a": "b379ce_a9509942673a41cb88b6b703f6fc1fa5~mv2.jpg",
    "ce8813ce": "b379ce_19d55e4c5e8b414f9c0ef7df441f5f6d~mv2.jpg",
    "93073695": "b379ce_343661ddb69f4c80bb7f87dcad37c242~mv2.jpg",
    "4fe5959f": "b379ce_373686cb4dab4380b9ba890c15865de0~mv2.jpg",
    "136a4671": "b379ce_c9136956c4624b7399665c5b5202d82d~mv2.jpg",
    "2730de6f": "b379ce_f05868226b08499ba7a70b26004e14d0~mv2.jpg",
    "2a13cbbe": "b379ce_3e2d502f4bd84dfdb7563732cc3331f7~mv2.jpg",
    "95f6280b": "b379ce_b373d6b55a694593aecb178117b9eb27~mv2.jpg",
    "c8f6b93f": "b379ce_6392e0273d1d470b8612a424c5f3ae7c~mv2.jpg",
    "a8daef42": "b379ce_d9d4ab5872f04c62bfcb6042ee20e784~mv2.jpg",
    "f0430bc5": "b379ce_af61d92d931c4a76ab9d5bf017939165~mv2.jpg",
}

# ☠️ 56cca82a bild 04 är den TYSKA marknadsgrafiken ("STABILER SOCKEL").
#    Enda bilden i rundan som kastas; talen den bar bor nu i spec-tabellen
#    och på rundans eget kort.
KASTAS = {"56cca82a": [3]}

# Galleriets ordning: hjälte, verklighetsbild, KORT, detaljer, måttritning
# SIST. Index avser `bilder.json`, som ligger i leverantörens ordning
# 1, 2, 3, 8, 9 — alltså är index 2 måttritningen.
# ☠️ Kontrollmätt, inte antaget: kontaktarket `steg9-index2.jpg` visar elva
#    måttritningar på elva produkter.
ORDNING = {pid: [0, 1, "KORT", 3, 4, 2] for pid in GALLERI}
ORDNING["56cca82a"] = [0, 1, "KORT", 4, 2]     # 04 kastad

# pid -> {index|"KORT": alt-text}
ALT = {
    "56cca82a": {
        0: "Punchingboll på höjdjusterbart golvställ med röd och svart boll, "
           "svart rund fot och ett par röda boxhandskar bredvid",
        1: "Punchingbollen står på golvet i ett ljust rum, i höjd med en "
           "stående persons överkropp",
        "KORT": "Faktakort: punchingboll i fyra höjder 125/131/138/145 cm. "
                "Fot Ø43 × 12 cm, boll Ø24 × 30 cm, 15 kg vatten eller "
                "20 kg sand i foten",
        4: "De två röda boxhandskarna som följer med, med vit snörning och "
           "vadderad knogdel",
        2: "Måttritning: bollen 24 × 30 cm, stället 125–145 cm högt och "
           "foten 43 cm i diameter",
    },
    "ce8813ce": {
        0: "Svart punchingboll på blank teleskopstång med rund svart fot",
        1: "Punchingbollen står på ett trägolv i ett vardagsrum intill en "
           "fåtölj och en grön krukväxt",
        "KORT": "Faktakort: svart punchingboll 133–151 cm. Fot Ø43 × 13,5 cm "
                "med sugpropp, boll Ø18 × 26 cm, 16,5 kg vatten eller "
                "33 kg sand",
        3: "Närbild på den svarta bollens räfflade yta och den gula fliken "
           "vid infästningen",
        4: "Närbild på fjädern mellan stången och foten, skruvad mot den "
           "svarta bottenplattan",
        2: "Måttritning: bollen 18 × 26 cm, stället 133–151 cm högt, foten "
           "43 cm bred och 13,5 cm hög",
    },
    "93073695": {
        0: "Punchingboll med röd boll på teleskopstång och en röd viktsäck "
           "spänd runt den svarta foten",
        1: "Punchingbollen står på ett gymgolv med hantlar och en bänk i "
           "bakgrunden",
        "KORT": "Faktakort: punchingboll 125/132/139/145 cm med viktsäck på "
                "15 kg. Fot Ø43 × 12 cm, boll Ø20 × 28 cm",
        3: "Punchingbollen i ett träningsrum, med den röda viktsäcken synlig "
           "runt hela foten",
        4: "Stället fristående på gymgolvet utan användare, sett snett "
           "framifrån",
        2: "Måttritning: stället 125–145 cm högt och foten 43 cm i diameter",
    },
    "4fe5959f": {
        0: "Punchingboll med röd boll på teleskopstång, svart rund fot och "
           "ett par röda boxhandskar hängande på stången",
        1: "Punchingbollen står på ett gymgolv framför ett fönster, med "
           "hantlar och en bänk i bakgrunden",
        "KORT": "Faktakort: punchingboll i fyra höjder 136/142/148/154 cm. "
                "Fot Ø48 × 23 cm med sugproppar, boll 18 × 18 × 24 cm",
        3: "Punchingbollen i ett träningsrum med skivstänger på väggen, sedd "
           "från sidan",
        4: "Stället i ett ljust gym, med den breda svarta foten mot golvet",
        2: "Måttritning: stället 136–154 cm högt, foten 48 cm bred och "
           "23 cm hög",
    },
    "136a4671": {
        0: "Punchingboll med röd och blå boll på blank teleskopstång och en "
           "bred räfflad fot",
        1: "Punchingbollen står i ett rum med väggklocka och en hylla, bollen "
           "i ungefär hakhöjd",
        "KORT": "Faktakort: punchingboll 147–165 cm, steglöst. Fot Ø48 × "
                "23 cm med sugproppar, boll Ø25 cm, 15 kg vatten eller "
                "25 kg sand",
        3: "Närbild på fotens räfflade gummiyta med upphöjt mönster",
        4: "Närbild på teleskopstångens låsskruv mellan de två rörsektionerna",
        2: "Måttritning: bollen 25 cm i diameter, stället 147–165 cm högt och "
           "foten 48 cm bred",
    },
    "2730de6f": {
        0: "Svart punchingboll på teleskopstång med synlig fjäder och en bred "
           "räfflad fot",
        1: "Punchingbollen står på ett ljust golv vid ett fönster, med "
           "träningsredskap i bakgrunden",
        "KORT": "Faktakort: svart punchingboll 145–180 cm. Fot Ø48 × 23 cm "
                "med sugproppar, boll Ø25 cm, stång Ø2,5 cm",
        3: "Närbild på den svarta bollen med gul flik vid infästningen mot "
           "stången",
        4: "Närbild på höjdvredet på stångens övre sektion",
        2: "Måttritning: bollen 25 cm i diameter, stället 145–180 cm högt och "
           "foten 48 cm bred",
    },
    "2a13cbbe": {
        0: "Punchingboll med svart boll högst upp och en vadderad reflexstång "
           "rakt ut åt sidan, på en djup svart fot",
        1: "Stället står i ett rum med anslagstavla, med reflexstången utfälld "
           "åt sidan",
        "KORT": "Faktakort: punchingboll med reflexstång 160–205 cm. Utfällt "
                "76 × 48 cm, fot Ø48 × 32 cm med 12 sugproppar, stång "
                "Ø5,5 × 50 cm",
        3: "Närbild på bollen och fjädringen som för tillbaka den efter varje "
           "träff",
        4: "Stället sett från sidan i ett ljust rum, med hela svängrummet "
           "runt reflexstången synligt",
        2: "Måttritning: stället 160–205 cm högt, foten 48 cm bred och "
           "76 cm i djupled utfällt",
    },
    "95f6280b": {
        0: "Fristående boxningssäck i rött och svart på en låg fot med en "
           "krans av sugproppar",
        1: "Boxningssäcken står på ett gymgolv med hantelställ i bakgrunden",
        "KORT": "Faktakort: fristående boxningssäck 135 cm, förfylld. Säck "
                "Ø24 × 103 cm, fot Ø38 × 3 cm med gummidämpning",
        3: "Boxningssäcken sedd snett framifrån i ett träningsrum",
        4: "Säcken fristående i ett ljust gym, med den låga foten och "
           "sugpropparna mot golvet",
        2: "Måttritning: säcken 24 cm i diameter och 103 cm lång, totalhöjd "
           "135 cm och foten 38 cm bred",
    },
    "c8f6b93f": {
        0: "Röd boxningssäck på pelare med en röd roterande arm åt sidan och "
           "en röd boll högst upp",
        1: "Stället står på ett trägolv i ett ljust rum med en grå fåtölj i "
           "bakgrunden",
        "KORT": "Faktakort: röd boxningssäck 155–205 cm med roterande arm. "
                "Säck Ø25 × 60 cm, arm Ø6 × 60 cm, 30 kg vatten eller "
                "35 kg sand i foten",
        3: "Stället i ett rum med träningsmatta, med armen utsvängd åt sidan",
        4: "Den röda säcken, armen och bollen sedda mot ett fönster",
        2: "Måttritning: säcken 60 cm lång, armen 60 cm, stället 155–205 cm "
           "högt och 88 cm i djupled",
    },
    "a8daef42": {
        0: "Svart boxningssäck på pelare med en svart roterande arm åt sidan "
           "och en svart boll högst upp",
        1: "Stället står på ett gymgolv med viktskivor och hantlar i "
           "bakgrunden",
        "KORT": "Faktakort: svart boxningssäck 155–205 cm med roterande arm. "
                "Säck Ø25 × 60 cm, arm Ø6 × 60 cm, 30 kg vatten eller "
                "35 kg sand i foten",
        3: "Stället framför ett ställ med viktskivor, sett snett framifrån",
        4: "Den svarta säcken i ett ljust rum, med armen och bollen synliga "
           "ovanför",
        2: "Måttritning: säcken 60 cm lång, armen 60 cm, stället 155–205 cm "
           "högt och foten 48 cm bred",
    },
    "f0430bc5": {
        0: "Svart boxningsstation med säck, boll högst upp, rak reflexstång "
           "åt sidan och en andra boll på en böjd arm",
        1: "Stationen står på ett trägolv i ett ljust rum, med alla fyra "
           "träffytorna synliga",
        "KORT": "Faktakort: boxningsstation 160–230 cm. Säck Ø15 × 53 cm, "
                "övre boll Ø14 × 16 cm, reflexstång Ø8 × 50 cm, 30 kg "
                "vatten eller 45 kg sand",
        3: "Närbild på reflexstångens fäste och låsvred på pelaren",
        4: "Närbild på säckens nedre del där den möter pelaren",
        2: "Måttritning: säcken 53 cm lång, övre bollen på 90–158 cm höjd, "
           "stationen 160–230 cm hög och foten 50 cm bred",
    },
}


def granska():
    """Samma grindar som brödtexten — inte en omskriven variant."""
    fel = []
    for pid, karta in sorted(ALT.items()):
        vantade = set(ORDNING[pid])
        if set(karta) != vantade:
            fel.append("%s: alt-nycklar %r != ordningen %r"
                       % (pid, sorted(map(str, karta)), sorted(map(str, vantade))))
        for nyckel, text in sorted(karta.items(), key=lambda p: str(p[0])):
            var = "%s bild %s" % (pid, nyckel)
            if nyckel == "KORT" and not text.startswith("Faktakort: "):
                fel.append("%s: kortets alt måste börja med 'Faktakort: '" % var)
            if nyckel != "KORT" and text.startswith("Faktakort"):
                fel.append("%s: bara kortet får heta Faktakort" % var)
            if len(text) > 220:
                fel.append("%s: alt-texten är %d tecken" % (var, len(text)))
            for rad in GR.FORBJUDET:
                monster, etikett = rad[0], rad[1]
                if monster.search(text):
                    fel.append("%s: %s — %r" % (var, etikett, text[:70]))
            if G.ARTNR.search(text):
                fel.append("%s: ARTIKELNUMMER i alt-texten" % var)
            for c, n, s in G.homoglyfer(text):
                fel.append("%s: HOMOGLYF %r (%s) i …%s…" % (var, c, n, s))
            for m in G.TREKONSONANT.finditer(text):
                fel.append("%s: TREKONSONANT %r" % (var, m.group(0)))
    # ☠️ Samma alt-text pa tva bilder ar en mall, inte en beskrivning.
    for pid, karta in ALT.items():
        sedda = {}
        for k, t in karta.items():
            if t in sedda:
                fel.append("%s: bild %s och %s delar alt-text" % (pid, sedda[t], k))
            sedda[t] = k
    return fel


def galleri(pid):
    """Fil-id i den ordning de ska ligga, med alt-texten."""
    ut = []
    for nyckel in ORDNING[pid]:
        fil = KORT_FIL[pid] if nyckel == "KORT" else GALLERI[pid][nyckel]
        ut.append({"id": fil, "alt": ALT[pid][nyckel]})
    return ut


if __name__ == "__main__":
    fel = granska()
    print("alttexter: %d produkter, %d bilder, %d fel"
          % (len(ALT), sum(len(v) for v in ALT.values()), len(fel)))
    for f in fel:
        print("  ☠️", f)
    if fel:
        raise SystemExit(1)
    for pid in sorted(ALT):
        print("%s  %d bilder  kort på plats %d"
              % (pid, len(ORDNING[pid]), ORDNING[pid].index("KORT") + 1))
