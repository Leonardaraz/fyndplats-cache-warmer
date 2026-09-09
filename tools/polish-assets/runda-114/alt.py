# -*- coding: utf-8 -*-
"""Runda 114 Steg 9 — alt-texterna. 39 stycken.

☠️ ALT-TEXTEN PASSERAR INGEN ANNAN GRIND. Den är kundtext utan skydd: den
   läses upp av skärmläsare, den indexeras, och den skrivs INTE av någon av
   textstegets kontroller. Därför har den en egen.

Fyra regler, alla mekaniskt prövade:

  1. VARJE TAL i en alt-text måste stå i SIDANS EGEN färdiga HTML. Ett tal som
     bara finns i alt-texten är ett ohärlett tal på en plats ingen läser.
  2. KORTETS alt börjar med `Faktakort: ` och beskriver FAKTA — inte kortet,
     och aldrig "Fyndplats-kort", som lägger vårt varumärke i ett fält som ska
     beskriva innehåll.
  3. MÅTTRITNINGENS alt säger `Måttritning`, så den som inte ser bilden vet
     att det är en ritning och inte ett foto.
  4. Inget husmärke, ingen tyska, inget artikelnummer, inget avsändarland.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                               # noqa: E402
sys.path.insert(0, HAR)
import bildplan                                                   # noqa: E402
import matt                                                       # noqa: E402
import texter as T                                                # noqa: E402

# nyckel → {position eller None(=kortet): alt-text}
ALT = {
    "397b845e": {
        1: "Kylvagn i grått och vitt på fyra hjul, med underhylla och "
           "flasköppnare monterad på sidan.",
        2: "Kylvagnen står vid ett dukat bord utomhus med drycken i boxen.",
        None: "Faktakort: kylvagn 56 liter, 84 × 38 × 83 cm, invändigt "
              "60 × 32 × 30 cm, bär 65 kg.",
        3: "Måttritning: 84 cm bred, 38 cm djup och 83 cm hög, invändigt "
           "60 × 32 × 30 cm.",
    },
    "412c9f43": {
        1: "Rosa kosmetikkyl med spegel i dörren och lysande ljusram runt spegeln.",
        2: "Den rosa kosmetikkylen står på ett sminkbord med hudvård bredvid.",
        None: "Faktakort: kosmetikkyl 6 liter, 24,3 × 19,4 × 35,6 cm, kyler "
              "2–17 °C, 26 dB.",
        5: "Kosmetikkylen på en stenbänk med serum och hudvårdsflaskor intill.",
        3: "Måttritning: 24,3 cm bred, 19,4 cm djup och 35,6 cm hög, invändigt "
           "16,1 × 13,8 × 24 cm.",
    },
    "d754d015": {
        1: "Vit kosmetikkyl med öppen dörr, spegel på insidan och två hyllplan.",
        2: "Den vita kosmetikkylen står på ett sminkbord framför en rund spegel.",
        None: "Faktakort: kosmetikkyl 6 liter, 24,3 × 19,4 × 35,6 cm, kyler "
              "2–17 °C, 26 dB.",
        4: "Ovansidan med ventilationsgaller och bärhandtag i konstläder.",
        5: "Närbild på skåpets nedre kant och de koniska fötterna.",
        3: "Måttritning: 24,3 cm bred, 19,4 cm djup och 35,6 cm hög.",
    },
    "758f0a80": {
        1: "Rosa minikyl med bärhandtag i konstläder på ovansidan.",
        2: "Den rosa minikylen står öppen på ett sminkbord med hudvård inuti.",
        None: "Faktakort: minikyl 4 liter som kyler 2–16 °C och värmer "
              "50–65 °C, 26 dB.",
        4: "Minikylen står öppen på ett skrivbord med burkar på hyllorna.",
        3: "Måttritning: 20,3 cm bred, 26,3 cm djup och 28 cm hög, invändigt "
           "13,5 × 15 × 20 cm.",
    },
    "d5cc9efa": {
        1: "Crèmevit minikyl med bärhandtag i konstläder på ovansidan.",
        2: "Den crèmevita minikylen står på en stenbänk bland hudvårdsflaskor.",
        None: "Faktakort: minikyl 4 liter som kyler 2–16 °C och värmer "
              "50–65 °C, 26 dB.",
        4: "Minikylen står öppen med hudvård och smink på hyllorna.",
        5: "Minikylen öppen med spegeln på dörrens insida och penslar bredvid.",
        3: "Måttritning: 20,3 cm bred, 26,3 cm djup och 28 cm hög.",
    },
    "b3e3aac8": {
        1: "Khakifärgad kylbox med öppet lock, vit insida och två svarta spännlås.",
        2: "Kylboxen står öppen på ett campingbord med dryck och mat på is.",
        None: "Faktakort: kylbox 42,6 liter, 66,6 × 38,5 × 40 cm, invändigt "
              "54,5 × 28 × 30 cm, bär 70 kg.",
        3: "Måttritning: 66,6 cm bred, 38,5 cm djup och 40 cm hög, 42,6 liter.",
    },
    "b815de72": {
        1: "Khakifärgad kylbox på hjul med greppbygel i ena änden och två "
           "spännlås på locket.",
        2: "Kylboxen står öppen i skogen, fylld med dryck och frukt på is.",
        None: "Faktakort: kylbox 70 liter på hjul, 84 × 42,2 × 44,3 cm, "
              "invändigt 71,6 × 32 × 33 cm.",
        3: "Måttritning: 84 cm bred, 42,2 cm djup och 44,3 cm hög, 70 liter.",
    },
    "e6d2e70b": {
        1: "Vitt kylskåp med slät front och stängd dörr utan handtag utanpå.",
        2: "Kylskåpet står under en bänkskiva i ett ljust rum.",
        None: "Faktakort: kylskåp 91 liter med frysfack, 47,5 × 44,2 × 84 cm, "
              "energiklass E, 41 dB.",
        5: "Närbild på dörrens överkant med greppkanten och gångjärnets skruvar.",
        3: "Måttritning: 47,5 cm bred, 44,2 cm djup och 84 cm hög.",
    },
    "ef0fa603": {
        1: "Svart dryckeskyl med mörk dörr och ventilationsgaller längs sidan.",
        2: "Dryckeskylen står öppen i ett kök med drycker och mat på hyllorna.",
        None: "Faktakort: dryckeskyl 44 liter, 43 × 51 × 51,3 cm, kyler "
              "4–18 °C, energiklass E.",
        3: "Måttritning: 43 cm bred, 51 cm djup och 51,3 cm hög.",
    },
}

FORBJUDET = [
    ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
    ("tyskt ord", re.compile(r"\b(K[üu]hl\w*|Gefrier\w*|Wei[ßs]|Schwarz|Grau)\b")),
    ("artikelnummer", G.ARTNR),
    ("lagerland", re.compile(r"\b(Tyskland|Polen|Spanien|Kina)\b", re.I)),
]
MAXLANGD = 145


def sidans_tal(k):
    """Talen sidan FAKTISKT skriver ut — alt-texten får inte hitta på egna."""
    txt = G.synlig_meningstext(T.bygg(k)["html"])
    return {m.group(0) for m in re.finditer(r"\d+(?:,\d+)?", txt)}


def granska(k, extra=None):
    fel = []
    karta = dict(ALT[k])
    if extra:
        karta.update(extra)
    plan = bildplan.GALLERI[k]
    if sorted(karta, key=lambda p: (p is not None, p)) != sorted(plan, key=lambda p: (p is not None, p)):
        fel.append("%s: alt-texterna täcker inte galleriet %s" % (k, plan))
    tal = sidans_tal(k)
    for pos, txt in karta.items():
        etikett = "kortet" if pos is None else "bild %s" % pos
        if len(txt) > MAXLANGD:
            fel.append("%s %s: %d tecken (max %d)" % (k, etikett, len(txt), MAXLANGD))
        if pos is None and not txt.startswith("Faktakort: "):
            fel.append("%s kortet: alt börjar inte med 'Faktakort: '" % k)
        if pos is not None and txt.startswith("Faktakort"):
            fel.append("%s %s: en produktbild kallas faktakort" % (k, etikett))
        if pos == 3 and "Måttritning" not in txt:
            fel.append("%s %s: måttritningen säger inte att den är en ritning" % (k, etikett))
        for e, m in FORBJUDET:
            t = m.search(txt)
            if t:
                fel.append("%s %s: %s %r" % (k, etikett, e, t.group(0)))
        for m in re.finditer(r"\d+(?:,\d+)?", txt):
            if m.group(0) not in tal:
                fel.append("%s %s: OHÄRLETT TAL %r — står inte på sidan"
                           % (k, etikett, m.group(0)))
    return fel


def _sjalvtest():
    fall = [
        ("A  ohärlett tal i alt-text  ", "OHÄRLETT TAL",
         ("397b845e", {2: "Kylvagnen rymmer 999 burkar."}), True),
        ("B  härlett tal i alt-text   ", "OHÄRLETT TAL",
         ("397b845e", {2: "Kylvagnen rymmer 56 liter."}), False),
        ("C  husmärke i alt-text      ", "husmärke",
         ("b3e3aac8", {2: "Kylboxen från Outsunny står på ett bord."}), True),
        ("D  kortet utan Faktakort:   ", "börjar inte med",
         ("ef0fa603", {None: "Dryckeskyl 44 liter, 43 × 51 × 51,3 cm."}), True),
        ("E  ritning utan ordet       ", "säger inte att den är en ritning",
         ("ef0fa603", {3: "43 cm bred, 51 cm djup och 51,3 cm hög."}), True),
        ("F  orörd produkt            ", "", ("d5cc9efa", None), False),
    ]
    fel = 0
    for etikett, sok, (k, extra), ska in fall:
        traff = [x for x in granska(k, extra) if not sok or sok in x]
        if bool(traff) != ska:
            print("  SJÄLVTEST FEL %s: %s"
                  % (etikett, "inget larm" if ska else "falsklarm: %s" % traff[:1]))
            fel += 1
    print("självtest: %d fall, %d fel" % (len(fall), fel))
    return fel


if __name__ == "__main__":
    if _sjalvtest():
        sys.exit(2)
    tot = 0
    for k in matt.WIX:
        f = granska(k)
        tot += len(f)
        for x in f:
            print("  ✗", x)
    n = sum(len(v) for v in ALT.values())
    print("%d alt-texter, %d fel" % (n, tot))
    sys.exit(0 if tot == 0 else 1)
