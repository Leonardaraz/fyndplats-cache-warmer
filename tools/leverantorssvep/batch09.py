# -*- coding: utf-8 -*-
"""Batch 9 i leverantörssvepet — singelsvansen: kaffe, väskor, tält, leksaker.

⚠️ Ordningen mellan par 35 och 36 är INTE valfri: det korta paret är en
   delsträng av det långa och måste därför köras EFTER det. Grinden fäller
   om de byter plats.
"""

PAR = [
    # ── Omtag från batch 8: taggen låg inne i citattecknen ────────────────
    ("kläder", "Leverantörens egen produktbild bär texten",
     "Produktbilden bär texten"),
    ("STÄD-kläder",
     "storleken, och de rekommenderar själva att man går ner ett steg.",
     "storleken, och rekommendationen är att gå ner ett steg."),

    # ── Färgnamn ──────────────────────────────────────────────────────────
    ("kläder", "Färgnamnen kommer från tillverkaren.",
     "Färgnamnen är kodnamn."),
    ("kläder",
     "Namnet kommer från leverantörens färgkod och beskriver inte färgen — "
     "bilden gör det.",
     "Namnet kommer från en färgkod och beskriver inte färgen — bilden gör "
     "det."),
    ("kläder",
     "Den tredje heter Fjäder beige hos leverantören, men är vit — en aning "
     "varm i tonen, utan att vara beige.",
     "Den tredje heter Fjäder beige, men är vit — en aning varm i tonen, utan "
     "att vara beige."),
    ("kläder",
     "Och avancerad grå säger ingenting alls om nyansen — det är "
     "leverantörens färgkod, och färgen är en vanlig mellangrå.",
     "Och avancerad grå säger ingenting alls om nyansen — det är en färgkod, "
     "och färgen är en vanlig mellangrå."),
    ("kläder",
     "Namnet kommer från leverantörens färgkod, och det finns inget blått i "
     "tyget.",
     "Namnet kommer från en färgkod, och det finns inget blått i tyget."),
    ("förvaring", " enligt leverantörens bild", ""),
    ("okänd", "Nej, även om ordet dyker upp i tillverkarens engelska namn.",
     "Nej, även om ordet dyker upp i det engelska originalnamnet."),
    ("okänd", "Leverantören avråder från det.", "Det rekommenderas inte."),
    ("okänd", "Leverantören rekommenderar en fot på minst 15 kg.",
     "Rekommendationen är en fot på minst 15 kg."),

    # ── Kaffe, kök, hushållsapparater ─────────────────────────────────────
    ("okänd", "Tillverkaren anger upp till 30 minuter på en laddning.",
     "En laddning räcker upp till 30 minuter."),
    ("okänd", "Tillverkaren anger ingen maxdiameter.",
     "Det finns ingen angiven maxdiameter."),
    ("okänd", "Tillverkaren anger 106 dB.", "Ljudnivån är 106 dB."),
    ("kaffe",
     "Tillverkaren anger temperaturlägen mellan 65 och 85 °C, alltså varmt "
     "hela vägen.",
     "Temperaturlägena ligger mellan 65 och 85 °C, alltså varmt hela vägen."),
    ("kaffe",
     "Tillverkarens egen tumregel är att hålla sig under nivå 3 för "
     "Nespresso-kapslar och över nivå 4 för Dolce Gusto.",
     "Tumregeln är att hålla sig under nivå 3 för Nespresso-kapslar och över "
     "nivå 4 för Dolce Gusto."),
    ("kaffe",
     "Tillverkaren anger att hetare vatten får mjölkpulvret att klumpa sig, "
     "och då blir drycken sämre än den behöver bli.",
     "Hetare vatten får mjölkpulvret att klumpa sig, och då blir drycken "
     "sämre än den behöver bli."),
    ("kaffe",
     "Det finns ett läge som ska växla mellan varmt och kallt, men det är "
     "svårfångat — i tillverkarens egen genomgång gick det inte att aktivera.",
     "Det finns ett läge som ska växla mellan varmt och kallt, men det är "
     "svårfångat — i produktgenomgången gick det inte att aktivera."),
    ("vattenblåsa",
     "Tillverkaren anger uttryckligen att blåsan inte är avsedd för "
     "dricksvatten, och en köpare beskriver att den luktar mjukgjord PVC när "
     "den är ny.",
     "Blåsan är uttryckligen inte avsedd för dricksvatten, och en köpare "
     "beskriver att den luktar mjukgjord PVC när den är ny."),
    ("okänd", "Tillverkaren gör kamouflagemodellen med armstöd och den svarta "
     "utan.",
     "Kamouflagemodellen har armstöd, den svarta inte."),

    # ── Spännband och väskor ──────────────────────────────────────────────
    ("spännband", "tillverkarens uppgifter och gäller per band",
     "angivna uppgifter och gäller per band"),
    ("väskor",
     "Tillverkaren själv märker dem 0,6, 1,6 och 2,4 cu.ft, men den siffran "
     "är väskans yttervolym inklusive skal och skum.",
     "De är märkta 0,6, 1,6 och 2,4 cu.ft, men den siffran är väskans "
     "yttervolym inklusive skal och skum."),
    ("väskor",
     "Tillverkaren klassar väskorna som IP67, vilket betyder dammtätt och "
     "tätt mot nedsänkning i en meters vattendjup i en halvtimme.",
     "Väskorna är klassade IP67, vilket betyder dammtätt och tätt mot "
     "nedsänkning i en meters vattendjup i en halvtimme."),
    ("väskor", "Tillverkarens cu.ft-tal är yttervolym.",
     "Cu.ft-talet är yttervolym."),
    ("väskor",
     "De flesta annonser återger tillverkarens cu.ft-tal, som beskriver "
     "väskans yttermått.",
     "De flesta annonser återger cu.ft-talet, som beskriver väskans "
     "yttermått."),

    # ── Instrument, hyllor, förvaring ─────────────────────────────────────
    ("handpan",
     "Tillverkaren anger 440 Hz för nio- och tolvtonsmodellen men 432 Hz för "
     "tiotonsmodellen.",
     "Stämningen är 440 Hz för nio- och tolvtonsmodellen men 432 Hz för "
     "tiotonsmodellen."),
    ("okänd", "Tillverkaren anger 0,9 kg som lägsta vikt.",
     "Lägsta vikt är 0,9 kg."),
    ("hylla",
     "tillverkaren anger inget väggfäste, och en hylla som är 66 cm hög och "
     "bara 30 cm djup kan tippa",
     "det finns inget väggfäste, och en hylla som är 66 cm hög och bara "
     "30 cm djup kan tippa"),
    ("okänd", "Tillverkaren anger att monteringsverktyg inte följer med.",
     "Monteringsverktyg följer inte med."),
    ("okänd", "Nej, tillverkaren anger inget.", "Nej, inget är angivet."),
    ("låda",
     "Något hänglås ingår inte och tillverkaren anger inte vilken "
     "bygeltjocklek haspen tar.",
     "Något hänglås ingår inte, och det är inte angivet vilken bygeltjocklek "
     "haspen tar."),
    ("låda",
     "Tillverkaren anger 50 kg som maxlast för innehållet och säger ingenting "
     "om att sitta på locket – använd det som yta, inte som pall.",
     "Maxlasten för innehållet är 50 kg, och ingenting sägs om att sitta på "
     "locket – använd det som yta, inte som pall."),
    ("låda",
     "Tillverkaren anger bara 50 kg för innehållet och ingen belastning för "
     "locket.",
     "Det anges bara 50 kg för innehållet och ingen belastning för locket."),
    ("leksak",
     "Tillverkaren anger EN71-1, EN71-2 och EN71-3 samt EMC, LVD och RoHS.",
     "Angivna standarder är EN71-1, EN71-2 och EN71-3 samt EMC, LVD och "
     "RoHS."),
    ("säng", "Tillverkaren anger ingen, och sängen visas utan.",
     "Ingen är angiven, och sängen visas utan."),

    # ── ☠️ Långt par FÖRE kort par: det korta är en delsträng ──────────────
    ("brits",
     "Duken är vattenavvisande och skyddar mot sol och insekter, men "
     "tillverkaren rekommenderar den inte i regn.",
     "Duken är vattenavvisande och skyddar mot sol och insekter, men den "
     "rekommenderas inte i regn."),
    ("brits", "tillverkaren rekommenderar den inte i regn",
     "den rekommenderas inte i regn"),

    ("okänd", "Tillverkaren rekommenderar från 6 år.",
     "Rekommenderad ålder är från 6 år."),
    ("tält",
     "Tillverkaren rekommenderar minst 200 × 140 cm golvyta, alltså "
     "2,8 kvadratmeter, för att man ska kunna dra ut pallarna och sitta "
     "bekvämt.",
     "Rekommendationen är minst 200 × 140 cm golvyta, alltså "
     "2,8 kvadratmeter, för att man ska kunna dra ut pallarna och sitta "
     "bekvämt."),
    ("tält", "Tillverkarens egen kapacitetsskiss visar fem liggplatser à "
     "80 cm.",
     "Kapacitetsskissen visar fem liggplatser à 80 cm."),
    ("pergola",
     "Specifikationen anger 595 cm längd medan tillverkarens egen ritning "
     "står på 600 cm.",
     "Specifikationen anger 595 cm längd medan måttritningen står på 600 cm."),
    ("pergola",
     "Handskar ingår, och tillverkaren varnar uttryckligen för att montera i "
     "blåst.",
     "Handskar ingår, och det finns en uttrycklig varning för att montera i "
     "blåst."),
    ("okänd", "30 kg per kvadratmeter är den gräns tillverkaren anger.",
     "Gränsen är 30 kg per kvadratmeter."),
    ("okänd", "Tillverkaren anger 200 kg på produktbilden och 240 kg i "
     "databladet.",
     "Produktbilden anger 200 kg och databladet 240 kg."),
    ("okänd", "Tillverkaren anger UPF 30+.", "UPF-klassen är 30+."),
    ("klösträd",
     "Det är ett medvetet val från tillverkaren: ett väggmonterat klösträd "
     "syns alltid, och grått försvinner mot de flesta väggar på ett sätt som "
     "beige eller mönstrat inte gör.",
     "Det är ett medvetet val: ett väggmonterat klösträd syns alltid, och "
     "grått försvinner mot de flesta väggar på ett sätt som beige eller "
     "mönstrat inte gör."),
    ("okänd", "Tillverkaren anger inget antal.", "Inget antal är angivet."),
    ("bana",
     "Rökeffekten, de lysande ögonen och boosten i banan drar ström, men "
     "tillverkaren anger varken typ eller antal — och de ingår inte.",
     "Rökeffekten, de lysande ögonen och boosten i banan drar ström, men "
     "varken typ eller antal är angivet — och batterierna ingår inte."),
    ("leksak",
     "Tillverkaren skriver inte hur mycket den rymmer eller hur länge en "
     "påfyllning räcker, så låt en vuxen sköta påfyllningen.",
     "Det står inte hur mycket den rymmer eller hur länge en påfyllning "
     "räcker, så låt en vuxen sköta påfyllningen."),
    ("byggsats", "Tillverkaren märker satsen från 14 år.",
     "Satsen är märkt från 14 år."),
    ("spel", "Speltiden är tillverkarens uppgift.",
     "Speltiden är en uppgift vi inte mätt själva."),
    ("spel",
     "Cirka fyra timmars speltid och åtta omgångar per laddning är "
     "tillverkarens egen mätning.",
     "Cirka fyra timmars speltid och åtta omgångar per laddning är en angiven "
     "uppgift, inte vår mätning."),
    ("träning",
     "Tillverkaren anger inga hopfällda mått, men ryggstödet på 74,5 cm och "
     "en bredd på 62,5 cm över fötterna ger en uppfattning om hur mycket "
     "plats den tar.",
     "Det finns inga angivna hopfällda mått, men ryggstödet på 74,5 cm och en "
     "bredd på 62,5 cm över fötterna ger en uppfattning om hur mycket plats "
     "den tar."),
    ("träning", "(tillverkarens uppgift)", "(angiven uppgift)"),
    ("träning", "Tillverkaren anger 350 kg maxbelastning.",
     "Maxbelastningen är 350 kg."),
    ("okänd", "Tillverkaren anger det inte, och vi gissar inte.",
     "Det är inte angivet, och vi gissar inte."),
]
