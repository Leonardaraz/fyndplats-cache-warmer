# -*- coding: utf-8 -*-
"""Runda 137 Steg 9 — galleriets ordning och alt-texterna.

Läst ur skarpa Wix: alla åtta har fem bilder och SAMMA tyska alt-text på alla
fem. Ordningen nedan är den råa importens (`galleri.json`), och den är
underlaget — inte en gissning.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA. `grind.granska` läser `html`,
   `namn`, `titel` och `meta` ur `texter.py`; alt-texten finns inte där och
   skrivs rakt in i Wix media. `altfel()` kör därför rundans EGNA listor —
   samma `FORBJUDET`, samma talgrind, samma typordslista, samma ARTNR.

⚠️ ALT-TEXTEN BESKRIVER VARAN, INTE STAJLINGEN. Sju av de åtta miljöbilderna
   har en katt i sig, och katten är ingen produktuppgift. Den enda gången ett
   djur nämns nedan är där det är det MOTIVET säger — och det gör den inte
   någonstans i den här rundan.

☠️ OCH SILUETTEN ÄR OCKSÅ STAJLING. Fem av måttritningarna bär en människa på
   180 cm som skalreferens. Talet är AVLÄST ur bilden och ändå fel att skriva:
   det är inget mått på varan, och i facit hade det öppnat 180 för brödtexten
   också. Rundans egen talgrind fällde alla fem — den grinden gäller alltså
   alt-texten, precis som runda 106:s kaninlöfte visade att den måste.

☠️ INGA STRYKNINGAR I DEN HÄR RUNDAN. Steg 4 granskade alla fyrtio bilderna:
   noll tysk text i pixlarna, noll leverantörslogotyp, noll artikelnummer.
   Måttritningarnas etiketter är rena tal med `cm`.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
sys.path.insert(0, os.path.join(HAR, ".."))
import grind as GR                                               # noqa: E402
import grindar as G                                              # noqa: E402
import matt as M                                                 # noqa: E402

PRODUKTER = ["c7bd00b9", "a73a1a1c", "f5f71f5d", "dd3b541b",
             "f489937f", "5616c567", "1ae60dbc", "819bf51c"]

# ☠️ GALLERIET LÄSES UR FIL, ALDRIG AVSKRIVET. `galleri.json` skrevs av Steg 4:s
#    hämtning direkt ur Wix och stämmer mot återläsningen i Steg 8.
GALLERI = json.load(open(os.path.join(HAR, "galleri.json"), encoding="utf-8"))

BORT = {}          # se modulhuvudet — inget att stryka
BESKURNA = {}      # och därmed inget att beskära

# Fil-id i Wix Media Manager för Faktakorten, efter uppladdning ur grenen.
# ☠️ ATTRIBUTIONEN BEVISAS PÅ md5, inte på ordningen i uppladdningssvaret.
KORTFIL = {
    "c7bd00b9": "b379ce_d9760a82504248a1b17dd607dc1faee2~mv2.jpg",
    "a73a1a1c": "b379ce_3011faec44334594a0d8013ed68d9ee0~mv2.jpg",
    "f5f71f5d": "b379ce_bc7db11524b74a2f8c029926c096051c~mv2.jpg",
    "dd3b541b": "b379ce_7770f798f76248a386b6f2c0c0151748~mv2.jpg",
    "f489937f": "b379ce_3f9551362d2044179053fbc412231cdb~mv2.jpg",
    "5616c567": "b379ce_437d1aa647c945619f9edee541ce2a2e~mv2.jpg",
    "1ae60dbc": "b379ce_a4c20e499b114a05b66dd4a6dfd02ff3~mv2.jpg",
    "819bf51c": "b379ce_f14d2271515a4d1d96b2c51846a80edb~mv2.jpg",
}


def filid(pid, nyckel):
    if nyckel == "kort":
        return KORTFIL[pid]
    return GALLERI[pid][nyckel - 1]


# ORDNINGEN ÄR RUNBOKENS: 1 hjälte, 2 verklighet, 3 eget kort, sist måttritning.
# Talen är POSITIONER I `GALLERI`; "kort" är rundans eget Faktakort.
#
# ⚠️ Råimporten lägger måttritningen på plats 3 på ALLA ÅTTA (uppgift #371),
#    alltså mellan verklighetsbilden och detaljerna. Den flyttas sist.
ORDNING = {pid: [1, 2, "kort", 4, 5, 3] for pid in PRODUKTER}

# ☠️ NYCKELN ÄR ORIGINALPOSITIONEN, inte den nya platsen — annars hade en
#    omflyttning tyst gett en bild grannens text.
ALT = {
 "c7bd00b9": {
  1: "Takspänt klösträd i ek och cremevitt, med tre runda plan och en "
     "hängmatta längs en sisalklädd stolpe på en fyrkantig träfot",
  2: "Klösträdet står mellan golv och tak i ett vardagsrum, med ett plan "
     "ovanför hängmattan och två under den",
  3: "Måttritning över klösträdet: 230 till 250 cm högt, fot 40 × 40 cm, "
     "plan 34 cm och hängmatta 30 cm i diameter",
  4: "Närbild på takplattan i ek överst, med den blå spännskruven synlig "
     "mellan plattan och stolpens sisallindning",
  5: "Närbild på hängmattan i cremevit plysch, fäst runt den sisallindade "
     "stolpen med uppvikt kant hela vägen runt",
  "kort": "Faktakort: takspänt klösträd 230 till 250 cm på en fot i 40 × 40 cm, "
          "med hängmatta och tre plan längs en sisalstolpe",
 },
 "a73a1a1c": {
  1: "Takspänt klösträd i grått och cremevitt, med tre runda plan och en "
     "hängmatta längs en sisalklädd stolpe på en grå metallfot",
  2: "Klösträdet står mellan golv och tak mot en grå betongvägg, med ett "
     "plan ovanför hängmattan och två under den",
  3: "Måttritning över klösträdet: 230 till 250 cm högt, fot 40 × 40 cm, "
     "plan 34 cm och hängmatta 30 cm brett",
  4: "Klösträdet sett snett framifrån i rummet, med de grå plyschklädda "
     "planen och hängmattan på var sin höjd längs stolpen",
  5: "Närbild där en hand lyfter kanten på ett plans grå klädsel och visar "
     "kardborrebandet under",
  "kort": "Faktakort: takspänt klösträd 230 till 250 cm på en fot i 40 × 40 cm, "
          "med hängmatta och tre plan längs en sisalstolpe",
 },
 "f5f71f5d": {
  1: "Klösträd 90 cm i cremevitt, med en sluten koja nedtill, en hängmatta i "
     "mitten och en bädd med kattöron i hörnen överst",
  2: "Klösträdet står i ett vardagsrum bredvid en soffa, med den runda "
     "ingången till kojan vänd utåt och en boll hängande från översta planet",
  3: "Måttritning över klösträdet: 90 cm högt, sockel 48 × 48 cm, koja "
     "30 × 30 × 28 cm och ingång 18 cm i diameter",
  4: "Klösträdet sett från sidan i rummet, med hängmattan spänd mellan "
     "stolparna och kojan under den",
  5: "Närbild på bädden överst, med hög uppvikt kant i cremevit plysch och "
     "två spetsiga öron i hörnen",
  "kort": "Faktakort: klösträd 90 cm på en sockel i 48 × 48 cm, med koja, "
          "hängmatta och en bädd med uppvikt kant överst",
 },
 "dd3b541b": {
  1: "Klösträd 90 cm i grått, med en sluten koja nedtill, en hängmatta i "
     "mitten och en bädd med kattöron i hörnen överst",
  2: "Klösträdet står vid ett fönster med gardin, med bädden överst och den "
     "runda kojingången vänd utåt",
  3: "Måttritning över klösträdet: 90 cm högt, sockel 48 × 48 cm, koja "
     "30 × 30 × 28 cm och ingång 18 cm i diameter",
  4: "Klösträdet sett snett framifrån på ett trägolv, med hängmattan mellan "
     "stolparna och sockeln fritt synlig under kojan",
  5: "Närbild underifrån på sockeln och de sisallindade stolparna, med "
     "hängmattan och mellanplanet ovanför",
  "kort": "Faktakort: klösträd 90 cm på en sockel i 48 × 48 cm, med koja, "
          "hängmatta och en bädd med uppvikt kant överst",
 },
 "f489937f": {
  1: "Klöspelare 91 cm i mörkgrått, med en grov sisalpelare, ett runt "
     "mellanplan och en bädd med uppvikt kant överst",
  2: "Klöspelaren står vid ett skrivbord på en randig matta, med bädden i "
     "bordshöjd och mellanplanet halvvägs ned",
  3: "Måttritning över klöspelaren: 91 cm hög, bottenplatta 45 × 45 cm, "
     "topplatta 45 × 36 cm och mellanplan 35,5 cm",
  4: "Närbild på bädden överst, med mörkgrå bouclékant runt en ljusgrå kudde "
     "ovanpå den sisallindade pelaren",
  5: "Närbild på pelarens fot, där sisallindningen möter den mörkgrå "
     "bottenplattan och mellanplanet ovanför",
  "kort": "Faktakort: klöspelare 91 cm på en bottenplatta i 45 × 45 cm, med "
          "grov sisalpelare, mellanplan och bädd överst",
 },
 "5616c567": {
  1: "Klöspelare 91 cm i ljusbrunt, med en grov sisalpelare, ett runt "
     "mellanplan och en bädd med uppvikt kant och gräddvit kudde överst",
  2: "Klöspelaren står vid ett skrivbord på en randig matta, med bädden "
     "överst och en boll liggande på mellanplanet",
  3: "Måttritning över klöspelaren: 91 cm hög, bottenplatta 45 × 45 cm, "
     "topplatta 45 × 36 cm och mellanplan 35,5 cm",
  4: "Närbild snett ovanifrån på bottenplattan i ljusbrun bouclé, där den "
     "grova sisalpelaren reser sig ur mitten",
  5: "Närbild på bäddens undersida och kant, med ljusbrun bouclé mot "
     "pelarens sisallindning",
  "kort": "Faktakort: klöspelare 91 cm på en bottenplatta i 45 × 45 cm, med "
          "grov sisalpelare, mellanplan och bädd överst",
 },
 "1ae60dbc": {
  1: "Kattrappa 66 cm i beige med fyra plyschklädda steg, en sluten koja "
     "inbyggd i andra steget och en boll hängande från sidan",
  2: "Kattrappan står vid en ljus fåtölj, med det nedersta steget mot golvet "
     "och det översta i armstödets höjd",
  3: "Måttritning över kattrappan: 66 cm hög, 60 × 40 cm i golvyta, steg på "
     "18, 33, 50 och 66 cm och en koja med ingång på 16 cm i diameter",
  4: "Närbild på en av stammarna under ett steg, lindad med jutetåg i täta "
     "varv upp mot den plyschklädda undersidan",
  5: "Närbild på kojan i beige plysch, med den runda ingången och de "
     "plyschklädda stegen på var sin sida",
  "kort": "Faktakort: kattrappa 66 cm med fyra steg på 18, 33, 50 och 66 cm "
          "och en inbyggd koja",
 },
 "819bf51c": {
  1: "Kattrappa 66 cm med ljusgrå plyschsteg och mörkgrå stammar, en sluten "
     "koja inbyggd i andra steget och en boll hängande från sidan",
  2: "Kattrappan står vid en grå fåtölj på ett trägolv, med det nedersta "
     "steget mot golvet och kojingången vänd utåt",
  3: "Måttritning över kattrappan: 66 cm hög, 60 × 40 cm i golvyta, steg på "
     "18, 33, 50 och 66 cm och en koja med ingång på 16 cm i diameter",
  4: "Närbild på en mörkgrå stam mellan två ljusgrå plyschsteg, med jämn yta "
     "utan synliga lindningsvarv",
  5: "Kattrappan sett från sidan vid fåtöljen, med kojans runda ingång och "
     "det nedersta steget närmast golvet",
  "kort": "Faktakort: kattrappa 66 cm med fyra steg på 18, 33, 50 och 66 cm "
          "och en inbyggd koja",
 },
}


def altfel():
    """Rundans EGNA grindar, körda mot alt-texterna. Se modulhuvudet."""
    fel = []
    for pid in PRODUKTER:
        huvudord, forbjudna = M.TYP[pid]
        for nyckel in ORDNING[pid]:
            text = ALT[pid].get(nyckel)
            namn = "%s bild %s" % (pid, nyckel)
            if not text:
                fel.append("%s: SAKNAR alt-text" % namn)
                continue
            # ☠️ Ett item UTAN altText blir ett item utan alt-text, även om det
            #    hade en. Tunna texter får aldrig nå skrivningen.
            if len(text) < 40:
                fel.append("%s: alt-texten är %d tecken — för tunn"
                           % (namn, len(text)))
            for monster, skal in GR.FORBJUDET:
                if monster.search(text):
                    fel.append("%s: %s — %r" % (namn, skal, text[:80]))
            for ord_, sammanhang in G.versalfel(text):
                fel.append("%s: VERSAL MITT I ORD %r — %r"
                           % (namn, ord_, sammanhang))
            for m in G.ARTNR.finditer(text):
                fel.append("%s: ARTIKELNUMMER %r" % (namn, m.group(0)))
            # Talgrinden: varje tal måste stå i produktens facit.
            for m in GR.TAL_RE.finditer(text):
                v = float(m.group(1).replace(",", "."))
                if v in GR.TAL_FRIA or v in M.TAL[pid] or int(v) in M.TAL[pid]:
                    continue
                fel.append("%s: OHÄRLETT TAL %s — %r"
                           % (namn, m.group(1), text[:80]))
            # ☠️ Produkttypen gäller även här. En kattrappa får inte kallas
            #    klösträd i alt-texten bara för att fältet är ett annat.
            #
            # ⚠️ MEN HUVUDORDET KRÄVS BARA DÄR DET HÖR HEMMA — på HJÄLTEBILDEN
            #    och på KORTET, de två som beskriver varan som helhet. En
            #    detaljbild namnger detaljen, inte hela möbeln (runda 136:s
            #    mätning: kravet på varje bild fällde elva korrekta närbilder).
            if nyckel in (1, "kort") and not GR._vikt(huvudord).search(text):
                fel.append("%s: saknar huvudordet %r" % (namn, huvudord))
            for f in forbjudna:
                if GR._vikt(f).search(text):
                    fel.append("%s: FEL PRODUKTTYP %r — %r" % (namn, f, text[:80]))
            # ☠️ Rundans egna förbjudna påståenden gäller ALT-TEXTEN OCKSÅ.
            #    Det var precis den nivån runda 106:s kaninlöfte slank igenom.
            for ord_ in M.FORBJUDNA_PASTAENDEN.get(pid, []):
                if GR._vikt(ord_).search(text):
                    fel.append("%s: FÖRBJUDET PÅSTÅENDE %r — %r"
                               % (namn, ord_, text[:80]))
            if nyckel == "kort" and not text.startswith("Faktakort: "):
                fel.append("%s: kortets alt-text börjar inte med 'Faktakort: '"
                           % namn)
        # ☠️ Kortet får ALDRIG ligga på plats 1 — det är hjältebildens plats,
        #    och kortet blir annars produktkortet i butiken.
        if ORDNING[pid][0] == "kort":
            fel.append("%s: Faktakortet ligger på plats 1" % pid)
        if "kort" not in ORDNING[pid]:
            fel.append("%s: inget Faktakort i galleriet" % pid)
        # ☠️ MÅTTRITNINGEN LIGGER SIST. Råimporten lägger den på plats 3.
        if ORDNING[pid][-1] != 3:
            fel.append("%s: måttritningen ligger inte sist" % pid)
        for p in BORT.get(pid, []):
            if p in ORDNING[pid]:
                fel.append("%s: struken bild %d ligger kvar i ordningen" % (pid, p))
        kvar = [i for i in range(1, len(GALLERI[pid]) + 1)
                if i not in BORT.get(pid, [])]
        saknas = [i for i in kvar if i not in ORDNING[pid]]
        if saknas:
            fel.append("%s: bild %s tappad ur ordningen" % (pid, saknas))
        # ☠️ FÄRGSYSKONEN FÅR INTE DELA ALT-TEXT PÅ EN MILJÖBILD. Två av våra
        #    egna URL:er med samma foto och samma text är den dubblett Google
        #    straffar, och den uppstår av OSS. Kortet undantas med flit: det är
        #    samma modell och samma faktarader, bara en annan färg.
        syskon = M.SYSKON[pid]
        for nyckel in (1, 2, 4, 5):
            if ALT[pid].get(nyckel) and ALT[pid][nyckel] == ALT[syskon].get(nyckel):
                fel.append("%s bild %s: IDENTISK alt-text som syskonet %s"
                           % (pid, nyckel, syskon))
    return fel


if __name__ == "__main__":
    f = altfel()
    for x in f:
        print("☠️", x)
    print("%d produkter, %d bilder, %d strykningar, %d fel"
          % (len(PRODUKTER), sum(len(ORDNING[p]) for p in PRODUKTER),
             sum(len(v) for v in BORT.values()), len(f)))
    sys.exit(1 if f else 0)
