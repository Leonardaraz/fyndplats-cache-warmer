# -*- coding: utf-8 -*-
"""Runda 120 Steg 14 — läs de ÅTTA publicerade sidorna som kunden ser dem.

Sju uppmjukningar ärvs ur `grindar.py`, alla köpta med ett falsklarm
(uppgift #398, #403, #413, #430, #431, #433, #434, #437). De upprepas inte
här; de bor i modulen och prövas av FALL nedan.

☠️ RUNDANS NYA GRIND, och den som gjorde hela Steg 14 om: FLIKRADEN LÄSES
   SOM `<summary>`, inte som text någonstans på sidan.

   Butikens `splitFlikar` (butiksrepot, `components/productview.tsx`) känner
   exakt fyra strängar — `Tekniska specifikationer`, `Användning och skötsel`,
   `Vanliga frågor`, `Kontakta oss`. Rundans första utkast skrev
   "Montering och skötsel", som matchar INGEN av dem. Uppmätt live 2026-09-10
   på rundans egna åtta sidor:

       <summary>-taggar:  Tekniska specifikationer · Vanliga frågor · Kontakta oss
       <h2> i brödtexten: … Montering och skötsel · Passar inte det här? …

   Skötseltexten hamnade alltså INNE i spec-fliken, tillsammans med
   korslänkarna, och den obligatoriska skötselfliken fanns inte alls.
   Runbokens egen varning beskriver precis det: "det ser inte trasigt ut,
   bara som en rubrik till, och därför upptäcks det inte."

   En grind som letar efter ORDET på sidan hade svarat GRÖNT på alla åtta —
   ordet stod ju där, som `<h2>`. Det är skillnaden mellan att mäta
   närvaro och att mäta STRUKTUR.

☠️ RUNDANS EGEN SIGNATUR ÄR EGENSKAPERNA. Åtta nästan lika barbordsset, där
   bara TVÅ har ryggstöd, bara TVÅ har förvaring, bara EN har stoppad sits,
   bara EN är i marmoroptik och bara EN har fotstöd. Och sex har två
   sittplatser medan två har fyra.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
from grind import (FORBJUDET, TONGRINDAR, NEGERANDE_GRINDAR,      # noqa: E402
                   MASSIVT, FAR_SAGA_MASSIVT, ENSKILDA, INGAR,
                   FYRA_SITS, TVA_SITS, HJUL, HOJDJUST, STAVFEL)
import matt as M                                                 # noqa: E402

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]

SUMMARY = re.compile(r"<summary[^>]*>\s*(.*?)\s*</summary>", re.S)

# ⚠️ UTOMHUS kan inte prövas på den renderade sidan: butikens egna
#    kategorilänkar och rekommendationer talar om trädgård och uteplats utan
#    att sidan påstår något. Grinden gjorde sitt jobb i `grind.py`, på KÄLLAN.
#    FÖRVARING är samma sak — "Förvaring & Organisering" är en kategorirad.
LIVE_UNDANTAG = {"UTOMHUSBRUK", "FÖRVARING"}


# ☠️ TVÄTTEN ÄGS AV `grindar.butikstvatt` sedan runda 121. Den här rundans
#    egen kopia var en av fyra tvillingar som `tvillingsvep` fällde: rundans
#    version saknade `&amp;`-formen av sidfotslänken och bar en SVG-heuristik
#    som åt vår egen text ("Bredd 0,9 m 1,2 m djup" tappade måttet).
_tvatta = G.butikstvatt


def granska(nyckel, html):
    f = FACIT[nyckel]
    fel = []
    # ☠️ ORDNINGEN: stryk grannarna FÖRST, ur rå HTML (runda 117).
    rensad = G.synlig_meningstext(_tvatta(
        G.strak_grannar(html, html, f["slug"], f["namn"])))
    egen_syn = G.synlig_meningstext(_tvatta(html))
    egna, kors = G.egna_meningar(html, f["slug"], f["namn"], _tvatta)

    # ── NÄRVARO prövas FÖRE strykningen (uppgift #430) ───────────────────
    if f["namn"] not in egen_syn:
        fel.append("PRODUKTNAMNET saknas på sidan")

    # ☠️ FLIKRADEN som <summary>, inte som text. Se filhuvudet.
    flikar = [m.strip() for m in SUMMARY.findall(html)]
    for flik in FLIKAR:
        if flik not in flikar:
            fel.append(f"FLIKEN {flik!r} är ingen <summary> — "
                       f"sidan har {flikar}")

    for tal in f["tal"]:
        if tal not in egen_syn:
            fel.append(f"TALET {tal!r} saknas i sidans text")
    if f["farg"] not in egen_syn.lower():
        fel.append(f"FÄRGEN {f['farg']!r} saknas")
    t = re.search(r"<title>(.*?)</title>", html, re.S)
    if t and t.group(1).strip() != f["titel"]:
        fel.append(f"TITELN är {t.group(1).strip()[:70]!r}, väntade {f['titel']!r}")

    # ── FÖRBJUDET prövas på rensad — grannens ord är inte vårt fel ───────
    for monster, etikett in FORBJUDET:
        if etikett in ("RELATIV LÄNK", "WIX STRIPPAR <br>"):
            continue          # gäller källan, inte den renderade sidan
        m = monster.search(rensad)
        if m:
            fel.append(f"{etikett} på sidan: {m.group(0)!r}")
    for monster, etikett in TONGRINDAR:
        m = G.loftestraff(monster, rensad)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(rensad, m.start()).strip()[:100]}…")
    for monster, etikett in NEGERANDE_GRINDAR:
        m = monster.search(rensad)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(rensad, m.start()).strip()[:100]}…")
    for ord_ in STAVFEL:
        if ord_ in rensad.lower():
            fel.append(f"STAVFEL: {ord_!r}")

    # ── Husets fasta materialregel ───────────────────────────────────────
    if nyckel not in FAR_SAGA_MASSIVT:
        m = MASSIVT.search(rensad)
        if m:
            fel.append(f"MASSIVT TRÄ: …{G.mening_kring(rensad, m.start()).strip()[:100]}…")

    # ── Rundans egen risk: en egenskap som kryper mellan två sidor ───────
    for monster, agare, etikett in ENSKILDA:
        if etikett in LIVE_UNDANTAG:
            continue
        m = monster.search(egna)
        if m and nyckel not in agare:
            fel.append(f"{etikett} på en sida som inte har det: "
                       f"…{G.mening_kring(egna, m.start()).strip()[:100]}…")

    # ☠️ ANTALET SITTPLATSER — sex set har två, två har fyra.
    fyra = nyckel in M.FEM
    if fyra and TVA_SITS.search(egna):
        fel.append("TVÅ SITTPLATSER på ett set med fyra")
    if not fyra and FYRA_SITS.search(egna):
        fel.append("FYRA SITTPLATSER på ett set med två")

    # ☠️ Negativa grindar: inget av de åtta har hjul eller höjdjustering.
    for monster, etikett in ((HJUL, "HJUL"), (HOJDJUST, "HÖJDJUSTERING")):
        m = monster.search(egna)
        if m:
            fel.append(f"{etikett} på en sida vars möbel saknar det: "
                       f"…{G.mening_kring(egna, m.start()).strip()[:100]}…")

    # …och länkmeningarna mot MÅLETS facit.
    for mal, mening in kors:
        malnycklar = {k for k, v in FACIT.items() if v["slug"] in mal}
        for monster, agare, etikett in ENSKILDA:
            if etikett in LIVE_UNDANTAG:
                continue
            if monster.search(mening) and malnycklar and not (malnycklar & agare):
                fel.append(f"KORSLÄNK påstår {etikett} om {sorted(malnycklar)}: "
                           f"…{mening.strip()[:100]}…")

    fel += G.leveransloften(egna, INGAR, nyckel)
    return fel


FALL = [
    # ── De ärvda uppmjukningarna: inget av dem får ge ett falsklarm ──────
    ("grannens namn fäller inte oss", "441d2209",
     lambda h: h + '<script>{"slug":"annan","name":"Barbord i massiv ek med hjul"}</script>', 0),
    ("grannens slug fäller inte oss", "441d2209",
     lambda h: h + '<script>{"slug":"barbord-100-cm-stoppade-pallar-ryggstod"}</script>', 0),
    ("egen fråga raderas INTE som granne", "441d2209",
     lambda h: h.replace("</body>", '<script>{"name":"Hur brett är bordet?"}</script></body>'), 0),
    ("bildbredd 1080w är inget påstående", "441d2209",
     lambda h: h + '<img srcset="https://static.wixstatic.com/x.jpg 1080w">', 0),
    ("grannens namn i pbrowse-namn fäller inte oss", "441d2209",
     lambda h: h + '<span class="pbrowse-namn">Barbord 100 cm med två stoppade '
                   'pallar – ryggstöd och grå stenlook</span>', 0),
    ("butikens EU-ribbon fäller inte oss", "441d2209",
     lambda h: h + '<a href="/eu-lager-garanti">Skickas från EU-lager – ingen importtull.</a>', 0),
    ("egen korslänk i DOM:en fäller inte oss", "441d2209",
     lambda h: h.replace("</body>", '<p><a href="https://www.fyndplats.se/'
                         'produkt/barbord-89-cm-tva-stolar-ryggstod" target="_self">'
                         'Samma storlek men med ryggstöd</a>.</p></body>'), 0),
    # ── Rundans NYA grind: flikraden ─────────────────────────────────────
    ("borttagen skötselflik fälls", "441d2209",
     lambda h: h.replace("<summary>Användning och skötsel</summary>",
                         "<summary>Montering och skötsel</summary>"), 1),
    ("borttagen spec-flik fälls", "441d2209",
     lambda h: h.replace("<summary>Tekniska specifikationer</summary>",
                         "<summary>Specifikationer</summary>"), 1),
    ("rubriken som BARA <h2> räcker inte", "441d2209",
     lambda h: h.replace("<summary>Vanliga frågor</summary>",
                         "<h2>Vanliga frågor</h2>"), 1),
    # ── Rundans egna egenskaper på fel sida ──────────────────────────────
    ("ryggstöd på fel sida fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Pallarna har ryggstöd.</p></body>"), 1),
    ("stoppad sits på fel sida fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Sitsen är stoppad med skumplast.</p></body>"), 1),
    ("marmoroptik på fel sida fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Skivan går i marmoroptik.</p></body>"), 1),
    ("fotstöd på fel sida fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Pallen har fotstöd.</p></body>"), 1),
    ("fyra sittplatser på ett tvåsits fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Setet har fyra pallar.</p></body>"), 1),
    ("två sittplatser på ett fyrsits fälls", "c88b5bbb",
     lambda h: h.replace("</body>", "<p>Setet har två pallar.</p></body>"), 1),
    ("hjul fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Bordet rullar på fyra hjul.</p></body>"), 1),
    ("höjdjustering fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Pallarna är höj- och sänkbara.</p></body>"), 1),
    # ── Husets fasta regler ──────────────────────────────────────────────
    ("massivt trä fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Skivan är massiv ek.</p></body>"), 1),
    ("husmärke fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Tillverkad av HOMCOM.</p></body>"), 1),
    ("leveransland fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Bordet skickas från Tyskland.</p></body>"), 1),
    ("attribution fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Leverantören anger 25 minuter.</p></body>"), 1),
    ("tyskt ord fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Skivan är i Spanplatte.</p></body>"), 1),
    ("engelsk enhet fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Skivan tål 374 lbs.</p></body>"), 1),
    ("leveranslöfte i SINGULAR fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Ett glas ingår i leveransen.</p></body>"), 1),
    ("leveranslöfte i PLURAL fälls", "441d2209",
     lambda h: h.replace("</body>", "<p>Fyra glas ingår i leveransen.</p></body>"), 1),
    # ☠️ BÅDA FORMERNA STÅR KVAR SOM LÅS. Den första fällde GRINDEN, inte
    #    sidan: uppräkningen kände sex superlativ och "smalaste" var inget av
    #    dem. Mönstret bär nu ändelsen. Samma familj som böjningshålet i
    #    leveranslöftena — läs meddelandet, inte bara utfallet.
    ("påstående om sortimentet, REGELBUNDET superlativ", "441d2209",
     lambda h: h.replace("</body>", "<p>Det smalaste barbordet i sortimentet.</p></body>"), 1),
    ("påstående om sortimentet, OREGELBUNDET superlativ", "441d2209",
     lambda h: h.replace("</body>", "<p>Det minsta barbordet i sortimentet.</p></body>"), 1),
    # ── Och att närvarokontrollerna faktiskt biter ───────────────────────
    ("saknat tal fälls", "441d2209", lambda h: h.replace("15,5", "X"), 1),
]


def sjalvtest(sidor):
    fel = []
    for namn, nyckel, skada, minst in FALL:
        bas = sidor[nyckel]
        n = len(granska(nyckel, skada(bas)))
        grund = len(granska(nyckel, bas))
        if minst == 0 and n > grund:
            fel.append(f"{namn}: FALSKLARM ({n} mot {grund} utan skadan)")
        if minst and n <= grund:
            fel.append(f"{namn}: grinden såg det INTE ({n} mot {grund})")
    return fel


if __name__ == "__main__":
    sidor, tot = {}, 0
    for nyckel, f in FACIT.items():
        html, hdr = G.hamta_isr(BAS + f["slug"])
        sidor[nyckel] = html
        print(f"    hämtad {nyckel} {len(html)//1024} kB, "
              f"cache {hdr.get('x-vercel-cache','?')} age {hdr.get('age','?')}")
    st = sjalvtest(sidor)
    print(f"\nlive-självtest: {len(FALL)} fall, {len(st)} fel")
    for x in st:
        print("  ☠️", x)
    for nyckel, html in sidor.items():
        fl = granska(nyckel, html)
        tot += len(fl)
        print(("FEL " if fl else "OK  ")
              + f"{nyckel}  {FACIT[nyckel]['slug']}  ({len(html)//1024} kB)")
        for x in fl:
            print("      ✗", x)
    print(f"\n{len(FACIT)} sidor, {tot} fel, {len(st)} fel i självtestet")
    sys.exit(1 if (tot or st) else 0)
