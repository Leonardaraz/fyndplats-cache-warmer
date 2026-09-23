# -*- coding: utf-8 -*-
"""Leverantörssvepet — omskrivningar, batch 1.

☠️ Mot kunden är VI leverantören. Varje par nedan tar bort en hänvisning till
   någon annan UTAN att tappa faktumet. Paren appliceras med EXAKT
   strängmatchning över hela katalogen, så flera färgsyskon som delar samma
   mening rättas i samma svep.

⚠️ `gammal` måste vara SAMMANHÄNGANDE inne i ett textnod — meningar som börjar
   direkt efter en <h2> ser hopslagna ut i den taggstrippade texten men är det
   inte i HTML:en. Därför riktas de paren mot delen EFTER rubriken.
"""

PAR = [
 # id           gammal                                              ny
 ("667ca8f9",
  "Leverantören anger tjugo minuter för monteringen",
  "Monteringen tar tjugo minuter"),

 ("8607c452",
  "Leverantörens egna bilder visar det både vid ett badkar och som förvaring "
  "längs en sovrumsvägg",
  "Skåpet fungerar både vid ett badkar och som förvaring längs en sovrumsvägg"),

 ("730c4df6",
  "Leverantörens egna bilder visar skåpet både över ett badrumstvättställ och "
  "på en köksvägg",
  "Skåpet sitter lika bra över ett badrumstvättställ som på en köksvägg"),

 # Vespa-scootrarna, två färgsyskon. Ingen påhittad märkning — bara faktumet.
 ("69042231/f24ea348",
  "Leverantören anger 18–36 månader och en maxvikt på 25 kg för föraren.",
  "Åldersspannet är 18–36 månader och maxvikten 25 kg för föraren."),
 ("69042231/f24ea348",
  "Leverantören anger 18–36 månader, med en maxvikt på 25 kg för föraren.",
  "Åldersspannet är 18–36 månader, med en maxvikt på 25 kg för föraren."),

 # Gokarterna: märkningen sitter FYSISKT på fordonet — det faktumet behålls,
 # bara ägandet av det stryks.
 ("ea640f31/08bdee9f/39a377f6",
  "Tillverkarens märkning på fordonet anger",
  "Märkningen på fordonet anger"),
 ("ea640f31/08bdee9f/39a377f6",
  "Tillverkarens märkning anger 8–12 år",
  "Märkningen på fordonet anger 8–12 år"),

 ("c409deea/693aa4d2",
  "Leverantören anger inomhusbruk och skyddat utomhusläge under tak.",
  "Dekorationen är gjord för inomhusbruk och skyddat utomhusläge under tak."),

 ("143403ea",
  "leverantörens egen måttritning ställer spöket",
  "måttritningen ställer spöket"),
 ("143403ea/6c785bc4",
  "och leverantören avråder från att låta den stå ute i oväder",
  "och den ska inte stå ute i oväder"),

 ("7f806a07",
  "Leverantören anger metall som material och att den pulverlackerade ramen "
  "är väderbeständig.",
  "Materialet är metall, och den pulverlackerade ramen är väderbeständig."),
 ("7f806a07",
  "Leverantören anger att ramen är väderbeständig och visar stället på altan "
  "och grus.",
  "Ramen är väderbeständig, och stället fungerar både på altan och på grus."),

 ("21b6dcbe",
  "och leverantören anger uttryckligen att stället går att",
  "och stället går att"),
 ("21b6dcbe",
  "Leverantören anger att den pulverlackerade ytan är rostskyddad och att "
  "stället är lämpligt även för utomhusbruk.",
  "Den pulverlackerade ytan är rostskyddad, och stället är lämpligt även för "
  "utomhusbruk."),
 ("21b6dcbe",
  "Ja, det är just en av användningarna leverantören pekar ut.",
  "Ja, det är just en av användningarna."),

 ("0ae1b285",
  "Leverantören räknar med 30–45 minuter för att forma granen färdigt.",
  "Räkna med 30–45 minuter för att forma granen färdigt."),
 ("0ae1b285",
  "men leverantören räknar med 30–45 minuter för att böja ut",
  "men räkna med 30–45 minuter för att böja ut"),
 ("0ae1b285",
  "Leverantören anger att materialet är flamhämmande",
  "Materialet är flamhämmande"),
]
