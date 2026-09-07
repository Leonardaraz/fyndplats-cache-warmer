# -*- coding: utf-8 -*-
"""Runda 91 Steg 9: galleriordning + alt-texter.

Ordningen är husets: **kortet på plats 3, måttritningen sist.** Feedens rena
positioner kom hem som produkt-på-vitt, livsstil, MÅTTRITNING, detalj, detalj
— ritningen flyttas alltså bakåt och kortet skjuts in som tredje bild.

✅ ALLA FYRA MÅTTRITNINGAR ÄR RENA. Runda 90 fick plocka bort modell C:s skiss
   för att den bar `Empfohlenes Alter: 5-12 Jahre` inbränt i pixlarna. De här
   fyra granskades i samma zoom och bär bara siffror och `cm` — ingen tysk
   text alls. Alla fyra behåller sin ritning, alltså sex bilder var.

☠️ `id` SKICKAS, ALDRIG `url`, för filer som redan ligger i Media Manager.
   En wixstatic-adress i `url`-fältet får Wix att importera om bilden till en
   NY fil — halva lagringen var kopior innan det mättes upp 2026-08-28.
   Korten är däremot EXTERNA (raw.githubusercontent.com) och skickas som url.

☠️ ALT-TEXTEN LIGGER PÅ ITEM-NIVÅ, inte inuti `image`. Skickad som
   `items[].image.altText` släpps den TYST: PATCH:en går igenom, bilden kommer
   tillbaka korrekt, och alt-texten är borta.

☠️ `media.main` skickas inte alls — read-only i V3, härleds ur första posten.

⚠️ ORDET SCOOTER står tryckt i guld på ramen och syns i flera detaljbilder.
   Det är fysiskt på varan och rörs inte — men det skrivs aldrig ut, varken i
   alt-texten eller i brödtexten. Grinden nedan fäller det.

⚠️ Alt-texterna är unika över HELA rundan. Fyra färgsyskon delar tre av fem
   fotografier (samma render omfärgad), så identiska alt-texter hade varit
   fyra sidor som säger exakt samma sak till Google.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
bilder = json.load(open(os.path.join(HAR, "bilder-alla.json"), encoding="utf-8"))

KORT_URL = ("https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/"
            "claude/seo-polering-runbook-review-bz3j9l/tools/polish-assets/"
            "runda-91/kort/%s.jpg")

# id -> (råbildsindex i ordning, alt-texter). KORTET står som None.
PLAN = {
 "369b4b2c": ([0, 1, None, 3, 4, 2], [
    "Svart sparkcykel för barn med luftdäck, flicka med hjälm står på fotplattan",
    "Pojke sparkar fram på den svarta sparkcykeln på en gångväg i en park",
    "Faktakort: sparkcykel barn 120 cm, svart ram med randband i guld och vitt",
    "Framhjulets luftdäck och silverfälg i närbild, med bromsok och bromsvajer",
    "Det svarta styret i närbild med vadderad tvärstång och bromshandtag",
    "Måttskiss: 120 cm lång, 58 cm bred och styre som ställs mellan 85 och 95 cm"]),

 "feac1d03": ([0, 1, None, 3, 4, 2], [
    "Turkos sparkcykel för barn med luftdäck, utfällt stödben och svart fotplatta",
    "Flicka står på den turkosa sparkcykeln framför ett hus med trappa",
    "Faktakort: sparkcykel barn 120 cm, turkos ram med randband i guld, vitt och svart",
    "Den turkosa ramen och den svarta fotplattan i närbild, sedda snett bakifrån",
    "Framhjulet i närbild: grovmönstrat luftdäck på silverfälg med blanka ekrar",
    "Måttskiss framifrån och från sidan: 120 cm lång, 58 cm bred, fotplatta 30 × 11 cm"]),

 "c851d101": ([0, 1, None, 3, 4, 2], [
    "Vit sparkcykel för barn med svarta ränder, pojke med hjälm och ryggsäck bredvid",
    "Flicka står på den vita sparkcykeln framför ett hus med trappa",
    "Faktakort: sparkcykel barn 120 cm, vit ram med svarta ränder",
    "Framgaffel och framhjul i närbild på den vita ramen, med bromsok och vajer",
    "Fotplattan och den vita ramen i närbild, med utfällt stödben under",
    "Måttskiss med vy framifrån: 120 cm lång, 58 cm bred och fotplatta 30 × 11 cm"]),

 "1b1d4842": ([0, 1, None, 3, 4, 2], [
    "Gräddbeige sparkcykel för barn, pojke med hjälm och ryggsäck står bredvid",
    "Den gräddbeige sparkcykeln uppställd på stödbenet på en stenlagd gång",
    "Faktakort: sparkcykel barn 120 cm, gräddbeige ram med randband i guld, vitt och svart",
    "Styret i närbild med bromshandtag, vadderad tvärstång och bromsvajer",
    "Den gräddbeige ramen och den halkmönstrade fotplattan i närbild",
    "Måttskiss av den gräddbeige sparkcykeln: 120 cm lång, 58 cm bred, styre 85–95 cm"]),
}

# ── Grind på alt-texterna, innan något skrivs ────────────────────────────
FORBJUDET = re.compile(
    r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|Tyskland|Spanien|Polen|Kina|"
    r"\d{3}-\d{3}[A-Z0-9]|\d+\s*kr|rostfri|elsparkcykel|Kinder|Roller|Scooter",
    re.I)
sedda, brister = {}, []
for pid, (ordning, alt) in PLAN.items():
    if len(ordning) != len(alt):
        brister.append("%s: %d bilder men %d alt-texter" % (pid, len(ordning), len(alt)))
    for a in alt:
        if len(a) > 125:
            brister.append("%s: alt-text %d tecken (tak 125): %r" % (pid, len(a), a[:50]))
        if FORBJUDET.search(a):
            brister.append("%s: förbjudet i alt-text: %r" % (pid, FORBJUDET.search(a).group(0)))
        if a in sedda:
            brister.append("%s: alt-text INTE unik, delas med %s: %r" % (pid, sedda[a], a[:50]))
        sedda[a] = pid
    # ☠️ Kortet MÅSTE finnas i planen. En runda utan eget kort är en
    #    vidarebefordran av leverantörens marknadsföring.
    if None not in ordning:
        brister.append("%s: INGET Fyndplats-kort i galleriet" % pid)
    for i in ordning:
        if i is not None and i >= len(bilder[pid]):
            brister.append("%s: råbild %d finns inte (%d bilder)" % (pid, i, len(bilder[pid])))

if brister:
    for b in brister:
        print("☠️", b)
    sys.exit(1)

print("Alt-textgrind: %d texter, alla unika, inom taket, inga förbjudna ord." % len(sedda))

IDS = {"369b4b2c": "369b4b2c-ef11-4795-adb0-2c5d4315901f",
       "feac1d03": "feac1d03-4c7c-48d4-9c56-9d7cf9ef7144",
       "c851d101": "c851d101-11ec-4bab-b393-fb35880d76ae",
       "1b1d4842": "1b1d4842-9cde-4845-bdb9-9d5bc0d19bbe"}

plan = {}
for pid, (ordning, alt) in PLAN.items():
    poster = []
    for i, a in zip(ordning, alt):
        if i is None:
            poster.append({"url": KORT_URL % pid, "altText": a})
        else:
            poster.append({"id": bilder[pid][i], "altText": a})
    plan[pid] = {"id": IDS[pid], "poster": poster, "antal": len(poster)}
    print("  %-9s %d bilder  (kort på plats %d)" % (pid, len(poster), ordning.index(None) + 1))

json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
