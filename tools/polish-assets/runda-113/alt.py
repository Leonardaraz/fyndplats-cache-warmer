# -*- coding: utf-8 -*-
"""Runda 113 Steg 11 — 34 alt-texter, en per bild i varje galleri.

☠️ ALT-TEXTEN VAR OGRINDAD FRAM TILL RUNDA 107 (uppgift #381) och är det inte
   längre. Den är kundtext: den läses upp av skärmläsare och indexeras av
   Google, alltså gäller samma regler som för brödtexten — inga ohärledda tal,
   inget avsändarland, inget husmärke, inget artikelnummer.

☠️ OCH TALEN GRINDAS MOT SIDANS EGEN FÄRDIGA TEXT, inte mot en egen lista.
   En alt-text som säger `203 cm` medan sidan skriver `2,03 m` är inte fel om
   man frågar en fri lista — men den är osynkad med det kunden läser, och
   runda 112 fällde exakt det fallet.

⚠️ DELADE RENDERINGAR FÅR INTE BÄRA ETT MÅTT. `9a33e15f` och `b2c76518` är
   samma kabinett i två färger, och `8cfe5171`/`a33ece7a` likaså. Ett mått i
   alt-texten på en bild som delas mellan storlekar hade varit ett påstående
   om FEL vara — här delas inte bilderna, men regeln står kvar som grind
   eftersom nästa runda kan ha den situationen.
"""
import re
import matt
import texter as T

ALT = {
    "8cfe5171": [
        "Låsbar minifrys i vitt med stängd dörr och nyckellås mitt på fronten",
        "Öppen minifrys på en köksbänk med frysta varor i båda facken",
        "Vit minifrys på en köksbänk bredvid mikrovågsugn och kaffemaskin",
        "Vit minifrys som står på golvet bredvid en soffa i ett vardagsrum",
        "Faktakort för låsbar minifrys med mått, volym och energiklass",
    ],
    "a33ece7a": [
        "Låsbar minifrys i grått med borstad front och nyckellås mitt på dörren",
        "Öppen minifrys i grått på en köksbänk med frysta varor i båda facken",
        "Grå minifrys på en köksbänk bredvid mikrovågsugn och kaffemaskin",
        "Grå minifrys som står på golvet bredvid en soffa i ett vardagsrum",
        "Faktakort för låsbar minifrys i grått med mått, volym och energiklass",
    ],
    "9a33e15f": [
        "Minifrys med silverfärgad dörr och greppkant längs hela överkanten",
        "Minifrys i silver som står på en köksbänk mot ett kaklat stänkskydd",
        "Faktakort för minifrys i silver med mått, volym och energiklass",
        "Måttritning av minifrysen med höjd, bredd och djup utsatta",
    ],
    "b2c76518": [
        "Helsvart minifrys med greppkant längs hela överkanten",
        "Svart minifrys som står på golvet bredvid en fåtölj vid ett fönster",
        "Faktakort för minifrys i svart med mått, volym och energiklass",
        "Måttritning av minifrysen med höjd, bredd och djup utsatta",
    ],
    "47a91a17": [
        "Smal vinkyl med glasdörr, blå innerbelysning och touchpanel i överkant",
        "Smal vinkyl som står på ett bardisk med vinglas och champagnehink intill",
        "Faktakort för smal vinkyl med mått, flaskkapacitet och energiklass",
        "Måttritning av den smala vinkylen med höjd, bredd och djup utsatta",
    ],
    "15d30e23": [
        "Bänkhög vinkyl med glasdörr och flaskorna liggande på tvären i fyra plan",
        "Bänkhög vinkyl på en köksbänk med vinglas och champagnehink intill",
        "Faktakort för bänkhög vinkyl med mått, flaskkapacitet och energiklass",
        "Måttritning av den bänkhöga vinkylen med höjd, bredd och djup utsatta",
    ],
    "480849a7": [
        "Hög och smal vinkyl med glasdörr och flaskorna på trådhyllor",
        "Hög smal vinkyl som står vid en köksö med barstolar intill",
        "Faktakort för hög smal vinkyl med mått, flaskkapacitet och energiklass",
        "Måttritning av den höga vinkylen med höjd, bredd och djup utsatta",
    ],
    "fdbfcea0": [
        "Vinkyl med blå innerbelysning bakom dubbelglaset och flaskor i fem plan",
        "Vinkyl som står på en bardisk med vinglas och champagnehink intill",
        "Faktakort för vinkyl med mått, flaskkapacitet och energiklass",
        "Måttritning av vinkylen med höjd, bredd och djup utsatta",
    ],
}

FORBJUDET = [
    ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
    ("lagerland", re.compile(r"\b(Tyskland|Polen|Spanien|Kina|tysk\w*|polsk\w*)\b", re.I)),
    ("artikelnummer", re.compile(r"\b\d{3}-\d{3}[A-Z]\d{2}[A-Z]{2}\b")),
    ("tyskt ord", re.compile(r"\b(Kühlschrank|Gefrierschrank|Weinkühlschrank|Flaschen)\b")),
    ("prisord", re.compile(r"\b(kr|pris|billig\w*|rea\b|kampanj)\b", re.I)),
]


def sidans_tal(k):
    """Alla tal som FAKTISKT står i den färdiga sidans text."""
    import grindar as G
    txt = G.synlig_meningstext(T.bygg(k)["html"])
    return set(re.findall(r"\d+(?:,\d+)?", txt))


def granska():
    fel = []
    import bildplan
    for k in matt.WIX:
        vantat = len(bildplan.GALLERI[k])
        if len(ALT[k]) != vantat:
            fel.append("%s: %d alt-texter mot %d bilder" % (k, len(ALT[k]), vantat))
            continue
        kanda = sidans_tal(k)
        for i, a in enumerate(ALT[k]):
            if len(a) > 125:
                fel.append("%s#%d: %d tecken (max 125)" % (k, i + 1, len(a)))
            if len(set(ALT[k])) != len(ALT[k]):
                fel.append("%s: två alt-texter är identiska" % k)
            for etikett, monster in FORBJUDET:
                m = monster.search(a)
                if m:
                    fel.append("%s#%d %s: %r" % (k, i + 1, etikett, m.group(0)))
            # ☠️ Varje tal i alt-texten måste stå i SIDANS EGEN text.
            for tal in re.findall(r"\d+(?:,\d+)?", a):
                if tal not in kanda:
                    fel.append("%s#%d OHÄRLETT TAL %r (står inte på sidan)"
                               % (k, i + 1, tal))
            # ☠️ Kortet ska sägas vara ett kort, annars läser en skärmläsare
            #    upp det som ett foto av varan.
            roll = bildplan.GALLERI[k][i][1]
            if roll == "kort" and "faktakort" not in a.lower():
                fel.append("%s#%d: kortets alt-text säger inte att det är ett kort" % (k, i + 1))
            if roll == "ritning" and "måttritning" not in a.lower():
                fel.append("%s#%d: ritningens alt-text säger inte att det är en ritning" % (k, i + 1))
            if roll in ("hjälte", "livsstil") and re.search(r"faktakort|måttritning", a, re.I):
                fel.append("%s#%d: ett foto beskrivs som kort eller ritning" % (k, i + 1))
    return fel


def _sjalvtest():
    """☠️ Grinden provas mot sina egna buggar, en i taget."""
    global ALT
    orig = {k: list(v) for k, v in ALT.items()}
    fall = [("husmärke", "8cfe5171", 0, "HOMCOM minifrys i vitt", "husmärke"),
            ("lagerland", "8cfe5171", 0, "Minifrys från Tyskland i vitt", "lagerland"),
            ("ohärlett tal", "8cfe5171", 0, "Låsbar minifrys på 999 liter", "OHÄRLETT TAL"),
            ("kort utan ordet", "8cfe5171", 4, "Vit minifrys sedd framifrån", "säger inte att det är ett kort"),
            ("foto som kort", "8cfe5171", 1, "Faktakort med öppen dörr", "beskrivs som kort"),
            ("ritning utan ordet", "9a33e15f", 3, "Minifrysen sedd från sidan", "säger inte att det är en ritning")]
    fel = 0
    for etikett, k, i, ny, vantat in fall:
        ALT[k][i] = ny
        if not [x for x in granska() if vantat in x]:
            print("  SJÄLVTEST FEL %s: ingen %s" % (etikett, vantat))
            fel += 1
        ALT[k][i] = orig[k][i]
    print("självtest: %d fall, %d fel" % (len(fall), fel))
    return fel


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    if _sjalvtest():
        raise SystemExit(2)
    f = granska()
    for x in f:
        print("  ✗", x)
    print("%d alt-texter, %d fel" % (sum(len(v) for v in ALT.values()), len(f)))
    raise SystemExit(1 if f else 0)
