# -*- coding: utf-8 -*-
"""Runda 90 Steg 9: galleriordning + alt-texter.

Ordningen är husets: **kortet på plats 3, måttritningen sist.** Feedens rena
positioner kom hem som produkt-på-vitt, livsstil, MÅTTRITNING, detalj, detalj
— ritningen flyttas alltså bakåt och kortet skjuts in som tredje bild.

☠️ MODELL C HAR INGEN MÅTTRITNING KVAR. Alla tre (`9518db1e`, `473084eb`,
   `85be4535`) delar samma skiss, och den bär TYSK TEXT inbränd i pixlarna:
   `Empfohlenes Alter: 5-12 Jahre` och `Gewichtsgrenze: 50 kg`. En grep över
   källkoden svarar grönt medan kundens öga läser tyska. Bilden plockas bort
   helt — de tre får FEM bilder, inte sex — och måtten skrivs i texten i
   stället. Att behålla den och hoppas att ingen zoomar är samma fel som att
   skriva ut artikelnumret.

   ⚠️ Filerna ligger kvar i Media Manager och blir föräldralösa. De städas av
   nattens `aosom-media-cleanup`, den enda vägen som faktiskt frigör lagring.

☠️ `id` SKICKAS, ALDRIG `url`, för filer som redan ligger i Media Manager.
   En wixstatic-adress i `url`-fältet får Wix att importera om bilden till en
   NY fil — halva lagringen var kopior innan det mättes upp 2026-08-28.
   Korten är däremot EXTERNA (raw.githubusercontent.com) och skickas som url.

☠️ ALT-TEXTEN LIGGER PÅ ITEM-NIVÅ, inte inuti `image`. Skickad som
   `items[].image.altText` släpps den TYST: PATCH:en går igenom, bilden kommer
   tillbaka korrekt, och alt-texten är borta.

☠️ `media.main` skickas inte alls — read-only i V3, härleds ur första posten.

⚠️ Alt-texterna är unika över HELA rundan, inte bara inom produkten. Rundan
   har tre färgsyskon i modell C och två i modell G; identiska alt-texter är
   fem sidor som säger samma sak till Google.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
bilder = json.load(open(os.path.join(HAR, "bilder-alla.json"), encoding="utf-8"))

# id -> (råbildsindex i ordning, alt-texter). KORTET står som None.
PLAN = {
 "5129f6b0": ([0, 1, None, 3, 4, 2], [
    "Vit sparkcykel för barn med luftdäck Ø40 cm, pojke med hjälm på fotplattan",
    "Pojke kör den vita sparkcykeln på en stenlagd gång i en park",
    "Faktakort: sparkcykel barn 139 cm, vit ram med röd bromsvajer",
    "Närbild på det svarta styret med bromshandtag och vadderad tvärstång",
    "Framhjulet i närbild: grovmönstrat luftdäck på vit ekerfälg",
    "Måttskiss: 139 cm lång, 58 cm bred, styre 90–96 cm och 36 cm fotplatta"]),

 "50b28808": ([0, 1, None, 3, 4, 2], [
    "Svart sparkcykel för barn med röd framgaffel, pojke med hjälm bredvid",
    "Den svarta sparkcykeln parkerad på stödbenet vid en asfaltsväg",
    "Faktakort: sparkcykel barn 139 cm, svart ram med röd framgaffel",
    "Framhjulets luftdäck och vita ekerfälg sedda snett uppifrån",
    "Den svarta sparkcykeln från sidan med utfällt stödben",
    "Måttskiss: 139 cm lång, 58 cm bred och styre 90–96 cm"]),

 "9518db1e": ([0, 1, None, 3, 4], [
    "Blå sparkcykel för barn med stödben och svart halkmönstrad fotplatta",
    "Barn kör den blå sparkcykeln på en gångväg medan en vuxen ser på",
    "Faktakort: sparkcykel barn 115 cm, blå ram och blå femekersfälgar",
    "Den blå sparkcykeln uppställd vid en mur med hjälmen bredvid",
    "Fotplattan i närbild: svart halkmönstrad yta med två nitar"]),

 "473084eb": ([0, 1, None, 3, 4], [
    "Rosa sparkcykel för barn med vit nedre ram och rosa femekersfälgar",
    "Barn åker den rosa sparkcykeln på en asfaltsgång i en park",
    "Faktakort: sparkcykel barn 115 cm, rosa och vit ram med rosa fälgar",
    "Den rosa sparkcykeln lutad mot en trävägg med hjälmen bredvid",
    "Vuxen och barn på promenad med den rosa sparkcykeln"]),

 "85be4535": ([0, 1, None, 3, 4], [
    "Vit sparkcykel för barn med svart nedre ram och svarta fälgar",
    "Barn kör den vita sparkcykeln på en gårdsplan medan en vuxen ser på",
    "Faktakort: sparkcykel barn 115 cm, vit och svart ram med svarta fälgar",
    "Den vita sparkcykeln uppställd mot en stenmur med hjälmen bredvid",
    "Fotplattans halkmönstrade yta i närbild, sedd snett uppifrån"]),

 "68f8f1a7": ([0, 1, None, 3, 4, 2], [
    "Ljusrosa sparkcykel med 12-tumshjul, flicka med hjälm på fotplattan",
    "Flicka kör den ljusrosa sparkcykeln på en stenlagd gång",
    "Faktakort: sparkcykel barn 12 tum, ljust rosa ram och svarta hjul",
    "Framhjulet i närbild: 12 tums däck på svart femekersfälg",
    "Styret i närbild med svart vadderad tvärstång och bromsvajer",
    "Måttskiss: 120 cm lång, 52 cm bred och styre 80–88 cm"]),

 "eb4418ad": ([0, 1, None, 3, 4, 2], [
    "Svart hopfällbar sparkcykel med stora PU-hjul, uppfälld och redo",
    "Barn sparkar fram på den hopfällbara sparkcykeln på en cykelbana",
    "Faktakort: hopfällbar sparkcykel 94 cm med orange stötdämpare",
    "Fotplattans ovansida i närbild med mönstertryck och bakskärm",
    "Styret i närbild med hopfällningsspärr och räfflade handtag",
    "Måttskiss: 94 cm lång, styre 88–103 cm och hopfälld 85 × 15 × 31 cm"]),
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
    # Varje råbildsindex ska finnas i produktens bildlista
    for i in ordning:
        if i is not None and i >= len(bilder[pid]):
            brister.append("%s: råbild %d finns inte (%d bilder)" % (pid, i, len(bilder[pid])))

if brister:
    for b in brister:
        print("☠️", b)
    sys.exit(1)

print("Alt-textgrind: %d texter, alla unika, inom taket, inga förbjudna ord." % len(sedda))
for pid, (o, a) in PLAN.items():
    print("  %-9s %d bilder  (kort på plats %d)" % (pid, len(o), o.index(None) + 1))
