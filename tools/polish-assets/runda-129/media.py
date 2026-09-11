# -*- coding: utf-8 -*-
"""Runda 129 Steg 9 — bildordning, bortplock och svensk alt-text.

ORDNINGEN (runbooken): 1 hjältebild, 2 livsstil, 3 eget Fyndplats-kort,
därefter detaljfoton, och MÅTTRITNINGEN SIST.

☠️ BORTPLOCKEN ÄR MÄTTA, inte antagna — se Steg 4-tabellen i STEG1-5.md.
   Fyra bilder bär tysk text inbränd i pixlarna och går inte att beskära
   utan att kapa varan.

☠️ ALT-TEXTEN BESKRIVER BILDEN, inte produkten. Varje rad nedan är skriven
   efter att bilden granskats i kontaktark — inte gissad ur produktnamnet.
   Uppgift #381: alt-texten var ogrindad i tidigare rundor.

⚠️ Leverantörens ursprungsland får ALDRIG stå i en alt-text, lika lite som
   i brödtexten. EU-lager-ribbonen är enda sanktionerade stället.
"""

# Källbilderna i importordning: [1] hjälte, [2] livsstil, [3] måttritning,
# [4] och [5] detalj/infografik.
RA = {}
for _rad in open(__file__.replace("media.py", "bilder.txt"), encoding="utf-8"):
    _rad = _rad.strip()
    if not _rad:
        continue
    _pid, _fil = _rad.split()
    RA.setdefault(_pid, []).append(_fil)

# Kortets Wix-fil per produkt (laddade upp i Steg 11, kvitterade på md5).
KORT = {
    "14aa1777": "b379ce_c8e8992f29d34d50a01d66b82247ecad~mv2.jpg",
    "1f14ab66": "b379ce_b2a9e18ffd9d419cb605250442fb5625~mv2.jpg",
    "c9ab8531": "b379ce_6e9a8af4393a4edca559ae32c21f23b1~mv2.jpg",
    "4ef7c2b4": "b379ce_2e9e49a2c67847e784e570237daa1597~mv2.jpg",
    "ec8ab782": "b379ce_62bc7d6f84264802a4183d186a3f9fdb~mv2.jpg",
    "db933c3c": "b379ce_06cd55e0de1940fd88d0bb225b4c1cea~mv2.jpg",
    "a6727ca5": "b379ce_00e6a8d94dc2410fbc42036642093aee~mv2.jpg",
    "9938574b": "b379ce_c92856ab95a948bab90d50dff4ae78cb~mv2.jpg",
    "6747b6c0": "b379ce_15179936884b456db7e2986777a669d4~mv2.jpg",
}

# Bilder som INTE ska följa med, angivna på sin plats i importordningen.
BORT = {
    "14aa1777": [4, 5],
    "4ef7c2b4": [4],
    "a6727ca5": [4],
    "9938574b": [4],
}

# Ordningen efter plocket, uttryckt i importpositioner. "kort" är kortet.
ORDNING = {
    "14aa1777": [1, 2, "kort", 3],
    "1f14ab66": [1, 2, "kort", 4, 5, 3],
    "c9ab8531": [1, 2, "kort", 4, 5, 3],
    "4ef7c2b4": [1, 2, "kort", 5, 3],
    "ec8ab782": [1, 2, "kort", 4, 5, 3],
    "db933c3c": [1, 2, "kort", 4, 5, 3],
    "a6727ca5": [1, 2, "kort", 5, 3],
    "9938574b": [1, 2, "kort", 5, 3],
    "6747b6c0": [1, 2, "kort", 4, 5, 3],
}

# Alt-text per produkt och importposition. Skriven efter granskning i
# kontaktark-1/2/3.jpg.
ALT = {
    "14aa1777": {
        1: "Två svarta solcellslyktstolpar stående bredvid varandra mot vit bakgrund",
        2: "En tänd lyktstolpe på en gräsmatta framför en rabatt, med ett par på en trädgårdsbänk",
        "kort": "Faktakort: två stolpar i paketet, med mått, ljusstyrka och lystid",
        3: "Måttskiss över stolpens höjd och en närbild på lyktan med solcellen i taket",
    },
    "1f14ab66": {
        1: "Svart solcellslyktstolpe med fyrkantig blomlåda i foten mot vit bakgrund",
        2: "Tänd lyktstolpe med planterad blomlåda bredvid en trädgårdsbänk",
        "kort": "Faktakort: lyktan står i en blomlåda, med mått, ljusstyrka och lystid",
        4: "Lyktstolpen tänd i skymningen med blommor i lådan",
        5: "Lyktstolpen tänd vid en husentré, med planterad låda i foten",
        3: "Måttskiss över stolpens höjd och lådans bredd, med närbild på lyktan",
    },
    "c9ab8531": {
        1: "Lyktstolpe med två klotarmaturer på böjda armar och blomlåda i foten, mot vit bakgrund",
        2: "De två klotarmaturerna tända över en planterad låda på en gräsmatta",
        "kort": "Faktakort: två klot på böjda armar, med mått, ljusstyrka och lystid",
        4: "Klotarmaturerna tända över en trädgårdsgång i mörker",
        5: "Lyktstolpen tänd vid en husentré i skymning",
        3: "Måttskiss över stolpens höjd, armarnas bredd och lådans höjd",
    },
    "4ef7c2b4": {
        1: "Lyktstolpe med tre lyktor på böjda armar och blomlåda i foten, mot vit bakgrund",
        2: "De tre lyktorna tända vid en vit ytterdörr med blommande rabatt",
        "kort": "Faktakort: tre lyktor över blomlådan, med mått, ljusstyrka och färgtemperatur",
        5: "Lyktstolpen tänd på en gräsmatta framför ett hus, med ett par på en bänk",
        3: "Måttskiss över stolpens höjd, armarnas bredd och planteringsfotens mått",
    },
    "ec8ab782": {
        1: "Lyktstolpe med tre klara glaskupor på böjda armar och blomlåda i foten, mot vit bakgrund",
        2: "De tre glaskuporna tända över en planterad låda bredvid en trädgårdsbänk",
        "kort": "Faktakort: tre glaskupor över blomlådan, med mått och ljusstyrka",
        4: "Lyktstolpen tänd vid en vit ytterdörr, med blommor i lådan",
        5: "Lyktstolpen tänd i en rabatt med ormbunkar planterade i lådan",
        3: "Måttskiss över stolpens höjd, kupornas bredd och lådans mått",
    },
    "db933c3c": {
        1: "Lyktstolpe med tre lyktor på en smal mast mot vit bakgrund",
        2: "De tre lyktorna tända i en rabatt medan någon matar en katt på gången",
        "kort": "Faktakort: tre lyktor på utsvängd fot, med mått, ljusstyrka och dimning",
        4: "Närbild på en av lyktorna med kupan och LED-modulen synlig innanför glaset",
        5: "Närbild på den avtagbara sockeln underifrån",
        3: "Måttskiss över stolpens höjd, bredd och djup",
    },
    "a6727ca5": {
        1: "Sexkantig lykta på en smal mast med utsvängd fot, mot vit bakgrund",
        2: "Lyktan tänd längs en gång vid en stenmur, med bänkar i bakgrunden",
        "kort": "Faktakort: rundad lykta på smal mast, med mått, lysdioder och lystid",
        5: "Närbild på den sexkantiga lyktan med solcellen i taket",
        3: "Måttskiss över lyktans höjd och diameter, med närbild på lyktan",
    },
    "9938574b": {
        1: "Två likadana solcellslyktor stående bredvid varandra mot vit bakgrund",
        2: "En av lyktorna tänd på en uteplats bredvid en stol",
        "kort": "Faktakort: två lyktor med spira, med mått, färgtemperatur och lystid",
        5: "Närbild på lyktans överdel med spiran och solcellen i taket",
        3: "Måttskiss över lyktans höjd och bredd, med närbild på lyktan",
    },
    "6747b6c0": {
        1: "Kantig lykta på en smal mast med utsvängd fot, mot vit bakgrund",
        2: "Lyktan tänd på en gräsmatta framför ett tak i trä",
        "kort": "Faktakort: kantig lykta på slank mast, med mått, ljusstyrka och lystid",
        4: "Närbild på den kantiga lyktan med kupan synlig",
        5: "Lyktans tak sett snett uppifrån, med solcellerna synliga",
        3: "Måttskiss över lyktans höjd och bredd",
    },
}


def plan(pid):
    """Ger (filnamn, alttext) i skrivordning för en produkt."""
    ut = []
    for p in ORDNING[pid]:
        fil = KORT[pid] if p == "kort" else RA[pid][p - 1]
        ut.append((fil, ALT[pid][p]))
    return ut
