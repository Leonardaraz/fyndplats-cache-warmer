# -*- coding: utf-8 -*-
"""Runda 142 — rundans DATA för spec-korten. Reglerna bor i `kortrunda.py`.

⚠️ RUBRIKEN MÅSTE BÄRAS AV BILD 1, och det avgörs med ögon, inte av kod.
   Varje rubrik nedan är vald mot kontaktarket `steg9-hjaltar.jpg`, där alla
   elva hjältebilder ligger bredvid varandra — kommentaren över varje rad
   säger vad man FAKTISKT ser.

☠️ Ingen rubrik nämner HOMCOM, trots att märket är tryckt på a8daef42:s säck
   och syns i bild 1. Leonards regel: sitter märket fysiskt på varan rör vi
   inte bilden — men ordet får aldrig nå namn, titel, meta, slug eller kort.

☠️ Ingen rubrik lovar FYLLNING. Nio av elva har en fot som ska fyllas, och
   sanden följer inte med; en kortrubrik har lika lite plats för brasklappen
   som en alt-text.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grind as GR                                               # noqa: E402
import kortrunda as KR                                           # noqa: E402
import texter as T                                               # noqa: E402
import spec as S                                                 # noqa: E402

# ☠️ Spec-tabellen LÄSES ur brödtextens HTML (`spec.py`) — kortet och sidan
#    kan alltså inte bära olika tal. `kortrunda.kor` vill ha den på `T`.
T.SPEC = S.SPEC

# pid -> (kicker, rubrik)
KORT = {
    # Bild 1: handskarna ligger UPPACKADE bredvid stället, inte på det.
    "56cca82a": ("Punchingboll 125–145 cm",
                 "Boxhandskarna ligger bredvid stället"),
    # Bild 1: helsvart boll på en blank teleskopstång med synliga skarvar.
    # Rundans enda helsvarta boll.
    "ce8813ce": ("Punchingboll 133–151 cm, svart",
                 "Svart boll på blank teleskopstång"),
    # Bild 1: den röda viktsäcken ligger som en ring runt foten. Omöjlig
    # att missa, och det enda som skiljer den från 56cca82a.
    "93073695": ("Punchingboll med viktsäck",
                 "Viktsäcken ligger som en ring runt foten"),
    # Bild 1: handskarna HÄNGER på stången under bollen.
    "4fe5959f": ("Punchingboll 136–154 cm",
                 "Boxhandskarna hänger på stången"),
    # Bild 1: bollen är tvåfärgad — röd på ena halvan, blå på den andra.
    # ☠️ Spec-blocket sa "röd och svart"; zoomen och hjältebilden säger
    #    annat, och bilden vinner om en SYNLIG egenskap (grind förbud 4).
    # ☠️ Rubriken stod först "Bollen är röd och blå" — det man SER i bild 1.
    #    På kontaktarket låg den tre millimeter över sin egen Färg-rad, som
    #    säger "vit, röd och blå". Kortet motsade alltså sig självt i samma
    #    ögonkast. Vitt finns på den panel som är vänd bort, och TVÅ källor
    #    säger det (spec-blocket och zoomen), så rubriken tar med det.
    "136a4671": ("Punchingboll 147–165 cm",
                 "Bollen är röd, vit och blå"),
    # Bild 1: fjäderspiralen sitter blottad mitt på stången.
    "2730de6f": ("Punchingboll 145–180 cm, svart",
                 "Fjädern sitter blottad mitt på stången"),
    # Bild 1: den vadderade armen sticker rakt ut åt sidan, i midjehöjd.
    "2a13cbbe": ("Punchingboll med reflexstång",
                 "Armen sticker rakt ut åt sidan"),
    # Bild 1: en hög cylinder på en PLATT fot — ingen fyllbar kagge, utan
    # en låg krans av sugproppar.
    "95f6280b": ("Boxningssäck 135 cm, förfylld",
                 "Låg fot med en krans av sugproppar"),
    # Bild 1: tre ytor på samma pelare — röd säck, arm åt sidan, boll överst.
    "c8f6b93f": ("Boxningssäck 155–205 cm, röd",
                 "Säck, arm och boll på samma pelare"),
    # Bild 1: samma tre ytor, svart säck.
    "a8daef42": ("Boxningssäck 155–205 cm, svart",
                 "Säck, arm och boll på samma pelare"),
    # Bild 1: fyra saker på pelaren — säck, boll överst, rak arm åt sidan
    # och en andra boll på en BÖJD arm.
    "f0430bc5": ("Boxningsstation 160–230 cm",
                 "Fyra träffytor på en pelare"),
}

# Fem rader per kort, alla HÄRLEDDA ur spec-tabellen.
# ☠️ KORTETIKETTENS FÖRSTA ORD MÅSTE FINNAS I SPEC-ETIKETTEN (`kortbygge.varde`).
RADER = {
    "56cca82a": ["Höjd", "Fot", "Boll", ("Fotens fyllning", "Fotens fyllning"),
                 "Vikt"],
    "ce8813ce": ["Höjd", "Fot", "Boll", ("Fotens fyllning", "Fotens fyllning"),
                 ("Fäste mot golvet", "Fäste mot golvet")],
    "93073695": ["Höjd", "Fot", "Boll", "Viktsäck",
                 ("Fotens fyllning", "Fotens fyllning")],
    "4fe5959f": ["Höjd", "Fot", "Boll", ("Fotens fyllning", "Fotens fyllning"),
                 ("Fäste mot golvet", "Fäste mot golvet")],
    "136a4671": ["Höjd", "Fot", "Boll", ("Fotens fyllning", "Fotens fyllning"),
                 "Färg"],
    "2730de6f": ["Höjd", "Fot", "Boll", "Stång",
                 ("Fotens fyllning", "Fotens fyllning")],
    "2a13cbbe": ["Höjd", ("Mått utfällt", "Mått utfällt"), "Fot", "Reflexstång",
                 ("Fäste mot golvet", "Fäste mot golvet")],
    "95f6280b": ["Höjd", "Säck", "Fot", "Fyllning", "Dämpning"],
    # ☠️ `Färg` är MED på båda syskonen med flit: utan den blir de två korten
    #    radidentiska, och det enda som skiljer sidorna åt är just färgen.
    "c8f6b93f": ["Höjd", "Säck", ("Roterande arm", "Roterande arm"),
                 ("Fotens fyllning", "Fotens fyllning"), "Färg"],
    "a8daef42": ["Höjd", "Säck", ("Roterande arm", "Roterande arm"),
                 ("Fotens fyllning", "Fotens fyllning"), "Färg"],
    "f0430bc5": ["Höjd", "Säck", ("Övre boll", "Övre boll"), "Reflexstång",
                 ("Fotens fyllning", "Fotens fyllning")],
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `bilder.json`, aldrig avskriven.
GALLERI = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
FILER = {pid: GALLERI[pid][0] for pid in KORT}

MJUKA = {}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET, mjuka=MJUKA)
