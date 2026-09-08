# -*- coding: utf-8 -*-
"""Batch 4 i leverantörssvepet — djurbostäder, klösträd, lampor, gym.

☠️ Texten skrivs i EN FIL och grindas innan den lämnar chatten.
⚠️ Meningar som spänner över en TAGG kapas: " ," och " ." i den avtaggade
   texten avslöjar var taggen låg, och paret får inte gå över den punkten.
"""

PAR = [
    # ── Julgran, kamin, pianobänk: spec-celler som Fas A inte nådde ────────
    ("886d9e37",
     "Leverantören anger att de övre grenarna är brandbeständiga – alltså inte "
     "hela granen.",
     "Bara de övre grenarna är brandbeständiga – alltså inte hela granen."),
    ("886d9e37", "15–20 minuter enligt leverantören", "15–20 minuter"),
    ("ccbdf68f", "15–20 m² enligt leverantören", "15–20 m²"),
    ("9decd8db", "44 × 32 × 3 cm enligt leverantören", "44 × 32 × 3 cm"),
    ("a0e9bbba", "5 cm enligt tillverkaren", "5 cm"),
    ("9cc6d5a9", "sockeltyp anges inte av leverantören", "sockeltyp anges inte"),

    # ── Akvarium ───────────────────────────────────────────────────────────
    ("adfc4c98",
     "Tillverkaren anger att veckovis byte av filternätet plus påfyllt "
     "filtermaterial och nitrifikationsbakterier håller kvaliteten utan täta "
     "vattenbyten.",
     "Veckovis byte av filternätet plus påfyllt filtermaterial och "
     "nitrifikationsbakterier håller kvaliteten utan täta vattenbyten."),
    ("adfc4c98",
     "Tumregeln tillverkaren anger är en centimeter fisk per liter vatten, "
     "alltså cirka 41 cm sammanlagt.",
     "Tumregeln är en centimeter fisk per liter vatten, alltså cirka 41 cm "
     "sammanlagt."),

    # ── Djurbostäder ───────────────────────────────────────────────────────
    ("9d2d4074",
     "Ja, leverantören anger 60–80 minuter.",
     "Ja, räkna med 60–80 minuter."),
    ("691dcbdd",
     "Leverantören anger 100–120 minuter för två personer.",
     "Räkna med 100–120 minuter för två personer."),
    ("1c28e09c",
     "Leverantören anger att hagen är förberedd för automatisk dörr.",
     "Hagen är förberedd för automatisk dörr."),
    ("a80e19ae",
     "Tillverkaren anger två höns, och det är husets inre mått som sätter "
     "gränsen: 71 × 55 cm golvyta och 93 cm höjd.",
     "Huset är avsett för två höns, och det är de inre måtten som sätter "
     "gränsen: 71 × 55 cm golvyta och 93 cm höjd."),
    ("a80e19ae",
     "Hålen är förborrade och tillverkaren räknar med ungefär 30 minuter.",
     "Hålen är förborrade och monteringen tar ungefär 30 minuter."),
    ("a80e19ae",
     "Ja, tillverkaren anger kaniner och ankor som alternativ till höns.",
     "Ja, kaniner och ankor fungerar också."),
    ("290af543",
     "Tillverkaren räknar med att en person monterar huset på cirka två timmar.",
     "En person monterar huset på cirka två timmar."),
    ("290af543",
     "Tillverkaren anger två till tre kaniner.",
     "Huset är avsett för två till tre kaniner."),
    ("fee40f78",
     "Tillverkarens egna bilder visar illrar i den, och det är den djurgruppen "
     "måtten är gjorda för.",
     "Bilderna visar illrar i den, och det är den djurgruppen måtten är gjorda "
     "för."),
    ("fee40f78",
     "Delningen är mätt i tillverkarens egen måttritning, som ligger bland "
     "bilderna.",
     "Delningen är mätt i måttritningen, som ligger bland bilderna."),
    ("42d80550",
     "Det betyder att golvytan förblir fri och att rören går att bygga om — "
     "tillverkaren anger att uppsättningen är anpassningsbar.",
     "Det betyder att golvytan förblir fri och att rören går att bygga om — "
     "uppsättningen är anpassningsbar."),
    ("42d80550",
     "Delningen är också det som avgör vilka djur buren passar — tillverkaren "
     "anger hamster och ökenråtta.",
     "Delningen är också det som avgör vilka djur buren passar — den är avsedd "
     "för hamster och ökenråtta."),
    ("42d80550",
     "Tillverkaren anger hamster och ökenråtta.",
     "Buren är avsedd för hamster och ökenråtta."),
    ("42d80550",
     "Tillverkaren anger att uppsättningen dessutom går att anpassa.",
     "Uppsättningen går dessutom att anpassa."),
    ("b3e20f91",
     "Tillverkaren rekommenderar ett hönshus på ungefär 120 × 140 × 100 "
     "centimeter som ställs inne i gården.",
     "Ett hönshus på ungefär 120 × 140 × 100 centimeter ställs inne i gården."),
    ("b3e20f91",
     "Sovhuset ställs inne i den — tillverkaren rekommenderar ett på ungefär "
     "120 × 140 × 100 centimeter.",
     "Sovhuset ställs inne i den — räkna med ett på ungefär "
     "120 × 140 × 100 centimeter."),
    ("a0e9bbba",
     "Tillverkaren anger ankor.",
     "Huset är avsett för ankor."),

    # ── Katthus, klösträd, kattbäddar ──────────────────────────────────────
    ("48a5c9e1",
     "Tillverkaren anger den för tre till fyra katter under 10 kg.",
     "Den är avsedd för tre till fyra katter under 10 kg."),
    ("48a5c9e1",
     "Tillverkaren anger maxlasten till 15 kg per plan.",
     "Maxlasten är 15 kg per plan."),
    ("48a5c9e1",
     "Tillverkaren anger tre till fyra katter under 10 kg.",
     "Den rymmer tre till fyra katter under 10 kg."),
    ("210ef9bf",
     "Leverantören anger upp till tre, med max 6 kilo per katt.",
     "Den rymmer upp till tre katter, med max 6 kilo per katt."),
    ("657051e8",
     "Det är en siffra få leverantörer anger, och den är värd att titta på: "
     "tunnare skivor svajar under en katt som landar, tjockare håller planet "
     "plant över tid.",
     "Det är en siffra som sällan redovisas, och den är värd att titta på: "
     "tunnare skivor svajar under en katt som landar, tjockare håller planet "
     "plant över tid."),
    ("657051e8",
     "Leverantören anger upp till 6 kilo per katt.",
     "Maxvikten är 6 kilo per katt."),
    ("84d4f368",
     "Invändigt är huset 78 × 44 × 45 cm och tillverkaren anger det för en till "
     "två katter på upp till 12 kg vardera.",
     "Invändigt är huset 78 × 44 × 45 cm och rymmer en till två katter på upp "
     "till 12 kg vardera."),
    ("84d4f368",
     "Tillverkaren anger det för en till två katter på upp till 12 kg vardera.",
     "Det är avsett för en till två katter på upp till 12 kg vardera."),
    ("a34f54b4",
     "Tillverkaren anger maxlasten på plattformen till 10 kg, vilket räcker för "
     "en vuxen katt med marginal.",
     "Maxlasten på plattformen är 10 kg, vilket räcker för en vuxen katt med "
     "marginal."),
    ("a34f54b4",
     "Tillverkaren anger maxlasten till 10 kg.",
     "Maxlasten är 10 kg."),
    ("ad90a1cc",
     "Leverantören anger upp till 4 kg.",
     "Maxvikten är 4 kg."),
    ("fb63ea3d",
     "Innermåttet är 51 × 34 × 31,5 cm och tillverkaren anger huset för katt "
     "upp till 6 kg.",
     "Innermåttet är 51 × 34 × 31,5 cm och huset är avsett för katt upp till "
     "6 kg."),
    ("fb63ea3d",
     "Tillverkaren anger huset för katt upp till 6 kg.",
     "Huset är avsett för katt upp till 6 kg."),
    ("bd476b1e",
     "Leverantören anger en till två katter.",
     "Den rymmer en till två katter."),
    ("f6e3098e",
     "Leverantörens uppgifter om vikt går isär, så vi anger ingen maxlast här.",
     "Viktuppgifterna går isär, så vi anger ingen maxlast här."),
    ("71c95ecf",
     "Leverantören anger två katter på upp till 5 kilo var.",
     "Den rymmer två katter på upp till 5 kilo var."),
    ("be8cb6e3",
     "Leverantören anger katter upp till 5 kilo.",
     "Maxvikten är 5 kilo per katt."),
    ("73cb432c",
     "Leverantören anger katter upp till 5 kg.",
     "Maxvikten är 5 kg per katt."),
    ("165471af",
     "Leverantören anger uttryckligen att den tjocka kudden inte är tvättbar — "
     "borsta av den och vädra den i stället.",
     "Den tjocka kudden är uttryckligen inte tvättbar — borsta av den och "
     "vädra den i stället."),
    ("1ed0d9cb",
     "Leverantören anger att den tjocka mattan inte är tvättbar.",
     "Den tjocka mattan är inte tvättbar."),
    ("92ac9101",
     "Tillverkaren rekommenderar därför uttryckligen att trädet ställs i ett "
     "hörn, eller att något tungt läggs på bottenplanet.",
     "Ställ därför trädet i ett hörn, eller lägg något tungt på bottenplanet."),
    ("92ac9101",
     "Det här är inget vi lägger till — det står i tillverkarens egen "
     "anvisning, och det är ärligare att säga det före köpet än att låta någon "
     "upptäcka det efteråt.",
     "Det här är inget vi lägger till — det står i monteringsanvisningen, och "
     "det är ärligare att säga det före köpet än att låta någon upptäcka det "
     "efteråt."),
    ("92ac9101",
     "Ställ trädet i ett hörn eller lägg något tungt på bottenplanet — "
     "tillverkaren anger det uttryckligen, eftersom 173 cm på en fot av "
     "49 × 49 cm är hög och smal.",
     "Ställ trädet i ett hörn eller lägg något tungt på bottenplanet — det står "
     "uttryckligen i anvisningen, eftersom 173 cm på en fot av 49 × 49 cm är "
     "hög och smal."),
    ("92ac9101",
     "Inte om det står i ett hörn eller mot en vägg, vilket tillverkaren "
     "rekommenderar.",
     "Inte om det står i ett hörn eller mot en vägg, vilket anvisningen "
     "rekommenderar."),
    ("92ac9101",
     "Hörnplacering är tillverkarens rekommenderade lösning.",
     "Hörnplacering är den rekommenderade lösningen."),

    # ── Hund ───────────────────────────────────────────────────────────────
    ("a8e376e7",
     "Vi anger inget invändigt mått: leverantörens siffra går inte ihop med "
     "yttermåttet, och vi publicerar hellre ingen siffra än en som inte "
     "stämmer.",
     "Vi anger inget invändigt mått: uppgiften går inte ihop med yttermåttet, "
     "och vi publicerar hellre ingen siffra än en som inte stämmer."),
    ("2b7853e9",
     "Leverantören är tydlig med att en otränad hund ska följas av sin ägare "
     "flera pass innan den går vippan själv.",
     "En otränad hund ska följas av sin ägare flera pass innan den går vippan "
     "själv."),

    # ── Vitvaror ───────────────────────────────────────────────────────────
    ("6b8978ce",
     "Tillverkaren anger 289 kWh per år vid normal användning.",
     "Förbrukningen är 289 kWh per år vid normal användning."),
    ("6b8978ce",
     "Ja, tillverkaren rekommenderar det.",
     "Ja, det rekommenderas."),

    # ── Belysning ──────────────────────────────────────────────────────────
    ("66eaa970",
     "Så länge anger leverantören att LED-modulen håller.",
     "Så länge är LED-modulen beräknad att hålla."),
    ("b964138a",
     "Leverantören anger ingen dimfunktion.",
     "Armaturen har ingen dimfunktion."),
    ("9cc6d5a9",
     "Kontrollera sockeltypen i den medföljande manualen innan du köper "
     "ljuskällor — leverantören anger effekten men inte sockeln.",
     "Kontrollera sockeltypen i den medföljande manualen innan du köper "
     "ljuskällor — effekten är angiven men inte sockeln."),
    ("a9477c1f",
     "Leverantören är uttrycklig på den punkten: armaturen kan växla mellan "
     "3000 K, 4000 K och 6500 K, men den är inte dimbar.",
     "Det är en viktig skillnad: armaturen kan växla mellan 3000 K, 4000 K och "
     "6500 K, men den är inte dimbar."),
    ("a9477c1f",
     "Den här armaturen ansluts med fast kabel, och leverantören anger "
     "uttryckligen att installationen ska göras av fackman.",
     "Den här armaturen ansluts med fast kabel, och installationen ska göras av "
     "fackman."),
    ("a9477c1f",
     "Den här armaturen ansluts med fast kabel och leverantören anger att "
     "installationen ska göras av fackman — har du ingen färdig "
     "anslutningspunkt är det elektriker som gäller.",
     "Den här armaturen ansluts med fast kabel och installationen ska göras av "
     "fackman — har du ingen färdig anslutningspunkt är det elektriker som "
     "gäller."),
    ("a9477c1f",
     "Leverantören anger fast kabelanslutning och professionell installation.",
     "Fast kabelanslutning och professionell installation krävs."),
    ("6b57083d",
     "Leverantören anger ingen kapslingsklass, så använd dem under tak och ta "
     "in dem över natten.",
     "Ingen kapslingsklass är angiven, så använd dem under tak och ta in dem "
     "över natten."),
    ("7695192b",
     "Klassen är tillverkarens uppgift och gäller den inbyggda LED:n.",
     "Klassen gäller den inbyggda LED:n."),

    # ── Gym ────────────────────────────────────────────────────────────────
    ("9a4f19ea",
     "och tillverkaren anger motståndet till upp till 120 kilo genom blockets "
     "utväxling.",
     "och motståndet går upp till 120 kilo genom blockets utväxling."),
    ("de64bbc8",
     "Ett dipbälte med vikt är möjligt rent fysiskt men tillverkaren anger "
     "ingen extra belastning, så gör det på egen risk.",
     "Ett dipbälte med vikt är möjligt rent fysiskt men ingen extra belastning "
     "är angiven, så gör det på egen risk."),
    ("de2a4e07",
     "Tillverkaren anger det spannet, vilket är värt att läsa innan du "
     "beställer: en station som är för hög gör att fötterna inte når golvet i "
     "sittande övningar.",
     "Det spannet är värt att läsa innan du beställer: en station som är för "
     "hög gör att fötterna inte når golvet i sittande övningar."),
    ("de2a4e07",
     "Tillverkaren anger 160–200 centimeter.",
     "Stationen är byggd för 160–200 centimeter."),
    ("b3c7c0a3",
     "Tillverkaren anger motorn som tystgående — poängen är att den ska gå att "
     "använda under ett möte eller bredvid någon som ser på tv.",
     "Motorn är tystgående — poängen är att den ska gå att använda under ett "
     "möte eller bredvid någon som ser på tv."),
    ("b3c7c0a3",
     "det står uttryckligen i tillverkarens anvisning och handlar om "
     "stabiliteten.",
     "det står uttryckligen i anvisningen och handlar om stabiliteten."),
    ("b3c7c0a3",
     "Tillverkaren anger sittande användning, av stabilitetsskäl.",
     "Maskinen är avsedd för sittande användning, av stabilitetsskäl."),
]
