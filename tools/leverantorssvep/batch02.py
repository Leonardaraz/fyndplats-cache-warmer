# -*- coding: utf-8 -*-
"""Leverantörssvepet — batch 2.

⚠️ ORDNING SPELAR ROLL där en gammal sträng är prefix till en annan. De längre
   paren står först, så den kortare inte äter upp den längres text.

☠️ Tom `ny` = MENINGEN STRYKS. Det gäller "vi vet inte"-familjen, som
   runbooken förbjuder rakt av: vet vi inte — utelämna, skriv inte att vi inte
   vet.
"""

PAR = [
 ("87c41ed3",
  "Leverantören anger förinställda ljusmönster utöver fast sken, så granen kan "
  "antingen stå stilla lysande eller blinka.",
  "Granen har förinställda ljusmönster utöver fast sken, så den kan antingen "
  "stå stilla lysande eller blinka."),
 ("87c41ed3",   # ☠️ "vi vet inte" — rådet står kvar, hedgen stryks
  "Håll levande ljus och värmekällor på avstånd – leverantören anger inget "
  "flamskydd för den här modellen.",
  "Håll levande ljus och värmekällor på avstånd."),
 ("87c41ed3",
  "Leverantören anger både fast sken och förinställda ljusmönster, så du väljer själv.",
  "Granen har både fast sken och förinställda ljusmönster, så du väljer själv."),

 ("886d9e37",
  "Leverantören räknar med 15–20 minuter för att böja ut alla toppar",
  "Räkna med 15–20 minuter för att böja ut alla toppar"),
 ("886d9e37",
  "Leverantören anger att de övre grenarna är brandbeständiga – alltså inte hela granen.",
  "De övre grenarna är brandbeständiga – alltså inte hela granen."),
 ("886d9e37",
  "Leverantören anger att de övre grenarna är brandbeständiga.",
  "De övre grenarna är brandbeständiga."),
 ("886d9e37",
  "Det är ett medvetet val från leverantören och det som gör modellen billigare",
  "Det är ett medvetet val och det som gör modellen billigare"),

 ("ccbdf68f",
  "Leverantören anger 15–20 m² som uppvärmningsyta, vilket motsvarar",
  "Kaminen värmer 15–20 m², vilket motsvarar"),
 ("ccbdf68f", "Leverantören anger 15–20 m².", "Kaminen värmer 15–20 m²."),

 ("9d686a82",
  "Leverantören anger 18–56 månader och en rekommenderad kroppslängd på "
  "80–100 cm, med en maxvikt på 25 kg för föraren.",
  "Åldersspannet är 18–56 månader med en rekommenderad kroppslängd på "
  "80–100 cm, och maxvikten är 25 kg för föraren."),
 ("9d686a82",
  "Leverantören anger 18–56 månader och kroppslängd 80–100 cm, med maxvikt "
  "25 kg för föraren.",
  "Åldersspannet är 18–56 månader och kroppslängden 80–100 cm, med maxvikt "
  "25 kg för föraren."),

 ("0b008ef0",
  "Tillverkaren är tydlig på en punkt: ett barn ska alltid ha uppsikt av en "
  "vuxen när karten körs.",
  "En sak är viktigare än allt annat: ett barn ska alltid ha uppsikt av en "
  "vuxen när karten körs."),
 ("0b008ef0",
  "Det är tillverkarens uttryckliga anvisning och den viktigaste raden här.",
  "Det är den viktigaste raden här."),
 ("0b008ef0",
  "Tillverkaren rekommenderar 8–12 år, och maxlasten är 50 kg.",
  "Karten är avsedd för 8–12 år, och maxlasten är 50 kg."),

 ("20169ffa",
  "Ramen är måttsatt för 120 kg och leverantören anger uttryckligen att pallen "
  "är avsedd för en person.",
  "Ramen är måttsatt för 120 kg, och pallen är avsedd för en person i taget."),
 ("20169ffa",
  "Leverantören pekar själv ut den som sminkpall och som sittplats i hallen "
  "när man tar på skorna.",
  "Den fungerar lika bra som sminkpall och som sittplats i hallen när man tar "
  "på skorna."),
 ("20169ffa",
  "Leverantören beskriver konstruktionen som enkel med tydlig anvisning.",
  "Konstruktionen är enkel och anvisningen tydlig."),

 ("9decd8db",
  "Leverantören anger måttet 44 × 32 × 3 cm – tre centimeter",
  "Facket mäter 44 × 32 × 3 cm – tre centimeter"),
 ("9decd8db", "Leverantören anger 44 × 32 × 3 cm.", "Facket mäter 44 × 32 × 3 cm."),
 ("9decd8db",
  "Leverantören beskriver monteringen som enkel med vanliga verktyg.",
  "Monteringen är enkel och görs med vanliga verktyg."),

 ("e0a73975",
  "Ja, och leverantören visar den så på en av produktbilderna.",
  "Ja, och en av produktbilderna visar den så."),
 ("69387273",
  "och leverantören lägger med en skruvnyckel i kartongen",
  "och en skruvnyckel ligger med i kartongen"),

 ("a0386ca3",   # ☠️ FÖRBJUDEN: att skriva att vi inte vet. Meningen stryks.
  "Leverantören anger inte fackets mått, så vi gör det inte heller.", ""),
 ("a0386ca3",
  "Leverantören anger inga mått för facket, bara att det finns under sitsen.",
  "Facket sitter under sitsen."),
 ("a0386ca3",
  "Leverantören beskriver monteringen som enkel med bildanvisning.",
  "Monteringen är enkel och följer en bildanvisning."),

 ("3d71da2b", "Leverantören anger 60 kg för skåpet.", "Skåpet bär 60 kg."),
 ("50a64a95",
  "Leverantören anger 150 kg bärighet för hela vagnen och 20 kg per låda",
  "Vagnen bär 150 kg totalt och 20 kg per låda"),

 ("52ac6a79",
  "Leverantörens tumregel är en liter per centimeter fisk: en fisk på 5 cm "
  "behöver 5 liter.",
  "Tumregeln är en liter per centimeter fisk: en fisk på 5 cm behöver 5 liter."),
 ("52ac6a79",
  "Leverantörens tumregel är en liter vatten per centimeter fisk.",
  "Tumregeln är en liter vatten per centimeter fisk."),

 ("adfc4c98",
  "Tillverkarens anvisning är att byta filternätet en gång i veckan och fylla "
  "på filtermaterial",
  "Byt filternätet en gång i veckan och fyll på filtermaterial"),
 ("adfc4c98",
  "Tillverkaren anger tumregeln en centimeter fisk per liter vatten, alltså "
  "ungefär 41 cm sammanlagd fisklängd.",
  "Tumregeln är en centimeter fisk per liter vatten, alltså ungefär 41 cm "
  "sammanlagd fisklängd."),
]
