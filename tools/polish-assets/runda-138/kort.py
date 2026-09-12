# -*- coding: utf-8 -*-
"""Runda 138 — Faktakorten. EN DATAFIL: reglerna bor i `kortrunda.py`.

☠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT, inte av spec-tabellen. Runbokens mätning:
   sju av sextiofem kort i runda 60–61 föll för att rubriken tog ett TAL ur
   tabellen i stället för ett INTRYCK ur bilden. Varje rubrik nedan är vald
   mot BILD 1 med ögon, i ett kontaktark — och beskriver något man ser i
   samma ögonkast som man läser rubriken.

⚠️ RUNDAN ÄR SJU OLIKA MODELLER, inte färgpar. Till skillnad från runda 137
   finns alltså ingen risk att två kort blir identiska av att syskonen är
   samma möbel — men `kortrunda.kontroll` fäller ändå på delad kicker, och
   det är kontrollen som gäller.

☠️ SEX AV SJU NÅR TAKET, EN GÖR DET INTE. `1366a476` är 200 cm, fristående
   med tippskyddslina; de sex andra spänns mot taket. Dess kicker bär därför
   en fast höjd där de andra bär ett spann — skillnaden är hela poängen med
   sidan och ska synas på kortet.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import kortrunda as KR                                           # noqa: E402
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

KORT = {
    # Bild 1: fyra stolpar bär tornet, och de två hålorna sitter rakt ovanför
    # varandra — den nedre kvadratisk, den mellersta med välvd öppning.
    "1366a476": ("Klösträd 200 cm, beige", "Två hålor ovanpå varandra"),
    # Bild 1: stammen är formad som en kaktus, med utstickande armar.
    "839a2ef5": ("Klösträd 230–275 cm, grönt", "Format som en kaktus"),
    # Bild 1: TVÅ separata stolpar går upp till var sin takplatta.
    "68bc6c0c": ("Klösträd 225–255 cm, vitt och grått", "Två stolpar mot taket"),
    # Bild 1: bottenplattan är en rund skiva, inte en rektangel.
    "e5b31270": ("Klösträd 225–255 cm, grått", "Rund bottenplatta"),
    # Bild 1: en stege lutar upp mot husets runda öppning.
    "fecadb3e": ("Klösträd 240–260 cm, träfärgat", "Stege upp till huset"),
    # Bild 1: en enda stam, två små liggytor, ingenting annat.
    "505a0dde": ("Klöspelare 220–260 cm, gult", "En enda stam, två liggytor"),
    # Bild 1: tunneln hänger under en liten hylla till HÖGER om den nedre
    # hålan, i ungefär samma höjd som den — inte under hålan.
    # ☠️ FÖRSTA RUBRIKEN SA "under den nedre hålan" OCH VAR FEL OM LÄGET.
    #    Kontaktarket fällde den, precis som runbooken säger att det ska: en
    #    rubrik är ett BILDLÖFTE, och ett läge man inte ser stämma är en liten
    #    lögn på en sida vi själva skrivit. Den gick inte att fånga i en
    #    textgrind — inget ord är förbjudet, det är RELATIONEN som är fel.
    # ⚠️ Tunneln står INTE i leverantörens Technische Daten — den är en
    #    BILDIAKTTAGELSE, bekräftad på både utkastet och den publicerade
    #    mörkgrå syskonsidan (Steg 1). Den hör därför hemma i RUBRIKEN, som
    #    beskriver fotot, och inte i RADERNA, som citerar spec-tabellen.
    "7bdc47b8": ("Klösträd 240–260 cm, ljusgrått", "Tunnel bredvid den nedre hålan"),
}

# Fem rader per kort, alla HÄRLEDDA ur `texter.SPEC` — kortet skriver aldrig
# ett eget värde.
# ☠️ KORTETIKETTENS FÖRSTA ORD MÅSTE FINNAS I SPEC-ETIKETTEN — `kortbygge.varde`
#    kräver det, och det är den kopplingen som hindrar att en rad får grannens
#    värde.
RADER = {
    "1366a476": ["Mått", "Nedre håla", ("Mellersta hålan", "Mellersta hålan"),
                 "Hängmatta", "Bärförmåga"],
    "839a2ef5": ["Mått", "Katthus", ("Husets öppning", "Öppning"),
                 "Hängmatta", "Bärförmåga"],
    "68bc6c0c": ["Mått", "Bas", "Rund hängmatta", "Hängmatta i tyg", "Bärförmåga"],
    "e5b31270": ["Mått", "Katthus", ("Husets öppning", "Öppning"),
                 "Hängmatta", "Klösstammar"],
    "fecadb3e": ["Mått", "Katthus", "Stege", "Hängmatta", "Klösstam"],
    "505a0dde": ["Mått", "Bas", "Liggytor", "Klösstam",
                 ("Rekommenderad kattvikt", "Rekommenderad vikt")],
    "7bdc47b8": ["Mått", "Katthåla", ("Hålans öppning", "Öppning"),
                 "Bärförmåga", ("Rekommenderad kattvikt", "Rekommenderad vikt")],
}

# ☠️ Bild 1 per produkt HÄRLEDS ur `galleri.json`, aldrig avskriven.
GALLERI = json.load(open(os.path.join(HAR, "galleri.json"), encoding="utf-8"))
FILER = {pid: GALLERI[pid][0] for pid in KORT}

MJUKA = {}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER, forbjudet=GR.FORBJUDET, mjuka=MJUKA)
