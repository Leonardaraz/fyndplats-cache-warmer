# -*- coding: utf-8 -*-
"""Runda 141 Steg 9 — svenska alt-texter, i en FIL och grindade.

☠️ Alt-texten passerar ingen av rundans vanliga grindar: `grind.granska`
   läser `namn`, `titel`, `meta` och `html` ur `texter.py`, och alt-texten
   finns inte där. Runbookens Steg 9 säger rakt ut att varje regel grinden
   vaktar därför är OGRINDAD i alt-texten — och att den ska köras mot samma
   lista, inte mot en omskriven variant. `granska()` här nedan gör just det.

Tre regler utöver de delade, alla ur rundans egna fynd:

1. **Beskriv VARAN, inte stajlingen.** Leverantörens miljöbilder är
   iscensatta; personen i bilden är inte produktinformation (runda 106).

2. ☠️ **Nämn aldrig vikter eller skivstång.** Tre av bänkarna visar dem på
   bild utan att de ingår (STEG4.md 4). I brödtexten står det utskrivet att
   de inte gör det — i en alt-text finns ingen plats för brasklappen, så
   ordet utelämnas helt i stället för att kvalificeras.

3. **Inga tal som inte är härledda ur `matt.py`.** Samma regel som
   brödtexten, och samma grind.

Positionerna är feedens 1, 2, 3, 8 och 9 — samma ordning som `bilder.json`.
☠️ `83b2cf8b` har bara FYRA: position 3 var måttritningen med `by Aosom`
   inbränt och plockades bort (STEG4.md 1).
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grind as GR                                               # noqa: E402
import grindar as G                                              # noqa: E402
import texter as T                                               # noqa: E402

# pid -> {feedposition: alt-text}
ALT = {
    "8de3c3ef": {
        1: "Träningsbänk 115 cm i svart med blå detaljer, ryggstödet uppfällt "
           "och ett vadderat rullpar framtill, sedd snett framifrån mot vit "
           "bakgrund.",
        2: "Träningsbänken uppställd på ett gymgolv med ryggstödet i ett "
           "upprätt läge och fötterna innanför rullparet.",
        3: "Måttskiss över träningsbänken: 115 cm lång, 32,5 cm bred och "
           "41,5–105,5 cm hög, hopfälld 32,5 × 22 × 75 cm.",
        8: "Träningsbänken med ryggstödet lutat bakåt, sedd från sidan i ett "
           "ljust rum.",
        9: "Träningsbänken i plant läge med sits och ryggdyna i linje, sedd "
           "från sidan.",
    },
    "7b818c3b": {
        1: "Plan träningsbänk i svart och grått bredvid ett fristående ställ "
           "med klykor, sedda snett framifrån mot vit bakgrund.",
        2: "Bänken och stället uppställda på ett trägolv intill en vägg, med "
           "klykorna i ett av de åtta höjdlägena.",
        3: "Måttskiss: bänken tar 140 × 73 cm i golvet, dynan är 110 × 26 cm "
           "och ligger 43 cm över golvet, och ställets klykor står mellan 98 "
           "och 122 cm.",
        8: "Bänken och stället sedda från sidan mot en betongvägg, med "
           "viktpinnarna synliga nere vid ställets fötter.",
        9: "Stället sett framifrån med handtagen utåt och den plana bänken "
           "bakom.",
    },
    "8a0e05f4": {
        1: "Träningsbänk 146 cm i svart med röda detaljer, två lårkuddar "
           "upptill och ett rullpar nedtill, sedd snett framifrån mot vit "
           "bakgrund.",
        2: "Bänken uppställd på ett trägolv med ryggstödet i plant läge och "
           "lårkuddarna i ett övre läge.",
        3: "Måttskiss: bänken är 146 cm lång, 64 cm bred och 73,5–85 cm hög, "
           "med ryggdynan 98 × 32 cm och bukdynan 30 × 16 cm.",
        8: "Närbild på justerratten på bänkens sida, med hålraden för "
           "ryggstödets lägen bakom.",
        9: "Närbild på ett av de svarta skumrullarna som låser fötterna, "
           "monterat i ett rött fäste.",
    },
    "b4961e6f": {
        1: "Hopfällbar träningsbänk i svart med armarna utsvängda och ett "
           "rullpar nedtill, sedd snett framifrån mot vit bakgrund.",
        2: "Bänken uppställd på ett gymgolv med armarna utsvängda och "
           "handtagen framåtdragna.",
        3: "Måttskiss: bänken är 107 cm hög och står på 135 × 55 cm med "
           "armarna uppfällda.",
        8: "Bänken med ryggstödet i nedåtlutat läge och fötterna innanför "
           "rullparet, sedd från sidan.",
        9: "Bänken med ryggstödet upprätt och armarna infällda, sedd snett "
           "från sidan.",
    },
    "83b2cf8b": {
        1: "Träningsbänk i svart och rött med skivstångsställ, bicepspulpet "
           "framtill och bensträckare vid foten, sedd snett framifrån mot vit "
           "bakgrund.",
        2: "Bänken uppställd i ett rum med ryggstödet i lutande läge och "
           "klykorna i ett av de tre hålen.",
        8: "Bänken sedd från sidan med bicepspulpeten framtill och "
           "bensträckarens viktpelare nedtill.",
        9: "Bänken i nedåtlutat läge med rullparet nedtill, sedd snett "
           "uppifrån.",
    },
    "a4bbe667": {
        1: "Träningsbänk med vit stålram och svarta dynor, skivstångsställ på "
           "båda sidor och armstöd för bicepscurl, sedd snett framifrån mot "
           "vit bakgrund.",
        2: "Bänken uppställd i ett rum med ryggstödet i lutande läge och "
           "klykorna i ett övre höjdläge.",
        3: "Måttskiss: bänken tar 180 × 134 cm i golvet och är 113–136 cm "
           "hög, ryggdynan är 76 × 25 cm och armstödsdynan 24 × 40 cm.",
        8: "Armstödet framför sitsen och rullparet nedtill, sedda från "
           "bänkens sida.",
        9: "Hela bänken snett framifrån i ett rum, med armstödet fällt "
           "framåt och klykorna uppe.",
    },
    "18b94738": {
        1: "Träningsbänk med stomme i ljus skiktlimmad träskiva och svarta "
           "dynor, sedd snett framifrån mot vit bakgrund.",
        2: "Bänken uppställd mot en betongvägg med det öppna facket under "
           "sitsen synligt.",
        3: "Måttskiss: bänken är 110 cm lång och 43–107 cm hög beroende på "
           "ryggstödets läge, och sitsen mäter 33 × 33 cm.",
        8: "Närbild på den svarta konstlädersdynan och dess kantsöm.",
        9: "Närbild på gaveln i skiktlimmad träskiva, där skikten syns i "
           "kanten.",
    },
}

# Fyndplats egna spec-kort. ☠️ Position 0 är kortets — det ligger på plats 3
# i galleriet, men har ingen feedposition eftersom det är VÅR bild.
# ☠️ KORTETS ALT-TEXT MÅSTE BÖRJA MED `Faktakort: `. Det är inte en smaksak:
#    `grindar.kortfel` letar efter exakt det prefixet i galleriets thumb-rad,
#    och det är KRITERIET för runbokens "minst ett eget Fyndplats-kort".
#
#    Rundan skrev först `Spec-kort från Fyndplats med …`. Sju sidor gick LIVE
#    med det, och Steg 14 fällde alla sju på `SAKNAR EGET KORT` — grinden hade
#    rätt. Två fel i ett: kortet blev osynligt för grinden, OCH texten ledde
#    med vårt VARUMÄRKE i ett fält som ska beskriva innehåll. `kortfel` fäller
#    uttryckligen `Fyndplats-kort:` av det andra skälet; `Spec-kort från
#    Fyndplats` är samma överträdelse i en form grinden inte kände igen.
#
#    Regeln grindas nu här också (`_kortformkoll`), så rundans EGEN alt-grind
#    fäller före skrivningen i stället för live-grinden efter.
KORT_ALT = {
    "8de3c3ef": "Faktakort: mått, ryggstödets sju vinklar och maxlast för "
                "den 115 cm långa bänken.",
    "7b818c3b": "Faktakort: bänkens och ställningens mått, ställningens åtta "
                "höjder och maxlast.",
    "8a0e05f4": "Faktakort: mått, ryggstödets tre lägen och maxlast för den "
                "146 cm långa bänken.",
    "b4961e6f": "Faktakort: mått med armarna utfällda, ryggstödets tre lägen "
                "och maxlast.",
    "83b2cf8b": "Faktakort: bänkens mått, bicepspulpetens storlek och höjd "
                "över golvet samt maxlast.",
    "a4bbe667": "Faktakort: mått, skivstångsställets sex höjder och maxlast "
                "för den vita bänken.",
    "18b94738": "Faktakort: mått, ryggstödets sex vinklar och maxlast för "
                "bänken i trä.",
}
for _p, _t in KORT_ALT.items():
    ALT[_p][0] = _t

# ☠️ Orden som ALDRIG får stå i en alt-text i den här rundan. Vikterna syns
#    på bild men ingår inte, och alt-texten har ingen plats för brasklappen.
# ☠️ Lookaheaden är inte kosmetisk. Första versionen fällde
#    `skivstångsställ` och `hantelfack` — som är FASTA delar av bänken
#    och ingår. Regeln gäller den LÖSA stången och de LÖSA vikterna;
#    skriven mot ordstammen fällde den tre korrekta alt-texter.
UTESLUTNA = re.compile(r"\bvikt(?:er|skivor?|skiva)\b"
                       r"|\bskivstång(?!sställ)\w*"
                       r"|\bhantel(?!fack)\w*|\bkettlebell\w*", re.I)


def granska(pid):
    """Kör rundans EGNA förbud + de delade grindarna mot alt-texterna."""
    fel = []
    egna = GR._egna_tal(pid) | GR._FRIA
    for pos, txt in sorted(ALT[pid].items()):
        var = "%s bild %d" % (pid, pos)
        if G.ARTNR.search(txt):
            fel.append("%s: ARTIKELNUMMER" % var)
        h = G.homoglyfer(txt)
        if h:
            fel.append("%s: HOMOGLYFER %r" % (var, h))
        for t in G.TREKONSONANT.finditer(txt):
            fel.append("%s: TRE LIKA KONSONANTER %r" % (var, t.group(0)))
        if G.JARGONG.search(txt):
            fel.append("%s: JARGONG" % var)
        for m in UTESLUTNA.finditer(txt):
            fel.append("%s: VIKTER/STÅNG nämns — de ingår inte (%r)"
                       % (var, m.group(0)))
        for monster, skal in GR.FORBJUDET:
            if monster.search(txt):
                fel.append("%s: %s" % (var, skal))
        for p, monster, skal in GR.SPECIFIKA:
            if p == pid and monster.search(txt):
                fel.append("%s: %s" % (var, skal))
        for tal in GR._TAL.findall(txt):
            if tal not in egna:
                fel.append("%s: OHÄRLETT TAL %r" % (var, tal))
        if len(txt) > 300:
            fel.append("%s: FÖR LÅNG (%d tecken)" % (var, len(txt)))
        if txt.strip() != txt or "  " in txt:
            fel.append("%s: BLANKSTEGSFEL" % var)
    return fel


def _kortformkoll():
    """Kortets alt-text: rätt prefix, och inget varumärke i innehållsfältet.

    ☠️ Båda halvorna behövs. Prefixet är vad `grindar.kortfel` MÄTER; förbudet
       mot `Fyndplats` är VARFÖR prefixet ser ut som det gör. En runda som bara
       grindat prefixet hade släppt igenom `Faktakort: Fyndplats visar …`.
    """
    fel = []
    for pid, txt in KORT_ALT.items():
        if not txt.startswith("Faktakort: "):
            fel.append("%s KORT: alt-texten måste börja med 'Faktakort: ' — "
                       "det är vad grindar.kortfel letar efter (%r)"
                       % (pid, txt[:40]))
        if re.search(r"Fyndplats|Spec-kort", txt, re.I):
            fel.append("%s KORT: varumärke eller mallord i ett fält som ska "
                       "beskriva innehåll (%r)" % (pid, txt[:40]))
    return fel


def _mallkoll():
    """Alt-texterna får inte vara samma mall fem gånger (runbokens Steg 9)."""
    fel = []
    for pid, d in ALT.items():
        forsta = [t.split(",")[0].split(" sedd")[0].strip() for t in d.values()]
        if len(set(forsta)) < len(forsta):
            fel.append("%s: samma inledning på flera bilder — %r" % (pid, forsta))
    return fel


if __name__ == "__main__":
    brister = []
    for pid in T.SLUG:
        assert pid in ALT, "saknar alt-texter för %s" % pid
        brister += granska(pid)
    brister += _mallkoll()
    brister += _kortformkoll()
    for b in brister:
        print("☠️ " + b)
    n = sum(len(d) for d in ALT.values())
    print("alt-grind: %d texter, %d brister" % (n, len(brister)))
    raise SystemExit(1 if brister else 0)
