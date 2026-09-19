# -*- coding: utf-8 -*-
"""Runda 87 — bevisar att linten BITER.

En grön lint säger bara att den inte skriker. Testet nedan planterar ett känt
fel i taget och kräver att RÄTT regel fäller det. Fångar den inte, är regeln
dekoration.

☠️ RUNDANS EGNA FYND, MUTERADE ETT I TAGET:
   * snölasten åt tre håll — ett saknat tal, ett syskons tal, och ett tal på
     en produkt vars källa inte anger något
   * ett vinterlöfte, som är rundans farligaste enskilda ord
   * förankringen åt BÅDA håll, och en grannes mängd både i SIFFROR och
     UTSKRIVEN I BOKSTÄVER
   * ett fönster på den produkt vars fönster ingen bild visar, och ett
     försvunnet fönster på den som faktiskt har ett
   * "vattentät" på den sida där källan säger emot sig själv
   * en lånad takform
   * en färgrad som får syskonets färg
   * ett bygglovspåstående och ett absolut väderlöfte

⚠️ Mutationer med scope `"*"` skriver om namn, titel, meta, ingress, punkter,
   spec, skötsel, villkor och FAQ på en gång. Runda 77 mätte varför: en
   mutation som bara rör ingressen kan lämna beviset kvar i spec-tabellen.

☠️ MUTERA GENOM ATT LÄGGA TILL, INTE BYTA UT, där båda sidor av en jämförelse
   annars ändras. Ett byte i spec-raden flyttar facit med sig och provar
   därför ingenting — runda 86 mätte upp det på en golvyta.
"""
import copy
import re

import lint
import texter


MUTATIONER = [
    # (kort, fält, sök, ersätt, förväntad delsträng i felet)
    # ── ☠️ SNÖLASTEN, ÅT TRE HÅLL ───────────────────────────────────────
    ("5f6592ad", "spec", "Snölast: 10 kg/m²", "Snölast: 5 kg/m²",
     "saknar 10 kg/m²"),
    ("20c0942e", "villkor",
     "Borsta av snön medan den är lätt.",
     "Taket klarar 5 kg/m². Borsta av snön medan den är lätt.",
     "det är 0f5e3fea:s snölast"),
    ("72051417", "spec", "Snölast: anges inte", "Snölast: 10 kg/m²",
     "källan anger ingen"),
    # ── ☠️ VINTERLÖFTET — rundans farligaste enskilda ord ────────────────
    ("95a9d7cc", "eg", "Sadeltak", "Vinterklart sadeltak", "vinterlöfte"),
    ("0f5e3fea", "ingress", "in i stående.</strong>",
     "in i stående — och det är vintersäkert.</strong>", "vinterlöfte"),
    # ── ☠️ FÖRANKRINGEN, ÅT BÅDA HÅLL ───────────────────────────────────
    ("8bdba748", "spec", "Ingår: tält och monteringsanvisning",
     "Ingår: tält, 6 markankare och monteringsanvisning", "lovar förankring"),
    ("72051417", "spec",
     "Ingår: tält, 6 markankare, 6 skruvar, 15 spännlinor, monteringsanvisning",
     "Ingår: tält, 6 markankare, 6 skruvar, monteringsanvisning",
     "saknar '15 spännlinor'"),
    ("6a419d8b", "villkor", "Handskarna som ingår är inte en artighet.",
     "20 jordspett ingår. Handskarna som ingår är inte en artighet.",
     "det är 95a9d7cc:s leveransinnehåll"),
    # ☠️ Samma sak UTSKRIVEN I BOKSTÄVER — hålet som fanns tills det mättes.
    ("6a419d8b", "villkor", "Handskarna som ingår är inte en artighet.",
     "Sexton markankare medföljer. Handskarna som ingår är inte en artighet.",
     "det är 0f5e3fea:s leveransinnehåll"),
    # ── ☠️ FÖNSTRET, ÅT BÅDA HÅLL ───────────────────────────────────────
    ("6a419d8b", "eg", "15 cm bred kant mot marken",
     "15 cm bred kant mot marken och ett fönster på sidan",
     "påstår ett fönster på sina egna ytor"),
    ("95a9d7cc", "*", "fönster", "lucka", "nämner det inte"),
    # ── ☠️ VATTENTÄTHETEN ───────────────────────────────────────────────
    ("0f5e3fea", "eg", "Vattenavvisande polyesterduk med UV30+",
     "Vattentät polyesterduk med UV30+", "kallar inte den här dukens tät"),
    ("72051417", "eg", "Galvaniserad stålstomme, duk i PE",
     "Galvaniserad stålstomme, vattentät duk i PE",
     "kallar inte den här dukens tät"),
    # ── ☠️ TAKFORMEN ────────────────────────────────────────────────────
    ("8bdba748", "spec", "Tak: bågformat", "Tak: sadeltak", "men taket är bågformat"),
    ("20c0942e", "eg", "Sadeltak med nock på mitten",
     "Bågformat tak med nock på mitten", "påstår takformen"),
    # ── ☠️ FÄRGEN ───────────────────────────────────────────────────────
    ("72051417", "spec", "Färg: ljusgrå", "Färg: mörkgrå", "men färgen är ljusgrå"),
    ("a165b178", "eg", "Mörkgrå duk", "Ljusgrå duk",
     "påstår 'ljusgrå' duk på sina egna ytor"),
    # ── ☠️ BYGGLOV OCH ABSOLUTA PÅSTÅENDEN ──────────────────────────────
    ("6a419d8b", "ingress", "Nio kvadratmeter",
     "Nio bygglovsfria kvadratmeter", "bygglov"),
    ("5f6592ad", "eg", "Angiven vindtålighet upp till Beaufort 5",
     "Stormsäker konstruktion", "absolut påstående"),
    # ── ☠️ MATERIALET ───────────────────────────────────────────────────
    ("95a9d7cc", "eg", "Galvaniserad metallstomme, vattentät och UV-beständig PE-duk",
     "Stomme i lackerat trä, vattentät och UV-beständig PE-duk",
     "stommen är galvaniserat stål"),
    # ── ☠️ HUSREGLER SOM GÄLLER VARJE RUNDA ─────────────────────────────
    ("8bdba748", "*", "cykelgarage", "Outsunny-cykelgarage", "förbjudet ord"),
    ("72051417", "eg", "Sadeltak som leder av regn åt två håll",
     "Leverantören anger ett sadeltak som leder av regn åt två håll",
     "förbjudet ord"),
    ("a165b178", "eg", "Takfot 134 cm",
     "Takfot 134 cm, samma som i rundans andra tält", "intern jargong"),
    ("20c0942e", "eg", "Ljusgrå duk", "Ljusgrå duk, som på våra publicerade tält",
     "intern jargong"),
    # ☠️ Talgrindens NYA enhet `m` — utan den var varje metertal osynligt.
    #    Muterad genom att LÄGGA TILL: spec-raden rörs inte, så facit står kvar.
    ("5f6592ad", "ingress", "163 cm i nock.</strong>",
     "163 cm i nock, alltså 1,63 m.</strong>",
     "tal som inte står i produktens egen spec: 1,63 m"),
    # ☠️ Och `kvadratmeter` utskrivet, som normaliseras till m² före mätning.
    ("a165b178", "ingress", "familjens minsta fotavtryck",
     "familjens minsta fotavtryck på 8,4 kvadratmeter",
     "tal som inte står i produktens egen spec"),
    # ☠️ Ett tal i ett LÄNKANKARE som inte är mätt för målsidan.
    ("72051417", "ingress", "162 × 221,5 cm i samma ljusa ton",
     "162 × 221,5 cm och 99 kg i samma ljusa ton",
     "som inte är mätt för DEN sidan"),
    # ── kommalista av tal (runbokens sifferstil) ────────────────────────
    ("8bdba748", "eg", "245 × 120 cm på marken, 200 cm i högsta punkten",
     "Måtten är 245, 120 och 200 cm", "kommalista"),
    # ── struktur ────────────────────────────────────────────────────────
    ("6a419d8b", "title", None,
     "Garagetält 300 × 300 cm med nio kvadratmeter golvyta och förstärkt stomme | Fyndplats",
     "titeln är"),
]

def kor():
    fangade, missade = 0, []
    for kort, falt, sok, ers, vantat in MUTATIONER:
        lint.FEL = []
        orig = texter.PRODUKTER
        muterade = copy.deepcopy(orig)
        for p in muterade:
            if p["kort"] != kort:
                continue
            if falt == "*":
                for f in ("name", "title", "meta", "ingress"):
                    p[f] = re.sub(sok, ers, p[f], flags=re.I)
                for f in ("eg", "spec", "skotsel"):
                    p[f] = [re.sub(sok, ers, r, flags=re.I) for r in p[f]]
                p["faq"] = [(re.sub(sok, ers, a, flags=re.I),
                             re.sub(sok, ers, b, flags=re.I)) for a, b in p["faq"]]
                p["villkor"] = (re.sub(sok, ers, p["villkor"][0], flags=re.I),
                                [re.sub(sok, ers, r, flags=re.I) for r in p["villkor"][1]])
            elif falt == "villkor":
                # ⚠️ `villkor` är (rubrik, [stycken]) — inte en lista och
                #    inte en sträng. Utan den här grenen kan rundans
                #    tyngsta block inte muteras alls.
                assert any(sok in r for r in p["villkor"][1]), \
                    "%s: hittade inte %r i villkor" % (kort, sok)
                p["villkor"] = (p["villkor"][0],
                                [r.replace(sok, ers, 1) for r in p["villkor"][1]])
            elif falt in ("eg", "spec", "skotsel"):
                assert sok in p[falt], "%s: hittade inte %r i %s" % (kort, sok, falt)
                p[falt] = [ers if r == sok else r for r in p[falt]]
            elif sok is None:
                p[falt] = ers
            else:
                assert sok in p[falt], "%s: hittade inte %r" % (kort, sok)
                p[falt] = p[falt].replace(sok, ers, 1)
        lint.PRODUKTER = muterade
        try:
            lint.kor()
            traff = [f for f in lint.FEL
                     if f.startswith(kort) and vantat.lower() in f.lower()]
            if traff:
                fangade += 1
            else:
                missade.append("%s/%s → väntade %r, fick: %s"
                               % (kort, falt, vantat, lint.FEL or "INGET FEL"))
        finally:
            lint.PRODUKTER = orig

    lint.FEL = []
    lint.PRODUKTER = texter.PRODUKTER
    lint.kor()
    print("orörd text: %d fel" % len(lint.FEL))
    for f in lint.FEL:
        print("   ", f)
    print("mutationer: %d/%d fångade" % (fangade, len(MUTATIONER)))
    for m in missade:
        print("MISSAD:", m)
    return not missade and not lint.FEL


if __name__ == "__main__":
    raise SystemExit(0 if kor() else 1)
