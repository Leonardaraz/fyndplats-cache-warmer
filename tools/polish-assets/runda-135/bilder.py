# -*- coding: utf-8 -*-
"""Runda 135 Steg 9 — galleriets ordning och alt-texterna.

Läst ur skarpa Wix 2026-09-12: alla åtta har fem bilder och SAMMA tyska
alt-text på alla fem ("Kratzbaum mit 2 Etagen, …"). Ordningen nedan är därför
den råa importens, och den är underlaget — inte en gissning.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA. `grind.py` läser `html`,
   `namn`, `titel` och `meta` ur `texter.py`; alt-texten finns inte där och
   skrivs rakt in i Wix media. Runda 106 mätte vad det kostar: sex sidor vars
   brödtext säger att hagen inte säljs som kaninbostad, grind grön på alla
   sex, och "kaniner" i fem alt-texter. `altfel()` kör därför rundans EGNA
   listor — samma `FORBJUDET`, samma `SVENSKAN`, samma talgrind, inte
   omskrivna varianter.

⚠️ ALT-TEXTEN BESKRIVER VARAN, INTE STAJLINGEN. Sex av de åtta miljöbilderna
   har en katt i sig, och katten är ingen produktuppgift. Varje detalj om
   varan är kvar; djuren är utelämnade.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
sys.path.insert(0, os.path.join(HAR, ".."))
import grind as GR                                               # noqa: E402
import grindar as G                                              # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402

PRODUKTER = ["0696efce", "7564dcfb", "5d64f423", "82efeeaf",
             "bdc7e768", "e2c8b0f3", "cc5da788", "741c5723"]

# Galleriet som det LIGGER, i ordning. Läst ur skarpa Wix, inte avskrivet.
GALLERI = {
    "0696efce": ["b379ce_e75f84136b0b47a680db2928a53237be~mv2.jpg",
                 "b379ce_8717f5f2ecd5424eabba8aabb2edb6ec~mv2.jpg",
                 "b379ce_2859681a018247009df46909020c5578~mv2.jpg",
                 "b379ce_66836bf5b40a47b09985084d0c798837~mv2.jpg",
                 "b379ce_1075b731e95b427ea6d234ca73952622~mv2.jpg"],
    "7564dcfb": ["b379ce_75e3fc44354d419abe9205345190ddb9~mv2.jpg",
                 "b379ce_a6fa16c7f6334f7c9c106ce11bcc6f6b~mv2.jpg",
                 "b379ce_358c04fa602e4de5b36826eaa4b1c213~mv2.jpg",
                 "b379ce_088dc931a0764102a437b61cb78c33b3~mv2.jpg",
                 "b379ce_00e440b136e6466bb155ba2168c4a66e~mv2.jpg"],
    "5d64f423": ["b379ce_3f54fa80039843e6991cd225788a6a3a~mv2.jpg",
                 "b379ce_c96000daafe44a2c9714d6d2bc8015ac~mv2.jpg",
                 "b379ce_c1b334ad3a0f45b8b24732047cd7a30b~mv2.jpg",
                 "b379ce_9b38eb7875c146119151b8d082f5c33c~mv2.jpg",
                 "b379ce_988d7868bc6a431ca890bca4ec7cd9f4~mv2.jpg"],
    "82efeeaf": ["b379ce_d4ec0c03f6c34597ae9cd4c151f45eab~mv2.jpg",
                 "b379ce_c3fdb5a0c97140e085558d8116161400~mv2.jpg",
                 "b379ce_4a27602629e54616867c5525a4d1cf0f~mv2.jpg",
                 "b379ce_3a613c683f164554991244320cfb7adb~mv2.jpg",
                 "b379ce_a8d12985d91f4924abe18928bebb5ee8~mv2.jpg"],
    "bdc7e768": ["b379ce_f0df97a04f9d41d88df463a28f5d24ce~mv2.jpg",
                 "b379ce_2b18b60bb914484f81a412c966565505~mv2.jpg",
                 "b379ce_be4d01a63def44a59f0431ccd9bebef9~mv2.jpg",
                 "b379ce_11cbb274b3c64e9b98f5e365fa26f072~mv2.jpg",
                 "b379ce_e0ad186c52be418e80dfaf34de040611~mv2.jpg"],
    "e2c8b0f3": ["b379ce_878baffa654741dcaa865a4eba2409e1~mv2.jpg",
                 "b379ce_7f6d54231ed54f40bacc285964c685d7~mv2.jpg",
                 "b379ce_d05fd2b388c445b89f1dc196ca07d2f4~mv2.jpg",
                 "b379ce_cb648ad9e9b147a8bd8f9cf46f82a385~mv2.jpg",
                 "b379ce_d35bb1a0e8fb4ce998a69a6d4a78457b~mv2.jpg"],
    "cc5da788": ["b379ce_e67f15727bf64eb39c2e8fc6c0b7d41b~mv2.jpg",
                 "b379ce_d741f7e7b2e3441c96109df913c30290~mv2.jpg",
                 "b379ce_2b128f3f38824dfe9c0b1e8d30f5f504~mv2.jpg",
                 "b379ce_c351d5b5fe5f4c80a169ca6e5d2c73ee~mv2.jpg",
                 "b379ce_c624f1ace5dd440494faf6d07ce51b63~mv2.jpg"],
    "741c5723": ["b379ce_7445cde5d6a3451a9336b78c27ab7ae6~mv2.jpg",
                 "b379ce_121ad4a30f1743eca719c35682c7f4b3~mv2.jpg",
                 "b379ce_588ef9b93bcc43458c4d2c91dc5d97e6~mv2.jpg",
                 "b379ce_27da599b46934d9bb0b26bc92acc84e8~mv2.jpg",
                 "b379ce_0969c250207f48cd9b25e85a1f7c8ca9~mv2.jpg"],
}

# ☠️ Bild 2 på `cc5da788` bär en PAPPERSKASSE med läsbar fransk
#    marknadsföringstext och ett främmande varumärke över en tredjedel av
#    bilden (Steg 4). Den är rekvisita, alltså bakgrund, och FÅR röras — men
#    att måla bort ett stort föremål ur förgrunden är ommålning, inte den
#    bakgrundstvätt `bildmetoder.md` beskriver. Plocka bort, inte laga.
BORT = {"cc5da788": [2]}

# ORDNINGEN ÄR RUNBOKENS: 1 hjälte, 2 verklighet, 3 eget kort, sist måttritning.
# Talen är POSITIONER I `GALLERI`; "kort" är rundans eget Faktakort.
#
# ⚠️ `cc5da788` SAKNAR MILJÖBILD efter strykningen. Runbokens svar är att
#    sätta näst renaste produktbilden på plats 2 och NOTERA avsaknaden —
#    aldrig att bygga ett kort som ersättning. Bild 4 visar konstruktionen
#    under hyddan och är det närmaste en andra helhetsvy som finns kvar.
ORDNING = {
    "0696efce": [1, 2, "kort", 4, 5, 3],
    "7564dcfb": [1, 2, "kort", 4, 5, 3],
    "5d64f423": [1, 2, "kort", 4, 5, 3],
    "82efeeaf": [1, 2, "kort", 4, 5, 3],
    "bdc7e768": [1, 2, "kort", 4, 5, 3],
    "e2c8b0f3": [1, 2, "kort", 4, 5, 3],
    "cc5da788": [1, 4, "kort", 5, 3],
    "741c5723": [1, 2, "kort", 4, 5, 3],
}

# ☠️ NYCKELN ÄR ORIGINALPOSITIONEN, inte den nya platsen — annars hade en
#    omflyttning tyst gett en bild grannens text.
ALT = {
 "0696efce": {
  1: "Klöspelare 87 cm i sisal, med en topplatta i trä överst, en boll "
     "hängande i snöre och en sockel med bollbana",
  2: "Klöspelaren står mot en grön vägg i ett vardagsrum, med sisalstammen i "
     "full höjd och bollen hängande från topplattan",
  3: "Måttritning över klöspelaren: sockel 39,5 × 39,5 cm, total höjd 87 cm "
     "och en topplatta på 20 × 20 cm",
  4: "Närbild på träkulan i sockelns bana, innesluten mellan två skivor i ljus ek",
  5: "Närbild på sisalens grova väv på klöspelarens stam, gräddvit mot det "
     "ljusa träet",
  "kort": "Faktakort: klöspelare 39,5 × 39,5 × 87 cm, topplatta 20 × 20 cm "
          "och bollbana i sockeln",
 },
 "7564dcfb": {
  1: "Klöspelare 87 cm med en rund bädd i långluggad plysch överst och en "
     "tjock sisalstam ned till en plyschklädd sockel",
  2: "Klöspelaren står i ett vardagsrum bredvid en soffa, med bädden högre "
     "än soffans armstöd",
  3: "Måttritning över klöspelaren: bädd Ø41 cm och 12 cm hög, total höjd "
     "87 cm och en sockel på 45 × 45 cm",
  4: "Närbild på bäddens långluggade plysch i brungrå melering, med den "
     "uppvikta kanten runt liggytan",
  5: "Närbild på plyschluggen i bädden, där de långa stråna lägger sig i "
     "lager mot varandra",
  "kort": "Faktakort: klöspelare 45 × 45 × 87 cm, bädd Ø41 cm och en stam på "
          "Ø14 cm klädd i sisal",
 },
 "5d64f423": {
  1: "Lågt klösträd i trä och jute, med en stor rund plyschbädd på den höga "
     "stolpen och en mindre hoppyta på den korta",
  2: "Klösträdet står på en rund matta framför en ljus vägg, med båda "
     "plyschytorna vända ut i rummet och en pompong hängande i snöre",
  3: "Måttritning över klösträdet: bädd Ø40 cm, hoppyta Ø30 cm, sockel "
     "50 × 47 cm och en total höjd på 61,5 cm",
  4: "Närbild på den stora bädden i gräddvit plysch, med uppvikt kant och "
     "jutelindningen på stolpen under",
  5: "Klösträdets två plyschytor sedda snett uppifrån, med den lägre "
     "hoppytan ett steg under bädden",
  "kort": "Faktakort: lågt klösträd 50 × 47 × 61,5 cm, bädd Ø40 cm och "
          "hoppyta Ø30 cm",
 },
 "82efeeaf": {
  1: "Klösträd 86 cm med en rektangulär bädd överst, en rund mellanplatå och "
     "klösklot i jute staplade på stammen",
  2: "Klösträdet står på en rund matta vid en byrå, med bädden överst och "
     "sisalklädda stammar ned mot sockeln",
  3: "Måttritning över klösträdet: 56 × 54 × 86 cm, bädd 54 × 36 cm och en "
     "mellanplatå på 40 × 37 cm",
  4: "Närbild på sockeln i ljusbrun plysch, där en sisalklädd stam är infäst "
     "genom skivan",
  5: "Närbild på bäddens uppvikta kant i ljusbrun plysch, med den mjuka "
     "liggytan innanför",
  "kort": "Faktakort: klösträd 56 × 54 × 86 cm, bädd 54 × 36 cm och klösklot "
          "på Ø11 cm i jute",
 },
 "bdc7e768": {
  1: "Klösträd 98 cm format som ett får, med en liggtunnel i gräddvit plysch, "
     "fyra jutelindade klösstolpar och ett svart huvud",
  2: "Klösträdet i fårdesign står på en rund matta mot en grön vägg, med "
     "svansen i en båge ut från tunnelns bakre ände",
  3: "Måttritning över klösträdet i fårdesign: 48 × 34 × 98 cm, med en "
     "liggtunnel på Ø26 cm som är 40 cm lång",
  4: "Närbild på svansleksaken: en svart böjd svans med en gräddvit pompong "
     "hängande i ett snöre",
  5: "Närbild på en klösstolpe där jutelindningen växlar med gräddvit plysch, "
     "under fårets svarta öra",
  "kort": "Faktakort: klösträd i fårdesign 48 × 34 × 98 cm, liggtunnel Ø26 cm "
          "och fyra klösstolpar",
 },
 "e2c8b0f3": {
  1: "Klösträd 98 cm med en grön hydda nederst, en oval bädd i beige ovanför "
     "och en krona av blad högst upp",
  2: "Klösträdet står på en rund matta vid en byrå, med bladkronan ovanför "
     "bädden och hyddans valvformade ingång vänd ut i rummet",
  3: "Måttritning över klösträdet: 44 × 30 × 98 cm, hydda 30 × 30 cm och en "
     "oval bädd på 40 × 30 cm",
  4: "Närbild på den ovala bädden i beige teddysammet, med uppvikt kant och "
     "en jutelindad stam bakom",
  5: "Närbild på hyddans gröna teddysammet och den valvformade ingången, med "
     "en grön pompong hängande i snöre",
  "kort": "Faktakort: klösträd 44 × 30 × 98 cm, hydda 30 × 30 cm med ingång "
          "19 × 21 cm och oval bädd",
 },
 "cc5da788": {
  1: "Klösträd 100 cm med en flätad kupolhydda av kaveldun upplyft på två "
     "sisalstammar, och en mellanplatå i plysch under",
  3: "Måttritning över klösträdet: 48 × 40 × 100 cm, kupolhydda Ø40 cm och "
     "38 cm hög, och en mellanplatå på 40 × 24 cm",
  4: "Klösträdets mellanplatå i plysch sedd underifrån, buren mellan två "
     "sisalklädda stammar",
  5: "Närbild på en sisalstam med plyschkrage, och en beige pompong hängande "
     "i ett snöre bredvid",
  "kort": "Faktakort: klösträd 48 × 40 × 100 cm, kupolhydda Ø40 cm med "
          "öppning 32 × 32 cm",
 },
 "741c5723": {
  1: "Klösträd 132 cm i fyra plan, med bädd överst, ett mörkgrått filthus, "
     "klösmatta längs sidan och en borstpelare vid sockeln",
  2: "Klösträdet står mot en grön vägg, med filthusets valvformade ingång i "
     "mitten och klösmattan på stammen under",
  3: "Måttritning över klösträdet: 55 × 44 × 132 cm, filthus 33,5 × 30 cm "
     "och en klösmatta på 16 × 43 cm",
  4: "Närbild på huset i mörkgrå filt, med valvformad ingång och bädden "
     "vilande ovanpå taket",
  5: "Närbild på bäddens ljusgrå plyschkant, uppvikt hela vägen runt "
     "liggytan",
  "kort": "Faktakort: klösträd 55 × 44 × 132 cm, filthus 33,5 × 30 cm och "
          "borstpelare på Ø10 cm",
 },
}


def altfel():
    """Rundans EGNA grindar, körda mot alt-texterna. Se modulens huvud."""
    fel = []
    for pid in PRODUKTER:
        tillatna = M.FACIT[pid]["tal"]
        huvudord, forbjudet_ord = M.TYP[pid]
        for nyckel in ORDNING[pid]:
            text = ALT[pid].get(nyckel)
            namn = "%s bild %s" % (pid, nyckel)
            if not text:
                fel.append("%s: SAKNAR alt-text" % namn)
                continue
            # ☠️ Ett item UTAN altText blir ett item utan alt-text, även om
            #    det hade en. Tunna texter får aldrig nå skrivningen.
            if len(text) < 40:
                fel.append("%s: alt-texten är %d tecken — för tunn"
                           % (namn, len(text)))
            for monster, skal in GR.FORBJUDET + GR.SVENSKAN:
                if monster.search(text):
                    fel.append("%s: %s — %r" % (namn, skal, text[:80]))
            # ☠️ Den här grinden finns för att DEN HÄR FILEN bar `inneslL`
            #    och alla andra var gröna. Se grindar.versalfel().
            for ord_, sammanhang in G.versalfel(text):
                fel.append("%s: VERSAL MITT I ORD %r — %r"
                           % (namn, ord_, sammanhang))
            # Talgrinden: varje tal måste stå i produktens facit.
            for m in GR.TAL.finditer(text):
                v = float(m.group(1).replace(",", "."))
                if v in GR.TAL_UNDANTAG or v in tillatna:
                    continue
                fel.append("%s: OHÄRLETT TAL %s — %r" % (namn, m.group(1), text[:80]))
            # ☠️ Produkttypen gäller även här. En klöspelare får inte kallas
            #    klösträd i alt-texten bara för att fältet är ett annat.
            if GR._vikt(forbjudet_ord).search(text):
                fel.append("%s: FEL PRODUKTTYP %r — %r"
                           % (namn, forbjudet_ord, text[:80]))
            if nyckel == "kort" and not text.startswith("Faktakort: "):
                fel.append("%s: kortets alt-text börjar inte med 'Faktakort: '"
                           % namn)
        # ☠️ Kortet får ALDRIG ligga på plats 1 — det är hjältebildens plats,
        #    och kortet blir annars produktkortet i butiken.
        if ORDNING[pid][0] == "kort":
            fel.append("%s: Faktakortet ligger på plats 1" % pid)
        if "kort" not in ORDNING[pid]:
            fel.append("%s: inget Faktakort i galleriet" % pid)
    return fel


if __name__ == "__main__":
    f = altfel()
    for x in f:
        print("☠️", x)
    print("%d produkter, %d bilder, %d fel"
          % (len(PRODUKTER), sum(len(ORDNING[p]) for p in PRODUKTER), len(f)))
    sys.exit(1 if f else 0)
