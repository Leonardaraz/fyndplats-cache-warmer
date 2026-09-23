# -*- coding: utf-8 -*-
"""Batch 3 i leverantörssvepet — bord, hyllor, hallmöbler, granar, kaminer.

Två av paren är MALLPAR: samma två meningar står ordagrant på ~28 kamin- och
värmaresidor, så de byts en gång och biter överallt. Resten är handskrivna
per produkt.

☠️ Texten skrivs i EN FIL och grindas innan den lämnar chatten (husregeln
   från batch 64: 9 fel inline mot 0 via fil).
"""

PAR = [
    # ── MALLPAR: kaminer och väggvärmare, ~28 sidor ────────────────────────
    ("mall",
     "Leverantören anger en uppvärmningsyta i kvadratmeter för varje modell, "
     "men siffrorna",
     "Varje modell har en angiven uppvärmningsyta i kvadratmeter, men "
     "siffrorna"),
    ("mall",
     "Ytan nedan är leverantörens uppgift, inget vi mätt.",
     "Ytan nedan är ett riktvärde, inte ett mätt värde."),

    # ── Bord ───────────────────────────────────────────────────────────────
    ("e60b4d1a",
     "Leverantören kallar färgen naturträ, vilket är missvisande nog att vara "
     "värt att säga rakt ut: det är inte en trämöbel, det är en vit möbel med "
     "träskiva.",
     "Färgen heter naturträ, vilket är missvisande nog att vara värt att säga "
     "rakt ut: det är inte en trämöbel, det är en vit möbel med träskiva."),
    ("1d56e82e",
     "Tillverkarens packlista anger en kudde, medan produkttexten och bilderna "
     "visar två.",
     "Packlistan anger en kudde, medan produkttexten och bilderna visar två."),
    ("03373078",
     "Tillverkaren anger 50 kilo totalt, varav 45 kilo på bordsskivan och "
     "5 kilo på hyllan.",
     "Maxlasten är 50 kilo totalt, varav 45 kilo på bordsskivan och 5 kilo på "
     "hyllan."),
    ("03373078",
     "Tillverkaren anger ungefär 30 minuter, med märkta delar och anvisning.",
     "Räkna med ungefär 30 minuter, med märkta delar och anvisning."),
    ("90a96877",
     "Tillverkaren anger 25 kilo som total maxlast.",
     "Total maxlast är 25 kilo."),
    ("90a96877",
     "Håll dig under 25 kilo på bordet — det är tillverkarens gräns för hela "
     "bordet, inte bara skivan.",
     "Håll dig under 25 kilo på bordet — gränsen gäller hela bordet, inte bara "
     "skivan."),
    ("4a365ee5",
     "Tillverkaren anger bordet för två personer.",
     "Bordet är avsett för två personer."),
    ("12889c63",
     "Tillverkaren anger det uttryckligen som en åtgärd för att minska "
     "skaderisken, och det märks mest i ett trångt kök där man passerar bordet "
     "dagligen.",
     "Det är uttryckligen en åtgärd för att minska skaderisken, och det märks "
     "mest i ett trångt kök där man passerar bordet dagligen."),
    ("12889c63",
     "fläck- och reptålig enligt tillverkaren",
     "fläck- och reptålig"),
    ("12889c63",
     "Nej, alla fyra hörnen är avrundade — tillverkaren anger det som en åtgärd "
     "mot skaderisk.",
     "Nej, alla fyra hörnen är avrundade — det är en åtgärd mot skaderisk."),
    # ☠️ Utan avslutande punkt: en tagg ligger mellan "hopfällt" och punkten.
    ("7e487213",
     "Tillverkaren anger 50 kilo när bordet är helt utfällt och 30 kilo när "
     "det är hopfällt",
     "Maxlasten är 50 kilo när bordet är helt utfällt och 30 kilo när det är "
     "hopfällt"),
    ("636bc545",
     "Härdat glas, angivet av tillverkaren",
     "Härdat glas, inte vanligt glas"),
    ("636bc545",
     "Båda planen är i härdat glas — det står uttryckligen i tillverkarens "
     "materialuppgift, inte bara glas som materialord.",
     "Båda planen är i härdat glas — det står uttryckligen i "
     "materialuppgiften, inte bara glas som materialord."),
    ("636bc545",
     "Ja, tillverkaren anger härdat glas för båda planen.",
     "Ja, båda planen är i härdat glas."),
    ("cc4aad40",
     "Tillverkaren anger materialet som valt för stabilitet och "
     "fuktbeständighet, och bordet bär 90 kilo.",
     "Materialet är valt för stabilitet och fuktbeständighet, och bordet bär "
     "90 kilo."),
    ("cc4aad40",
     "Tillverkaren anger bordet som lämpligt både inomhus och utomhus, och "
     "materialet som fuktbeständigt.",
     "Bordet är lämpligt både inomhus och utomhus, och materialet är "
     "fuktbeständigt."),
    ("cc4aad40",
     "Ta in bordet inför vintern; tillverkaren anger fuktbeständighet men ingen "
     "frostbeständighet.",
     "Ta in bordet inför vintern; materialet är fuktbeständigt men inte "
     "frostbeständigt."),
    ("cc4aad40",
     "Tillverkaren anger det som lämpligt både inne och ute och materialet som "
     "fuktbeständigt.",
     "Det är lämpligt både inne och ute, och materialet är fuktbeständigt."),
    ("4fa6649a",
     "Tillverkaren beskriver motorn som tystgående och anger att den är testad "
     "för 20 000 cykler.",
     "Motorn är tystgående och testad för 20 000 cykler."),
    ("7be802c2",
     "Tillverkaren anger 25 kg, vilket är tio kilo mer än vårt mindre rullbord "
     "tål.",
     "Maxlasten är 25 kg, vilket är tio kilo mer än vårt mindre rullbord tål."),
    ("f4dcad8d",
     "Tillverkaren anger 15 kg för hela bordet.",
     "Maxlasten är 15 kg för hela bordet."),
    ("7ab49b8a",
     "Tillverkaren anger 28 mm i sekunden, mot 20 mm/s på vårt enmotoriga bord "
     "med minnesfunktion.",
     "Lyfthastigheten är 28 mm i sekunden, mot 20 mm/s på vårt enmotoriga bord "
     "med minnesfunktion."),
    ("7ab49b8a",
     "Det är därför ett stativ som ska bära en okänd skiva behöver mer marginal "
     "än ett bord där tillverkaren vet vad skivan väger.",
     "Det är därför ett stativ som ska bära en okänd skiva behöver mer marginal "
     "än ett bord där skivans vikt är känd."),
    ("7ab49b8a",
     "Tillverkaren anger 15–20 minuter för stativet.",
     "Räkna med 15–20 minuter för stativet."),
    ("a1f16108",
     "Tillverkaren anger att bordsskivan består av två plattor som fogas samman "
     "vid monteringen.",
     "Bordsskivan består av två plattor som fogas samman vid monteringen."),
    ("5684651e",
     "Tillverkaren anger en härdad glasskiva på 6 millimeter och beskriver den "
     "som slagtålig.",
     "Glasskivan är härdad, 6 millimeter tjock och slagtålig."),
    ("5684651e",
     "Tillverkaren beskriver den som slagtålig.",
     "Skivan är slagtålig."),
    ("06ef6f12",
     "Tillverkaren lyfter fram det som särskilt lämpligt i hem där det finns "
     "barn.",
     "Det gör möbeln särskilt lämplig i hem där det finns barn."),
    ("06ef6f12",
     "Ja, tillverkaren anger bambu som material.",
     "Ja, materialet är bambu."),
    ("06ef6f12",
     "Ja, tillverkaren anger att klaffarna fälls ut och fixeras säkert.",
     "Ja, klaffarna fälls ut och fixeras säkert."),
    ("06ef6f12",
     "Tillverkaren lyfter fram det som särskilt lämpligt i hem med barn.",
     "Det gör möbeln särskilt lämplig i hem med barn."),

    # ── Hyllor, hallmöbler, skrivbord ──────────────────────────────────────
    ("4b04080a",
     "Tillverkaren anger 28 kg för hela stället, 5 kg per hylla och 2 kg per "
     "krok.",
     "Maxlasten är 28 kg för hela stället, 5 kg per hylla och 2 kg per krok."),
    ("9768fb7a",
     "Tillverkaren anger 138 kg för hela möbeln sammanlagt.",
     "Maxlasten är 138 kg för hela möbeln sammanlagt."),
    ("c51f87de",
     "Tillverkaren anger 1 kg per krok.",
     "Maxlasten är 1 kg per krok."),
    ("bb14015b",
     "På leverantörens miljöbild står två spegelvända exemplar sida vid sida "
     "och bildar en hel vägg.",
     "På miljöbilden står två spegelvända exemplar sida vid sida och bildar en "
     "hel vägg."),
    ("ebbfd47b",
     "Tillverkaren anger cirka 30 minuters montering.",
     "Räkna med cirka 30 minuters montering."),
    ("7d30510e",
     "Tillverkaren anger 70 kg för skivan, 5 kg per låda och 110 kg för möbeln "
     "sammanlagt.",
     "Maxlasten är 70 kg för skivan, 5 kg per låda och 110 kg för möbeln "
     "sammanlagt."),
    ("b5f9a520",
     "Därför fungerar möbeln lika bra i badrum och kök som i ett vardagsrum, "
     "och leverantörens egna bilder visar den i alla tre.",
     "Därför fungerar möbeln lika bra i badrum och kök som i ett vardagsrum, "
     "och bilderna visar den i alla tre."),
    ("79ab08fe",
     "På leverantörens egen miljöbild står en tulpankruka där.",
     "På miljöbilden står en tulpankruka där."),
    ("c1ed35a7",
     "Leverantörens lastuppgift för sitsen är 120 kg — det är en vuxenmöbel, "
     "inte bara en barnbänk.",
     "Sitsen bär 120 kg — det är en vuxenmöbel, inte bara en barnbänk."),
    ("1199e887",
     "Tillverkaren anger den som rostbeständig, och pulverlack är en hårdare "
     "yta än våtlack där skorna slår i.",
     "Ytan är rostbeständig, och pulverlack är en hårdare yta än våtlack där "
     "skorna slår i."),
    ("f94a964c",
     "Tillverkarens måttritning anger 120 kg som maxlast.",
     "Måttritningen anger 120 kg som maxlast."),
    ("f94a964c",
     "120 kg enligt tillverkarens måttritning.",
     "120 kg enligt måttritningen."),
    ("d9b52d27",
     "Ja, tillverkaren anger det som både nattduksbord och sidobord.",
     "Ja, det fungerar som både nattduksbord och sidobord."),
    ("d9b52d27",
     "Tillverkaren anger det som både nattduksbord och sidobord.",
     "Det fungerar som både nattduksbord och sidobord."),
    ("b7256938",
     "Tillverkaren anger uttryckligen att madrassen inte ingår.",
     "Madrassen ingår inte i leveransen."),
    ("b7256938",
     "Nej, det anger tillverkaren uttryckligen.",
     "Nej, madrassen ingår inte."),

    # ── Julgranar ──────────────────────────────────────────────────────────
    ("0065fe6b",
     "Gångjärnskonstruktionen gör att grenarna öppnas när sektionerna reses — "
     "tillverkaren anger tio minuter, mot en halvtimme eller mer för en gran "
     "med lösa grenar.",
     "Gångjärnskonstruktionen gör att grenarna öppnas när sektionerna reses — "
     "räkna med tio minuter, mot en halvtimme eller mer för en gran med lösa "
     "grenar."),
    ("d4cfaf97",
     "Tillverkaren anger 30–40 minuter första gången.",
     "Räkna med 30–40 minuter första gången."),
    ("4bb4653f",
     "Tillverkaren anger 25–35 minuter första gången — grenarna öppnas lätt, "
     "men de är många.",
     "Räkna med 25–35 minuter första gången — grenarna öppnas lätt, men de är "
     "många."),
    ("c9c6b721",
     "Tillverkaren anger 25–30 minuter, och det är en rimlig siffra.",
     "Räkna med 25–30 minuter första gången."),
    ("d1769923",
     "Tillverkaren anger 20–25 minuter, vilket är kort för en gran med den här "
     "tätheten.",
     "Räkna med 20–25 minuter, vilket är kort för en gran med den här "
     "tätheten."),

    # ── Kaminer, brasor, värmare ───────────────────────────────────────────
    ("84baf336",
     "Väggfäste och skruvsats ingår för hängning, och tillverkaren anger ett "
     "separat inbyggnadsmått för den som vill ha kaminen infälld i en vägg "
     "eller en möbel.",
     "Väggfäste och skruvsats ingår för hängning, och det finns ett separat "
     "inbyggnadsmått för den som vill ha kaminen infälld i en vägg eller en "
     "möbel."),
    ("e3e1a4a9",
     "Väggfäste och skruvsats ingår, och tillverkaren anger ett separat "
     "inbyggnadsmått för infällning.",
     "Väggfäste och skruvsats ingår, och det finns ett separat inbyggnadsmått "
     "för infällning."),
    ("1f6f0ef9",
     "En öppen låga förbrukar syre, och tillverkaren anger själv att produkten "
     "ska användas i ett väl ventilerat utrymme.",
     "En öppen låga förbrukar syre, och brasan ska användas i ett väl "
     "ventilerat utrymme."),
    ("1f6f0ef9",
     "Tillverkaren anger uttryckligen att brasan varken är avsedd för matlagning "
     "eller som husets huvudsakliga värmekälla.",
     "Brasan är varken avsedd för matlagning eller som husets huvudsakliga "
     "värmekälla."),
    ("1f6f0ef9",
     "Tillverkaren anger att den varken är avsedd för matlagning eller som "
     "huvudsaklig värmekälla.",
     "Den är varken avsedd för matlagning eller som huvudsaklig värmekälla."),
    ("0b32c6fe",
     "Tillverkaren anger ingen kapslingsklass, så den hör hemma i torra rum.",
     "Ingen kapslingsklass är angiven, så den hör hemma i torra rum."),
    ("0b32c6fe",
     "Tillverkaren anger ingen kapslingsklass.",
     "Ingen kapslingsklass är angiven."),
    ("82a1756d",
     "Kapslingsklass anges inte av tillverkaren, så placera det i torra rum.",
     "Kapslingsklass anges inte, så placera det i torra rum."),
    ("7039bdb7",
     "Leverantörens paketlista tar bara upp själva gnistskyddet.",
     "Paketlistan tar bara upp själva gnistskyddet."),
    ("540c23cd",
     "Leverantören anger 20–25 kvadratmeter.",
     "Riktvärdet är 20–25 kvadratmeter."),
    ("c5feb43e",
     "Leverantören anger 13–18 kvadratmeter.",
     "Riktvärdet är 13–18 kvadratmeter."),
    ("88ebb094",
     "Leverantören anger 10–15 kvadratmeter.",
     "Riktvärdet är 10–15 kvadratmeter."),
    ("c93648cc",
     "Fronten är öppen — det sitter ingen glasruta i den, vilket tillverkaren "
     "anger på två ställen.",
     "Fronten är öppen — det sitter ingen glasruta i den."),
    ("c93648cc",
     "Tillverkaren beskriver produkten som huvudsakligen dekorativ och kallar "
     "värmen en bifunktion.",
     "Produkten är huvudsakligen dekorativ — värmen är en bifunktion."),
    ("c93648cc",
     "Tillverkaren kallar värmen en bifunktion och produkten huvudsakligen "
     "dekorativ.",
     "Värmen är en bifunktion och produkten huvudsakligen dekorativ."),
    ("c93648cc",
     "20–25 m² enligt tillverkaren",
     "20–25 m²"),
    ("f7d1f45e",
     "Det här är en inbyggnadsmodell och tillverkaren är tydlig: den monteras i "
     "en vägg av tegel eller betong, inte i gips.",
     "Det här är en inbyggnadsmodell: den monteras i en vägg av tegel eller "
     "betong, inte i gips."),
    ("f7d1f45e",
     "Tillverkaren anger tegel eller betong.",
     "Tegel eller betong — inte gips."),
    ("b2f457d7",
     "Tillverkaren anger värmeeffekten till 1 993 W och en uppvärmningsyta på "
     "omkring 20 m² — det räcker som komplement i ett vardagsrum, inte som "
     "husets huvudvärmekälla.",
     "Värmeeffekten är 1 993 W och uppvärmningsytan omkring 20 m² — det räcker "
     "som komplement i ett vardagsrum, inte som husets huvudvärmekälla."),
    ("b2f457d7",
     "Tillverkaren anger cirka 20 m² och en effekt på 1 993 W.",
     "Cirka 20 m² och en effekt på 1 993 W."),
]
