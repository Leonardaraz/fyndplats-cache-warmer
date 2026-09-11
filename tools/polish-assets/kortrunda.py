# -*- coding: utf-8 -*-
"""Det RUNDAGENERISKA i ett kortbygge — en runda skriver bara KORT och RADER.

☠️ SKÄLET ÄR HUSETS VANLIGASTE BUGG. Runda 120:s `kort.py` bar `specrader`,
   `kontroll` och hela `__main__`-blocket; runda 128 ärvde en kopia. Sju
   rundor till hade blivit sju kopior, och runda 104-106 visar redan vad det
   kostar: de ärvde en mall UTAN copy-raden till `kort/` och laddade upp sex
   kort från adresser som svarade 404.

   Reglerna bor därför här, och en runda är en datafil. Samma skäl som
   `SHIP_AXIS_RE`, `EU_TULL_CODES` och `mapWithConcurrency`.

⚠️ Det som INTE går att flytta hit är rubriken och radvalet. Rubriken måste
   bäras av FOTOT, och det avgörs med ögon mot bild 1 — inte av kod.
"""
import json
import os
import subprocess
import urllib.request

from PIL import Image, ImageDraw

import grindar as G
import kortbygge as KB

HJALTE = ("https://static.wixstatic.com/media/%s"
          "/v1/fill/w_1600,h_1600,al_c,q_90/f.jpg")


def specrad(SPEC, pid, etikett):
    """Radens värde ORDAGRANT ur spec-tabellen — kortet får ingen andra sanning.

    ☠️ KASTAR hellre än gissar. En etikett som inte finns i tabellen är ett
       stavfel i RADER, och ett tyst `None` hade renderats som strängen "None"
       och sett ut som en produktuppgift.
    """
    for e, v in SPEC[pid]:
        if e == etikett:
            return f"{e}: {v}"
    raise KeyError(f"{pid} saknar spec-raden {etikett!r} — "
                   f"finns: {[e for e, _ in SPEC[pid]]}")


def hamta_hjaltar(har, filer, storlek=1600):
    """Bild 1 per produkt, i den storlek kortet faktiskt använder.

    ⚠️ HÄMTA I 1600, INTE I MINIATYR. Ett första försök tog w_640 och korten
       byggdes på en uppförstorad bild — den ser skarp ut i ett kontaktark och
       grötig i full storlek på kundens skärm.
    """
    # ☠️ EGEN MAPP, INTE `rawbilder/`. Rundornas `rawbilder/` bär Steg 4:s
    #    granskningsbilder, och runda 121:s ligger i 760 px. Ett återanvänt
    #    namn hade antingen byggt kortet på en uppförstorad bild eller skrivit
    #    över Steg 4:s underlag — och då ljuger bildgranskningens spår.
    #    `kortbygge` varnar för exakt det: en förbehandlad bild i `rawbilder/`
    #    gör att mappen ljuger om vad den innehåller.
    mapp = os.path.join(har, "kortfoto")
    os.makedirs(mapp, exist_ok=True)
    ut = {}
    for pid, fil in filer.items():
        vag = os.path.join(mapp, f"{pid}-1.jpg")
        if not os.path.exists(vag):
            r = urllib.request.Request(HJALTE % fil,
                                       headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(r, timeout=120) as s:
                open(vag, "wb").write(s.read())
        b = Image.open(vag)
        if min(b.size) < storlek:
            raise SystemExit(f"{pid}: hjältebilden är {b.size}, för liten för "
                             f"ett {storlek}-kort")
        ut[pid] = vag
    return ut


def kontroll(SPEC, KORT, RADER, produkter, forbjudet=()):
    """Fäller FÖRE bygget — ett kort som är fel har redan laddats upp efteråt."""
    fel, sedda, kickers = [], {}, {}
    for pid in produkter:
        try:
            rader = [specrad(SPEC, pid, e) for e in RADER[pid]]
        except KeyError as e:
            fel.append(str(e))
            continue
        kicker, rubrik = KORT[pid]
        text = " ".join(rader)
        if len(rader) != 5:
            fel.append(f"{pid}: kortet har {len(rader)} rader, ska ha 5")
        if "None" in text:
            fel.append(f"{pid}: kortet bär ett OVERIFIERAT fält — {text}")
        # ⚠️ Etiketten heter inte "Mått" i alla rundor — runda 121 skriver
        #    "Yttermått". Kravet är produktens EGET yttermått, och `Paketmått`
        #    duger uttryckligen inte: det är kartongen, inte varan.
        if not any(e.endswith("mått") and e != "Paketmått" for e in RADER[pid]):
            fel.append(f"{pid}: kortet saknar måttraden — har {RADER[pid]}")
        # ☠️ Två IDENTISKA kort hjälper ingen att skilja två sidor åt, och
        #    färgsyskon gör risken konkret: samma mått, vikt och last.
        nyckel = (kicker, rubrik, tuple(rader))
        if nyckel in sedda:
            fel.append(f"{pid} och {sedda[nyckel]} får IDENTISKA kort")
        sedda[nyckel] = pid
        if kicker in kickers:
            fel.append(f"{pid} och {kickers[kicker]} delar kicker {kicker!r}")
        kickers[kicker] = pid
        # Kortets EGEN text går genom samma grindar som brödtexten. Runda 90
        # och 91 skrev fel färg två rundor i rad, båda gångerna i rubriken.
        kortext = f"{kicker} {rubrik}"
        # ⚠️ Rundorna bär sina grindar i TVÅ former: runda 121 som
        #    (regex, etikett), andra som naken regex. Att kräva den ena hade
        #    tvingat varje runda att forma om sin lista — alltså en tvilling
        #    till listan som redan finns i grind.py.
        for m in forbjudet:
            monster, etikett = m if isinstance(m, tuple) else (m, m.pattern)
            if monster.search(kortext):
                fel.append(f"{pid}: kortrubriken fälls av {etikett}")
        if G.ARTNR.search(kortext) or G.ARTNR.search(text):
            fel.append(f"{pid}: ARTIKELNUMMER i kortet")
        for c, n, s in G.homoglyfer(kortext):
            fel.append(f"{pid}: HOMOGLYF {c} ({n}) i kortrubriken — …{s}…")
    return fel


def bygg(har, SPEC, KORT, RADER, produkter, foton, mjuka=None):
    """Bygger, skriver `kort-facit.json` och kopierar till spårade `kort/`."""
    os.chdir(har)
    prod = [{"kort": p, "spec": [specrad(SPEC, p, e) for e in RADER[p]]}
            for p in produkter]
    kortdata = {p: (KORT[p][0], KORT[p][1],
                    [(e, i) for i, e in enumerate(RADER[p])]) for p in produkter}
    namn, facit = KB.bygg(har, prod, kortdata, mjuka=mjuka, foton=foton)
    json.dump(facit, open(os.path.join(har, "kort-facit.json"), "w"),
              ensure_ascii=False, indent=1)
    return namn, facit


def spartest(har, produkter, mall="%s_spec.jpg"):
    """Kortet måste ligga i GRENEN — se `grindar.kortfiler`."""
    return G.kortfiler(har, produkter, mall)


def kontaktark(har, produkter, SLUG, KORT, ut="kontaktark-kort.jpg",
               ruta=520, etikett=34, kolumner=3):
    """Översiktsarket. ⚠️ ERSÄTTER INTE ÖGONEN — det är det som ger dem något
    att titta på. Runbokens regel: felet syns på en sekund här och aldrig i
    ett API-svar."""
    rader = (len(produkter) + kolumner - 1) // kolumner
    ark = Image.new("RGB", (ruta * kolumner, (ruta + etikett) * rader), "white")
    rit = ImageDraw.Draw(ark)
    for i, pid in enumerate(produkter):
        x, y = (i % kolumner) * ruta, (i // kolumner) * (ruta + etikett)
        bild = Image.open(os.path.join(har, "kort", f"{pid}_spec.jpg"))
        ark.paste(bild.convert("RGB").resize((ruta, ruta), Image.LANCZOS),
                  (x, y + etikett))
        rit.text((x + 8, y + 10), f"{pid}  {SLUG[pid][:44]}", fill="black")
        rit.rectangle([x, y, x + ruta - 1, y + etikett + ruta - 1], outline="black")
    vag = os.path.join(har, ut)
    ark.save(vag, quality=90)
    return vag, ark.size


def kor(har, T, KORT, RADER, filer, forbjudet=(), mjuka=None):
    """Hela rundans kortbygge: grind → hjältebilder → bygge → kontaktark."""
    produkter = list(KORT)
    fel = kontroll(T.SPEC, KORT, RADER, produkter, forbjudet)
    print(f"kortrunda.kontroll: {len(produkter)} produkter, {len(fel)} fel")
    for f in fel:
        print("  ✗", f)
    if fel:
        raise SystemExit(1)
    foton = hamta_hjaltar(har, filer)
    namn, _ = bygg(har, T.SPEC, KORT, RADER, produkter, foton, mjuka)
    for n in namn:
        print(f"  {n}  {os.path.getsize(os.path.join(har, 'jpg', n + '.jpg')):>7} byte")
    vag, mat = kontaktark(har, produkter, T.SLUG, KORT)
    print(f"  {vag}  {mat}")
    return namn
