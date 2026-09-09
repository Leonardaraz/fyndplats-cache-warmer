# -*- coding: utf-8 -*-
"""Runda 114 — kyl-/frysfamiljens NIO sista utkast. Allt här är MÄTT.

☠️ SVEPET GICK KLART OCH STÄMMER MOT FÖRRA RUNDAN. 3 126 utkast över 32 sidor
   och 2 454 publicerade över 25, båda med `cursor === null` OCH unika id ==
   radantal. Runda 113 mätte 3 134 / 2 446 — åtta färre utkast och åtta fler
   publicerade, alltså exakt den rundans åtta sidor. Två oberoende svep som
   möts är ett kvitto; ett ensamt tal är en förhoppning.

☠️ NAMNKROCKEN MOT EN PUBLICERAD SIDA VAR FALSK. `397b845e` heter
   "Kühlwagen mit 56L … Rollen, Flaschenöffner" och vi säljer redan
   `kylvagn-56-liter-hjul-flaskoppnare`. Måttgrinden gav högst 1/3 och
   pixelgrinden 59,49 — två OLIKA vagnar (84 cm bred med fällbart lock mot
   67 cm med tvådelat). Se `dubblettgrind.py`; kontrollmätningen där fäller
   fortfarande runda 113:s bevisade dubblett på 0,00.

☠️ MEN DE TVÅ VAGNARNAS KYLBOXAR ÄR NÄSTAN IDENTISKA — 66 × 35 × 34 mot
   66 × 36 × 32 cm — OCH BURKTALEN SKILJER SIG DUBBELT: källan säger 80 burkar
   här, den publicerade sidan säger cirka 60. Två av VÅRA EGNA sidor med samma
   volym och dubbelt burktal är en motsägelse kunden kan se. Burktalet utelämnas
   därför här, och invändiga mått står i stället. Se `UTELAMNAS`.
"""

WIX = {
    "397b845e": "397b845e-19ce-4b08-bba5-7848d06f477e",
    "412c9f43": "412c9f43-a3c1-4d9f-9c05-edd75443d6a5",
    "d754d015": "d754d015-8777-4fb1-8d51-92c337c77890",
    "758f0a80": "758f0a80-57b6-4d74-a795-99911eb71c9c",
    "d5cc9efa": "d5cc9efa-a11f-4423-be2f-c908db711937",
    "b3e3aac8": "b3e3aac8-bc82-43f8-87f5-dd9849c0d138",
    "b815de72": "b815de72-d15d-413c-822f-027fb45c0f3c",
    "e6d2e70b": "e6d2e70b-3b2d-4d80-838e-383286482b5a",
    "ef0fa603": "ef0fa603-edfe-464a-9b15-e3820ea7840d",
}

VARIANT = {
    "397b845e": "e71782e1-0050-49cd-9baf-fef225209ac5",
    "412c9f43": "21a2fbfc-235f-48cf-a9cd-e0aa26a7222f",
    "d754d015": "4da8ee62-cbaf-4bab-8490-b77101c902ef",
    "758f0a80": "16cf76d2-00ea-42ba-87d8-43ba89776550",
    "d5cc9efa": "cd9dff16-c8e0-4313-8830-605bbde8fb01",
    "b3e3aac8": "e1f2e9af-3385-4b06-afb9-7b25d7e4dc65",
    "b815de72": "26262b3f-d90a-4011-897e-1819329d65ec",
    "e6d2e70b": "d9d4592c-04ba-4f16-bd8b-f247fedef2c1",
    "ef0fa603": "f6a75b70-2333-4904-94ec-8135f9b8d7d9",
}

# ☠️ IMPORTEN SKAPADE TVÅ SKU-KROCKAR SJÄLV, inte poleringen (uppgift #272):
#    412c9f43 och d754d015 bär BÅDA `FP-minikuhlschrank-fur`
#    758f0a80 och d5cc9efa bär BÅDA `FP-mini-kuhlschrank`
IMPORT_SKU = {
    "397b845e": "FP-kuhlwagen-mit-56l", "412c9f43": "FP-minikuhlschrank-fur",
    "d754d015": "FP-minikuhlschrank-fur", "758f0a80": "FP-mini-kuhlschrank",
    "d5cc9efa": "FP-mini-kuhlschrank", "b3e3aac8": "FP-kuhlbox-42-6l-gro-e",
    "b815de72": "FP-kuhlbox-70l-gro-e", "e6d2e70b": "FP-mini-kuhlschrank-91",
    "ef0fa603": "FP-mini-kuhlschrank-44l-46",
}

# Fyra konstruktioner. Grupperna styr vilka grindar som gäller (se grind.py).
GRUPPER = {
    "397b845e": "V",                      # kylvagn, passiv, is/kylklampar
    "b3e3aac8": "P", "b815de72": "P",     # passiva kylboxar
    "412c9f43": "K", "d754d015": "K",     # kosmetikkyl 6 L, spegel + LED
    "758f0a80": "B", "d5cc9efa": "B",     # beautykyl 4 L, kyler OCH värmer
    "e6d2e70b": "E", "ef0fa603": "E",     # elnätsdrivna kylskåp > 10 L
}
KONSTRUKTION = {
    "V": "kylvagn", "P": "passiv kylbox",
    "K": "kosmetikkyl", "B": "beautykyl", "E": "kylskåp",
}

YTTERMATT = {
    "397b845e": (84, 38, 83), "412c9f43": (24.3, 19.4, 35.6),
    "d754d015": (24.3, 19.4, 35.6), "758f0a80": (20.3, 26.3, 28),
    "d5cc9efa": (20.3, 26.3, 28), "b3e3aac8": (66.6, 38.5, 40),
    "b815de72": (84, 42.2, 44.3), "e6d2e70b": (47.5, 44.2, 84),
    "ef0fa603": (43, 51, 51.3),
}
# Innermått, samma ordning som källans egen etikettering.
INNERMATT = {
    "397b845e": (60, 32, 30), "412c9f43": (16.1, 13.8, 24),
    "d754d015": (16.1, 13.8, 24), "758f0a80": (13.5, 15, 20),
    "d5cc9efa": (13.5, 15, 20), "b3e3aac8": (54.5, 28, 30),
    "b815de72": (71.6, 32, 33),
}
VOLYM = {"397b845e": 56, "412c9f43": 6, "d754d015": 6, "758f0a80": 4,
         "d5cc9efa": 4, "b3e3aac8": 42.6, "b815de72": 70,
         "e6d2e70b": 91, "ef0fa603": 44}
VIKT = {"397b845e": 17.5, "412c9f43": 2.6, "d754d015": 2.6, "758f0a80": 2.2,
        "d5cc9efa": 2.2, "b3e3aac8": 10, "b815de72": 14.5,
        "e6d2e70b": 20, "ef0fa603": 15.9}
FARG = {"397b845e": "vit och grå", "412c9f43": "rosa", "d754d015": "vit",
        "758f0a80": "rosa", "d5cc9efa": "crèmevit", "b3e3aac8": "khaki",
        "b815de72": "khaki", "e6d2e70b": "vit", "ef0fa603": "svart"}
MATERIAL = {
    "397b845e": "plast (PU och PP), stål", "412c9f43": "plast, glas och aluminium",
    "d754d015": "plast, glas och aluminium", "758f0a80": "ABS-plast och aluminium",
    "d5cc9efa": "ABS-plast och aluminium", "b3e3aac8": "HDPE-plast med PU-skum",
    "b815de72": "HDPE-plast med PU-skum", "e6d2e70b": "stål och plast",
    "ef0fa603": "metall och ABS-plast",
}

# ── Steg 2: (EU) 2019/2016 gäller ELNÄTSDRIVNA kylapparater ÖVER 10 liter ──
# Artikel 1 ordagrant: "electric mains-operated refrigerating appliances with a
# volume of more than 10 litres and of less than or equal to 1 500 litres".
# Två av nio faller innanför. De sju andra är antingen passiva (ingen ström
# alls) eller under tiolitersgränsen — och då finns ingen energiklass att ange.
ENERGIKLASS = {"e6d2e70b": "E", "ef0fa603": "E"}
ARSFORBRUKNING = {"ef0fa603": 73}          # kWh/år; e6d2e70b saknar tal i källan
LJUD = {"412c9f43": 26, "d754d015": 26, "758f0a80": 26, "d5cc9efa": 26,
        "e6d2e70b": 41, "ef0fa603": 35}

# Kyl- och värmeintervall. ☠️ De fyra små är AVLÄSTA UR MÅTTBILDEN, inte ur
# spec-blocket — se UTELAMNAS. 44-litersmodellens intervall står i texten.
KYLINTERVALL = {"412c9f43": (2, 17), "d754d015": (2, 17),
                "758f0a80": (2, 16), "d5cc9efa": (2, 16),
                "ef0fa603": (4, 18), "e6d2e70b": (0, 10)}
VARMEINTERVALL = {"758f0a80": (50, 65), "d5cc9efa": (50, 65)}
OMGIVNING = {"412c9f43": (10, 30), "d754d015": (10, 30),
             "758f0a80": (10, 30), "d5cc9efa": (10, 30)}

# ── Vad som INTE får stå på sidan, och varför ─────────────────────────────
# Grinden i `grind.py` fäller om något av orden dyker upp i den färdiga texten.
UTELAMNAS = {
    # ✅ LÖST AV EN ZOOM, INTE AV EN UTESLUTNING. Spec-blocket säger "2 °C"
    # OCH "lämplig omgivningstemperatur 10–30 °C", vilket ser ut som en
    # motsägelse: ett Peltier-element kyler RELATIVT omgivningen. Måttbilden
    # bär svaret i pixlarna — `2-17°C` med snöflinka på 6-litersmodellen och
    # `2-16 °C` / `50-65 °C` på 4-litersmodellen. Tvåan är alltså BOTTEN på ett
    # intervall, inte ett absolut löfte, och intervallet är det som publiceras.
    # Se `KYLINTERVALL` nedan och `zoom-badge3.jpg`.
    #
    # ⚠️ Det som fortfarande INTE går att använda är 6-litersmodellens
    # VÄRMESIDA. Grafiken sätter 10–30 °C vid lågan — exakt samma tal som
    # spec-blockets tillåtna OMGIVNING — och den tyska texten nämner ingen
    # värmefunktion alls. Två av tre källor pekar då åt "det här är
    # omgivningen, inte en funktion". 6-litersmodellen säljs som ren kyl.
    "412c9f43": ["värmer", "värmefunktion"], "d754d015": ["värmer", "värmefunktion"],
    # Källan säger "Temperaturkontrolle: 0-10 ℃" OCH "Einstellbereich: 0-5
    # Grad". Det andra är sannolikt termostatrattens fem lägen, inte grader —
    # men det går inte att verifiera, så det utelämnas.
    "e6d2e70b": ["0-5", "0–5"],
    # Se modulens huvud: 80 burkar mot den publicerade vagnens cirka 60.
    "397b845e": ["burkar", "burk", "flaskor"],
}

# ☠️ HÄLSOPÅSTÅENDEN SOM INTE FÖLJER MED (Steg 2). Källan säljer 4-liters-
#    boxen för "Muttermilch und Medikamenten". En Peltier-box med tillåten
#    omgivning upp till 30 °C kan inte garantera kylkedjan för bröstmjölk eller
#    läkemedel, och mot kunden är VI leverantören. Grindas som förbjudna ord.
FORBJUDNA_ANVANDNINGAR = ["bröstmjölk", "modersmjölk", "läkemedel", "medicin",
                          "insulin", "vaccin"]

BILDER = {
    "397b845e": ["b379ce_949fc91f16c34c43a0a0a8187c327d1e~mv2.jpg",
                 "b379ce_c70686202d5f4b44b42ce6670cbce052~mv2.jpg",
                 "b379ce_e3244c823af443a594524c7e674a5288~mv2.jpg",
                 "b379ce_0880c785bcf14cf6a0d14c18d0818e3a~mv2.jpg",
                 "b379ce_a5c7fdf91c7f41e0b8f83792d4ab0b16~mv2.jpg"],
    "412c9f43": ["b379ce_a4829ee6ce2848cca599a067bfdfcb3b~mv2.jpg",
                 "b379ce_850048de72514ff382dbdbb63266d29e~mv2.jpg",
                 "b379ce_01e5c5e20aac472e9cfbb917dd878fde~mv2.jpg",
                 "b379ce_940323c3df934a65b40e92325c6da995~mv2.jpg",
                 "b379ce_d897a24d95aa432ab108fd9aa6de9a4c~mv2.jpg"],
    "d754d015": ["b379ce_48d8089ee5ce410aabca1db02b44ddbe~mv2.jpg",
                 "b379ce_e5b528aa57bd49d1a16b0db8ac00b95c~mv2.jpg",
                 "b379ce_0ecf623771bf4bb2971091e9e2b297bd~mv2.jpg",
                 "b379ce_96f4e87d4867428d8fa0a42f0033ef77~mv2.jpg",
                 "b379ce_67e6e812a0f94cd7b4dded4e380496a0~mv2.jpg"],
    "758f0a80": ["b379ce_51f9cc2fdc6a4990ba23318332422e41~mv2.jpg",
                 "b379ce_9f972ac433fb4de6b5d1a19ef73b81a9~mv2.jpg",
                 "b379ce_9d5077943db24203b1def52cdae6856e~mv2.jpg",
                 "b379ce_03420cc86e8a4a3aa728ac41d1e5520d~mv2.jpg",
                 "b379ce_e79129a3dc25412e9cffc7a4e13c0087~mv2.jpg"],
    "d5cc9efa": ["b379ce_aef303369a614151b8bd481ce96b69b8~mv2.jpg",
                 "b379ce_316e81ae25ae455c93eb90980c8e43d5~mv2.jpg",
                 "b379ce_086841f717374c23a5a9e56ec5648f3b~mv2.jpg",
                 "b379ce_18d4e2012d6f448b8f0de27e2657489c~mv2.jpg",
                 "b379ce_4177f8220ea842c39da2999462250976~mv2.jpg"],
    "b3e3aac8": ["b379ce_cf10a2ce0f3546c990f9da9163851b09~mv2.jpg",
                 "b379ce_0ce89287f6524f8e956fd6e0f3695a8a~mv2.jpg",
                 "b379ce_b2911e928df04f27b062db336b884918~mv2.jpg",
                 "b379ce_337f61a5f5ef429bb796681f99867950~mv2.jpg",
                 "b379ce_2ead2d99d31a4c2da0e811ee5234e874~mv2.jpg"],
    "b815de72": ["b379ce_6a521d37d9754bba88d76aab443ca445~mv2.jpg",
                 "b379ce_d0c0e5286ed64c3a9dfd828e9b9e18f3~mv2.jpg",
                 "b379ce_fff12cfa865f497c84a8455731d43ff1~mv2.jpg",
                 "b379ce_b42e93a7d9374d618c1fc81d791cb2c1~mv2.jpg",
                 "b379ce_0ca56601e606461bbfe1b5c27b116558~mv2.jpg"],
    "e6d2e70b": ["b379ce_d53415af78df43ec9a169fcaae8670ce~mv2.jpg",
                 "b379ce_d600148642934909ba96fbc0f6e5197c~mv2.jpg",
                 "b379ce_7dc8c3a4f1c2414d874081149da0c59b~mv2.jpg",
                 "b379ce_eb4bca1c4b9a45cf96a7b6cf7daf04f2~mv2.jpg",
                 "b379ce_05e23fa76b7a4227a1a204cdb66f96f5~mv2.jpg"],
    "ef0fa603": ["b379ce_986b1b2a7d5e4a10a1ea7c493dcd60b9~mv2.jpg",
                 "b379ce_7fad58fa23fe4aaa8d2ff788a8b05fe9~mv2.jpg",
                 "b379ce_99603e41500c4f2f859806c6aeb4c87a~mv2.jpg",
                 "b379ce_3a840c5dac824bbca752089869ae42df~mv2.jpg",
                 "b379ce_c18ffb18ade9458f86c9a2079e27dfc2~mv2.jpg"],
}


def kontroll():
    """Modulen ska falla på sig själv innan någon annan grind läser den."""
    for d in (VARIANT, YTTERMATT, VOLYM, VIKT, FARG, MATERIAL, BILDER,
              GRUPPER, IMPORT_SKU):
        saknas = set(WIX) - set(d)
        if saknas:
            raise SystemExit("☠️ %s saknar %s" % (d, sorted(saknas)))
    if set(ENERGIKLASS) != {k for k in WIX if GRUPPER[k] == "E"}:
        raise SystemExit("☠️ ENERGIKLASS täcker inte exakt grupp E")
    for k in WIX:
        if GRUPPER[k] in ("V", "P") and k in LJUD:
            raise SystemExit("☠️ %s är passiv och kan inte ha ett ljudtal" % k)
    if len({v for v in IMPORT_SKU.values()}) == len(IMPORT_SKU):
        raise SystemExit("☠️ SKU-krockarna är borta ur underlaget — de MÄTTES")
    if set(VARMEINTERVALL) & set(KYLINTERVALL) != set(VARMEINTERVALL):
        raise SystemExit("☠️ en produkt värmer utan att kyla")
    if set(VARMEINTERVALL) != {"758f0a80", "d5cc9efa"}:
        raise SystemExit("☠️ VÄRME är mätt på 4-litersmodellen och INGEN annan")
    if any(len(BILDER[k]) != 5 for k in WIX):
        raise SystemExit("☠️ någon produkt har inte fem bilder")
    print("✅ matt.py: %d produkter, %d grupper, %d med lagkrav på energiklass"
          % (len(WIX), len(set(GRUPPER.values())), len(ENERGIKLASS)))


if __name__ == "__main__":
    kontroll()
