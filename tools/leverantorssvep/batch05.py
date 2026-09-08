# -*- coding: utf-8 -*-
"""Batch 5 i leverantörssvepet — knästolar, kontorsstolar, växthus, uteprodukter.

☠️ MÄTT, inte gissat: ett par som "aldrig träffar" har TVÅ olika orsaker, och
   bara den ena är ett fel.

   1. Paret träffade i ett TIDIGARE anrop i samma batch. `missade` räknas per
      anrop, så ett par som bet på sidan 12 står som missat i anropet som
      börjar på sidan 33. Läs listorna TILLSAMMANS — 4b04080a och 9768fb7a
      var redan rättade av batch 3 när de såg ut att ha missats.

   2. En TAGG ligger inne i meningen. Den avtaggade texten visar den inte:
      `Leverantören anger att de <span style="font-weight: 700">övre</span>
      grenarna` blir `Leverantören anger att de övre grenarna`. Ett exakt par
      byggt på den avtaggade texten kan då aldrig matcha.

   ☠️ Regeln: bygg paret ur den RÅA plainDescription när ett par bommar, inte
      ur den avtaggade meningen — och kapa fragmentet före taggen.
"""

PAR = [
    # ── Omtag: paret föll på ett <span> inne i meningen ───────────────────
    #    Rått: 'Leverantören anger att de <span …>övre</span> grenarna …'
    ("886d9e37",
     "inomhusbruk. Leverantören anger att de",
     "inomhusbruk. Bara de"),

    # ── Stolar ─────────────────────────────────────────────────────────────
    ("4d3c458c",
     "tillverkaren skriver ut det, och det handlar om stabiliteten.",
     "det står uttryckligen i anvisningen och handlar om stabiliteten."),
    ("0787ecd5",
     "Det anger leverantören uttryckligen.",
     "Stolen är byggd för det."),
    ("0787ecd5",
     "Leverantören anger upp till 190 centimeter.",
     "Stolen passar upp till 190 centimeter."),
    ("knästol",
     "Leverantörens råd är att vänja sig stegvis och resa på sig var "
     "15–30:e minut i början.",
     "Rådet är att vänja sig stegvis och resa på sig var 15–30:e minut i "
     "början."),
    ("knästol",
     "Leverantören anger själv 15–30 minuter i taget som utgångspunkt.",
     "Utgångspunkten är 15–30 minuter i taget."),
    ("cdc03206",
     "Ett fast svankstöd sitter där tillverkaren gissat; det här sitter där du "
     "behöver det, och det är den inställning som betyder mest på en nätstol "
     "där ryggen annars är en spänd yta utan form.",
     "Ett fast svankstöd sitter där det råkar sitta; det här sitter där du "
     "behöver det, och det är den inställning som betyder mest på en nätstol "
     "där ryggen annars är en spänd yta utan form."),
    ("2b8b7297",
     "du väljer alltså vinkeln själv och inte tillverkaren.",
     "du väljer alltså vinkeln själv."),
    ("f3f45d87",
     "Den går att flytta i höjd eller ta bort helt, och det är skillnaden mot "
     "ett fast nackstöd som sitter där tillverkaren gissat att din nacke är.",
     "Den går att flytta i höjd eller ta bort helt, och det är skillnaden mot "
     "ett fast nackstöd som sitter där det råkar sitta."),
    ("a3128b31",
     "Ett fast nackstöd sitter där tillverkaren gissat att din nacke är; det "
     "här sitter där den faktiskt är.",
     "Ett fast nackstöd sitter där det råkar sitta; det här sitter där din "
     "nacke faktiskt är."),
    ("437a50ee",
     "Klassen är tillverkarens angivelse för fjäderns hållfasthet.",
     "Klassen anger fjäderns hållfasthet."),
    ("437a50ee",
     "Det är tillverkarens angivelse för gasfjäderns hållfasthetsklass.",
     "Det är gasfjäderns hållfasthetsklass."),

    # ── Skrivbord och möbelset ─────────────────────────────────────────────
    ("6341b51a",
     "Leverantören anger två skärmar upp till 42 tum, och 168 cm bredd räcker "
     "gott.",
     "Bordet tar två skärmar upp till 42 tum, och 168 cm bredd räcker gott."),
    ("cfab9c4e",
     "Leverantören anger två skärmar upp till 42 tum.",
     "Bordet tar två skärmar upp till 42 tum."),
    ("06a712e1",
     "Tillverkaren anger inte att det är avtagbart, så räkna med att det "
     "sitter kvar.",
     "Det är inte angivet som avtagbart, så räkna med att det sitter kvar."),
    ("61355ceb",
     "Bambu är starkt men lätt, och tillverkaren anger lasten per del: 4 kg på "
     "klädstången, 3 kg på byxhållarna, 6 kg på skohyllan och 2 kg på brickan, "
     "sammanlagt 22 kg.",
     "Bambu är starkt men lätt, och lasten är fördelad per del: 4 kg på "
     "klädstången, 3 kg på byxhållarna, 6 kg på skohyllan och 2 kg på brickan, "
     "sammanlagt 22 kg."),
    ("7d9afdf7",
     "Tillverkaren anger 9 kg för hela stället och 3 kg per del — alltså 3 kg "
     "på själva klädstången, 3 på skohyllan och 3 på krokarna tillsammans.",
     "Maxlasten är 9 kg för hela stället och 3 kg per del — alltså 3 kg på "
     "själva klädstången, 3 på skohyllan och 3 på krokarna tillsammans."),
    ("776ef75a",
     "Tillverkaren anger bara det utdragna måttet, 225 centimeter.",
     "Bara det utdragna måttet är angivet, 225 centimeter."),
    ("878bad3a",
     "Tillverkarens bild visar tre möjliga uppställningar.",
     "Bilderna visar tre möjliga uppställningar."),
    ("cd6b31a9",
     "Tillverkaren anger stolarna som stapelbara men inte hur högt.",
     "Stolarna är stapelbara, men det finns ingen angiven maxhöjd för "
     "stapeln."),
    ("aeff0074",
     "Metall och komposit tål väder, men tillverkaren rekommenderar ett "
     "skyddsöverdrag när gruppen inte används.",
     "Metall och komposit tål väder, men använd ett skyddsöverdrag när gruppen "
     "inte används."),
    ("f02917da",
     "Regulatorn på tillverkarens egen bild är märkt 50 mbar, alltså den tyska "
     "standarden.",
     "Regulatorn på produktbilden är märkt 50 mbar, alltså den tyska "
     "standarden."),
    ("f02917da",
     "Regulatorn på tillverkarens bild är märkt 50 mbar.",
     "Regulatorn på produktbilden är märkt 50 mbar."),
    ("7d28f235",
     "Leverantörens bilder visar skåpet både med hyllplanet på plats och utan, "
     "med två sopkärl stående på bottnen.",
     "Bilderna visar skåpet både med hyllplanet på plats och utan, med två "
     "sopkärl stående på bottnen."),

    # ── Säsongsdekorationer ────────────────────────────────────────────────
    ("410a98d3",
     "Duken är stänkskyddad och klarar regn, men leverantören avråder från att "
     "låta den stå ute i riktigt dåligt väder.",
     "Duken är stänkskyddad och klarar regn, men låt den inte stå ute i "
     "riktigt dåligt väder."),
    ("d5663ed0",
     "Det är ett medvetet val från tillverkaren — det vita ljuset läser som "
     "ben och gör avslöjandet tydligare i mörker.",
     "Det är ett medvetet val — det vita ljuset läser som ben och gör "
     "avslöjandet tydligare i mörker."),
    ("30403377",
     "Tillverkaren rekommenderar att den stängs av i bullriga eller blåsiga "
     "lägen.",
     "Stäng av den i bullriga eller blåsiga lägen."),
    ("c6189c09",
     "Kör den högst åtta timmar i sträck; det är vad tillverkaren anger för "
     "att motorn ska hålla över flera säsonger.",
     "Kör den högst åtta timmar i sträck; det är vad som krävs för att motorn "
     "ska hålla över flera säsonger."),
    ("fc40ff21",
     "Kapslingsklass IP44 betyder stänkskyddad: dagg och en regnskur är inget "
     "problem, men leverantören avråder från att låta den stå ute i ihållande "
     "regn eller blåst.",
     "Kapslingsklass IP44 betyder stänkskyddad: dagg och en regnskur är inget "
     "problem, men låt den inte stå ute i ihållande regn eller blåst."),
    ("5754c08b",
     "Vid ihållande regn eller blåst rekommenderar leverantören att den tas "
     "in.",
     "Vid ihållande regn eller blåst ska den tas in."),

    # ── Växthus och odling ─────────────────────────────────────────────────
    ("67b9ec87",
     "Tillverkaren anger vindtålighetsklass 3 till 4 — det är ett växthus för "
     "odlingssäsongen, inte en vinterbyggnad.",
     "Vindtålighetsklassen är 3 till 4 — det är ett växthus för "
     "odlingssäsongen, inte en vinterbyggnad."),
    ("dc33b355",
     "Där hänger ampelväxter eller en lykta, och tillverkaren anger 10 kg som "
     "gräns för den delen.",
     "Där hänger ampelväxter eller en lykta, och gränsen för den delen är "
     "10 kg."),
    ("5cec1f40",
     "Tillverkaren anger vindtålighetsklass 4, vilket motsvarar omkring "
     "28 km/h, och skriver att växthuset inte ska lämnas uppe i hårdare vind.",
     "Vindtålighetsklassen är 4, vilket motsvarar omkring 28 km/h, och "
     "växthuset ska inte lämnas uppe i hårdare vind."),
    ("5cec1f40",
     "Tillverkaren anger klass 4 och skriver att växthuset inte ska stå kvar i "
     "starkare vind än så.",
     "Klassen är 4, och växthuset ska inte stå kvar i starkare vind än så."),
    ("5cec1f40",
     "Vindtålighetsklass 4 motsvarar cirka 28 km/h, och tillverkaren avråder "
     "från att lämna det uppe i hårdare vind.",
     "Vindtålighetsklass 4 motsvarar cirka 28 km/h, och det ska inte lämnas "
     "uppe i hårdare vind."),
    ("48c878c9",
     "Tillverkarens ritning anger tre.",
     "Måttritningen anger tre."),
    ("f3a71061",
     "Tillverkaren anger vindtäthetsklass 6.",
     "Vindtäthetsklassen är 6."),
    ("8498de60",
     "Tillverkaren anger vindtålighetsklass 4 och skriver uttryckligen att "
     "växthuset inte är avsett för dåligt väder: det är en säsongförlängare "
     "från vår till höst, inte en byggnad som ska stå ute i vinterstorm och "
     "snö.",
     "Vindtålighetsklassen är 4, och växthuset är uttryckligen inte avsett för "
     "dåligt väder: det är en säsongförlängare från vår till höst, inte en "
     "byggnad som ska stå ute i vinterstorm och snö."),
    ("8498de60",
     "Tillverkaren anger uttryckligen att växthuset inte är avsett för dåligt "
     "väder, och snölast är det som river sönder duken vid sömmarna.",
     "Växthuset är uttryckligen inte avsett för dåligt väder, och snölast är "
     "det som river sönder duken vid sömmarna."),
    ("8498de60",
     "Tillverkaren anger vindtålighetsklass 4 och skriver att växthuset inte "
     "är avsett för dåligt väder.",
     "Vindtålighetsklassen är 4, och växthuset är inte avsett för dåligt "
     "väder."),
]
