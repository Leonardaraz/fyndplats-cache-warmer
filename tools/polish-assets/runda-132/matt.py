"""Runda 132 — husdjurstrappor. Allt uppmätt, inget gissat.

Källorna är tre, och de säger emot varandra på fyra av tio produkter:
  1. leverantörens TYSKA `Technische Daten`   (auktoritativ för mått/last)
  2. leverantörens TYSKA `Beschreibung`        ☠️ kopierad mellan modeller
  3. den svenska spec-tabellen `to-product.ts` byggde vid importen

☠️ `Vikt` i den svenska tabellen är FRAKTVIKTEN, inte varans (uppgift #488).
   Uppmätt här i fyra fall: 0,81 mot 1,5 · 4,2 mot 5,0 · 4,2 mot 5,0.
   VARANS vikt står i tyskans `Gewicht`. Använd aldrig spec-tabellens tal.
"""

# Wix-id:n, hela strängen. Nycklen är de åtta första tecknen.
PID = {
    "8f6147b5": "8f6147b5-7d27-4762-93f8-05c776755df4",
    "4c25eb86": "4c25eb86-8fba-42d5-a22f-0e399ea2e72d",
    "762cc411": "762cc411-d74a-400b-b796-64e442af7f72",
    "f384c51d": "f384c51d-b404-469b-9b41-a2f48690b619",
    "3ff2bc32": "3ff2bc32-d666-4de1-8c5a-943f52e2183c",
    "03715963": "03715963-a864-4dd0-a120-eda1452bc17d",
    "c38f929e": "c38f929e-2bfa-4354-8de6-5948e022b4e0",
    "96d2803c": "96d2803c-63aa-444a-a69b-fc4a34c8c5e0",
    "11436227": "11436227-fd8c-4e88-ab5d-3aaf2eb9f932",
    "71e8e879": "71e8e879-f162-4d1f-a0b3-5d0e6acedce4",
}

TRAPPOR = {
    # ---- Grupp A: spånskiva + plysch, enskilda modeller ----
    "8f6147b5": dict(
        steg=3, matt="46 x 35,5 x 34 cm", steghojd="10 cm",
        material="spånskiva och plysch", last=50, vikt_tysk=None,
        farg_de="Grau", farg_spec="Beige", pris=849,
        farg="ljusgrå", sisal=True,
        # ✅ BILDEN AVGJORDE BÅDA (Steg 4, 2026-09-11, förstoring av bild 1+5):
        anm=("FÄRGEN: LJUSGRÅ. Tyskans Grau vinner; spec-tabellens Beige är "
             "FEL. SISALEN: FINNS — stolparna är sisallindade, syns i "
             "förstoring och i närbilden (bild 5). Intron var alltså INTE "
             "kopierad; det är Technische Datens materiallista som är "
             "ofullständig. ☠️ Två antaganden omkullkastade av bilden."),
    ),
    "4c25eb86": dict(
        steg=4, matt="60 x 40,5 x 59 cm", stegmatt="40,5 x 15 cm",
        steghojder="15/29,5/45/59,5 cm",
        material="spånskiva och plysch", last=50, pris=799,
        farg_de="Grau", farg="mörkgrå", sisal=True,
        # ✅ BILDEN AVGJORDE (bild 4 och 5 är närbilder på sisalrepet):
        anm=("FÄRGEN: MÖRKGRÅ, nästan antracit — inte den ljusgrå man läser "
             "ur 'Grau'. SISALEN: FINNS, sisallindade stolpar. "
             "☠️ Spec-tabellens Mått är platshållaren 'Modell 1' — "
             "oanvändbar, använd tyskans tal."),
    ),
    "762cc411": dict(
        steg=3, matt="45 x 35 x 34 cm",
        material="spånskiva och plysch", last=10, pris=849,
        farg_de="Beige", farg_spec="Beige", farg="gräddvit", sisal=False,
        # ✅ BILDEN AVGJORDE: stolparna är klädda i SAMMA gräddvita bouclé
        #    som stegen — INGET sisal. Här är intron alltså kopierad.
        anm=("FÄRGEN: GRÄDDVIT. SISALEN: SAKNAS — stolparna är klädda i "
             "samma bouclé som stegen. Intron ('Kletterbaum') är kopierad "
             "från en sisalmodell; skriv varken klätterträd eller klöspelare. "
             "10 kg är LÄGST i rundan — säljs som kattrappa."),
    ),

    # ---- Grupp B: MDF + kortplysch, FÄRGSYSKON (identiska mått OCH vikt) ----
    "f384c51d": dict(
        steg=4, matt="40 x 59 x 54,2 cm", stegmatt="40 x 17 cm",
        steghojder="14,3/27,6/40,9/54,2 cm",
        material="MDF med kortplysch", last=30, pris=819,
        farg_de="Natur", farg_spec="Naturholz", montering=True,
        farg="ljus trälook med gräddvita stegdynor",
        # ✅ BILDEN AVGJORDE: ljus furuton stomme, gräddvita stegdynor.
        anm=("FÄRGEN: LJUS TRÄLOOK med gräddvita stegdynor. Beschreibung "
             "ärver syskonets 'dunkler Kaffeefarbe' — den är FEL här. "
             "Bild 4 visar kardborrebandet under stegdynan."),
        syskon="3ff2bc32",
    ),
    "3ff2bc32": dict(
        steg=4, matt="40 x 59 x 54,2 cm", stegmatt="40 x 17 cm",
        steghojder="14,3/27,6/40,9/54,2 cm",
        material="MDF med kortplysch", last=30, pris=799,
        farg_de="Dunkelbraun", farg_spec="Dunkelbraun", montering=True,
        farg="mörkbrun med bruna stegdynor",
        # ✅ BILDEN AVGJORDE: mycket mörk espressobrun stomme, bruna dynor.
        anm=("FÄRGEN: MÖRKBRUN (espresso) stomme med bruna stegdynor. "
             "Här STÄMMER 'dunkler Kaffeefarbe' — den hör hit, och det är "
             "därifrån syskonets felaktiga rad kommer."),
        syskon="f384c51d",
    ),

    # ---- Grupp C: hopfällbar med förvaring, FÄRGSYSKON ----
    "03715963": dict(
        steg=3, matt="40 x 54 x 48 cm", stegmatt="40 x 18 x 16 cm",
        material="MDF klass P2 med mockaimitation och fleece",
        last=None, vikt_tysk="4,2 kg", pris=759,
        farg_de="Weiß", farg_spec="Weiß", montering=True,
        forvaring=True, hopfallbar=True,
        farg="gräddvit med vita stegdynor", steghojder="16/32/48 cm",
        # ☠️ INGEN maxlast i Technische Daten. Skriv ingen.
        anm="Ingen maxlast angiven. Spec-tabellens 5 kg är FRAKTVIKTEN.",
        syskon="c38f929e",
    ),
    "c38f929e": dict(
        steg=3, matt="40 x 54 x 48 cm", stegmatt="40 x 18 x 16 cm",
        material="MDF klass P2 med mockaimitation och fleece",
        last=None, vikt_tysk="4,2 kg", pris=749,
        farg_de="Schwarz", farg_spec="Schwarz", montering=True,
        forvaring=True, hopfallbar=True,
        farg="mörkblå med bruna stegdynor", steghojder="16/32/48 cm",
        # ☠️ Intron kallar den "dreistufiges Tierschutzgitter" — ett
        #    SKYDDSGRINDS-ord ur en helt annan familj. Allt annat säger
        #    trappa, och syskonets identiska text säger "Treppe".
        anm=("Intron kallar den 'Tierschutzgitter' (skyddsgrind). Fel ord "
             "ur en annan familj — syskonets identiska text säger trappa."),
        syskon="03715963",
    ),

    # ---- Grupp D: 2-i-1 dyntrappa i PU-läder, FÄRGSYSKON ----
    "96d2803c": dict(
        steg=2, matt="45 x 39 x 20 cm", utfalld="67 x 39 x 10 cm",
        material="PU-läder med skumstoppning",
        last=None, hundvikt=7, vikt_tysk="0,81 kg", pris=619,
        farg_de="Grau", farg_spec="Dunkelgrau, Kohlegrau", farg="grå",
        # ☠️ INGEN maxlast; leverantören anger i stället en HUNDVIKT
        #    ("bis 7 kg") med rasexempel. Det är ett annat mått.
        anm=("Ingen maxlast — leverantören anger hundvikt upp till 7 kg. "
             "Spec-tabellens 1,5 kg är FRAKTVIKTEN; varan väger 0,81 kg. "
             "Färgnamnen spretar: Grau / Dunkelgrau / Kohlegrau."),
        syskon="11436227",
    ),
    "11436227": dict(
        steg=2, matt="45 x 39 x 20 cm", utfalld="67 x 39 x 10 cm",
        material="PU-läder med skumstoppning",
        last=None, hundvikt=7, vikt_tysk="0,81 kg", pris=569,
        farg_de="Schwarz", farg_spec="Schwarz", farg="mörkgrå, nästan svart",
        anm="Samma vara som 96d2803c, mörk. Hundvikt 7 kg står i brödtexten.",
        syskon="96d2803c",
    ),

    # ---- Grupp E: skumtrappa med avtagbart översta steg ----
    "71e8e879": dict(
        steg=3, matt="54 x 40 x 39 cm", andra_steget="26 cm",
        material="skumplast med plyschöverdrag", last=15, pris=749,
        farg_de="Beige", farg_spec="Beige", vikt_tysk=None,
        farg="gräddvita steg med bruna sidor", oversta_steget="13 cm",
        # ☠️ SÄKERHETSNOTIS ur leverantörens egen text, ordagrant:
        #    "Da die oberste Stufe nicht fixiert ist, müssen Sie sich auf
        #     das Sofa oder Bett stützen, um sie zu benutzen."
        #    Den MÅSTE nå kunden — översta steget är löst.
        anm=("2-i-1: översta steget lyfts av → 2 steg. Leverantörens egen "
             "varning: översta steget är INTE fastsatt och måste stödjas "
             "mot soffan eller sängen. Ska stå i kundtexten."),
    ),
}

# Publicerade grannar i familjen (lästa ur Wix 2026-09-11). Facit för
# korslänkarna — och grinden mot att beskriva någon annans produkt.
GRANNAR = {
    "hundtrappa-sma-hundar-katter-4-steg": dict(
        namn="Hundtrappa för små hundar och katter", matt="60 x 35 x 44 cm",
        stegmatt="34 x 15 cm", steghojder="10/20/30/40 cm", steg=4, last=4.5,
        anm="OMMAPPAD till Aosom 2026-09-11; utkastet a6412efa pensionerat."),
    "hundtrappa-med-forvaring": dict(
        namn="Hundtrappa med förvaring 3 steg", matt="40,5 x 44,5 x 38 cm",
        stegmatt="40,5 x 16,5 x 12,6 cm", steg=3, last=30),
    "hopfallbar-hundtrappa-3-steg": dict(
        namn="Hopfällbar hundtrappa 3 steg", matt="53 x 30,5 x 36,5 cm",
        hopfalld="63 x 30,5 x 11,3 cm", steg=3, last=10),
    "vikbar-husdjurstrappa-4-steg": dict(
        namn="Vikbar husdjurstrappa 4 steg", matt="67 x 38 x 49,5 cm",
        hopfalld="77,2 x 38 x 12,6 cm", stegmatt="33 x 16 x 12,5 cm",
        steg=4, last=20),
    "hundramp-bil-155-cm": dict(
        namn="Hundramp för bil 155 cm", matt="155 x 38,5 x 15,5 cm", last=90),
    "hopfallbar-hundramp-bil-158-cm": dict(
        namn="Hopfällbar hundramp till bil 158 cm", matt="158 x 43,5 x 2,5 cm",
        last=60),
}
