// lib/category-content.ts
// Redaktionellt innehåll (intro-text + FAQ) per KATEGORI, för att ge
// /kategori/<slug>-sidorna riktig brödtext och long-tail-SEO i stället för
// bara en produktlistning (audit 2026-06-24, "tunn kategoritext").
//
// UTÖKAD 2026-08-12: tidigare hade bara de 9 huvudkategorierna innehåll — de
// 27 underkategorierna renderade noll ord egen text och såg för Google ut som
// varianter av /alla-produkter. Nu har alla 36 live-kategorier innehåll, och
// gaten på `parentId === null` är borttagen i page.tsx: KARTAN är gaten, så en
// kategori får text exakt när den fått en post här.
//
// NYCKEL = exakt live-SLUG (verifierat mot www.fyndplats.se/sitemap.xml),
// INTE namn — slugs är stabila och unika, så ingen åäö-/"&"-matchning kan slå fel.
// REA/Populära och okända kategorier saknas medvetet → inget block (oförändrat).
// En kategori som ännu inte är live (t.ex. Mode efter Kina-utfasningen) renderar
// inget förrän den får ≥1 synlig produkt och sidan slutar redirecta — då dyker
// innehållet upp automatiskt (self-revive-vänligt).
//
// SANNINGSKRAV: texterna beskriver det sortiment som FAKTISKT ligger i kategorin
// (avstämt mot live-sidorna 2026-08-12). Skriv aldrig om produkttyper vi inte
// säljer — det ger besvikna besökare och studsar som Google mäter.
//
// Innehållet är medvetet UNIKT per kategori (egen P1/P2 + egna frågor) för att
// undvika duplicerad boilerplate; de gemensamma trygghets-/fraktfakta är
// omformulerade per kategori. Alla påståenden är sanna för Fyndplats: EU-lager
// med 3–7 arbetsdagars leverans, fri frakt över 499 kr, Klarna, 30 dagars öppet
// köp, svensk kundtjänst som svarar inom 24 h på vardagar.

export type CategoryContent = {
  intro: string[]; // stycken (~150–200 ord totalt)
  faq: { q: string; a: string }[]; // 3 frågor per kategori
};

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "elektronik-tillbehor": {
    intro: [
      "Elektronik och smarta tillbehör ska göra vardagen enklare – inte krångligare. Hos Fyndplats hittar du noga utvalda prylar inom mobiltillbehör, laddare och kablar, dator och gaming samt hörlurar och ljud, till priser som inte sticker i ögonen. Vi väljer produkter som faktiskt håller måttet: laddare med rätt effekt, kablar i hållbara material och ljudtillbehör som låter bättre än prislappen antyder.",
      "När du handlar elektronik lönar det sig att tänka på kompatibilitet och anslutningar. Kontrollera vilken kontakt din enhet använder (USB-C, Lightning eller micro-USB), hur många watt din laddare behöver leverera och om tillbehöret ska tåla att slängas i väskan varje dag. I varje produktbeskrivning samlar vi specifikationerna så att du snabbt ser om prylen passar just din telefon, dator eller hörlur.",
      "Alla beställningar skickas från EU-lager med leverans inom 3–7 arbetsdagar, och du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag att ett tillbehör passar min telefon eller dator?",
        a: "Kolla anslutningstypen (USB-C, Lightning eller micro-USB) och eventuell modellkompatibilitet i produktbeskrivningen. Vi listar specifikationerna för varje produkt – är du osäker svarar vår svenska kundtjänst normalt inom 24 timmar på vardagar.",
      },
      {
        q: "Hur lång är leveranstiden på elektronik?",
        a: "Vi skickar från EU-lager, vilket ger en leveranstid på 3–7 arbetsdagar. Du får en spårbar leverans och kan följa paketet hela vägen hem.",
      },
      {
        q: "Vad gäller om en pryl inte fungerar som tänkt?",
        a: "Du har alltid 30 dagars öppet köp. Skulle något vara fel eller inte motsvara beskrivningen löser vi det – hör av dig till kundtjänst så hjälper vi dig vidare.",
      },
    ],
  },

  "hem-inredning": {
    intro: [
      "Ett hem blir personligt i detaljerna. Hos Fyndplats samlar vi prisvärda fynd för hela hemmet – belysning, förvaring och organisering, dekoration, badrum och hemtextil, smarta hushållsapparater och praktiska verktyg för hemmafixaren. Oavsett om du vill fräscha upp ett rum eller lösa ett vardagsproblem hittar du noga utvalda produkter som gör skillnad utan att kosta en förmögenhet.",
      "Tänk på rummets mått och ljus innan du köper. En golvlampa eller stämningsfull belysning sätter tonen i vardagsrummet, medan förvaringskorgar och hyllor skapar ordning i hallen och garderoben. För badrummet och sovrummet lyfter mjuk hemtextil i rätt färg känslan direkt. Mått och material står i varje produktbeskrivning så att du vet att det passar innan du beställer.",
      "Du handlar tryggt med Klarna och fri frakt över 499 kr. Beställningarna skickas från EU-lager med 3–7 arbetsdagars leverans, och du har alltid 30 dagars öppet köp om du ändrar dig.",
    ],
    faq: [
      {
        q: "Hur vet jag att inredningsdetaljen passar i mitt rum?",
        a: "Mått och material anges i varje produktbeskrivning. Mät ytan där produkten ska stå eller hänga innan du beställer, så slipper du överraskningar. Är du osäker hjälper vår kundtjänst dig gärna.",
      },
      {
        q: "Levererar ni större inredningsartiklar?",
        a: "Ja. Allt skickas från EU-lager med spårbar leverans inom 3–7 arbetsdagar. Frakten är fri vid köp över 499 kr.",
      },
      {
        q: "Kan jag ångra ett köp om färgen inte blev som jag tänkt mig?",
        a: "Absolut – du har 30 dagars öppet köp. Kontakta kundtjänst så hjälper vi dig med returen.",
      },
    ],
  },

  "kok-husgerad": {
    intro: [
      "Rätt redskap gör matlagningen roligare. I Kök & Husgeråd hittar du noga utvalda köksredskap och tillbehör, köksmaskiner och apparater samt servering och glas – prisvärda fynd för både vardagsmiddagen och när du dukar upp för gäster.",
      "När du fyller på köket lönar det sig att tänka långsiktigt. Knivar och skärbrädor i hållbara material håller i åratal, en bra köksmaskin sparar tid varje vecka och matchande glas och serveringsdetaljer lyfter dukningen. Vi anger material, mått och skötselråd i produktbeskrivningarna så att du enkelt väljer rätt – och så att dina favoriter håller länge.",
      "Alla beställningar skickas från EU-lager med leverans inom 3–7 arbetsdagar. Du betalar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål produkterna maskindisk?",
        a: "Det varierar mellan material. Vi anger skötselråd, inklusive om en produkt tål maskindisk, i produktbeskrivningen. Vid tveksamhet rekommenderar vi handdisk för längre livslängd.",
      },
      {
        q: "Hur snabbt får jag mina köksprylar?",
        a: "Leveranstiden är 3–7 arbetsdagar från vårt EU-lager, med spårbar frakt. Fri frakt gäller vid köp över 499 kr.",
      },
      {
        q: "Kan jag returnera en köksmaskin om den inte passar mina behov?",
        a: "Ja, du har 30 dagars öppet köp. Hör av dig till kundtjänst så hjälper vi dig med returen.",
      },
    ],
  },

  "barn-familj": {
    intro: [
      "Det bästa till barnen ska vara tryggt, hållbart och roligt. I Barn & Familj samlar vi genomtänkta favoriter inom baby och småbarn samt leksaker och spel – prisvärda fynd som tål lek och växer med barnet.",
      "När du handlar till barn är säkerhet och ålder viktigast. Kontrollera rekommenderad ålder och materialinnehåll i produktbeskrivningen, särskilt för de allra minsta. Pedagogiska träleksaker, aktivitetsleksaker och spel som tränar motorik och fantasi är populära val som håller längre än en snabb trend.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp – så att du hinner känna efter att allt blev rätt.",
    ],
    faq: [
      {
        q: "Hur vet jag vilken ålder en leksak passar för?",
        a: "Rekommenderad ålder anges i produktbeskrivningen tillsammans med material. Följ alltid åldersmärkningen, särskilt för småbarn där smådelar kan vara olämpliga.",
      },
      {
        q: "Är leksakerna säkra och i bra material?",
        a: "Vi väljer produkter med fokus på hållbarhet och säkerhet och anger materialinnehåll i beskrivningen. Har du en specifik fråga svarar vår kundtjänst normalt inom 24 timmar.",
      },
      {
        q: "Vad gäller för leverans och retur?",
        a: "Leverans sker inom 3–7 arbetsdagar från EU-lager. Du har 30 dagars öppet köp om något inte passar.",
      },
    ],
  },

  "skonhet-halsa": {
    intro: [
      "Egentid behöver inte vara dyr. I Skönhet & Hälsa hittar du noga utvalda produkter inom hudvård och ansikte, massage och återhämtning, hår och rakning samt kropp och välbefinnande – för en enkel rutin som får dig att må bra i vardagen.",
      "Bygg din rutin utifrån dina behov. Till ansiktet lönar det sig att tänka på hudtyp och vad du vill åstadkomma, oavsett om det är återfuktning, rengöring eller lite extra lyster. Massageverktyg och redskap för återhämtning hjälper mot spänningar efter en lång dag. Vi beskriver användning och innehåll i varje produkt så att du vet vad du köper.",
      "Beställningarna skickas från EU-lager med 3–7 arbetsdagars leverans. Du betalar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag om en hudvårdsprodukt passar min hudtyp?",
        a: "Vi anger användningsområde och innehåll i produktbeskrivningen. Tänk på din hudtyp (torr, normal, blandhy eller känslig) och introducera gärna en ny produkt i taget. Är du osäker, börja försiktigt.",
      },
      {
        q: "Hur lång är leveranstiden?",
        a: "Vi skickar från EU-lager med en leveranstid på 3–7 arbetsdagar och spårbar frakt. Fri frakt gäller över 499 kr.",
      },
      {
        q: "Kan jag returnera skönhetsprodukter?",
        a: "Du har 30 dagars öppet köp. Av hygienskäl bör förseglade produkter vara oöppnade vid retur – hör av dig till kundtjänst så guidar vi dig.",
      },
    ],
  },

  "husdjur": {
    intro: [
      "Våra fyrbenta vänner förtjänar det bästa. I kategorin Husdjur samlar vi prisvärda fynd för hund och katt – allt från lek och tillbehör, selar, koppel och transport till pälsvård, mat- och vattenskålar samt mysiga bäddar och tillbehör.",
      "Tänk på storlek och vikt när du väljer. En sele eller bädd ska sitta rätt för att vara bekväm, och rätt skål eller matautomat gör vardagen smidigare för både dig och djuret. Vi anger mått och material i produktbeskrivningarna så att du hittar något som passar just din hund eller katt.",
      "Allt skickas från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur väljer jag rätt storlek på sele, koppel eller bädd?",
        a: "Mät ditt djur och jämför med måtten i produktbeskrivningen. För selar är bröstomfånget viktigast, för bäddar djurets längd. Är du mellan storlekar, välj gärna den större.",
      },
      {
        q: "Hur snabbt levereras husdjursprodukterna?",
        a: "Leveranstiden är 3–7 arbetsdagar från vårt EU-lager, med spårning hela vägen. Fri frakt över 499 kr.",
      },
      {
        q: "Kan jag byta om produkten inte passar mitt djur?",
        a: "Ja, du har 30 dagars öppet köp. Kontakta kundtjänst så hjälper vi dig med byte eller retur.",
      },
    ],
  },

  "sport-fritid": {
    intro: [
      "Vare sig du tränar hemma, packar för bilen eller ger dig ut i naturen ska utrustningen funka utan krångel. I Sport & Fritid hittar du smarta fynd inom träning och gym, friluftsliv och resa samt bil och cykel – prisvärt och noga utvalt.",
      "Tänk på hur och var du ska använda produkten. Till hemmaträningen är hållbarhet och rätt vikt avgörande, medan friluftsutrustning gärna ska vara lätt och tåla väder och vind. För bilen och cykeln gör rätt tillbehör resan tryggare och smidigare. Specifikationer som mått, material och kapacitet står i varje produktbeskrivning.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar. Du betalar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag att utrustningen håller för regelbunden träning?",
        a: "Vi anger material och i förekommande fall maxvikt eller belastning i produktbeskrivningen. Välj utifrån hur ofta och hårt du tränar – tveka inte att fråga kundtjänst om du vill ha råd.",
      },
      {
        q: "Hur lång är leveranstiden?",
        a: "Leverans sker inom 3–7 arbetsdagar från EU-lager, med spårbar frakt. Fri frakt gäller vid köp över 499 kr.",
      },
      {
        q: "Kan jag returnera om produkten inte motsvarar förväntningarna?",
        a: "Ja, du har 30 dagars öppet köp. Hör av dig så hjälper vi dig vidare.",
      },
    ],
  },

  "tradgard-utemobler": {
    intro: [
      "En fin uteplats och en grönskande odling gör hela skillnaden under den ljusa delen av året. I Trädgård & Utemöbler hittar du prisvärda fynd för balkongen, altanen och trädgården – från odlingslådor och spaljéer till praktiska lösningar som gör uterummet trivsammare.",
      "Tänk på utrymme och väder när du planerar. Mät ytan på balkongen eller altanen innan du köper, och välj material som tål att stå ute. En odlingslåda med spaljé tar vara på höjden i ett litet utrymme, medan smarta odlings- och förvaringslösningar gör det enklare att lyckas med grönsaker, örter och klätterväxter. Mått och material står i varje produktbeskrivning.",
      "Allt skickas från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål produkterna att stå ute året runt?",
        a: "Det beror på materialet. Vi anger om en produkt är avsedd för utomhusbruk i produktbeskrivningen. Många trädetaljer mår bra av att tas in eller skyddas under vintern för längre livslängd.",
      },
      {
        q: "Passar produkterna även på en liten balkong?",
        a: "Många av våra lösningar är gjorda för små ytor – mät din balkong och jämför med produktens mått. Odlingslådor med spaljé utnyttjar höjden och tar liten golvyta.",
      },
      {
        q: "Hur fungerar leverans och retur?",
        a: "Leverans sker inom 3–7 arbetsdagar från EU-lager. Du har 30 dagars öppet köp om du ändrar dig.",
      },
    ],
  },

  // Mode & Accessoarer är f.n. inte live (tömdes vid Kina-utfasningen och
  // redirectar till /butik). Innehållet ligger redo så att sidan får riktig
  // brödtext automatiskt så fort kategorin återupplivas med EU-produkter.
  "mode-accessoarer": {
    intro: [
      "Rätt accessoar lyfter en hel outfit. I Mode & Accessoarer hittar du tidlösa fynd inom smycken, klockor och solglasögon, väskor och necessärer samt accessoarer som kompletterar din stil – prisvärt och noga utvalt.",
      "Satsa på det som håller över tid. Ett slätt kedjehalsband, ett par klassiska solglasögon eller en väska i rätt storlek funkar säsong efter säsong. Tänk på material och mått i produktbeskrivningen, särskilt om du är känslig för vissa metaller eller vill ha en väska som rymmer det du bär varje dag.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar. Du betalar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilket material är smyckena gjorda av?",
        a: "Material anges i produktbeskrivningen. Är du känslig för vissa metaller, leta efter nickelfria alternativ och läs beskrivningen noga innan du köper.",
      },
      {
        q: "Hur snabbt levereras accessoarerna?",
        a: "Leveranstiden är 3–7 arbetsdagar från EU-lager, med spårbar frakt. Fri frakt över 499 kr.",
      },
      {
        q: "Kan jag returnera om något inte passar?",
        a: "Ja, du har 30 dagars öppet köp. Kontakta kundtjänst så hjälper vi dig med returen.",
      },
    ],
  },
  // ══ UNDERKATEGORIER (tillagda 2026-08-12) ═════════════════════════════════
  // Skrivna mot det faktiska sortimentet i respektive kategori. Tunna kategorier
  // (1–3 produkter) får kortare text som handlar om just de produkterna — hellre
  // ett stycke som stämmer än tre utfyllda som lovar ett sortiment vi inte har.

  "baby-smabarn": {
    intro: [
      "De första åren går fort, och prylarna ska hänga med. I Baby & Småbarn hittar du praktiska favoriter som babybadkar med ställning, gunghästar med ryggstöd och bälte och annat som gör vardagen med de minsta enklare.",
      "Säkerhet och ålder går före allt annat när du handlar till småbarn. Kontrollera rekommenderad ålder, maxvikt och materialinnehåll i produktbeskrivningen — särskilt för produkter barnet sitter i, som gunghästar och badkar, där stödet ska passa barnets storlek. Ett hopfällbart babybadkar sparar dessutom plats i ett litet badrum.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Fri frakt över 499 kr, betalning med Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en gunghäst?",
        a: "Våra gunghästar med ryggstöd och bälte är avsedda från ungefär 18 månader, när barnet sitter stadigt själv. Exakt åldersintervall och maxvikt står i produktbeskrivningen — följ alltid den märkningen.",
      },
      {
        q: "Tar ett babybadkar mycket plats?",
        a: "Hopfällbara modeller viks ihop platt efter badet och kan hängas eller ställas på högkant, vilket gör dem tacksamma i ett litet badrum. Mått i både utfällt och hopfällt läge anges i beskrivningen.",
      },
      {
        q: "Vad gäller för leverans och retur?",
        a: "Leverans sker inom 3–7 arbetsdagar från EU-lager. Du har 30 dagars öppet köp om något inte passar — kontakta kundtjänst så hjälper vi dig.",
      },
    ],
  },

  "badrum-hemtextil": {
    intro: [
      "Badrummet och sovrummet är de rum där mjuka material märks mest. I Badrum & Hemtextil samlar vi prisvärda tillbehör och textilier som gör de vardagliga rummen trivsammare utan att kosta en förmögenhet.",
      "Tänk på mått och skötsel innan du beställer. Mät hyllan, väggen eller sängen där produkten ska sitta, och läs tvättråden om det är textil — rätt tvättemperatur avgör hur länge färgen håller. Material och mått står i varje produktbeskrivning så att du slipper överraskningar när paketet kommer.",
      "Allt skickas från EU-lager med 3–7 arbetsdagars leverans och spårning hela vägen. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag att produkten passar i mitt badrum?",
        a: "Mät ytan där produkten ska stå eller monteras och jämför med måtten i beskrivningen. För väggmonterade tillbehör är det också värt att kolla vilken typ av vägg du har innan du borrar.",
      },
      {
        q: "Hur tvättar jag hemtextilen?",
        a: "Tvättråd och material anges per produkt. Som regel håller färg och form bäst vid lägre temperatur och utan torktumling — följ alltid produktens egen märkning.",
      },
      {
        q: "Kan jag returnera om färgen inte blev som på bilden?",
        a: "Ja, du har 30 dagars öppet köp. Skärmar återger färg olika, så hör av dig till kundtjänst så löser vi returen.",
      },
    ],
  },

  belysning: {
    intro: [
      "Rätt ljus förändrar ett rum mer än de flesta möbler. I Belysning hittar du golvlampor med inbyggda hyllor, vägglampor i retro-stil för utomhusbruk och kraftiga LED-armaturer för garage och verkstad — prisvärt och noga utvalt.",
      "Tre saker avgör valet. **Sockeln** måste matcha lampan du tänkt använda (E27 är vanligast). **IP-klassen** talar om hur mycket väta armaturen tål — utomhus och i garage vill du ha minst IP44. **Ljusmängden** mäts i lumen, inte watt: en LED-armatur drar en bråkdel av en gammal glödlampas effekt vid samma ljus. Allt detta anges i produktbeskrivningen.",
      "Beställningarna skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken lampsockel behöver jag?",
        a: "Sockeltypen anges för varje armatur, och E27 är den vanligaste i svenska hem. Har du redan lampor hemma, kontrollera att sockeln stämmer innan du beställer.",
      },
      {
        q: "Kan vägglamporna sitta utomhus?",
        a: "De modeller som är avsedda för utomhusbruk har en IP-klass angiven, till exempel IP45. Är ingen IP-klass angiven är armaturen tänkt för inomhusbruk.",
      },
      {
        q: "Passar en hexagonlampa i ett vanligt garage?",
        a: "Måtten anges i beskrivningen, och modulerna monteras i mönster efter takytan. Mät takhöjd och yta först, och räkna med god marginal till portens rörelseområde.",
      },
    ],
  },

  "bil-cykel": {
    intro: [
      "Utrustningen till bilen och cykeln ska funka utan krångel den dag du behöver den. I Bil & Cykel hittar du cykelpumpar med golvfot och manometer, ergonomiska handtag med stötdämpning, cykelryggsäckar med hydreringssystem, barncyklar och hydrauliska garagedomkrafter.",
      "Tänk på mått och kapacitet. En domkraft ska klara bilens vikt med marginal och ha låg profil om bilen ligger nära marken. Till cykeln avgör ventiltypen (Presta eller Schrader) vilken pump som passar, och en barncykel väljs efter hjulstorlek snarare än ålder — 20 tum passar ungefär 6–9 år. Kapacitet, mått och kompatibilitet står i varje produktbeskrivning.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans och spårbar frakt. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar cykelpumpen min ventil?",
        a: "Pumparnas ventilstöd anges i beskrivningen. De flesta golvpumpar hanterar både Presta och Schrader, ofta med ett vändbart munstycke — kolla vilken ventil dina slangar har innan du beställer.",
      },
      {
        q: "Hur väljer jag rätt storlek på barncykel?",
        a: "Utgå från hjulstorleken och barnets innerbenslängd, inte enbart åldern. En 20-tumscykel passar typiskt 6–9 år. Barnet ska nå marken med tåspetsarna när det sitter på sadeln.",
      },
      {
        q: "Hur mycket klarar en garagedomkraft?",
        a: "Maxlasten anges per modell, till exempel 2,5 ton. Välj alltid en domkraft med marginal till bilens vikt, och använd pallbockar när du arbetar under bilen.",
      },
    ],
  },

  "burar-klader-tillbehor": {
    intro: [
      "En trygg plats gör skillnad för både djur och husse. Här hittar du hopfällbara hundgårdar med soltak, hundhagar i metall, hundgrindar som kläms fast utan borrning, hundtrappor, kaninhagar för inomhusbruk och hamsterburar med tunnlar och flera våningar.",
      "Utgå från djurets storlek och rörelsebehov. En hundgrind mäts mot dörr- eller trappöppningens bredd — modeller med klämfäste passar hyresrätter där man inte får borra. För kaniner och smådjur är golvytan viktigare än höjden, medan en hundtrappa ska matcha soffans eller sängens höjd och djurets maxvikt. Alla mått anges i produktbeskrivningen.",
      "Allt skickas från EU-lager med leverans inom 3–7 arbetsdagar. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Måste jag borra för att sätta upp en hundgrind?",
        a: "Nej, våra klämmonterade grindar spänns fast mellan karmarna utan skruv och passar därför i hyresrätter. Mät öppningen och kontrollera att den ligger inom grindens justerintervall, till exempel 72–107 cm.",
      },
      {
        q: "Hur stor hage behöver min kanin?",
        a: "Golvytan är det viktigaste måttet — kaniner behöver kunna göra flera hopp i rad. En hage med övervåning ger extra yta utan att ta mer plats i rummet. Mått och antal paneler anges per modell.",
      },
      {
        q: "Går hundgården att fälla ihop för förvaring?",
        a: "Ja, de hopfällbara modellerna viks ihop platt och kan förvaras eller tas med. Både utfällt och hopfällt mått anges i beskrivningen.",
      },
    ],
  },

  "dator-gaming": {
    intro: [
      "Sitter du länge framför skärmen märks stolen mer än något annat. I Dator & Gaming hittar du gamingstolar med fotstöd och justerbar rygg — prisvärda alternativ som klarar långa pass utan att kännas hårda efter en timme.",
      "Kolla maxvikt, justermöjligheter och sitthöjd innan du väljer. En stol med utfällbart fotstöd fungerar även för en paus mellan passen, och justerbar rygg gör att du kan variera ställning under dagen. Måtten och maxbelastningen, till exempel 120 kg, anges i varje produktbeskrivning.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Fri frakt över 499 kr, betalning med Klarna och 30 dagars öppet köp om stolen inte blev som du tänkt.",
    ],
    faq: [
      {
        q: "Hur mycket klarar en gamingstol?",
        a: "Maxvikten anges per modell, ofta runt 120 kg. Välj med marginal och kontrollera även sitthöjd och sittbredd om du är lång eller kort.",
      },
      {
        q: "Behöver stolen monteras?",
        a: "Ja, gamingstolar levereras normalt i delar med verktyg och monteringsanvisning i kartongen. Räkna med 20–30 minuter för monteringen.",
      },
      {
        q: "Kan jag returnera om stolen inte passar?",
        a: "Du har 30 dagars öppet köp. Spara gärna emballaget tills du testat stolen, så blir returen enklare.",
      },
    ],
  },

  "dekoration-prydnad": {
    intro: [
      "Det är detaljerna som gör ett hus till ett hem. I Dekoration & Prydnad hittar du prisvärda inredningsdetaljer som konstgjorda träd och formklippta växter för både inne och ute — grönska som ser levande ut året runt utan vattning.",
      "Tänk på skala och placering. Ett konstgjort träd på 91 cm gör sig bäst på golv i ett hörn eller flankerande en entré, medan mindre detaljer fungerar på hyllor och byrålådor. Kontrollera i beskrivningen om produkten tål utomhusbruk — UV-beständiga material behåller färgen i solen, medan inomhusvarianter bleks med tiden.",
      "Beställningarna skickas från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål de konstgjorda växterna att stå utomhus?",
        a: "De modeller som är avsedda för utomhusbruk anges så i beskrivningen och är gjorda i material som tål väder. Inomhusvarianter bleks av direkt solljus över tid.",
      },
      {
        q: "Hur sköter jag en konstgjord växt?",
        a: "Damma av bladen då och då, gärna med en fuktig trasa eller en kall fläkt. Ingen vattning eller beskärning behövs.",
      },
      {
        q: "Levereras trädet i kruka?",
        a: "Vad som ingår framgår av produktbeskrivningen och bilderna. Höjdmåttet gäller normalt hela produkten inklusive bas.",
      },
    ],
  },

  "forvaring-organisering": {
    intro: [
      "Ordning börjar med rätt möbel på rätt plats. I Förvaring & Organisering hittar du byråer med tyglådor i industristil, skoskåp som tar liten golvyta, kontorshurtsar på hjul, justerbara garagehyllor i stål, klocklådor och hopfällbara arbetsbord.",
      "Mät först, köp sen. Djupet är det mått som oftast överraskar — ett skoskåp på 24 cm djup passar i en smal hall där en vanlig byrå aldrig hade gått in. För garagehyllor avgör antal hyllplan och maxlast per plan hur mycket du får plats med, och en hurts på hjul kan rullas undan under skrivbordet när den inte används. Alla mått står i beskrivningen.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket tål en garagehylla?",
        a: "Maxlast per hyllplan anges i produktbeskrivningen. Fördela tunga saker jämnt och placera det tyngsta längst ned för bästa stabilitet.",
      },
      {
        q: "Behöver möblerna monteras?",
        a: "Ja, förvaringsmöbler levereras platt med skruv och anvisning. De flesta byråer och hyllor tar 30–60 minuter att montera.",
      },
      {
        q: "Passar ett skoskåp i en smal hall?",
        a: "Kolla djupmåttet — våra smalare skoskåp är runt 24 cm djupa och byggda för just trånga hallar. Mät väggen och räkna med utrymme för att kunna öppna luckan.",
      },
    ],
  },

  "friluftsliv-resa": {
    intro: [
      "Bra friluftsutrustning märks först när vädret vänder. I Friluftsliv & Resa hittar du campingstolar med armstöd, uppblåsbara liggunderlag med inbyggd fotpump, bärbara campingvaskar med vattentank, infällbara bryggstegar med halkskydd och solelslösningar till husvagnen.",
      "Tänk på vikt, packmått och hur du transporterar utrustningen. Ska den bäras behöver den vara lätt; ska den ligga i husvagnen spelar packmåttet större roll än vikten. Ett liggunderlag med inbyggd pump sparar både plats och tid på plats, och campingstolar i tvåpack blir ofta billigare per stol. Maxvikt, mått och packmått anges i varje produktbeskrivning.",
      "Allt skickas från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket bär en campingstol?",
        a: "Maxvikten anges per modell, ofta runt 130 kg. Kontrollera även sitthöjden om du vill kunna resa dig lätt från stolen.",
      },
      {
        q: "Hur snabbt blåser man upp ett liggunderlag med fotpump?",
        a: "Med inbyggd fotpump tar det normalt någon minut — du slipper separat pump och behöver inget batteri. Tjocklek och mått i uppblåst läge anges i beskrivningen.",
      },
      {
        q: "Vilken solpanel räcker för att hålla husvagnsbatteriet laddat?",
        a: "För ren underhållsladdning över vintern räcker en 100 W-panel med god marginal. Ska du driva utrustning ombord behöver du räkna på förbrukningen — effekt och spänning anges per produkt.",
      },
    ],
  },

  "har-rakning": {
    intro: [
      "Jobbar du med hår behöver utrustningen orka en hel arbetsdag. I Hår & Rakning hittar du höj- och sänkbara arbetsstolar för salong, torkhuvar på stativ med timer och frisörväskor med lås för verktygen — utrustning för salongen såväl som för dig som klipper hemma.",
      "Höjd och effekt är de mått som spelar roll. En arbetsstol ska kunna ställas så att du sitter med raka handleder mot kundens huvudhöjd, och en torkhuv på stativ behöver ett justerintervall som täcker både barn och vuxna, exempelvis 115–165 cm. Effekten avgör torktiden, och en timer på upp till 60 minuter gör att du kan lämna behandlingen igång. Mått och effekt anges per produkt.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar torkhuven både barn och vuxna?",
        a: "Justerintervallet anges per modell, till exempel 115–165 cm, vilket täcker de flesta sitthöjder. Stativet gör att huven kan flyttas mellan platser i salongen.",
      },
      {
        q: "Går arbetsstolen att höja och sänka?",
        a: "Ja, våra salongsstolar är höj- och sänkbara med gaspatron och har vadderad sits. Höjdintervall och maxvikt står i beskrivningen.",
      },
      {
        q: "Kan jag använda utrustningen hemma?",
        a: "Absolut. Utrustningen är salongsklassad men fungerar lika bra hemma — kontrollera bara att du har plats för stativet och ett eluttag i närheten.",
      },
    ],
  },

  "hudvard-ansikte": {
    intro: [
      "En enkel rutin slår en komplicerad som aldrig blir av. I Hudvård & Ansikte hittar du prisvärd ansiktsvård för vardagen, som sheetmasks med snigelsekret och kollagen i flerpack — en snabb återfuktning som tar tjugo minuter framför tv:n.",
      "Tänk på din hudtyp och introducera en ny produkt i taget, så vet du vad som fungerar om huden reagerar. Sheetmasks är lämpliga att använda ett par gånger i veckan snarare än dagligen, och de fungerar bäst på ren hud. Innehåll och användning anges i varje produktbeskrivning.",
      "Beställningarna skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur ofta kan man använda en sheetmask?",
        a: "Ett par gånger i veckan räcker för de flesta hudtyper. Använd på rentvättad hud och massera in det som blir kvar i stället för att skölja av.",
      },
      {
        q: "Passar maskerna känslig hud?",
        a: "Innehållsförteckningen anges per produkt. Har du känslig hud, testa gärna på en liten yta först och introducera bara en ny produkt åt gången.",
      },
      {
        q: "Kan jag returnera hudvård?",
        a: "Du har 30 dagars öppet köp. Av hygienskäl bör förseglade produkter vara oöppnade vid retur — hör av dig till kundtjänst så guidar vi dig.",
      },
    ],
  },

  hushallsapparater: {
    intro: [
      "En smart apparat gör det tråkiga jobbet åt dig. I Hushållsapparater hittar du praktiska maskiner för hemmet och verkstaden, som digitala ultraljudstvättar i rostfritt med värme och timer — de rengör smycken, glasögon, verktygsdelar och förgasarmunstycken utan skrubbning.",
      "Volymen avgör vad som får plats: en mindre tank räcker för smycken och glasögon, medan större modeller tar verkstadsdelar. Värmefunktionen lossar fett betydligt effektivare än kallt vatten, och timern gör att du kan gå ifrån under tiden. Kapacitet i liter, effekt och material anges i varje produktbeskrivning.",
      "Allt skickas från EU-lager med 3–7 arbetsdagars leverans och spårbar frakt. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken storlek på ultraljudstvätt ska jag välja?",
        a: "Utgå från det största föremålet du vill rengöra — det ska få plats i tanken med vätska över. Smycken och glasögon klarar sig med de mindre modellerna, verkstadsdelar kräver större volym.",
      },
      {
        q: "Vad kan man rengöra i en ultraljudstvätt?",
        a: "Smycken, glasögon, klockarmband, verktygsdelar och förgasarmunstycken är vanliga användningsområden. Undvik pärlor, opaler och limmade delar som kan ta skada av vibrationerna.",
      },
      {
        q: "Hur lång är leveranstiden?",
        a: "Vi skickar från EU-lager med 3–7 arbetsdagars leverans och spårbar frakt. Fri frakt gäller vid köp över 499 kr.",
      },
    ],
  },

  "kalas-fest": {
    intro: [
      "Det är detaljerna som gör kalaset minnesvärt. I Kalas & Fest hittar du prylar som lyfter festen hemma, som sockervaddsmaskiner för barnkalaset — några skedar strösocker blir till sockervadd på ett par minuter.",
      "Tänk på effekt och plats. En maskin på runt 450 W värmer upp snabbt och gör en vadd i taget, vilket räcker gott för ett kalas. Ställ den på en stadig yta med utrymme runt om, och låt en vuxen sköta själva maskinen eftersom skålen blir varm. Effekt, mått och medföljande tillbehör anges i produktbeskrivningen.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Fungerar en sockervaddsmaskin med vanligt strösocker?",
        a: "Ja, vanligt strösocker fungerar i de flesta maskiner. Hårda karameller kan också användas i vissa modeller — kolla produktbeskrivningen först.",
      },
      {
        q: "Hur lång tid tar det att göra en sockervadd?",
        a: "Maskinen behöver några minuters uppvärmning, sedan tar varje vadd ungefär en minut att snurra upp.",
      },
      {
        q: "Är den säker att använda med barn?",
        a: "Skålen blir varm under användning, så en vuxen bör sköta maskinen medan barnen snurrar upp vadden på pinnen. Följ alltid tillverkarens anvisning.",
      },
    ],
  },

  keps: {
    intro: [
      "En keps är den enklaste lösningen på sol i ögonen. Här hittar du baseballkepsar med lång skärm för sol och sommar — enkla, tidlösa modeller som fungerar lika bra på stranden som på promenaden.",
      "Kolla justeringen och materialet. En keps med bakre spänne passar de flesta huvudstorlekar och kan delas i familjen, medan skärmens längd avgör hur mycket sol du faktiskt slipper i ögonen. Bomull och andningsbara material är svalast under sommaren. Storlek och material anges i produktbeskrivningen.",
      "Beställningen skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Är kepsen justerbar i storlek?",
        a: "Justering och storlek anges per modell. Kepsar med spänne eller kardborre bak passar de flesta vuxna huvudstorlekar.",
      },
      {
        q: "Kan man tvätta en keps?",
        a: "Handtvätt i ljummet vatten är skonsammast och behåller skärmens form. Låt kepsen lufttorka — undvik torktumlare, som kan deformera skärmen.",
      },
    ],
  },

  "koksmaskiner-apparater": {
    intro: [
      "En bra köksmaskin sparar tid varje vecka. I Köksmaskiner & Apparater hittar du prisvärda apparater som gör vardagsmatlagningen enklare och tar bort de mest tidsödande momenten.",
      "Tänk på effekt, kapacitet och var maskinen ska stå. En apparat som används dagligen förtjänar en plats framme på bänken, medan den du tar fram vid enstaka tillfällen bör vara lätt att ställa undan — kolla därför både mått och vikt. Effekt, volym och skötselråd anges i varje produktbeskrivning, inklusive om delar tål maskindisk.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål delarna maskindisk?",
        a: "Det varierar mellan modeller och anges i skötselråden. Motordelen ska aldrig sköljas eller diskas — torka den med fuktig trasa.",
      },
      {
        q: "Hur snabbt får jag maskinen hem?",
        a: "Leveranstiden är 3–7 arbetsdagar från vårt EU-lager, med spårbar frakt. Fri frakt gäller vid köp över 499 kr.",
      },
    ],
  },

  "koksredskap-tillbehor": {
    intro: [
      "Rätt redskap gör matlagningen roligare och snabbare. I Köksredskap & Tillbehör hittar du prisvärda basredskap i hållbara material för det dagliga arbetet vid spisen och bänken.",
      "Satsa på material som håller. Redskap i rostfritt stål och tåligt trä överlever år av användning, medan skötselrådet avgör hur länge de behåller sitt utseende — trä mår till exempel bäst av handdisk och en gnutta olja då och då. Material, mått och skötselråd anges i varje produktbeskrivning.",
      "Beställningarna skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål redskapen maskindisk?",
        a: "Det beror på materialet och anges i skötselrådet. Trä och vissa beläggningar håller längre med handdisk.",
      },
      {
        q: "Vad gäller vid retur?",
        a: "Du har 30 dagars öppet köp. Hör av dig till kundtjänst så hjälper vi dig med returen.",
      },
    ],
  },

  "kropp-valbefinnande": {
    intro: [
      "Kroppen behöver återhämtning lika mycket som träning. I Kropp & Välbefinnande hittar du hopfällbara massagebänkar i aluminium och rollatorer med fjädring och sits — utrustning som gör vardagen bekvämare, hemma eller i behandlingsrummet.",
      "Vikt och maxbelastning är de avgörande måtten. En massagebänk i aluminium är lättare att bära och fälla ihop än en i trä, medan antalet sektioner styr hur kompakt den blir hopvikt. För en rollator är sitshöjd och maxvikt viktigast, och fjädring gör stor skillnad på ojämnt underlag utomhus. Alla mått anges i produktbeskrivningen.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans och spårbar frakt. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket väger en hopfällbar massagebänk?",
        a: "Vikten anges per modell. Bänkar i aluminium är märkbart lättare än motsvarande i trä och är därför lämpligare om du behöver bära och flytta bänken ofta.",
      },
      {
        q: "Vad klarar en rollator för maxvikt?",
        a: "Maxvikten anges per modell, ofta runt 136 kg. Kontrollera även sitthöjden så att den passar användarens längd.",
      },
      {
        q: "Går utrustningen att fälla ihop för förvaring?",
        a: "Ja, både massagebänkarna och rollatorerna är hopfällbara. Mått i både utfällt och hopfällt läge står i beskrivningen.",
      },
    ],
  },

  "lek-tillbehor-for-husdjur": {
    intro: [
      "En katt som får klösa på rätt ställe låter soffan vara. Här hittar du klösträd med grotta och hängmatta, väggmonterade klöspelare med flera plattformar, klöspelare i sisal med hängande lekboll och automatiska bollkastare för hund.",
      "Höjd och stabilitet avgör om katten faktiskt använder trädet. Katter vill klättra högt och sitta med uppsikt, så ett träd på 130 cm eller mer används mer än ett lågt. Väggmonterade lösningar tar noll golvyta och passar små lägenheter, men kräver att du kan borra i väggen. Sisal är det material som håller längst mot klor. För hundar avgör kastlängden — 3, 6 eller 9 meter — hur stor yta ni behöver.",
      "Allt skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur högt bör ett klösträd vara?",
        a: "Katter söker sig till högt belägna platser, så ett träd på minst 130 cm används oftast mer än ett lågt. Har du flera katter är fler nivåer och en grotta att dra sig undan i värt mycket.",
      },
      {
        q: "Måste väggklösträdet borras fast?",
        a: "Ja, väggmonterade modeller skruvas i väggen och behöver fäste som klarar kattens vikt och hopp. Det tar noll golvyta, vilket gör dem populära i mindre lägenheter.",
      },
      {
        q: "Fungerar en automatisk bollkastare inomhus?",
        a: "Kastlängden går att ställa i steg, ofta 3, 6 eller 9 meter — det kortaste läget fungerar i en längre korridor, medan de längre passar bäst i trädgården.",
      },
    ],
  },

  "leksaker-spel": {
    intro: [
      "Det bästa leksakerna gör är att hålla längre än nyhetsglädjen. I Leksaker & Spel hittar du elbilar och elmotorcyklar för barn, eltraktorer med släp och fjärrkontroll, bilbanor med loopar och lysande detaljer, rutschkanor för inomhusbruk och spel för hela familjen.",
      "Ålder och plats styr valet. Rekommenderad ålder står alltid i beskrivningen och är viktig — inte bara för smådelar utan för att barnet ska klara körningen. Elfordon för de minsta har stödhjul och låg toppfart (runt 2 km/h), och de flesta har föräldrafjärrkontroll så att du kan ta över. Mät också ytan: en bilbana eller rutschkana behöver sin plats, och många viks ihop till en förvaringslåda efter leken.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en elbil för barn?",
        a: "Åldersintervallet anges per modell — vanligt är 3 år och uppåt. De minsta modellerna har stödhjul, låg hastighet och fjärrkontroll så att en vuxen kan styra vid behov.",
      },
      {
        q: "Hur länge räcker batteriet i ett elfordon?",
        a: "Körtiden beror på batteri, underlag och barnets vikt. Räkna med ungefär en timmes lek per laddning, och ladda alltid enligt tillverkarens anvisning.",
      },
      {
        q: "Tar bilbanan mycket plats?",
        a: "Många modeller viks ihop till sin egen förvaringslåda efter leken. Både utfällt och hopfällt mått anges i produktbeskrivningen.",
      },
    ],
  },

  "massage-aterhamtning": {
    intro: [
      "Återhämtning är halva träningen — och en bra bänk gör jobbet bekvämt för båda parter. I Massage & Återhämtning hittar du hopfällbara massagebänkar i två och tre sektioner, i trä och aluminium, för behandling hemma eller på plats hos kunden.",
      "Välj efter hur ofta du flyttar bänken. Aluminium är lättare att bära och passar dig som åker mellan behandlingar, medan trä ofta upplevs stabilare för en bänk som står kvar. Antalet sektioner styr packmåttet: tre sektioner viks ihop mindre än två. Längd, vikt, maxbelastning och hopfällt mått anges i varje produktbeskrivning.",
      "Beställningarna skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Trä eller aluminium — vad ska jag välja?",
        a: "Aluminium är lättare och smidigare att bära mellan behandlingar. Trä är oftast tyngre men upplevs mycket stabilt och passar bäst för en bänk som får stå kvar.",
      },
      {
        q: "Hur liten blir bänken hopfälld?",
        a: "Det hopfällda måttet anges per modell och beror på antalet sektioner — en tresektionsbänk viks ihop mindre än en med två sektioner.",
      },
      {
        q: "Ingår bärväska?",
        a: "Vad som ingår framgår av produktbeskrivningen. Många hopfällbara bänkar levereras med bärväska.",
      },
    ],
  },

  "mat-vattenskalar": {
    intro: [
      "Rätt skål gör måltiden lugnare för både hund och katt. Här hittar du mat- och vattenskålar i praktiska material som är enkla att hålla rena och står stadigt även när djuret är ivrigt.",
      "Storleken ska matcha djuret: en skål som är för djup gör att katter tar i med morrhåren, vilket många ogillar, medan en för liten skål gör att stora hundar äter för fort. Rostfria skålar är enklast att hålla rena och tar inte åt sig lukt. Volym, mått och material anges i produktbeskrivningen.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken skålstorlek passar min hund?",
        a: "Utgå från dagsransonen — skålen ska rymma en måltid utan att fyllas till brädden. Volym och mått anges i beskrivningen.",
      },
      {
        q: "Varför äter katten hellre ur en grund skål?",
        a: "Många katter ogillar att morrhåren nuddar skålens kanter. En grundare och bredare skål brukar därför fungera bättre för kattmat.",
      },
    ],
  },

  mobiltillbehor: {
    intro: [
      "Ett tillbehör som passar är skillnaden mellan en bra dag och en tom telefon. I Mobiltillbehör hittar du prisvärda laddare, kablar och skydd för vardagen — sådant som helst ska funka utan att man tänker på det.",
      "Kolla anslutningen först. USB-C sitter på så gott som alla nyare telefoner, medan äldre iPhone-modeller använder Lightning. Laddarens effekt i watt avgör hur snabbt telefonen laddar, och en kabel i flätat material håller betydligt längre i väskan än en tunn plastkabel. Anslutningstyp och effekt anges i varje produktbeskrivning.",
      "Beställningen skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag att tillbehöret passar min telefon?",
        a: "Kolla anslutningstypen — USB-C, Lightning eller micro-USB — i produktbeskrivningen och jämför med din telefon. Är du osäker svarar vår kundtjänst normalt inom 24 timmar på vardagar.",
      },
      {
        q: "Spelar laddarens wattal någon roll?",
        a: "Ja, en laddare med högre effekt laddar snabbare, förutsatt att telefonen stöder det. En svagare laddare skadar inget — den tar bara längre tid.",
      },
    ],
  },

  "selar-koppel-transport": {
    intro: [
      "Rätt utrustning gör promenaden och bilresan tryggare för er båda. Här hittar du hundselar, koppel, hopfällbara hundramper till bilen och cykelvagnar som också fungerar som hundvagn.",
      "Mät innan du beställer. För selen är bröstomfånget det avgörande måttet, inte hundens vikt. En ramp ska vara tillräckligt lång för att ge en flack lutning mot din biltröskel — 158 cm som viks till 45 cm är ett vanligt och praktiskt format. För cykelvagnar och hundvagnar är maxvikten det som styr, ofta upp till 45 kg. Alla mått anges i produktbeskrivningen.",
      "Allt skickas från EU-lager med 3–7 arbetsdagars leverans och spårbar frakt. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mäter jag för rätt selstorlek?",
        a: "Mät bröstomfånget bakom frambenen, på hundens bredaste punkt, och jämför med storlekstabellen i beskrivningen. Hamnar du mellan storlekar, välj den större.",
      },
      {
        q: "Hur lång ska en hundramp vara?",
        a: "Ju längre ramp, desto flackare lutning — och desto lättare för hunden. Mät höjden upp till bagageluckan och välj en ramp som ger en lagom vinkel; 158 cm passar de flesta personbilar och SUV:ar.",
      },
      {
        q: "Kan cykelvagnen användas utan cykel?",
        a: "Ja, 2-i-1-modellerna har handtag så att de fungerar som hundvagn att skjuta framför sig. Maxvikten, ofta 45 kg, anges i beskrivningen.",
      },
    ],
  },

  "servering-glas": {
    intro: [
      "Dukningen är det första gästerna ser. I Servering & Glas hittar du prisvärda serveringsdetaljer och glas som lyfter både vardagsmiddagen och festen.",
      "Tänk på material och skötsel. Glas och serveringsdetaljer som tål maskindisk sparar tid när gästerna gått, medan handdiskade material ofta behåller sin glans längre — dekorerade ytor och guldkanter mår nästan alltid bäst av handdisk. Mått är värt att kolla om du har begränsat skåputrymme, särskilt på högre glas som inte alltid får plats under en låg hylla. Ska serveringen fram ofta lönar det sig att välja något stapelbart som är enkelt att ställa undan.",
      "Beställningarna skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål produkterna maskindisk?",
        a: "Det anges i skötselrådet per produkt. Vid tveksamhet ger handdisk längre livslängd, särskilt för dekorerade ytor.",
      },
      {
        q: "Hur levereras ömtåliga glas?",
        a: "Glas packas skyddat och skickas spårbart från vårt EU-lager med leverans inom 3–7 arbetsdagar. Skulle något gå sönder på vägen ersätter vi det.",
      },
    ],
  },

  "traning-gym": {
    intro: [
      "Hemmagymmet vinner på att vara enkelt att komma igång med. I Träning & Gym hittar du hantelset med väska, gummerade hexhantlar med kromat grepp, motionscyklar med justerbart motstånd och tysta studsmattor med handtag.",
      "Välj vikt och belastning efter hur du tränar. Ett färgkodat hantelset från 0,5 till 2 kg passar konditions- och rehabpass, medan tyngre hexhantlar behövs för styrka — gummeringen skyddar dessutom golvet och dämpar ljudet. För motionscykeln är maxvikt och antal motståndslägen det som avgör, och en studsmatta med gummirep i stället för fjädrar är märkbart tystare i lägenhet. Alla mått och maxvikter anges i beskrivningen.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken hantelvikt ska jag börja med?",
        a: "För konditionspass och rehab räcker ofta 0,5–2 kg, medan styrketräning kräver tyngre hantlar. Ett set med flera vikter ger dig utrymme att öka efter hand.",
      },
      {
        q: "Är studsmattan tyst nog för lägenhet?",
        a: "Modeller med gummirep i stället för stålfjädrar är betydligt tystare och skonsammare mot leder. Diameter, maxvikt och antal rep anges per modell.",
      },
      {
        q: "Hur mycket klarar motionscykeln?",
        a: "Maxvikten anges per modell, ofta runt 120 kg. Kontrollera även justermöjligheterna för sadel och styre så att du får rätt sittställning.",
      },
    ],
  },

  "vaskor-necessarer": {
    intro: [
      "En bra väska är den du slutar tänka på. I Väskor & Necessärer hittar du praktiska väskor och necessärer med smart förvaring, som sminkväskor i aluminium med lås, spegel och flera nivåer — ordning på plats i stället för att gräva i botten.",
      "Tänk igenom vad som ska rymmas innan du väljer. Flera nivåer gör att småsaker inte blandas ihop, ett lås är värt mycket om väskan reser med, och en hård aluminiumkonstruktion skyddar innehållet bättre än ett mjukt tygfodral. Mått, antal fack och material anges i produktbeskrivningen.",
      "Beställningen skickas från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Får en hård sminkväska följa med i handbagaget?",
        a: "Måtten anges i beskrivningen — jämför dem med ditt flygbolags regler. Tänk på att vätskor i handbagage har egna begränsningar oavsett väska.",
      },
      {
        q: "Vad gäller vid retur?",
        a: "Du har 30 dagars öppet köp. Hör av dig till kundtjänst så hjälper vi dig med returen.",
      },
    ],
  },

  "verktyg-hemmafix": {
    intro: [
      "Rätt verktyg gör projektet till ett nöje i stället för en kamp. I Verktyg & Hemmafix hittar du handvinschar för båt och trailer i flera kapaciteter, CNC-fräsar med GRBL-styrning för trä och akryl, justerbara laserstativ och garagehyllor i stål.",
      "Dimensionera efter last, inte efter hopp. En handvinsch väljs utifrån vad som faktiskt ska dras — 272, 725 eller 1588 kg — och utväxlingen avgör hur tungt det känns i handen: högre utväxling betyder lättare vev men fler varv. För en CNC-fräs är arbetsytan det som begränsar vad du kan tillverka, och GRBL innebär att den fungerar med de vanligaste gratisprogrammen. Kapacitet och mått anges i varje produktbeskrivning.",
      "Allt skickas från EU-lager med 3–7 arbetsdagars leverans och spårbar frakt. Fri frakt över 499 kr, Klarna och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken kapacitet behöver min handvinsch?",
        a: "Utgå från vikten på det som ska dras och välj med marginal — en båt på trailer kräver mer kraft uppför ramp än på plan mark. Kapaciteten anges i kilo per modell.",
      },
      {
        q: "Vad betyder GRBL på en CNC-fräs?",
        a: "GRBL är en öppen styrprogramvara som gör att fräsen fungerar med de vanligaste gratisprogrammen för att skicka G-kod från datorn. Det gör den enklare att komma igång med för hemmabruk.",
      },
      {
        q: "Hur mycket tål en garagehylla?",
        a: "Maxlast per hyllplan anges i beskrivningen. Fördela vikten jämnt och placera tyngst längst ned för bästa stabilitet.",
      },
    ],
  },
};

/** Redaktionellt innehåll för en kategori-slug, annars undefined. */
export function categoryContent(slug: string): CategoryContent | undefined {
  return CATEGORY_CONTENT[slug];
}
