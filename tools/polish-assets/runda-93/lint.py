# -*- coding: utf-8 -*-
"""Runda 93 — grind före skrivning.

☠️ ZONERAD FÄRGGRIND. Runda 92 zonindelade TALEN eftersom ett länkat tal
   annars fick stå var som helst på sidan. Samma hål finns för FÄRGER så
   snart sidan korslänkar sina syskon: syskonstycket SKA nämna "beige" och
   "brun" på den mörkbruna sidan, men ingen annan mening får göra det.
   Grinden tillåter därför främmande färgord ENDAST i stycken som bär en
   länk — precis som TAL_LANK gör för tal.

☠️ ARTIKELNUMMERGRINDEN ÄR ETT MÖNSTER, inte en lista. Källtexten bär
   84C-054GY och 84C-054BK; familjen bär dessutom 84C-041 och 01-0867. En
   uppräkning hade missat nästa. Mönstret fäller varje sträng som ser ut som
   ett leverantörsartikelnummer.
"""
import re
import sys

FARGORD = ["beige", "mörkbrun", "brun"]

# Tal som får stå i texten. Allt annat är ogrundat.
TAL_OK = {"3", "250", "255", "180", "100", "10", "14", "2", "36", "35", "9", "6"}

FORBJUDNA = [
    # leverantör och husmärken
    r"outsunny", r"aosom", r"homcom", r"pawhut", r"vinsetto", r"aiyaplay",
    # avsändarland
    r"tyskland", r"tyska", r"tysk\b", r"kina", r"kinesisk", r"spanien", r"polen",
    # husregel: mot kunden är VI leverantören
    r"leverantör",
    # artikelnummer under alla dess etiketter
    r"artikelnummer", r"artikelnr", r"modellreferens", r"referensnummer",
    # tyska rester
    r"\bdach\b", r"\brahmen\b", r"pavillon\b", r"lieferumfang", r"abmess",
    r"wasserabweisend", r"einziehbar", r"ersatzdach",
    # ogrundade löften
    r"vattentät", r"helt tät", r"stormsäker", r"livstid", r"certifierad",
    r"\bsäker\b", r"\bsäkert\b",
    # intern jargong
    r"\brundan\b", r"\bbatch\b",
    # pris
    r"\bkr\b", r"kronor", r"rabatt", r"billig",
]

ARTIKELNUMMER = re.compile(r"\b\d{2,3}[A-Za-z]?-\d{2,4}[A-Za-z]{0,3}\b")

KRAV = [
    (r"endast takduken", "saknar att ENDAST duken ingår"),
    # ☠️ imperativen "Mät", INTE "mäter" — den första grinden godkändes av
    #    ordet "mäter" i en måttmening och krävde alltså ingenting alls.
    (r"(?<![a-zåäö])mät(?![a-zåäö])", "saknar uppmaningen att mäta stommen"),
    (r"dräneringshål", "saknar dräneringshålen"),
]


def synlig(h):
    t = re.sub(r"<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", t).strip()


def stycken(h):
    bitar = re.findall(r"<(?:p|li)\b[^>]*>.*?</(?:p|li)>", h, re.S)
    return bitar or [h]


def brister(pid, h, egen_farg, tal_ok=TAL_OK):
    f = []
    s = synlig(h)
    lag = s.lower()

    for m in FORBJUDNA:
        if re.search(m, lag):
            f.append("förbjuden sträng: %s" % m)

    for t in ARTIKELNUMMER.findall(s):
        f.append("ser ut som ett leverantörsartikelnummer: %r" % t)

    for m, txt in KRAV:
        if not re.search(m, lag):
            f.append(txt)

    # --- zonerad talgrind (runda 92) ---
    for st in stycken(h):
        for t in re.findall(r"(?<![\d,.])\d+(?:,\d+)?(?![\d,.])", synlig(st)):
            if t not in tal_ok:
                f.append("främmande tal: %r" % t)

    # --- zonerad färggrind (runda 93) ---
    for st in stycken(h):
        har_lank = "<a href" in st
        txt = synlig(st).lower()
        for farg in FARGORD:
            if farg == egen_farg:
                continue
            # "brun" är delsträng i "mörkbrun" -> kräv ordgräns
            if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % farg, txt):
                if not har_lank:
                    f.append("främmande färg %r utanför ett länkstycke" % farg)
    if not re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % egen_farg, lag):
        f.append("den egna färgen %r nämns inte" % egen_farg)

    return f


def sjalvtest():
    """Varje regel ska fälla på en riggad sträng. En grind som inte kan fela
    har aldrig bevisats fungera."""
    bas = ("<p>Duken mäter 250 × 255 cm och har tio dräneringshål. "
           "Endast takduken ingår. Mät stommen först. Färgen är beige.</p>")
    assert brister("x", bas, "beige") == [], brister("x", bas, "beige")
    fall = [
        (bas.replace("beige", "Outsunny beige"), "outsunny"),
        (bas.replace("250", "84C-054GY"), "artikelnummer"),
        (bas.replace("250", "999"), "främmande tal"),
        (bas.replace("Endast takduken ingår. ", ""), "endast"),
        (bas.replace("Mät stommen först. ", ""), "mäta"),
        (bas.replace("dräneringshål", "hål"), "dräneringshål"),
        (bas.replace("beige", "brun"), "egna färgen"),
        (bas[:-4] + " Den finns även i brun.</p>", "främmande färg"),
        (bas.replace("Duken", "Den tyska duken"), "tysk"),
        (bas.replace("Duken", "Leverantören anger att duken"), "leverantör"),
        (bas.replace("Duken", "Den säkra duken").replace("säkra", "säker"), "säker"),
        (bas.replace("250", "250 kr"), "kr"),
    ]
    n = 0
    for txt, vad in fall:
        b = brister("x", txt, "beige")
        assert b, "regeln för %s fällde INTE" % vad
        n += 1
    return n


if __name__ == "__main__":
    sys.path.insert(0, __file__.rsplit("/", 1)[0])
    import texter
    n = sjalvtest()
    print("självtest: %d regler fäller korrekt" % n)
    fel = 0
    for pid in texter.PRODUKTER:
        h = texter.beskrivning(pid)
        b = brister(pid, h, texter.FARG[pid])
        print("%s %-9s %4d tecken  %s" % (pid, texter.FARG[pid], len(synlig(h)),
                                          "OK" if not b else b))
        fel += len(b)
    # namn, seo och sku granskas med samma grind
    for pid in texter.PRODUKTER:
        for etikett, txt in [("namn", texter.namn(pid)),
                             ("seo-titel", texter.seo_titel(pid)),
                             ("seo-desc", texter.seo_beskrivning(pid)),
                             ("kort", " ".join(texter.KORT[pid]))]:
            b = [x for x in brister(pid, "<p>%s</p>" % txt, texter.FARG[pid])
                 if not x.startswith(("saknar", "den egna"))]
            if b:
                print("  ☠️ %s %s: %s" % (pid, etikett, b)); fel += len(b)
        sku = texter.SKU[pid]
        if len(sku) > 40 or not re.match(r"^[A-Za-z0-9\-]+$", sku):
            print("  ☠️ SKU otillåten: %r" % sku); fel += 1
    if len(set(texter.SKU.values())) != len(texter.SKU):
        print("  ☠️ SKU inte unika"); fel += 1
    print("SUMMA brister:", fel)
    sys.exit(1 if fel else 0)
