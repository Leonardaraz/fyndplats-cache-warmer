# -*- coding: utf-8 -*-
"""Runda 133 — klöstunnor. Allt uppmätt, inget gissat.

Källorna är tre, och de säger emot varandra på sex av tio:
  1. leverantörens TYSKA `Technische Daten`   (auktoritativ för mått och last)
  2. leverantörens TYSKA `Beschreibung`        ☠️ kopierad mellan modeller
  3. den svenska spec-tabellen `to-product.ts` byggde vid importen

☠️ `Vikt` i den svenska tabellen är FRAKTVIKTEN (uppgift #488). INGEN av de
   tio har ett `Gewicht` i tyskan att ställa den mot, så VARANS vikt är
   OKÄND för alla tio — och får därför inte stå på någon sida.

☠️ Spec-tabellens `Material` är en FÖRKORTNING, inte en översättning. Fyra
   säger bara `Polyester`, sex säger `Sisal, Spanplatte` — där `Spanplatte`
   är TYSKA. Materialraden skrivs om från tyskans lista, ärvs aldrig.

☠️ `ingangar` ÄR MÄTT PÅ BILDEN, inte läst ur texten. Leverantören kallar
   både `e7a9abb7` och `f2e06b7a` "Drei Ebenen" — den ena har tre ingångar,
   den andra två. Se uppgift #504.
"""

PID = {
    "b6bf627f": "b6bf627f-8560-4745-940d-07d43c20212f",
    "a33447f9": "a33447f9-36dc-4d22-8092-1e6ebfe053bb",
    "e7a9abb7": "e7a9abb7-4c93-4ea5-961d-62998ff5fd31",
    "f2e06b7a": "f2e06b7a-6bcc-4907-92e7-41aa56181007",
    "bd0d7f9e": "bd0d7f9e-ba09-4bb6-a936-79bf854a100e",
    "d9310184": "d9310184-40d8-4fe8-af74-66fa6aadd054",
    "efa9c03e": "efa9c03e-18c6-42d5-af52-f9fe3ad7174d",
    "e43b623c": "e43b623c-c17c-49c0-9fa8-6a30fca49e5a",
    "d85ade1b": "d85ade1b-e32f-4f1d-a4b0-593b3f8160fd",
    "ec29ad45": "ec29ad45-6adc-40ea-82dc-be321fb06b3c",
}

# last=None betyder INGEN ANGIVEN MAXLAST. Då skrivs ingen — att räkna fram
# en ur vikten eller ur ett syskon vore ett påhittat tal på en möbel ett djur
# klättrar i. Samma negativa grind som runda 132:s.
# montering=None betyder att källan INTE säger något. Åtta av tio säger
# uttryckligen "Keine Montage erforderlich" / "Kommt vollständig montiert an";
# b6bf627f och a33447f9 gör det inte, och då påstås det inte.
TUNNOR = {
    # ---- Grupp A: flätat sjögräs + sisal, två storlekar av samma serie ----
    "b6bf627f": dict(
        matt="35,5 × 35,5 × 49 cm", topp="Ø35 cm", form="rund",
        ingangar=2, oppning="Ø14 cm", inre_hal=None,
        last=20, katt="1–2 katter under 5 kg", montering=None,
        material="spånskiva, plysch, sisal och sjögräs",
        farg="khakifärgat sjögräs och taupe sisal med gräddvita kanter",
        farg_de="Khaki+Kaffee", farg_spec="Khaki+Kaffee", pris=849,
        anm=("BILDEN: nedre halvan är FLÄTAT sjögräs i korgbindning, övre "
             "halvan finrandig sisal, kanterna gräddvit plysch. Två hålor, "
             "en per plan. Tyskan och spec-raden är överens om färgen."),
    ),
    "a33447f9": dict(
        matt="45 × 45 × 79 cm", topp=None, form="rund",
        ingangar=3, oppning="Ø17 cm", inre_hal="Ø17 cm",
        last=20, katt="1–2 katter under 5 kg", montering=None,
        material="spånskiva, plysch, sisal och sjögräs",
        farg="khakifärgat sjögräs och taupe sisal med gräddvita kanter",
        farg_de="Khaki+Kaffee", farg_spec="Khaki+Braun", pris=1529,
        anm=("☠️ SJÄLVMOTSÄGELSE: intron säger 'zwei Höhlenbereiche', "
             "punktlistan 'Drei Höhlenbereiche'. BILDEN visar TRE, och "
             "namnet säger 'dreistöckige'. Intron är kopierad från b6bf627f. "
             "⚠️ Färgen: tyskan Khaki+Kaffee, spec-raden Khaki+Braun — "
             "samma vara, två ord. Bilden fick avgöra."),
    ),

    # ---- Grupp B: öppen topp, samma fotavtryck — men OLIKA antal ingångar ----
    "e7a9abb7": dict(
        matt="40 × 40 × 74 cm", topp=None, form="rund med öppen topp",
        ingangar=3, oppning="Ø18 cm", inre_hal="Ø18 cm",
        last=None, katt="katter under 4,5 kg", montering=True,
        material="spånskiva, sammetslen polyester och sisal",
        farg="mörkgrå med ljusgrå sisalpanel och vita kanter",
        farg_de="Grau+Weiß", farg_spec="Grau, Weiß", pris=1169,
        anm=("BILDEN: TRE fyrkantiga ingångar med vit plyschkant, räknade "
             "på bild 1 och bild 2. Toppen är en öppen liggplats med "
             "plyschkant. INGEN maxlast angiven."),
    ),
    "f2e06b7a": dict(
        matt="40 × 40 × 74 cm", topp="37 × 37 cm", form="rund med öppen topp",
        ingangar=2, oppning="Ø18 cm", inre_hal="Ø18 cm",
        last=None, katt="katter under 4,5 kg", montering=True,
        material="spånskiva, sammetslen polyester och sisal",
        farg="beige med gräddvit panel och vita kanter",
        farg_de="Beige+Weiß", farg_spec="Beige", pris=1159,
        anm=("☠️ TVÅ ingångar, inte tre — räknat på bild 1 OCH bild 2. Delar "
             "mått, vikt, paketmått och ordagrant samma tyska text med "
             "e7a9abb7, som har TRE. Uppgift #504. De får INTE korslänkas "
             "som färgvarianter. ⚠️ Spec-raden säger bara 'Beige' och "
             "tappar vitt som tyskan har."),
    ),

    # ---- Grupp C: Ø38 × 70, tre färgställningar av samma konstruktion ----
    "bd0d7f9e": dict(
        matt="Ø38 × 70 cm", topp=None, form="rund",
        ingangar=3, oppning="Ø17 cm", inre_hal="Ø17,5 cm",
        last=None, katt="katter under 5 kg", montering=True,
        material="spånskiva, plysch och sisal",
        farg="ljusgrå sisal med grå kanter",
        farg_de="Hellgrau", farg_spec="Grå", pris=999,
        anm=("BILDEN: tre runda hålor i spiral, GRÅ plyschkanter och grå "
             "topp. ⚠️ Leverantören kallar både den här och efa9c03e "
             "'Hellgrau' — kantfärgen är det enda som skiljer dem i ord, "
             "och den måste stå i namnet."),
    ),
    "d9310184": dict(
        matt="Ø38 × 70 cm", topp=None, form="rund",
        ingangar=3, oppning="Ø17 cm", inre_hal="Ø17,5 cm",
        last=None, katt="katter under 5 kg", montering=True,
        material="spånskiva, plysch och sisal",
        farg="ljusbrun sisal med gräddvita kanter",
        farg_de="Braun", farg_spec="Braun", pris=1029,
        anm=("BILDEN: tre runda hålor, GRÄDDVITA kanter och gräddvit topp. "
             "⚠️ Tyskan säger 'Braun'; fotot är ljusbrunt/taupe, inte brunt. "
             "Bilden fick avgöra."),
    ),
    "efa9c03e": dict(
        matt="Ø38 × 70 cm", topp=None, form="rund",
        ingangar=3, oppning="Ø17 cm", inre_hal="Ø17,5 cm",
        last=None, katt="katter under 5 kg", montering=True,
        material="spånskiva, plysch och sisal",
        farg="ljusgrå sisal med mörkgrå kanter",
        farg_de="Hellgrau", farg_spec="Hellgrau", pris=1059,
        anm=("BILDEN: tre runda hålor, MÖRKGRÅ/koksgrå plyschkanter, topp "
             "och sockel. ⚠️ Spec-raden bär oöversatt tyska: 'Hellgrau'."),
    ),

    # ---- Grupp D: Ø35 × 60, ensam modell med angiven maxlast ----
    "e43b623c": dict(
        matt="Ø35 × 60 cm", topp="Ø32,5 × 2 cm", form="rund",
        ingangar=2, oppning="Ø17 cm", inre_hal=None,
        inre_nedre="Ø33 × 27 cm", inre_ovre="Ø33 × 24 cm",
        last=10, katt=None, montering=True,
        material="spånskiva, plysch, PP-bomull och sisal",
        farg="ljusgrå", farg_de="Hellgrau", farg_spec="Hellgrau", pris=939,
        anm=("BILDEN: två runda hålor. Den ENDA i rundan med 10 kg maxlast "
             "— de övriga som anger något säger 20. ⚠️ Ingen "
             "kattviktsrekommendation i källan, så ingen skrivs."),
    ),

    # ---- Grupp E: Ø38 × 96, färgsyskon med tvättbar bädd och tre leksaker ----
    "d85ade1b": dict(
        matt="Ø38 × 96 cm", topp="Ø38 × 6 cm", form="rund",
        ingangar=3, oppning="18 × 19 cm", inre_hal=None,
        inre_skikt="Ø35 × 27 cm",
        last=20, katt="rekommenderat upp till 6 kg", montering=True,
        leksaker=3, badd="avtagbar och maskintvättbar",
        material="spånskiva, MDF, plysch, PP-bomull och sisal",
        farg="cremevit med beige bädd", farg_de="Cremeweiß+Beige",
        farg_spec="Cremeweiß", pris=1359,
        anm=("BILDEN: tre KATTFORMADE hålor, ett hängande mustips i var och "
             "en, rund plyschbädd på toppen. ⚠️ Spec-raden bär OÖVERSATT "
             "tyska: 'Cremeweiß'. ⚠️ Namnet säger '4-Ebenen' och texten "
             "'drei Schlafhöhlen' — tre hålor plus bädden på toppen."),
    ),
    "ec29ad45": dict(
        matt="Ø38 × 96 cm", topp="Ø38 × 6 cm", form="rund",
        ingangar=3, oppning="18 × 19 cm", inre_hal=None,
        inre_skikt="Ø35 × 27 cm",
        last=20, katt="rekommenderat upp till 6 kg", montering=True,
        leksaker=3, badd="avtagbar och maskintvättbar",
        material="spånskiva, MDF, plysch, PP-bomull och sisal",
        farg="grå med grå bädd", farg_de="Grau", farg_spec="Grau", pris=1459,
        anm=("Färgsyskon till d85ade1b: samma mått, samma maxlast, samma "
             "tre leksaker, samma bädd. Kontrollerat på bilden — identisk "
             "konstruktion, enda skillnaden är färgen."),
    ),
}

# Färgsyskon som FÅR korslänkas som varianter av samma modell. Grupp B står
# INTE här, och det är hela poängen med uppgift #504.
FARGSYSKON = [
    ("bd0d7f9e", "d9310184", "efa9c03e"),
    ("d85ade1b", "ec29ad45"),
]

# Storlekssyskon — samma serie, olika storlek. Korslänkas som "finns även i",
# aldrig som "samma modell i en annan färg".
STORLEKSSYSKON = [("b6bf627f", "a33447f9")]
