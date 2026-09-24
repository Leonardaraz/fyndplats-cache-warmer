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
        a: "Leveranstiden är 3–7 arbetsdagar från EU-lager, med spårbar frakt. Fri frakt gäller vid köp över 499 kr.",
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
        a: "Leveranstiden är 3–7 arbetsdagar från EU-lager, med spårning hela vägen. Fri frakt över 499 kr.",
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
  // Möbler skapades i Wix 2026-09-23 — se MAIN_GROUPS i category-groups.ts.
  // Texterna är skrivna mot de ~710 produkter som sorterades in samma kväll.
  mobler: {
    intro: [
      "Möbler är det du lever med varje dag, och därför det som lönar sig mest att välja rätt. Här samlar vi allt från ergonomiska kontorsstolar och skrivbord till fåtöljer, bäddsoffor, matgrupper, soffbord, sängramar och rumsavdelare – prisvärda möbler för vardagsrummet, hemmakontoret, köket och sovrummet.",
      "Mät innan du beställer. Bredd och djup avgör om en soffa eller ett matbord ryms, men för stolar är sitthöjden och maxvikten minst lika viktiga, och för en fåtölj med fällbar rygg behöver du räkna med utrymmet bakom. Varje produktbeskrivning anger mått, material och hur mycket möbeln bär, så att du kan jämföra på riktigt och inte bara på bild.",
      "Beställningarna skickas från EU-lager med 3–7 arbetsdagars leverans. Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver möblerna monteras?",
        a: "De flesta möbler levereras omonterade i kartong, med beslag och monteringsanvisning. Stolar och fåtöljer är ofta klara efter att fot och rygg skruvats fast; större bord och sängramar tar längre tid. Vad som ingår står i produktbeskrivningen.",
      },
      {
        q: "Hur vet jag att möbeln får plats?",
        a: "Alla mått anges i beskrivningen. Mät ytan där möbeln ska stå och tänk på dörröppningar, fällbara ryggar och utdragbara fotstöd som tar extra plats när de används.",
      },
      {
        q: "Kan jag returnera en möbel?",
        a: "Ja, du har 30 dagars öppet köp. Kontakta kundtjänst innan du skickar tillbaka något, så hjälper vi dig med returen.",
      },
    ],
  },

  // ══ UNDERKATEGORIER (tillagda 2026-08-12) ═════════════════════════════════
  // Skrivna mot det faktiska sortimentet i respektive kategori. Tunna kategorier
  // (1–3 produkter) får kortare text som handlar om just de produkterna — hellre
  // ett stycke som stämmer än tre utfyllda som lovar ett sortiment vi inte har.

  "baby-smabarn": {
    intro: [
      "De första åren går fort, och prylarna ska hänga med. I Baby & Småbarn hittar du lekmattor i skum, gåvagnar i trä, babygungor, hopfällbara babybadkar, en lekhage med bollhavsbollar, juniorsängar och ett väggmonterat skötbord.",
      "Säkerhet och ålder går före allt annat när du handlar till småbarn. Kontrollera rekommenderad ålder och maxvikt i produktbeskrivningen, särskilt för sådant barnet sitter i, som babygungor med ryggstöd, säkerhetsbälte och bygel. En gåvagn i trä ger stöd när barnet tar sina första steg, och en lekmatta i XPE-skum dämpar när barnet ramlar.",
      "Babybadkaren viks ihop platt för förvaring och resa, och två av dem har inbyggd termometer som visar vattnets temperatur.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en gåvagn?",
        a: "Gåvagnarna i trä är gjorda för barn från 12 till 18 månader och ger stöd när barnet tar sina första steg. Låt barnet gå med vagnen under uppsikt på plant golv.",
      },
      {
        q: "Vad ska jag tänka på med en babygunga?",
        a: "Välj en gunga med ryggstöd, säkerhetsbälte och bygel framtill för de minsta. En av gungorna står på ett eget stativ och behöver ingen takmontering, och på en annan går ryggstöd och bygel att ta av när barnet växer.",
      },
      {
        q: "Tar ett babybadkar mycket plats?",
        a: "Nej, babybadkaren är hopfällbara och viks ihop platt för förvaring och resa. Ett av dem står på en hopfällbar ställning som lyfter badkaret till en bekväm höjd.",
      },
    ],
  },

  baddfatoljer: {
    intro: [
      "En bäddfåtölj är en fåtölj till vardags och en säng när någon sover över. Du fäller ut den, lägger ryggen plant och har en bädd som är lika lång som en vanlig säng, utan att gästrummet behöver en säng som står tom resten av året.",
      "Bäddarna är 180 till 193 cm långa och 60 till 98 cm breda. De smala fåtöljerna tar liten plats i ett litet rum, och de med 90 cm bred bädd ger gästen mer utrymme. Ryggen går att ställa i tre till sex lägen, så att du kan luta dig bakåt även när fåtöljen inte är bäddad.",
      "Klädseln är sammet, manchester, chenille eller tyg i linnelook, och flera har armstöd i gummiträ. Stommen är av stål, och de flesta bär 120 kg. Till de flesta följer en kudde, och fåtöljerna levereras omonterade med anvisning.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur lång blir bädden?",
        a: "Mellan 180 och 193 cm, beroende på modell. De flesta ger 183 till 190 cm, alltså en vanlig sänglängd.",
      },
      {
        q: "Hur mycket bär en bäddfåtölj?",
        a: "De flesta bär 120 kg. En modell i manchester utan armstöd är byggd för 200 kg.",
      },
      {
        q: "Går klädseln att tvätta?",
        a: "Kudden som följer med har avtagbart och tvättbart överdrag på flera modeller. Själva fåtöljen torkar du av, och skötselråden står i produktbeskrivningen.",
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

  badrumsskap: {
    intro: [
      "Ett badrumsskåp ska rymma mycket på liten yta och klara badrummets fukt. Här samlar vi smala skåp som får plats bredvid tvättstället, högskåp för handdukar och flaskor, tvättställsskåp, spegelskåp och medicinskåp som går att låsa.",
      "De smala skåpen börjar på 18 cm i bredd och högskåpen går upp till 185 cm, så de flesta badrum har en plats för ett. Stommarna är av lackerad MDF eller spånskiva, bambu eller rostfritt stål, och flera har justerbara hyllplan. Ett av högskåpen har en inbyggd tvättkorg som tippas ut, och på några skåp stängs dörrarna mjukt.",
      "Nästan alla medicinskåp låses med kod eller nyckel, så att mediciner hålls utom räckhåll för barn, och de flesta hängs på väggen. Till de höga skåpen följer tippskydd som ska fästas i väggen. Torka av skåpen med en lätt fuktad trasa och vädra badrummet efter duschen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar ett badrumsskåp i ett litet badrum?",
        a: "Ja, välj efter bredden. De smala skåpen är från 18 cm breda och flera högskåp är bara 20 cm. Mät platsen bredvid tvättstället och räkna med utrymme för att öppna dörren.",
      },
      {
        q: "Går medicinskåpen att låsa?",
        a: "Ja, nästan alla. Fyra har kodlås och tio har nyckellås, och vilket lås skåpet har står i produktbeskrivningen.",
      },
      {
        q: "Behöver skåpen monteras?",
        a: "Ja, de flesta levereras omonterade och monteras efter anvisningen i paketet. De höga skåpen ska dessutom fästas i väggen med tippskyddet som följer med.",
      },
    ],
  },

  badrumsspeglar: {
    intro: [
      "Här hittar du badrumsspeglar med och utan belysning: rektangulära och bågformade LED-speglar, en rund LED-spegel, en spegel med inbyggd förstoringsspegel och enkla speglar med hylla.",
      "LED-speglarna har antiimma som håller en del av glaset fritt från imma efter duschen. Ljuset dimras och ställs i tre färgtemperaturer, 3 000, 4 500 och 6 500 K, och sju av speglarna har också Bluetooth och klocka.",
      "Storlekarna går upp till 100 × 80 cm, och de flesta LED-speglarna har IP44, som tål vattenstänk. Placera ändå spegeln så att duschen inte sprutar direkt på den.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är antiimma?",
        a: "En platta eller folie bakom glaset som håller en del av spegeln fri från imma när badrummet är fullt av ånga. Storleken står i beskrivningen, till exempel 50 × 40 cm, och på den runda spegeln stänger den av sig själv.",
      },
      {
        q: "Vilken färgtemperatur ska jag välja?",
        a: "LED-speglarna ställs om mellan 3 000 K, som är varmt och mjukt, 4 500 K och 6 500 K, som liknar dagsljus. Det kallare ljuset visar färgerna tydligare vid sminkning och rakning.",
      },
      {
        q: "Har speglarna högtalare?",
        a: "Sju av LED-speglarna har Bluetooth och klocka, och flera anger en högtalare på 6 W. Det står i beskrivningen vilka.",
      },
    ],
  },

  barbord: {
    intro: [
      "Här hittar du barbord för köket och vardagsrummet: set med två eller fyra pallar, ett set med två stolar med ryggstöd, två höj- och sänkbara barbord, ett vridbart barbord med glasskåp och en hopfällbar bardisk som packas i en väska.",
      "Borden i seten är 80 till 121,5 cm breda, och sitthöjden är 57 till 68 cm, alltså högre än vid ett matbord. Två av seten har hyllor under skivan, och på det ena bär skivan 170 kg. Ett annat har vinställ och glashållare.",
      "De höj- och sänkbara barborden är runda, drygt 60 cm i diameter, och ställs mellan 70 och 90 cm respektive 67 och 93 cm. Det vridbara barbordet på 150 cm har skåp med dörrar i räfflat glas och en sidomodul, och bardelen vrids ut i vinkel eller läggs rakt.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur högt är ett barbord?",
        a: "De flesta barbord i seten här är 87 till 95 cm höga, och sitthöjden är 57 till 68 cm. Ett vanligt matbord är runt 75 cm högt, så barbordet passar med pallar eller barstolar och inte med vanliga stolar.",
      },
      {
        q: "Hur mycket plats behöver ett barbord med pallar?",
        a: "Räkna med utrymme att dra ut pallarna. För setet på 105 cm anges en golvyta på minst 200 × 140 cm, och för setet med två hyllplan 1,5 × 1,5 meter.",
      },
      {
        q: "Vad är en bardisk?",
        a: "En disk att stå bakom och servera från. Bardisken här fälls upp utan verktyg, har en förvaringshylla och en front i tyg som går att ta av, och packas i en bärväska. Den finns i två längder, 98 och 110 cm.",
      },
    ],
  },

  barnmobler: {
    intro: [
      "Här hittar du barnmöbler: barnfåtöljer och barnsoffor, barnbord med stolar, stapelbara barnpallar, stegpallar, en barnsäng, sminkbord för barn och låga barngarderober med klädstång och spegel.",
      "Barnfåtöljerna finns i teddyfleece, manchester, linnelook och konstläder, och den med kronrygg och den med rutmönstrad rygg har en fotpall eller pall till. En har ett fällbart ryggstöd och blir 90 cm lång. Barnsofforna på 77 cm har plats för två barn och bär 80 kg.",
      "Sminkborden för barn har spegel och pall eller stol, och tre av dem har speglar i akryl, som inte splittras. Ett blir skrivbord när spegeln tas av. Ett barnbord och två sminkbord är testade enligt leksaksstandarden EN 71.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar barnfåtöljerna?",
        a: "Det står i varje beskrivning. Fåtöljen i teddyfleece passar från 18 månader, och fåtöljen med kronrygg och fotpall från 3 år. Barnsofforna för två barn bär 80 kg.",
      },
      {
        q: "Vad är en utklädningsgarderob?",
        a: "En låg garderob med klädstång, hyllor och spegel i barnets höjd, så att barnet själv når kläderna. Garderoberna här är drygt en meter höga, och två är gjorda i massivt trä efter Montessoriidén.",
      },
      {
        q: "Behöver barnmöblerna monteras?",
        a: "Borden, garderoberna och flera av sminkborden monteras, och till garderoberna följer skruvar och anvisning med. Barnfåtöljen med kronrygg levereras färdig att använda.",
      },
    ],
  },

  belysning: {
    intro: [
      "Rätt ljus förändrar ett rum mer än de flesta möbler. I Belysning hittar du taklampor, bordslampor, vägglampor för utomhusbruk, dekorativa LED-björkar och kraftiga LED-armaturer för garage och verkstad. Golvlamporna ligger också här, och de har dessutom en egen sida.",
      "Tre saker avgör valet. Sockeln måste matcha lampan du tänkt använda (E27 är vanligast). IP-klassen talar om hur mycket väta armaturen tål — utomhus och i garage vill du ha minst IP44. Ljusmängden mäts i lumen, inte watt: en LED-armatur drar en bråkdel av en gammal glödlampas effekt vid samma ljus. Allt detta anges i produktbeskrivningen.",
      "Taklamporna finns med glaskulor, i kristall, med skärm i linne eller hampsnöre och som LED-lampor med fjärrkontroll. Bordslamporna är i keramik, trä och glas, flera har USB-uttag i foten och ett par är sladdlösa och laddbara, så att de kan stå där det saknas eluttag.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
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

  "blomstall-vaxthyllor": {
    intro: [
      "Ett blomställ samlar krukväxterna på liten yta och ger varje växt sitt eget ljus. Här samlar vi blomställ, växthyllor och blompallar för vardagsrummet, balkongen och altanen: i trappform, för hörnet, hopfällbara eller med krokar för hängande krukor.",
      "De flesta har en stomme av pulverlackerad eller rostskyddad metall och kan stå både inne och ute. Hyllor av galler släpper igenom vatten, och växtstället med tråg har en kant runt det övre planet och två dräneringshål, så att krukorna står kvar och vattnet inte blir stående.",
      "Titta på bärförmågan per plan. På de flesta ställ i metall bär varje plan 10 till 25 kg, medan blomstället i vitt med sju nivåer bär 2 kg per nivå och passar för mindre krukor. Blompallarna med mosaikskiva är tre stycken, 51, 61 och 71 cm höga, och de ryms i varandra när de ställs undan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan blomstället stå ute?",
        a: "De flesta kan det. Stommen är pulverlackerad eller rostskyddad, och i beskrivningen står om stället är gjort för både inne och ute. Står det ute över vintern, ta in det eller ställ det under tak.",
      },
      {
        q: "Hur mycket bär ett blomställ?",
        a: "Det skiljer sig mycket. På de flesta ställ i metall bär varje plan 10 till 25 kg, blompallarna bär 30 till 50 kg och blomstället med sju nivåer 2 kg per nivå. Bärförmågan står i varje produktbeskrivning.",
      },
      {
        q: "Vad är skillnaden mellan ett blomställ och en växthylla?",
        a: "Ingen egentlig, det är två namn på samma sak: ett ställ med flera plan där krukväxterna står på olika höjd. Blompallar är lösa pallar för en kruka var, som kan ställas bredvid varandra som en trappa.",
      },
    ],
  },

  bokhyllor: {
    intro: [
      "Här hittar du bokhyllor till vardagsrummet, kontoret och barnrummet: smala och låga hyllor, kubhyllor med öppna fack, bokhyllor i trädform, en roterande kubhylla och hyllor på hjul.",
      "De höga bokhyllorna levereras med tippskydd som fäster dem i väggen. En av dem har LED-belysning i sju färger på varje plan.",
      "Barnbokhyllorna har lutande plan eller fack där omslagen syns i stället för ryggarna, så att ett barn som inte läser än hittar sin bok. Flera har formen av moln, hus eller björn, och två har tyglådor.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket tål hyllplanen?",
        a: "Det skiljer sig mycket och står i beskrivningen: från 3 kg per plan i en barnbokhylla till 10 kg per plan i en metallhylla.",
      },
      {
        q: "Måste bokhyllan fästas i väggen?",
        a: "En hög eller smal hylla ska alltid fästas, och de flesta bokhyllorna levereras med tippskydd. Skruva i väggmaterialet, inte bara i gipsskivan.",
      },
      {
        q: "Finns det bokhyllor för barn?",
        a: "Ja, med lutande plan där omslagen syns, i form av moln, hus och björn, och en kubhylla med tyglådor. Flera har rundade kanter.",
      },
    ],
  },

  boxningssackar: {
    intro: [
      "Med en boxningssäck hemma tränar du när det passar dig. Här samlar vi fristående boxningssäckar, boxsäcksställ med säck och speedball, punchingbollar på fjädrande stång, boxställ med två speedballs och ett väggfäste för en säck du redan har.",
      "De fristående säckarna står på en fot som fylls med vatten eller sand. Foten levereras tom och fylls först när säcken står på plats, och flera har sugproppar under foten som ger grepp mot ett slätt golv. Punchingbollarna och ställen går att höja och sänka, och höjderna går från 125 till 231 cm.",
      "Till flera följer boxhandskar med, och boxsäcksställen har plats för både säck och speedball. Väggfästet håller en säck på upp till 100 kg, 80 cm ut från väggen, men säcken köper du separat.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad fyller man foten med?",
        a: "Vatten, sand eller båda. Sand ger mest tyngd: i en av säckarna tar foten 120 kg sand eller 70 kg vatten. Sanden eller vattnet köper du själv, eftersom foten levereras tom.",
      },
      {
        q: "Behöver jag borra i väggen?",
        a: "Nej, de fristående säckarna och ställen står på golvet. Bara väggfästet skruvas i väggen.",
      },
      {
        q: "Vad är en speedball?",
        a: "En liten boll som sitter på en fjäder eller i ett ställ och studsar tillbaka när du slår, så att du tränar snabbhet och träffsäkerhet.",
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

  byraer: {
    intro: [
      "Här hittar du byråer till sovrummet, hallen och barnrummet: smala byråer från 20 cm bredd, breda byråer upp till 130 cm, en låg modell på 51,5 cm och höga byråer med fem lådor.",
      "Nästan hälften har tyglådor på en stomme av stål, MDF eller bambu. Flera levereras med tippskydd som fäster byrån i väggen, och det står i beskrivningen vilka.",
      "Två byråer har eluttag ovanpå, den ena också USB, så att mobilen laddas på byrån. En byrå har ett skåp bredvid lådorna.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur djup är en smal byrå?",
        a: "Flera byråer är bara 29 eller 30 cm djupa och passar i hallen eller bredvid sängen. Djupet står alltid i måtten.",
      },
      {
        q: "Varför ska byrån fästas i väggen?",
        a: "En byrå med utdragna lådor kan välta framåt, till exempel om ett barn klättrar på den. Tippskyddet håller den mot väggen, och det följer med flera av byråerna.",
      },
      {
        q: "Behöver byrån monteras?",
        a: "Ja, byråerna levereras omonterade, med anvisning i kartongen.",
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

  "elbilar-for-barn": {
    intro: [
      "En elbil ger barnet egen fart på gården, i parken och på uppfarten. Här samlar vi alla våra eldrivna åkfordon för barn: elbilar och terrängbilar, elfyrhjulingar, elmotorcyklar, Vespa-scootrar, eltraktorer med släp och elgokarts. Det finns modeller för barn från 18 månader upp till 12 år, och flera är licensierade modeller av riktiga bilar från Mercedes-Benz, Audi, BMW, Lamborghini och Toyota.",
      "Välj efter ålder och volt. 6 V passar de minsta: farten ligger oftast på 2,5–3 km/h, och de flesta motorcyklarna i klassen har stödhjul. 12 V är det vanligaste valet från tre år, med en toppfart på upp till 8 km/h, och nästan hälften av modellerna har en fjärrkontroll så att du kan styra tills barnet kör själv. 24 V ger mer kraft för äldre barn, upp till 16 km/h, och här finns också en tvåsitsig elfyrhjuling.",
      "En full laddning räcker till 30–70 minuters körning beroende på modell, underlag och barnets vikt, och laddningen tar oftast 8–12 timmar. Maxvikten går från 20 kg på de minsta fordonen till 65 kg på de största, och flera modeller har bälte, fjädring och mjukstart.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken elbil passar mitt barns ålder?",
        a: "För barn från 18 månader passar 6 V-fordon med låg fart, till exempel elfyrhjulingar och elmotorcyklar med stödhjul. Från tre år är 12 V det vanligaste valet, och för barn upp till 12 år finns 24 V-modeller med två hastighetslägen. Kontrollera åldersintervallet och maxvikten i produktbeskrivningen.",
      },
      {
        q: "Går det att styra elbilen med fjärrkontroll?",
        a: "Ja, nästan hälften av modellerna har en fjärrkontroll för föräldern. Med den styr du bilen tills barnet klarar det själv, och de flesta av de modellerna har dessutom bälte.",
      },
      {
        q: "Hur länge räcker batteriet?",
        a: "En full laddning ger 30–70 minuters körning, beroende på modell, underlag och barnets vikt. Laddningen tar oftast 8–12 timmar, så det enklaste är att ladda över natten.",
      },
    ],
  },

  "eldkorgar-eldstader": {
    intro: [
      "En eldkorg eller eldstad utomhus samlar sällskapet på uteplatsen, även när kvällarna blir kalla. Här samlar vi eldkorgar från Ø38 till Ø75 cm, rökfria modeller, eldkorgar med grillgaller och gnistkåpa, en eldkorg formad som ett torn, ett eldbord med bordsyta runt elden och ett fyrfat i stål.",
      "De rökfria eldkorgarna har sekundärförbränning, som bygger på lufthål i korgen. Täcks hålen slutar den att fungera, och den förutsätter torr ved: blöt ved ryker oavsett vad korgen gör.",
      "Flera eldkorgar har grillgaller och gnistskydd. Vad som ingår, till exempel gnistskydd, grillgaller och eldgaffel, står i produktbeskrivningen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Varför ryker min rökfria eldkorg?",
        a: "Fuktig ved är den vanligaste orsaken – den ryker oavsett hur förbränningen är konstruerad. Elda med torr ved, och täck inte lufthålen, för då slutar den sekundära förbränningen att fungera.",
      },
      {
        q: "Kan jag grilla på eldkorgen?",
        a: "Ja, flera av eldkorgarna har ett grillgaller som läggs över elden. Vilka som har det står i produktbeskrivningen.",
      },
      {
        q: "Får jag elda när det är eldningsförbud?",
        a: "Under eldningsförbud gäller länsstyrelsens eller kommunens besked, och reglerna skiljer sig åt beroende på om du lagar mat eller bara eldar för värmen. Kontrollera vad som gäller där du bor innan du tänder.",
      },
    ],
  },

  elementskydd: {
    intro: [
      "Här hittar du elementskydd, också kallade radiatorskydd, som döljer elementet bakom en spjälad front. Fronten släpper igenom den varma luften, och ovansidan blir en hylla där du kan ställa lätta saker.",
      "Skydden är 60 till 172 cm breda, 18 till 19 cm djupa och 81 till 95,5 cm höga. Det vita på 60 eller 90 cm finns i två bredder, och det längsta på 172 cm täcker ett långt element under ett fönster.",
      "Elementskyddet i ekton har vågräta spjälor och två lådor i överkant, och gavlarna har ett förskuret urtag för golvlisten. Flera förankras i väggen med beslag, vältskydd eller väggclips som följer med.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mäter jag för ett elementskydd?",
        a: "Mät elementets bredd, höjd och djup, inklusive rör och termostat, och jämför med skyddets innermått. Det vita på 112 cm har till exempel innermåttet 106,8 × 16,8 × 80,3 cm.",
      },
      {
        q: "Minskar ett elementskydd värmen?",
        a: "Något, eftersom skyddet står framför elementet. Den spjälade fronten släpper ändå igenom den varma luften, så värmen når rummet.",
      },
      {
        q: "Hur mycket tål hyllan ovanpå?",
        a: "På det vita skyddet på 60 eller 90 cm tål toppskivan 5 kg. Ställ bara lätta saker där, som några böcker, och torka upp spill direkt, eftersom MDF inte tål väta.",
      },
    ],
  },

  elkaminer: {
    intro: [
      "En elkamin ger känslan av en brasa utan skorsten, ved eller aska. Lågorna är LED-ljus, och kaminen värmer rummet när du vill. Här samlar vi väggkaminer att hänga på väggen eller bygga in, fristående kaminer och konsolmodeller, en cylindrisk kamin och små elkaminer på ben.",
      "Effekten är 1800 eller 2000 W, och de flesta har två värmelägen, så att du kan välja 1000 W en sval kväll och full effekt när det är kallt. De flesta går också att köra som ren flameffekt utan värme, och flera har fjärrkontroll, termostat, timer och överhettningsskydd.",
      "Väggkaminerna finns upp till 152 cm breda, och några är gjorda för att byggas in i en vägg eller nisch. Andra ska sitta utanpå väggen, och det står i beskrivningen. Ljudnivån ligger under 50 till 55 dB, alltså hörbar i ett tyst rum men inte påträngande.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Går elkaminen att använda utan värme?",
        a: "Ja, de flesta kan köras som ren flameffekt, så att du har lågorna året om utan att rummet blir varmt.",
      },
      {
        q: "Hur mycket värmer en elkamin?",
        a: "Effekten är 1800 eller 2000 W, och de flesta har ett lägre läge. En av konsolmodellerna anges värma ett rum på upp till 30 kvadratmeter.",
      },
      {
        q: "Kan man bygga in en elkamin i väggen?",
        a: "Några väggkaminer är gjorda för inbyggnad, och det står i beskrivningen. Andra ska sitta utanpå väggen och ska inte byggas in i en nisch.",
      },
    ],
  },

  "forvaring-organisering": {
    intro: [
      "Ordning börjar med rätt möbel på rätt plats. I Förvaring & Organisering hittar du förvaringsbänkar att sitta på, skåp, kubhyllor, kontorshurtsar på hjul, klädställ och förvaring till garage och förråd. Byråer, bokhyllor, skoskåp och tvättkorgar har dessutom egna sidor.",
      "Mät först, köp sen. Djupet är det mått som oftast överraskar, och ett skåp som är några centimeter för djupt tar mer golv än man tror. För hyllor avgör antal hyllplan och maxlast per plan hur mycket du får plats med, och en hurts på hjul kan rullas undan under skrivbordet när den inte används. Alla mått står i beskrivningen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket tål en garagehylla?",
        a: "Maxlast per hyllplan anges i produktbeskrivningen. Fördela tunga saker jämnt och placera det tyngsta längst ned för bästa stabilitet.",
      },
      {
        q: "Behöver möblerna monteras?",
        a: "Ja, förvaringsmöblerna levereras omonterade, med skruv och anvisning i kartongen.",
      },
      {
        q: "Var hittar jag byråer och bokhyllor?",
        a: "De har egna sidor, Byråer och Bokhyllor, liksom Skoskåp & skobänkar och Tvättkorgar. Där finns bland annat smala byråer från 20 cm bredd och skoskåp för 8 till 30 par.",
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

  garagetalt: {
    intro: [
      "Ett garagetält ger motorcykeln, cyklarna och trädgårdsredskapen tak över huvudet utan att du behöver bygga något. Här samlar vi våra garagetält, från 120 × 179 cm för två cyklar eller en motorcykel till ett tält på 300 × 300 cm med 9 m² golvyta.",
      "De flesta har stomme i galvaniserat stål och duk i PE eller polyester, och dörren rullas upp eller öppnas med dragkedja. Markankare och spännlinor följer med så att tältet står stadigt. Titta på snölasten – den anges per modell, till exempel 5 eller 10 kg per kvadratmeter – och borsta av taket efter snöfall.",
      "Ett tält på 162 × 221,5 cm är djupt nog för en motorcykel eller ett par cyklar efter varandra.",
      "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Klarar garagetältet snö?",
        a: "Snölasten anges per modell, till exempel 5 eller 10 kg per kvadratmeter. Det räcker för ett lätt snölager, så borsta av taket efter snöfall.",
      },
      {
        q: "Vad får plats i ett garagetält?",
        a: "Tälten på 120 × 179 cm rymmer två cyklar, en motorcykel eller trädgårdsredskap. Tälten på 162 × 221,5 cm är djupa nog för en motorcykel eller ett par cyklar efter varandra, och det stora tältet på 300 × 300 cm har 9 m² golvyta.",
      },
      {
        q: "Hur förankras tältet?",
        a: "Markankare och spännlinor följer med, och ett av tälten har dessutom expanderskruvar för hårt underlag.",
      },
    ],
  },

  gnistskydd: {
    intro: [
      "Här hittar du gnistskydd, också kallade brasskärmar, som ställs framför den öppna spisen och fångar gnistor och glöd som flyger ut ur elden. De står fritt och flyttas undan när du lägger in ved.",
      "De flesta har tre paneler, där sidopanelerna vinklas bakåt så att skyddet står stadigt och täcker även åt sidorna. Bredden är 96 till 141 cm och höjden 50 till 81 cm, så mät spisens öppning innan du väljer.",
      "Ett gnistskydd är guldfärgat och har dubbeldörrar i mitten, och ett har handtag och en välvd mittpanel. Gnistskyddet i smidesdesign på 128 cm levereras färdigmonterat, och flera går att fälla ihop när de inte används.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stort gnistskydd behöver jag?",
        a: "Skyddet ska vara bredare och högre än spisens öppning, så att det täcker hela eldstaden. Ett tredelat skydd tar mindre bredd när det vinklas: det som är 114 cm brett utfällt spänner 108 cm vinklat.",
      },
      {
        q: "Vad är skillnaden mellan gnistskydd och brasskärm?",
        a: "Ingen, det är två namn på samma sak: en skärm av metall som ställs framför en öppen eld och tar emot gnistorna.",
      },
      {
        q: "Blir gnistskyddet varmt?",
        a: "Ja, metallen blir varm när den står nära elden. Låt skyddet svalna innan du flyttar det, och håll barn och husdjur borta från det medan det brinner.",
      },
    ],
  },

  golvlampor: {
    intro: [
      "En golvlampa ger ljus där taklampan inte når: bredvid soffan, vid läsfåtöljen eller i ett mörkt hörn. Här samlar vi båglampor, golvlampor med inbyggd LED, trebenta lampor med tygskärm, golvlampor med hyllor och lampset där golvlampan har två bordslampor i samma stil.",
      "Lamporna är från 129 till 190 cm höga, och några går att höja och sänka. De flesta båglamporna har en tung fot i marmor som håller den långa armen stadig. Ungefär hälften går att dimra, många har fjärrkontroll och de flesta har en fotbrytare, så att du tänder utan att böja dig.",
      "Titta på ljuskällan innan du beställer. I lamporna med inbyggd LED sitter ljuset fast, till några lampor med E27-sockel ingår lamporna och till andra köper du dem separat. Flera LED-lampor går att ställa om mellan varmt och kallt ljus, från 3000 till 6500 kelvin.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår glödlampan?",
        a: "Det beror på lampan. I lamporna med inbyggd LED sitter ljuskällan fast. Till några lampor med E27-sockel ingår lamporna, till andra köps de separat, och det står i produktbeskrivningen.",
      },
      {
        q: "Vad är en båglampa?",
        a: "En golvlampa med en lång, böjd arm som når ut över soffan eller bordet, så att ljuset kommer ovanifrån. Foten är tung, ofta i marmor, så att lampan står stadigt.",
      },
      {
        q: "Kan jag ladda mobilen i lampan?",
        a: "Ja, i två av golvlamporna med hyllor. Den ena har USB-uttag och den andra både USB-A, USB-C och ett vanligt eluttag.",
      },
    ],
  },

  "grill-utekok": {
    intro: [
      "Grillen är samlingspunkten på altanen. Här samlar vi gasolgrillar, kolgrillar och planchor, grillvagnar och campingbord, kylboxar och kylvagnar för drycken, och tillbehör som grilltält och eldstadsverktyg. Eldkorgarna har en egen sida under Eldkorgar & eldstäder.",
      "Gasolgrillarna har från två till fem brännare, och en plancha är en stekhäll som värms av gasolbrännare. Till både gasolgrillarna och planchorna följer regulator och slang med, så du behöver bara en gasolflaska. Kolgrillarna finns på vagn och på hjul, och som portabla och hopfällbara modeller.",
      "Två av kylboxarna håller kylan i upp till 72 timmar på is, den ena helt utan el, och flera kylboxar och kylvagnar står på hjul.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår regulator och slang?",
        a: "Ja, till både gasolgrillarna och planchorna ligger regulator och slang i kartongen. Gasolflaskan köper du separat.",
      },
      {
        q: "Hur länge håller kylboxen kylan?",
        a: "Det beror på modell och på hur mycket is du lägger i. Den som håller längst klarar upp till 72 timmar på is, och tiden anges i produktbeskrivningen.",
      },
      {
        q: "Kan jag grilla på en eldkorg?",
        a: "Ja, flera av eldkorgarna har grillgaller. De finns under Eldkorgar & eldstäder.",
      },
    ],
  },

  "gunghastar-gungdjur": {
    intro: [
      "En gunghäst tränar balansen utan att barnet tänker på det. Här samlar vi våra gunghästar och gungdjur: klassiska gunghästar i trä, mjuka hästar i plysch på medar och gungdjur formade som svan, giraff, ren, elefant, dinosaurie och nallebjörn – för barn från 12 månader upp till sex år.",
      "För de minsta är ryggstöd och bälte viktigast. En klassisk gunghäst kräver att barnet kan hålla balansen sittande själv, medan gungdjur med ryggstöd och bälte passar redan från 18 månader. Många av plyschdjuren har ljud, som gnäggande eller melodier, och maxvikten går från 25 upp till 60 kg.",
      "Plyschhästar med ljud tål inte maskintvätt eftersom elektroniken sitter inuti – torka av dem med en lätt fuktad trasa. Låt alltid en vuxen ha uppsikt när barnet gungar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en gunghäst?",
        a: "Gungdjur med ryggstöd och bälte passar från 18 månader, och ett av gungdjuren redan från 12 månader. En klassisk gunghäst utan ryggstöd kräver att barnet kan hålla balansen själv, och flera är gjorda för barn från två eller tre år.",
      },
      {
        q: "Trä eller plysch?",
        a: "En gunghäst i trä är lätt att torka av med en fuktad trasa. En plyschhäst är mjukare och har ofta ljud, men tål inte maskintvätt eftersom elektroniken sitter inuti.",
      },
      {
        q: "Hur mycket får barnet väga?",
        a: "Maxvikten varierar mellan 25 och 60 kg på de modeller som anger den – kontrollera den i beskrivningen innan du köper.",
      },
    ],
  },

  halloweendekoration: {
    intro: [
      "Halloweendekoration gör entrén och trädgården till en del av kvällen. Här samlar vi två sorters figurer: uppblåsbara spöken, pumpor, skelett och portar för gräsmattan, och animerade häxor, zombier, clowner och liemän som rör sig, lyser och låter när någon kommer nära.",
      "De uppblåsbara figurerna reser sig av sig själva när du kopplar in fläkten och håller formen så länge den går. De lyser inifrån, och de flesta har en duk som är IP44-klassad för regn och stänk. Till de flesta följer markpinnar och linor med för att förankra figuren i gräset. Fläkten behöver ström, så ställ figuren nära ett uttag eller använd en förlängningssladd för utomhusbruk.",
      "De animerade figurerna drivs med batterier och behöver ingen sladd. De flesta startar av rörelse, ljud eller beröring och tänder ögonen, rör sig och skriker, ylar eller skrattar. Många är gjorda för att stå inne eller under tak, till exempel i hallen eller på verandan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål de uppblåsbara figurerna regn?",
        a: "De flesta har en duk som är IP44-klassad, vilket täcker regn och stänk. Förankra figuren med markpinnarna och linorna, och ta in den vid storm – en hög duk tar mycket vind.",
      },
      {
        q: "Ingår batterier i de animerade figurerna?",
        a: "I de flesta gör de inte. Vilka batterier figuren behöver står i produktbeskrivningen, så köp dem samtidigt om figuren ska vara igång samma kväll som paketet kommer.",
      },
      {
        q: "Varför startar figuren av sig själv?",
        a: "Sensorn är känslig med flit, så att den reagerar på ett barn som kommer gående. Blåst och trafikbuller kan därför också starta den. Står figuren blåsigt kan du slå av den mellan besöken och slå på den igen när det ringer på.",
      },
    ],
  },

  "hamsterburar-gnagarburar": {
    intro: [
      "Här finns hamsterburar i trä, en dvärghamsterbur, hamsterburar med rörsystem och tunnlar och större gnagarburar för råtta, degu och chinchilla. En stor hamsterbur i trä på ben mäter 110 cm, och hamsterburen på stativ är 120 cm hög och står på hjul.",
      "Hamstrar gräver, så bäddens djup spelar roll. Två träburar har 31 cm fri höjd i bottenplanet, nog för en bädd där djuret kan gräva riktiga gångar, och gnagarburen på hjul har en 26 cm djup underdel i härdat glas. I dvärghamsterburen ger bottenvåningen plats för ett ordentligt lager strö.",
      "Gnagarburen i akryl och aluminium ger 0,50 m² bottenyta i ett enda plan. Flera burar kommer med hus, löphjul, matskål och vattenflaska, och i dvärghamsterburen sitter löphjulet och vattenflaskan redan på plats.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilka burar har djup bädd för grävning?",
        a: "Två hamsterburar i trä har 31 cm fri höjd i bottenplanet, och gnagarburen på hjul har en 26 cm djup underdel i härdat glas. Djupet står redan i produktnamnet.",
      },
      {
        q: "Finns det burar för råtta, degu och chinchilla?",
        a: "Ja. Smådjursburen på 150 cm med fem plan är gjord för djur som klättrar, som råtta, chinchilla, degu och iller. Gnagarburen på 128 cm har fyra plan, ramper och en hängmatta och står på fyra hjul.",
      },
      {
        q: "Vad följer med buren?",
        a: "Det varierar. Flera levereras med hus, löphjul, matskål och vattenflaska, och vad som ingår står i beskrivningen.",
      },
    ],
  },

  "hantlar-hantelset": {
    intro: [
      "Här hittar du hantlar för hemmagymmet: hantelset med ställ, justerbara hantlar, gummerade hexhantlar och enskilda hantlar på 15 och 20 kg. Här finns också en kettlebell på 10 kg, en skivstång med viktskivor och ett hantelställ i två hyllor som bär 270 kg.",
      "Justerbara hantlar sparar plats. Den justerbara hanteln går från 2 till 11 kg i fem steg, 4-i-1-paret ställs om mellan 1, 1,5, 2 och 2,5 kg, och två hantlar på 20 kg sammanlagt blir en skivstång när du sätter ihop dem med förbindelsestången.",
      "Hexhantlarna har sexkantiga huvuden, så de ligger stilla där du lägger dem i stället för att rulla i väg, och på de gummerade skonar gummit golvet. Hantelsetet på 36 kg har sex gummerade hexhantlar och ett kompakt ställ, och setet med väska har fyra färgkodade par från 0,5 till 2 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Justerbara hantlar eller fasta hexhantlar?",
        a: "Justerbara hantlar tar mindre plats och låter dig öka vikten utan att köpa nya. Fasta hexhantlar går snabbare att byta mellan under ett pass, eftersom varje vikt redan ligger färdig.",
      },
      {
        q: "Kan hantlarna ställas direkt på golvet?",
        a: "De gummerade hexhantlarna skonar underlaget, och hanteln på 20 kg är gummiklädd för att kunna sättas ned på ett trägolv. För förvaringen finns hantelstället, där varje hylla bär 135 kg.",
      },
      {
        q: "Finns det skivstång?",
        a: "Ja, en justerbar skivstång med viktskivor på 20 kg, och ett set där två hantlar blir en skivstång med en förbindelsestång.",
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

  "honshus-honsgardar": {
    intro: [
      "Här hittar du hönshus i trä, hönsgårdar att gå in i, värpreden och en automatisk hönslucka. Flera anger hur många höns de är gjorda för, från hönshus för två höns till hönsgården på 24 m² för 24–30 höns.",
      "De flesta hönshus har både värprede och sittpinnar, och flera har en rastgård i samma stycke. Städningen går fortare med en utdragbar bricka eller bottenlåda, och på ett av husen fälls både taket och värpredet upp.",
      "Hönsgårdarna ger hönsen yta att röra sig på under dagen, från 3,07 m² med ståhöjd upp till 24 m². De stora är byggda av galvaniserat stålrör med tak av duk mot sol och regn. Den automatiska hönsluckan öppnar på morgonen och stänger på kvällen, och i hönsredet i galvat stål rullar ägget ner i en uppsamlingslåda.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur många höns får plats?",
        a: "Det beror på modellen. Hönshusen är gjorda för två till tio höns, och hönsgårdarna i stål rymmer från 4–6 höns upp till 24–30 höns på 24 m². De flesta beskrivningar anger antalet.",
      },
      {
        q: "Vad är skillnaden mellan hönshus och hönsgård?",
        a: "I hönshuset sover och värper hönsen, med sittpinnar och värprede. Hönsgården är en inhägnad rastgård där de rör sig under dagen, i trä eller galvaniserat stål och ofta med tak. Flera hönshus har en mindre rastgård i samma stycke.",
      },
      {
        q: "Hur fungerar den automatiska hönsluckan?",
        a: "Den öppnar på morgonen och stänger på kvällen av sig själv. Du styr den med timer eller den inbyggda ljussensorn och kan öppna den manuellt med fjärrkontrollen.",
      },
    ],
  },

  hornskrivbord: {
    intro: [
      "Här hittar du hörnskrivbord som tar vara på ett hörn i rummet. De flesta är L-formade med en stor och en mindre skiva, så att du har datorn på den ena och papper eller en andra skärm på den andra.",
      "Fyra har eluttag och USB i bordet, så att datorn och telefonen laddas vid skrivbordet. Två av dem har ett hylltorn med fem plan, ett har tre lådor, och gamingbordet har ett skärmställ för två skärmar upp till 42 tum. Flera har ett skärmställ som höjer skärmen.",
      "Två kan byggas om till raka skrivbord. Det ena blir 240 cm långt, och det andra blir 150 cm och vrids på stället mellan hörnläge och rakt läge. Hörnskrivbordet på 150 × 150 cm har två lika stora arbetsytor på 90 × 55 cm.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stort hörn behöver ett hörnskrivbord?",
        a: "Mät längs båda väggarna. Gamingbordet tar 128 × 128 cm, bordet med tre lådor 170 × 100 cm och bordet med lika långa sidor 150 × 150 cm. Det vridbara skrivbordet tar 105 × 85 cm i hörnläge.",
      },
      {
        q: "Hur mycket tål skrivbordet?",
        a: "Det skiljer mellan modellerna. Gamingbordet tål 45 kg totalt, och borden med hylltorn tål 135 kg totalt och 50 kg per bordsskiva.",
      },
      {
        q: "Har hörnskrivborden förvaring?",
        a: "De flesta har det. Två har ett hylltorn med fem plan, ett har tre lådor och fyra hyllor, ett har hyllor och ett datorställ, och det vridbara skrivbordet har också förvaring. Hörnskrivbordet på 150 × 150 cm har bara arbetsytor.",
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

  "hundbaddar-hundsoffor": {
    intro: [
      "En egen bädd ger hunden en fast plats att vila på. Här samlar vi våra hundbäddar och hundsoffor: soffor med ben i furu och dynor med tvättbart överdrag, upphöjda hundsängar med nät för ute och inne och hopfällbara bäddar med bärväska.",
      "En upphöjd bädd lyfter hunden från golvet. På hundsofforna lyfter furubenen bädden så att luften kommer åt underifrån, och på nätbäddarna cirkulerar luften under hunden så att den håller sig sval. En av nätbäddarna har dessutom tak som ger skugga och skydd mot regn.",
      "Välj storlek efter hunden: bäddarna finns från små sängar på Ø40 cm för katter och de minsta hundarna till XL-bäddar på 122 × 92 cm som bär 50 kg.",
      "Du betalar tryggt med Klarna, med fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Varför välja en upphöjd hundbädd?",
        a: "En upphöjd bädd lyfter hunden från golvet så att luften kommer åt underifrån. På bäddar med nät cirkulerar luften under hunden så att den håller sig sval, och de hopfällbara modellerna med bärväska är lätta att ta med.",
      },
      {
        q: "Går överdraget att tvätta?",
        a: "På de flesta sofforna och bäddarna går överdraget eller dynan att ta av och tvätta. Tvättråden står i beskrivningen.",
      },
      {
        q: "Vilken storlek behöver min hund?",
        a: "Hunden ska kunna ligga utsträckt, så mät den från nos till svansrot och jämför med liggytans mått. De minsta sofforna är gjorda för katter och små hundar som tax och chihuahua, medan de största bäddarna bär upp till 50 kg.",
      },
    ],
  },

  hundburar: {
    intro: [
      "En hundbur ger hunden en egen plats hemma, i bilen och på resan. Här samlar vi våra hundburar: möbelburar i valnöt, ek och vitt som också fungerar som sidobord, en bur i metall med hjul och topplucka och mjuka burar i väv som viks ihop när de inte används.",
      "Mät hunden på längden, inte bara vikten: de flesta burarna anger både maxvikt och kroppslängd, oftast upp till 30 kg och 60 cm. Hunden ska kunna stå, vända sig och ligga utsträckt. En skjutdörr tar ingen plats framför buren, och möbelburarnas skiva ovanpå bär mellan 20 och 50 kg – plats för lampan och böckerna.",
      "Möbelburarna väger mellan 25 och 47 kg och monteras där de ska stå, medan de mjuka burarna väger från 3,8 kg och följer med i bagageutrymmet. För två hundar finns en bur på 120 cm med mellanvägg och två skjutdörrar.",
      "Du handlar tryggt med Klarna, med fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor hundbur behöver min hund?",
        a: "Hunden ska kunna stå upp, vända sig och ligga utsträckt. Mät kroppslängden och jämför med burens innermått – de flesta burarna anger både maxvikt och kroppslängd, till exempel 30 kg och 60 cm.",
      },
      {
        q: "Vad är en möbelbur?",
        a: "En hundbur byggd som en möbel, med en hel skiva ovanpå som fungerar som sidobord. Den smälter in i rummet, och skivan bär mellan 20 och 50 kg.",
      },
      {
        q: "Vilken bur passar på resan?",
        a: "De mjuka burarna i väv väger från 3,8 kg och viks ihop, så de är lätta att ta med i bilen. Metallburen med hjul och bricka går också att fälla ihop.",
      },
    ],
  },

  hundkojor: {
    intro: [
      "En hundkoja ger hunden ett eget skydd mot regn, blåst och markfukt när den är ute på tomten. Här samlar vi våra hundkojor och hundhus i gran och plast för utomhusbruk, plus en koja i MDF för inomhus, i storlekar för hundar från 8 upp till 30 kilo.",
      "Välj storlek efter hunden: den ska kunna gå in, vända sig och ligga utsträckt, och de flesta kojorna anger hur stor hund de är byggda för. Ett upphöjt golv med luftspalt håller fukt och frost från marken borta, ett asfaltstak håller regnet ute och ett tak som fälls upp gör det lätt att göra rent. Några modeller har veranda framför dörren, och en har takterrass med trappa. Plastkojorna tar inte upp fukt och kan spolas rena.",
      "Utomhuskojorna är väderskydd, inte isolerade vinterbostäder. En hund som ska vara ute vintertid behöver en isolerad hydda.",
      "Du betalar tryggt med Klarna, med fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Klarar hundkojan svensk vinter?",
        a: "Inte som enda skydd. Kojorna skyddar mot regn, blåst och markfukt, men väggarna är oisolerade. En hund som ska vistas ute vintertid behöver en isolerad hydda.",
      },
      {
        q: "Hur stor hundkoja behöver min hund?",
        a: "Hunden ska kunna gå in, vända sig och ligga utsträckt. De flesta kojorna anger en maxvikt, från 8 kilo för de minsta till 30 kilo, och invändiga mått, så jämför med hundens längd och mankhöjd.",
      },
      {
        q: "Trä eller plast – vad ska jag välja?",
        a: "En koja i gran ger ett klassiskt hundhus, ofta med asfaltstak, veranda eller ett tak som fälls upp. Plast är lätt, tar inte upp fukt och kan spolas ren. Ingen av sorterna är isolerad.",
      },
    ],
  },

  hundvagnar: {
    intro: [
      "Här finns hundvagnar för allt från små hundar på upp till 4 kg till stora hundar på upp till 30 kg, och cykelvagnar för hund som bär upp till 45 kg. Maxvikten står oftast redan i namnet, och flera anger också liggytan och hur lång hunden får vara.",
      "Flera är hopfällbara. En fälls i ett enda drag och lägger sig platt, och en annan blir bärväska: kabinen lossas från chassit och packas ned till 61 × 40 × 10 cm.",
      "Cykelvagnarna för hund dras efter cykeln, och modellerna 2-i-1 blir hundvagn när ni kommit fram: dragstaget hakas av och handtaget fälls upp. Joggingvagnen har ett låsbart framhjul, och på en vagn med tre hjul kan framhjulet svänga fritt eller låsas rakt fram.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor hund får plats i vagnen?",
        a: "Titta på maxvikten och liggytan. Vagnen med fyra hjul och sufflett för hundar upp till 4 kg tar högst 32 cm kroppslängd, vagnarna för mellanstora hundar har 93 × 52 cm liggyta och bär 25 kg, och de största hundvagnarna tar upp till 30 kg.",
      },
      {
        q: "Kan jag cykla med hundvagnen?",
        a: "Med cykelvagnarna för hund, ja. De dras efter cykeln, och på modellerna 2-i-1 hakas dragstaget av så att vagnen blir en hundvagn med handtag. En av dem bär upp till 45 kg.",
      },
      {
        q: "Går vagnen att fälla ihop?",
        a: "Flera är hopfällbara, och det står i namnet. En vagn för hundar upp till 30 kg fälls i ett enda drag och lägger sig platt i 87 × 56 × 32 cm.",
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

  juldekoration: {
    intro: [
      "Juldekoration utomhus sätter stämningen redan vid grinden. Här samlar vi uppblåsbara tomtar, snögubbar, pepparkaksgubbar, renar och en pingvin, ljusfigurer som renfamiljer och isbjörnar, och för inomhus julbyar i trä, girlanger och adventskalendrar.",
      "De uppblåsbara figurerna är upp till 250 cm höga och reser sig när du kopplar in fläkten. De lyser inifrån med LED, och de flesta är IP44-klassade, alltså skyddade mot stänk. Till de flesta följer markspett och linor med för att förankra figuren i gräsmattan, och vid kraftigt regn, snö eller hård vind tar du in den.",
      "Ljusfigurerna lyser med lysdioder – renfamiljen har 283 stycken – och de flesta är IP44-klassade för att stå ute. Flera har timer. För inomhus finns julbyar i trä med LED, girlanger och två adventskalendrar med 24 lådor att fylla.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål de uppblåsbara figurerna regn och snö?",
        a: "De flesta är IP44-klassade och skyddade mot stänk, så lätt regn går bra. Vid kraftigt regn, snö eller hård vind ska figuren tas in, och den håller längre om den står inne i dåligt väder.",
      },
      {
        q: "Hur länge får fläkten gå?",
        a: "Figuren håller formen bara medan fläkten går, så den ska vara på så länge figuren står uppe. För en del figurer anger produktbeskrivningen hur länge fläkten får gå i sträck, till exempel högst åtta timmar.",
      },
      {
        q: "Ingår batterier i julbyarna och adventskalendrarna?",
        a: "Nej, batterierna ingår inte. Vilka som behövs står i produktbeskrivningen.",
      },
    ],
  },

  julgranar: {
    intro: [
      "En konstgjord julgran – eller plastgran, som många säger – ställer du upp varje december i många år, utan barr på golvet och utan vattning. Här samlar vi alla våra julgranar: från små granar på 57 cm till granar på 225 cm för rum med högt i tak, och från smala pelarmodeller som bara är 46–54 cm breda till täta granar med över 2 000 grenspetsar.",
      "Välj efter rummet. Mät takhöjden och lämna plats för toppen, och tänk på bredden: en bred gran på 180 cm kan vara över en meter i diameter, medan en smal modell får plats bredvid soffan. Antalet grenspetsar säger hur tät granen blir – samma höjd finns från några hundra till flera tusen spetsar. Vill du ha en julgran med belysning finns granar där LED-lamporna redan sitter i grenverket, och de snötäckta modellerna ger vinterkänsla direkt.",
      "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur hög julgran ska jag välja?",
        a: "Utgå från takhöjden och dra av 20–30 cm för toppen och stjärnan. I ett rum med 2,4 meter i tak passar en gran på 180–210 cm. Har du ont om golvyta är en smal modell ofta rätt – en pelargran på 180 cm är bara 46 cm bred.",
      },
      {
        q: "Finns det julgranar med belysning?",
        a: "Ja. Flera av våra granar har varmvita LED-lampor som redan sitter i grenverket – från små granar med 50 LED till en 210 cm hög gran med 700 LED. Då slipper du linda en ljusslinga runt granen själv.",
      },
      {
        q: "Hur förvarar jag en konstgjord julgran?",
        a: "Många av våra granar delas i sektioner, och flera har en fot som fälls ihop – då ryms granen i en kartong till nästa jul. Förvara den torrt och fluffa upp grenarna när du ställer upp den igen.",
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

  "kaninburar-marsvinsburar": {
    intro: [
      "Här hittar du kaninburar och kaninhus för trädgården, burar på hjul, marsvinshyddor, smådjursstall med löpgård och hagar för kanin och marsvin. De flesta är gjorda för båda djuren, och vilka djur en bur passar för står i beskrivningen.",
      "Flera utomhusburar har tak av asfaltpapp eller bitumen, stomme i granträ och galler eller nät i galvaniserat stål. Många har två plan: ett stängt sovhus överst och en öppen rastgård under, med en ramp emellan. Smådjursstallen på 230 cm har löpgård åt båda håll och en tredje yta under själva huset.",
      "Hagarna utan botten ställs direkt på gräsmattan, så att djuren går på riktig mark och kan beta. För inomhus finns en modulhage av 47 trådpaneler som blir 175 × 105 cm och en modulär bur av 27 paneler. Den hopfällbara hagen på 110 × 105 cm viks ihop till 13,5 cm när den inte används.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar burarna både för kanin och marsvin?",
        a: "De flesta gör det, och flera av smådjursstallen nämner också råtta och degu. Vilka djur en bur är gjord för står i beskrivningen.",
      },
      {
        q: "Vad är skillnaden på en hydda och en hage?",
        a: "En hydda eller ett stall har tak och ett stängt sovhus, ofta med en rastgård bredvid eller under. En hage är en inhägnad där djuren rör sig, och flera har ett hus eller ett tak som fälls upp. Hagarna utan botten ställs på gräset, och modulhagarna för inomhus byggs av paneler.",
      },
      {
        q: "Hur ser jag hur stor buren är?",
        a: "Längd, djup och höjd står i beskrivningen, och flera anger bottenytan i kvadratmeter. Kaninhyddan i två plan har 0,81 m² bottenplan, och kaninhuset på 122 cm har en rastgård på 1,02 m².",
      },
    ],
  },

  katthus: {
    intro: [
      "Ett katthus ger utekatten ett torrt och skyddat ställe att vila på, på balkongen, altanen eller i trädgården. Här samlar vi våra katthus i trä – från små hus på 62 cm till hus i två och tre plan med balkong och fönster – och några katthus för inomhusbruk.",
      "Titta på tak, golv och öppning. Ett tak med asfalt eller takpapp leder bort regnet, och ett hus på ben med golvet några centimeter över marken slipper suga upp markfukt. Ett tak eller en lucka som fälls upp gör det lätt att göra rent, och ett hus med två plan ger katten både en skyddad sovplats och en utsiktsplats. Har du två katter finns också ett hus byggt för två.",
      "I flera av utomhushusen ingår ingen bädd – lägg i halm, en filt eller en värmematta avsedd för djur.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår det en bädd i katthuset?",
        a: "I flera av utomhushusen gör det inte. Lägg i halm, en filt eller en värmematta avsedd för djur. Några modeller, som det upphöjda katthuset på 62 cm, levereras med bädd.",
      },
      {
        q: "Hur gör jag rent katthuset?",
        a: "Flera av husen har ett tak eller en lucka som fälls upp, så du kommer åt hela insidan på en gång. Ett av husen har dessutom en botten som går att ta ur vid storstädningen.",
      },
      {
        q: "Finns det katthus för inomhusbruk?",
        a: "Ja, till exempel ett katthus i tv-design med kudde och en hopfällbar kattkoja med klöspelare i sisal.",
      },
    ],
  },

  kattlador: {
    intro: [
      "En kattlåda ska vara lätt att hålla ren och stor nog för katten att vända sig och gräva i. Här samlar vi alla våra kattlådor: öppna lådor med höga kanter, täckta kattlådor med lock eller tak, lådor med toppingång och kattlådsskåp som döljer lådan i en möbel.",
      "Rostfritt stål är värt att titta på. Plast får med tiden repor från klor och skopa, och i reporna fastnar urin som luktar – ett kar i stål har ingen sådan yta och går att skura rent. Rostfria lådor finns här från 52 cm upp till en XXL-låda på 130 liter. En täckt låda eller en låda med toppingång håller mer av sanden kvar, och flera modeller har kolfilter eller luktfilter. En utdragbar låda gör det enklare att tömma.",
      "Kattlådsskåpen har en skiva ovanpå som tål vikt, så möbeln fungerar som sidobord eller hylla, och innermåtten står i beskrivningen så att du ser vilken låda som får plats.",
      "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Varför välja en kattlåda i rostfritt stål?",
        a: "Plast får med tiden repor från klor och skopa, och i reporna fastnar urin som luktar även efter rengöring. Rostfritt stål suger inte åt sig lukt på samma sätt och går att skura utan att ytan skadas.",
      },
      {
        q: "Hur stor kattlåda behöver min katt?",
        a: "Katten ska kunna vända sig och gräva utan att kliva ur. Jämför sandytans mått i beskrivningen med kattens längd – en stor katt eller flera katter behöver en XL- eller XXL-låda.",
      },
      {
        q: "Vad är ett kattlådsskåp?",
        a: "Ett kattlådsskåp är en möbel med plats för kattlådan inuti. Skivan ovanpå tål vikt, på en av modellerna 50 kg, och innermåtten står i beskrivningen, så att du ser vilken låda som får plats.",
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

  "kladhangare-hallmobler": {
    intro: [
      "Här hittar du klädhängare, klädställningar och hallmöbler: fristående klädhängare med krokar, klädställ på hjul, en öppen klädställning med tre stänger och hallmöbler som samlar krokar, bänk och skoförvaring i en och samma möbel.",
      "Klädhängaren i furu har åtta krokar på olika höjder. Klädstället med paraplyställ tar bara 30,5 × 30,5 cm golv och har tolv krokar på tre höjder. Klädställningen på hjul ställs i höjd mellan 95 och 170 cm och i bredd mellan 86 och 160 cm.",
      "Hallmöblerna har bänk, skobänk eller en tygkommod med sju lådor under krokarna. Hallmöbeln 3-i-1 har en bänk som bär 110 kg och levereras med tippskydd. Till den som vill sitta ner och ta på skorna finns också hallbänkar, varav en med rullade armstöd.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket klarar en klädhängare?",
        a: "Det står per krok och totalt i beskrivningen. Klädhängaren i furu tar 5 kg per krok och 30 kg totalt, och den trädformade klädhängaren för väggen tar 5 kg per krok och 40 kg totalt.",
      },
      {
        q: "Får långa rockar plats på klädstället?",
        a: "Klädstället i vit metall har 133 cm fritt hängrum, vilket räcker för långrockar utan att de nuddar golvet. Den öppna klädställningen har hänghöjder på 132 och 85 cm.",
      },
      {
        q: "Vilken hallmöbel passar en smal hall?",
        a: "Klädstället med paraplyställ tar 30,5 × 30,5 cm golv, och hallmöbeln med tygkommod är bara 30 cm djup. Hallmöbeln med stoppad sits är 72,5 cm bred.",
      },
    ],
  },

  klostrad: {
    intro: [
      "Ett klösträd ger katten ett eget ställe att klösa, klättra och sova på. Här samlar vi alla våra klösträd och kattträd, från ett litet klösträd på 46 cm till takhöga modeller som spänns fast mellan golv och tak och når 275 cm. Här finns också klöspelare, klöstunnor med hålor att gömma sig i och väggklösträd som monteras på väggen.",
      "Välj efter katten och bostaden. Katter sitter gärna högt med uppsikt över rummet, så ett högt träd med flera plan används ofta mer än ett lågt. Har du ont om golvyta tar ett takhögt träd eller ett väggklösträd mindre plats. De flesta träden har sisal på stammarna, som tål klor bra, medan andra har jute eller naturfiber som vattenhyacint och sjögräs. Höga träd bör fästas i väggen, och flera levereras med tippskydd.",
      "Titta också på plattformarnas mått, så att katten kan ligga utsträckt, och på hur mycket trädet bär – flera modeller bär upp till 30 kg totalt.",
      "Du handlar tryggt med Klarna, med fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur högt ska ett klösträd vara?",
        a: "Katter sitter gärna högt, så ett träd på 130 cm eller mer används ofta mer än ett lågt. Har du flera katter är fler plan och en grotta att dra sig undan i värt mycket, medan kattungar och äldre katter klarar sig bra med ett lägre träd.",
      },
      {
        q: "Hur sitter ett takhögt klösträd fast?",
        a: "Ett takhögt klösträd har en justerbar del som spänns mot taket, så trädet står stadigt i hela sin höjd. Mät takhöjden innan du beställer – varje takhög modell har ett höjdspann, till exempel 228–260 cm.",
      },
      {
        q: "Vad är skillnaden mellan klösträd, klöspelare och klöstunna?",
        a: "Ett klösträd har flera plan, ofta med grotta, hängmatta och bädd. En klöspelare är en ensam stam att klösa och sträcka sig mot, och den tar liten plats. En klöstunna är en sluten tunna med hålor där katten kan gömma sig, med klösytor av sisal eller naturfiber.",
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
        a: "Leveranstiden är 3–7 arbetsdagar från EU-lager, med spårbar frakt. Fri frakt gäller vid köp över 499 kr.",
      },
    ],
  },

  "koksoar-koksvagnar": {
    intro: [
      "En köksö eller köksvagn ger köket mer arbetsyta och förvaring utan att du behöver bygga om. Här samlar vi köksöar med skåp och utfällbar skiva, köksvagnar med lådor och hyllor, smala vagnar med utdragskorgar och vagnar med kryddhylla eller vinställ.",
      "Alla står på hjul, och på nästan alla har två av hjulen broms, så att vagnen står stilla när du arbetar och rullar undan när du städar. Köksöarna är från 113 till 129 cm breda, och de har en skiva som fälls ut eller brickor som dras ut när du behöver mer yta.",
      "Skivorna är av massivt gummiträ, furu eller i trälook och stenlook, och flera vagnar har kryddhylla, handdukshängare och plats för flaskor. Bärigheten står per modell och går upp till 112 kg på den största köksön. Vagnarna levereras omonterade med anvisning.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan en köksö och en köksvagn?",
        a: "Köksön är större, med skåp och en skiva som ger en ny arbetsplats mitt i köket. Köksvagnen är smalare och fungerar som extra förvaring och avlastningsyta som rullas åt sidan.",
      },
      {
        q: "Går hjulen att låsa?",
        a: "Ja, på nästan alla köksöar och köksvagnar har två av hjulen broms.",
      },
      {
        q: "Hur mycket tål skivan?",
        a: "Det står per modell. Den största köksön bär 112 kg totalt, och de smala vagnarna med utdragskorgar är gjorda för lättare saker som burkar och flaskor.",
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

  konstvaxter: {
    intro: [
      "Konstväxter ger grönska där riktiga växter har det svårt, som i ett mörkt hörn eller vid en entré där ingen hinner vattna. Här samlar vi konstgjorda växter för inne och ute, från buxbomsklot, cypresser och lavendelträd till olivträd, monstera, bambu och palmer upp till 190 cm, och häck på rulle.",
      "Många står färdiga i en kruka med cementfylld botten som håller dem stadiga, och några står på jordspett för rabatten. Växterna behöver varken vattnas eller beskäras, och de klarar sig där det är mörkt.",
      "Ska växten stå ute, välj en som är UV-beständig, så att färgen inte bleks i solen. Många av växterna passar både inne och ute, men några är gjorda för inomhusbruk, så kontrollera i produktbeskrivningen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan konstväxterna stå ute?",
        a: "Många kan det, och de UV-beständiga tappar inte färgen i solen. Några är gjorda för inomhusbruk, så kontrollera i produktbeskrivningen innan du ställer växten ute.",
      },
      {
        q: "Hur gör jag rent en konstväxt?",
        a: "Damma av bladen då och då med en mjuk borste eller en lätt fuktad trasa. Vissa kan också sköljas försiktigt med ljummet vatten – låt dem torka efteråt.",
      },
      {
        q: "Välter växten om det blåser?",
        a: "Många står i en kruka med cementfylld botten som håller dem stadiga, och några står på jordspett som sätts ner i marken.",
      },
    ],
  },

  "kropp-valbefinnande": {
    intro: [
      "Här hittar du hjälpmedel för kropp och vardag: två hopfällbara rollatorer med sits, en ljusterapilampa, en ergonomisk sittdyna, en duschpall med stödhandtag och en hopfällbar massagebänk. Här finns också en handpan och en tungtrumma.",
      "Båda rollatorerna har fyra hjul och sits, fälls ihop och bär 136 kg. Den ena har fjädring i chassit, handbroms i båda handtagen och hjul på 20 cm. Den andra har korg och bricka, och handtagen ställs mellan 82 och 97 cm.",
      "Ljusterapilampan ger upp till 10 000 lux och har tre färgtemperaturer, fem ljusstyrkor och timer. Sittdynan är av memoryskum med ett urtag för svanskotan och mäter 44 × 39 × 13 cm, och duschpallen ställs mellan 39 och 51,5 cm och bär 150 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad betyder 10 000 lux?",
        a: "Lux mäter hur mycket ljus som når en yta, och värdet sjunker ju längre från lampan du sitter. 10 000 lux är den ljusstyrka som brukar anges för ljusterapi. Lampan har fem ljusstyrkor, så den kan också användas svagare.",
      },
      {
        q: "Hur högt ska handtagen på en rollator sitta?",
        a: "En vanlig tumregel är att handtagen ska vara i höjd med handleden när du står rak med armarna hängande. På rollatorn med korg och bricka ställs handtagen mellan 82 och 97 cm.",
      },
      {
        q: "Varför har sittdynan ett urtag?",
        a: "Urtaget bak gör att svanskotan inte bär vikten när du sitter, och memoryskummet formar sig efter kroppen. Dynan är 13 cm hög och har ett överdrag i mesh.",
      },
    ],
  },

  "lek-tillbehor-for-husdjur": {
    intro: [
      "Här samlar vi tillbehör för lek och vila för hund och katt: hundtrappor och hundramper upp till soffan och sängen, agilityset med tunnlar, hinder och slalom, kattbäddar, kattrappor och leksaker som håller djuret aktivt.",
      "Hopp ner från soffan eller sängen sliter på leder och rygg, särskilt hos äldre djur och kortbenta raser – där gör en trappa eller ramp skillnad. Välj höjd efter möbeln och titta på maxvikten: trapporna bär från 4,5 upp till 50 kg. Agilityseten finns från tre delar upp till elva delar med två tunnlar, och flera levereras med bärväska.",
      "För katten finns bäddar på ben, kattkojor i vattenhyacint, en hängmatta för fönsterbrädan, kattrappor och en automatisk kattleksak. Klösträden har fått en egen kategori.",
      "Du handlar tryggt med Klarna, med fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Trappa eller ramp – vad passar min hund?",
        a: "En ramp har inga steg och passar hundar som har svårt att kliva, till exempel en äldre hund med stela leder. En trappa tar mindre plats på golvet. Mät höjden på soffan eller sängen innan du väljer.",
      },
      {
        q: "Vad ingår i ett agilityset?",
        a: "Seten består av hopphinder, tunnlar, hoppringar och slalompinnar i olika kombinationer, från tre till elva delar, och flera levereras med bärväska.",
      },
      {
        q: "Finns det något för katten?",
        a: "Ja, kattbäddar på ben, kattkojor, kattrappor, en hängmatta för fönsterbrädan och en automatisk kattleksak med fjärrkontroll.",
      },
    ],
  },

  "leksaker-spel": {
    intro: [
      "Här samlar vi leksaker och spel för barn i olika åldrar: gåbilar och sparkbilar för de minsta, balanscyklar och trampbilar, klätterställningar och rutschkanor för inomhusbruk, byggsatser med tusentals delar, lasertag och spelbord för hela familjen.",
      "Rekommenderad ålder står i beskrivningen och är viktig, både för smådelar och för att barnet ska klara leksaken. Gåbilarna för de minsta har ofta skjutstång och skyddsbåge, så att du kan styra medan barnet sitter. Mät också ytan: en klätterställning eller ett spelbord behöver sin plats, och flera fälls ihop efter leken.",
      "Elbilar, sparkcyklar, gunghästar, leksakskök och sandlådor har numera egna kategorier.",
      "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan gåbil, sparkbil och trampbil?",
        a: "En gåbil har ofta en skjutstång så att en vuxen kan skjuta på, en sparkbil drivs framåt med fötterna och en trampbil har pedaler. Åldern står i beskrivningen – de minsta modellerna passar från ett år.",
      },
      {
        q: "Vilken balanscykel passar mitt barn?",
        a: "Balanscyklarna finns för barn från 12 månader till fem år. Den minsta har tre hjul och en sitthöjd på 26,5 cm, och sadeln går att justera på flera.",
      },
      {
        q: "Kan klätterställningarna stå inomhus?",
        a: "Ja, flera är gjorda för inomhusbruk, till exempel klätterställningar i trä med ramp och rutschkana, och några fälls ihop efter leken.",
      },
    ],
  },

  leksakskok: {
    intro: [
      "I ett leksakskök lagas låtsasmat, diskas och dukas. Här samlar vi våra leksakskök och barnkök för barn från tre år: kök i trä och MDF med ugn och diskho, kök i plast med ljud och ljus, ett hörnkök och en leksaksdiskmaskin.",
      "Några av köken har rinnande vatten: en batteridriven kran pumpar upp vatten ur diskhon så att det går runt i kretslopp. Andra har en diskho med kran men utan vatten, och det står i beskrivningen vilket som gäller. Kök med ljud, ljus och vatten drivs med AA-batterier, som inte alltid ingår.",
      "Titta också på höjden och tillbehören – köken kommer med allt från några få tillbehör upp till 92 delar. Köken i MDF tål avtorkning men inte blötläggning, så torka upp vattenspill direkt.",
      "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Har leksaksköken riktigt vatten?",
        a: "Några har det. I dem pumpar en batteridriven kran upp vatten ur diskhon så att det rinner i kretslopp. Andra har en diskho med kran men utan vatten – det står i beskrivningen.",
      },
      {
        q: "Från vilken ålder passar ett leksakskök?",
        a: "De flesta köken är gjorda för barn från tre år, och flera upp till sex eller åtta år. Följ åldersrekommendationen i beskrivningen.",
      },
      {
        q: "Behöver köket batterier?",
        a: "Kök med ljud, ljus eller rinnande vatten drivs med AA-batterier, som inte alltid ingår. Kök utan elektronik behöver inga batterier.",
      },
    ],
  },

  "massage-aterhamtning": {
    intro: [
      "Här hittar du massage för hemmet: uppresningsfåtöljer med massage, kontorsstolar med massage, reclinerfåtöljer och en gungstol med massage, en fot- och vadmassage och en muskelmassageapparat. Massagebänkar och massagestolar finns också samlade på egna sidor.",
      "En uppresningsfåtölj, eller fåtölj med uppresningshjälp, lyfter och tippar sitsen framåt så att det blir lättare att resa sig. De flesta här lyfts elektriskt och en har hydraulisk lyft. Alla har värme, de flesta har massage i åtta punkter, och ryggen fälls på flera av dem till 150 grader. Två har uttag för USB-A och USB-C, och en behöver bara 35 cm fritt mot väggen.",
      "Kontorsstolarna med massage har fyra till sju vibrationspunkter, och en har knådande massage vid skuldror och midja. Nio av dem har värme, de flesta har ett utdragbart eller infällbart fotstöd, och på de flesta fälls ryggen till mellan 130 och 155 grader. De bär 120 kg, och en bär 135 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är en uppresningsfåtölj?",
        a: "En fåtölj med uppresningshjälp: en motor lyfter och tippar sitsen framåt, så att du kommer upp utan att ta spjärn. Fåtöljerna här fälls också bakåt till liggläge, och alla har värme.",
      },
      {
        q: "Hur mycket plats behöver en uppresningsfåtölj?",
        a: "Räkna med utrymme både bakåt och framåt. Fåtöljerna här är 144 till 165 cm långa i liggläge och upp till 142 cm höga i lyft läge. Den cremevita behöver bara 35 cm fritt mot väggen.",
      },
      {
        q: "Går värmen att använda utan massage?",
        a: "På flera av fåtöljerna, ja. Det står i beskrivningen. På bland annat uppresningsfåtöljen med 155 graders liggläge styrs ländvärmen separat.",
      },
    ],
  },

  massagebankar: {
    intro: [
      "Här hittar du hopfällbara massagebänkar, som också kallas massagebord, massagesäng eller behandlingsbänk. De fälls ihop till ett platt paket och passar både för behandling hemma och för hembesök hos kunden.",
      "Stommen är av trä eller aluminium. Två bänkar i trä bär 250 kg och har en bärväska med i kartongen. På bänkarna med tre zoner fälls rygg, mitt och ben var för sig, och två av dem kan ställas i halvsittande läge.",
      "Liggytan är 60 cm bred, och två bänkar har en liggyta på 70 cm som ger mer plats för armarna. Med ansiktsstödet på är de flesta 210 till 215 cm långa, och höjden går att ställa på alla. Den 70 cm breda med armstöd och handbrädor har en 9 cm tjock dyna.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska en massagebänk ha?",
        a: "En tumregel är att bänken ska nå ungefär till knogarna när du står bredvid den med armarna rakt ner. Höjden går att ställa på alla bänkarna här. Är du lång, titta efter en bänk som går högt: de två träbänkarna med bärväska går upp till 92 cm.",
      },
      {
        q: "Trä eller aluminium?",
        a: "Titta hellre på vikt, maxlast och bredd än på material. Vikten står på de flesta bänkarna och ligger mellan 13 och 17,5 kg. Den på 13 kg har träställ, och aluminiumbänkarna med tre zoner väger 17,5 kg.",
      },
      {
        q: "Hur mycket bär en massagebänk?",
        a: "Det skiljer mellan modellerna. Där maxlasten anges ligger den mellan 130 och 250 kg: den 70 cm breda bänken med armstöd och handbrädor bär 130 kg, och de två träbänkarna med bärväska bär 250 kg.",
      },
    ],
  },

  massagestolar: {
    intro: [
      "En massagefåtölj är en fåtölj att vila i, med vibration och värme i ryggen och ett fotstöd som fälls upp. Här samlar vi massagefåtöljer för vardagsrummet och massagestolar, där flera är kontorsstolar med massage i ryggen för dig som sitter länge vid skrivbordet.",
      "De flesta har både värme och vibration, och några har knådande massage i stället för vibration. Massagen och värmen styrs med en fjärr- eller handkontroll, och flera har timer som stänger av av sig själv. Många går att vrida runt, några har gungfunktion och flera har mugghållare och sidofickor för kontrollen.",
      "Några fåtöljer har uppresningshjälp: en elmotor lyfter sitsen och hjälper dig upp när du ska resa dig. Fåtöljerna bär upp till 160 kg, och klädseln är konstläder, mikrofiber, sammet, chenille eller tyg i linnelook. Kör massagen i korta pass i stället för i timmar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan en massagestol och en massagefåtölj?",
        a: "Massagefåtöljen är en vilfåtölj med fotstöd och ryggläge. Flera av massagestolarna är kontorsstolar, med vibration eller knådning i ryggen, som du sitter i vid skrivbordet.",
      },
      {
        q: "Finns det massagefåtöljer som hjälper en upp?",
        a: "Ja, några har uppresningshjälp. Samma handkontroll styr uppresningen, liggläget och massagen.",
      },
      {
        q: "Hur mycket bär en massagefåtölj?",
        a: "Det står per modell. De flesta bär 120 kg, flera 135 eller 150 kg, och fyra modeller är byggda för 160 kg.",
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

  matgrupper: {
    intro: [
      "Här hittar du matgrupper, alltså matbord som säljs tillsammans med stolar. Sex är tredelade med ett bord och två stolar, och fyra är femdelade med ett bord och fyra stolar.",
      "De små grupperna passar i köket eller i en liten lägenhet: ett kvadratiskt bord på 60 cm, ett på 70 × 70 cm, ett smalt bord på 90 × 47 cm och ett ovalt bord på 80 cm med en hylla under skivan. Klaffbordet fälls ut från 70 till 110 cm, och i en av grupperna har stolarna stoppad klädsel.",
      "Grupperna för fyra har bord på 100 till 120 cm: två i MDF och metall, ett glasbord med stolar i konstläder och ett bord med stolar i furu.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket plats behöver en matgrupp?",
        a: "Räkna med bordets mått plus utrymme att dra ut stolarna. För glasbordet för fyra anges en golvyta på 180 × 170 cm, och för gruppen med bord på 80 × 60 cm minst 2,5 kvadratmeter.",
      },
      {
        q: "Hur höga är bordet och stolarna?",
        a: "Borden är 74,5 till 76,5 cm höga och sitthöjden är 43,5 till 47,5 cm där den anges. Det är vanlig höjd för ett matbord. Ett barbord är runt 90 cm.",
      },
      {
        q: "Hur mycket bär stolarna?",
        a: "Mellan 100 och 120 kg per stol där maxlasten anges, och de flesta bär 120 kg. Borden tål mellan 30 och 100 kg.",
      },
    ],
  },

  "miniugnar-airfryers": {
    intro: [
      "Här hittar du miniugnar och bänkugnar för köksbänken, och miniugnar med frityrkorg som fungerar som airfryer. De rymmer från 9 till 36 liter och tar mindre plats än en vanlig ugn, så de passar i ett litet kök eller som en extra ugn.",
      "Sju av ugnarna har frityrkorg och varmluft. Maten ligger i korgen och den varma luften cirkulerar runt den, så att den blir krispig med betydligt mindre olja än i en vanlig fritös. Ugnarna med frityrkorg rymmer från 10 till 36 liter.",
      "De vanliga miniugnarna har timer och flera har tre värmelägen: övervärme, undervärme eller båda. Två bänkugnar har två kokplattor ovanpå, så att du kan koka och baka samtidigt, och tre ugnar har grillspett.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Är en varmluftsfritös samma sak som en airfryer?",
        a: "Ja, varmluftsfritös är det svenska ordet för airfryer. Här är funktionen inbyggd i en miniugn: maten ligger i en frityrkorg och varm luft blåser runt den. Samma ugn bakar också, och flera av dem kan grilla.",
      },
      {
        q: "Hur stor miniugn behöver jag?",
        a: "Titta på innermåttet och på bakplåten. Ugnen på 9 liter tar en bakplåt på 25 × 20 cm, medan ugnarna på 36 liter har en bakplåt på 37,8 × 28 cm. Innermåtten står i varje beskrivning.",
      },
      {
        q: "Hur varm blir en miniugn?",
        a: "Upp till 230 °C på de ugnar där temperaturen anges, och flera börjar redan på 80 eller 90 °C. Timern går upp till 60 minuter på de flesta.",
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

  motionscyklar: {
    intro: [
      "Här hittar du motionscyklar för träning hemma, bland dem en liggande modell och hopfällbara modeller med ryggstöd, en spinningcykel och pedaltränare som ställs på golvet framför en stol eller soffa.",
      "De flesta motionscyklarna har magnetiskt motstånd i 8 steg och en LCD-display, och två av dem har Bluetooth. Maxvikten är 110 eller 120 kg. Spinningcykeln har filtbroms och steglöst motstånd, och sadeln ställs mellan 78 och 93 cm över golvet.",
      "Pedaltränarna används sittande och tränar benen, flera också armarna. Den eldrivna pedaltränaren har en motor som håller benen i rörelse, med 12 hastigheter och fjärrkontroll.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur tung får jag vara?",
        a: "Maxvikten står i beskrivningen: 110 eller 120 kg för motionscyklarna och 100 kg för spinningcykeln.",
      },
      {
        q: "Finns det motionscykel med ryggstöd?",
        a: "Ja. På den liggande motionscykeln sitter du tillbakalutat med stöd för ryggen, och två hopfällbara modeller har ryggstöd och fälls ihop mellan passen.",
      },
      {
        q: "Vad är en pedaltränare?",
        a: "En liten trampmaskin som ställs på golvet framför en stol eller soffa. Den tränar benen, flera också armarna, och den eldrivna håller benen i rörelse med en motor.",
      },
    ],
  },

  "motorcyklar-for-barn": {
    intro: [
      "En motorcykel för barn är ofta det första egna fordonet med gas och styre. Här samlar vi elmotorcyklar för barn från 18 månader upp till 12 år, bland dem licensierade modeller av BMW och Honda. För de allra minsta finns också ett sparkfordon och två trehjulingar i motorcykelform, som drivs med fötterna eller med pedaler.",
      "Välj efter ålder. För barn på 18–36 månader finns elmotorcyklar på 6 V med en toppfart på 2,5–3 km/h, antingen med två avtagbara stödhjul eller med tre hjul som står stadigt utan stödhjul. För 3–8 år finns modeller på 12 V med stödhjul och fjädring bak, som går i upp till 5 eller 6 km/h.",
      "Elmotorcykeln på 24 V är gjord för 8–12 år och kräver att barnet redan kan cykla: den har två farter, 8 och 16 km/h, luftfyllda bakdäck och en maxlast på 65 kg. En laddning räcker i 30 minuter till en timme beroende på modell, och laddningen tar oftast 8–12 timmar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en elmotorcykel?",
        a: "De minsta modellerna på 6 V är gjorda för barn från 18 månader och går i 2,5–3 km/h. Från tre år passar modellerna på 12 V, och för barn på 8–12 år finns en elmotorcykel på 24 V. Rekommenderad ålder står i varje produktbeskrivning, och på de flesta också maxvikten.",
      },
      {
        q: "Går stödhjulen att ta bort?",
        a: "Ja, på de flesta modellerna med stödhjul skruvas de av när barnet håller balansen själv. Elmotorcyklarna med tre hjul har inga stödhjul, eftersom de står stadigt ändå.",
      },
      {
        q: "Hur länge räcker batteriet?",
        a: "Mellan 30 minuter och en timme per laddning, beroende på modell, underlag och barnets vikt. Laddningen tar oftast 8–12 timmar, så det enklaste är att ladda över natten.",
      },
    ],
  },

  nattduksbord: {
    intro: [
      "Nattduksbordet håller lampan, mobilen och boken inom räckhåll från sängen. Här hittar du nattduksbord och sängbord med lådor, öppna fack och hyllor, svävande modeller som skruvas fast i väggen och smala bord för trånga sovrum.",
      "Flera säljs två och två, så att båda sidorna av sängen matchar. Två sängbord har inbyggda eluttag och USB-uttag, och ett nattduksbord har RGB-belysning dold i en springa.",
      "De svävande borden sitter på väggen utan ben, så golvet under dem blir fritt. Maxlasten står i beskrivningen, till exempel 20 kg per bord.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Är nattduksbord och sängbord samma sak?",
        a: "Ja, det är två namn på samma möbel: det lilla bordet bredvid sängen. Vi använder båda namnen.",
      },
      {
        q: "Hur högt ska ett nattduksbord vara?",
        a: "Ungefär i höjd med madrassens överkant, så att du når lampan och mobilen när du ligger. Mät sängen innan du väljer, höjden står i beskrivningen.",
      },
      {
        q: "Hur sätts ett svävande nattduksbord upp?",
        a: "Det skruvas fast direkt i väggen, med skruv och plugg som passar väggens material. Kontrollera maxlasten i beskrivningen innan du ställer tunga saker på det.",
      },
    ],
  },

  odlingslador: {
    intro: [
      "En odlingslåda gör det enkelt att odla grönsaker, kryddor och blommor även utan trädgårdsland, på gräsmattan, uteplatsen eller balkongen. Här samlar vi odlingslådor och planteringslådor i galvaniserad metall, trä, träkomposit, plast och konstrotting, från lådor som står direkt på marken till upphöjda odlingsbord.",
      "Flera lådor i metall och plast har öppen botten och ställs direkt på marken, så att rötterna når jorden under. Metallådan på 241 × 90,5 cm levereras tillsammans med en mindre låda på 126 cm i samma paket. Flera av lådorna i trä har en fiberduk på insidan.",
      "Vill du slippa böja dig finns upphöjda lådor och odlingsbord, några på hjul eller med skåp eller hylla under. Andra har spaljé för klätterväxter, en foliekåpa som rullas upp eller ett nät som håller fåglarna borta.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver odlingslådan en botten?",
        a: "Nej, inte om den står på marken. Flera av lådorna har öppen botten, så att rötterna når jorden under. På altanen eller balkongen passar en låda med botten och dräneringshål bättre, till exempel de upphöjda lådorna med vattenmagasin eller lådan på hjul.",
      },
      {
        q: "Vilket material ska jag välja?",
        a: "Galvaniserad metall och träkomposit ruttnar inte och står ute år efter år. Trä ger ett varmare intryck men behöver skötas, och plast är lätt. Flera av lådorna i plast monteras utan verktyg.",
      },
      {
        q: "Hur mycket jord går det åt?",
        a: "Räkna längd gånger bredd gånger djup på odlingsytan. Odlingsbordet med drivbänk rymmer cirka 75 liter jord och lådan med skåp 131 liter, och för de andra står odlingsytans mått i beskrivningen.",
      },
    ],
  },

  oronlappsfatoljer: {
    intro: [
      "Här hittar du öronlappsfåtöljer, fåtöljer med hög rygg och sidostycken i huvudhöjd som ger stöd när du lutar dig åt sidan. Här finns också två gungstolar och en uppresningsfåtölj med samma rygg.",
      "Sex av fåtöljerna har samma form: 102 cm höga, 74 cm breda, med knappad rygg och en maxlast på 160 kg. De finns i grått, grå sammet, cremevit flanell, blått, mörkgrått och brunt. På den mörkgrå och den bruna går klädseln att ta av och tvätta, och på den blå går sitsdynans överdrag att tvätta.",
      "Två fåtöljer har ländkudde: den gula med fotpall och den beige i linnelook, som är 110 cm hög och står på ben i gummiträ. Gungstolarna i fleece har fotpall, nackkudde och ryggkudde, och uppresningsfåtöljen har två motorer och fälls till 155 grader.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är en öronlappsfåtölj?",
        a: "En fåtölj med hög rygg och sidostycken i överkant, öronlapparna, som ger stöd åt huvudet när du lutar dig åt sidan. Öronlappsfåtöljerna här är 102 till 110 cm höga.",
      },
      {
        q: "Hur mycket bär en öronlappsfåtölj?",
        a: "Sex av dem bär 160 kg. De andra fåtöljerna, gungstolarna och uppresningsfåtöljen bär 120 kg.",
      },
      {
        q: "Går klädseln att tvätta?",
        a: "På den mörkgrå och den bruna öronlappsfåtöljen går klädseln att ta av och tvätta i maskin, och på den blå går sitsdynans överdrag att tvätta. Hur de andra sköts står under Användning och skötsel i varje beskrivning.",
      },
    ],
  },

  pallar: {
    intro: [
      "Här hittar du pallar till hela hemmet: stegpallar, duschpallar, pianopallar, rullpallar och sadelpallar på hjul, salongspallar, stoppade pallar och stapelbara sittpallar i fyrpack. Det finns också verkstadspallar med verktygsfack eller verktygsbricka och en trädgårdspall på hjul.",
      "Pianopallarna ställs i höjd mellan 45 och 58 cm, och pianopallen med notförvaring har ett dolt fack under sitsen. Rullpallarna, sadelpallarna och salongspallarna är höj- och sänkbara, de flesta med gaslyft, och flera har ryggstöd eller fotring.",
      "Tre av duschpallarna ställs i höjd i fem eller åtta steg, och duschpallarna bär 100 till 150 kg. Stegpallen i stål fälls ihop med ett knapptryck, och till barnen finns stegpallar med två och tre steg. De stapelbara pallarna kommer i fyrpack, och fem av dem bär 120 kg per pall.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska en pianopall ha?",
        a: "Underarmarna ska vara ungefär vågräta när fingrarna vilar på tangenterna. Pianopallarna här ställs i höjd mellan 45 och 58 cm, så sitsen kan följa den som spelar.",
      },
      {
        q: "Vad är skillnaden på en sadelpall och en rullpall?",
        a: "En sadelpall har en sits formad som en ridsadel, högre fram och i sidorna och nedsänkt i mitten, så att du sitter med bäckenet framåtlutat. En rullpall har en rund sits, och flera har ryggstöd.",
      },
      {
        q: "Hur mycket bär en duschpall?",
        a: "Duschpallarna här bär 100 till 150 kg. Den med U-formad sits och stödhandtag bär 150 kg, och de i aluminium bär 135 kg.",
      },
    ],
  },

  projektordukar: {
    intro: [
      "Här hittar du projektordukar på 84 till 120 tum: motoriserade dukar som körs upp och ner med fjärrkontroll, manuella dukar som dras ner för hand och låser sig där du släpper dem, och dukar på stativ som ställs upp utan att något skruvas i väggen.",
      "Dukarna finns i tre bildformat. 16:9 är formatet för film, tv och spel, 4:3 passar presentationer och äldre material, och en kvadratisk duk i 1:1 kan visa båda, eftersom bilden då bara fyller en del av höjden.",
      "De motoriserade dukarna går på 230 V och drar 25 W, och fjärrkontrollen är trådlös. Både de motoriserade och de manuella skruvas i vägg eller tak och är gjorda för inomhusbruk. De två stativdukarna på 84 tum står på ett trebent stativ och kan användas ute i uppehållsväder, och 120-tumsduken förankras med markankare och stormlinor i gräsmattan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor projektorduk behöver jag?",
        a: "Utgå från rummet och avståndet. I projektorns manual står hur bred bilden blir på ett visst avstånd, och det avgör var projektorn ska stå för att fylla duken. Dukarna här är 152 till 263 cm breda, och ingen av dem har egen elektronik som behöver matcha projektorn.",
      },
      {
        q: "Vad betyder 84 tum?",
        a: "Tum anger dukens diagonal, alltså avståndet från hörn till hörn. En duk på 84 tum i formatet 4:3 är 171 cm bred och 128 till 131 cm hög, och duken på 120 tum i 16:9 är 263 × 148 cm.",
      },
      {
        q: "Kan duken användas utomhus?",
        a: "Stativdukarna kan det. Duken på 120 tum ställs upp på gräsmattan och är gjord för att stå ute en kväll, och de två på trebent stativ används inne och ute i uppehållsväder. De motoriserade och de manuella dukarna skruvas i vägg eller tak och är gjorda för inomhusbruk.",
      },
    ],
  },

  "redskapsbodar-forrad": {
    intro: [
      "En redskapsbod ger gräsklipparen, cyklarna och trädgårdsredskapen ett eget tak. Här samlar vi våra redskapsbodar, förråd och trädgårdsskåp: bodar i galvad plåt och plast från 1,1 upp till 12,4 m², ett förrådstält på 13,4 m² och trädgårdsskåp i trä för spadar, krattor och annat trädgårdsredskap.",
      "Börja med yta och höjd. Vill du kunna gå in, titta på nockhöjden: bodarna på 4,1 m² har 2,28 meter i nock och de på 12,4 m² har två meter, och skjutdörrar behöver ingen plats framför boden. De flesta bodarna levereras utan golv och ska stå på ett plant, bärande underlag, till exempel en gjuten platta eller en ram i tryckimpregnerat virke – läs i beskrivningen vad som ingår.",
      "Välj material efter hur mycket underhåll du vill ha. Galvaniserad plåt har ett zinkskikt som skyddar stålet, plastbodarna är genomfärgade och ska inte målas, och trä behöver målas eller laseras innan det tas i bruk.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver jag bygglov för en redskapsbod?",
        a: "Mindre bodar kan ofta byggas som friggebod utan bygglov. Enligt Boverket får en friggebod vara högst 15 kvadratmeter och 3 meter hög, och den får inte stå närmare tomtgränsen än 4,5 meter utan grannens medgivande. Kommunen kan ha egna regler, så kontrollera alltid med din kommun innan du beställer.",
      },
      {
        q: "Ingår golv i redskapsboden?",
        a: "De flesta bodarna levereras utan golv och ska stå på ett plant, bärande underlag, till exempel en gjuten platta eller en ram i tryckimpregnerat virke. En av plastbodarna levereras med golv. Läs i beskrivningen vad som ingår.",
      },
      {
        q: "Redskapsbod, förrådstält eller trädgårdsskåp?",
        a: "En redskapsbod är ett litet hus som du går in i. Förrådstältet täcker 13,4 m² och har 255 cm i nock, så du går upprätt över hela golvet. Ett trädgårdsskåp tar minst plats och har hyllor och fack för redskap – bra när ytan är liten.",
      },
    ],
  },

  sandlador: {
    intro: [
      "En sandlåda med tak ger skugga under leken och kan skydda sanden mellan gångerna. Här samlar vi våra sandlådor i barrträ för barn från tre år: låga sandlådor med lekkök och diskho, sandlådor med soltak eller lekstugetak och sandlådor formade som ett piratskepp och en bil.",
      "Titta på tak och botten. På flera modeller täcker duken hela sandytan, och på en kan taket sänkas ända ner till 18 cm så att det fungerar som lock – det håller regn, löv och katter borta. Flera har fiberduk i botten, och en av lådorna rymmer 200 kilo sand.",
      "Måla eller olja träet en gång om året.",
      "Du handlar tryggt med Klarna, med fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver sandlådan ett lock?",
        a: "Ett lock eller ett skynke håller löv, regn och katter borta när ingen leker, och torr sand är trevligare att gräva i. På en av lådorna sänks taket ner till 18 cm och fungerar som lock.",
      },
      {
        q: "Hur mycket sand behövs?",
        a: "Det beror på sandytan och djupet. En av lådorna har en sandyta på 77,5 × 77,5 cm som är 20 cm djup och rymmer 200 kilo sand. Sandytans mått står i beskrivningen.",
      },
      {
        q: "Vilken ålder passar sandlådorna för?",
        a: "De är gjorda för barn från tre år, och de flesta upp till sju eller åtta år.",
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
        a: "Glas packas skyddat och skickas spårbart från EU-lager med leverans inom 3–7 arbetsdagar. Skulle något gå sönder på vägen ersätter vi det.",
      },
    ],
  },

  "serveringsvagnar-rullvagnar": {
    intro: [
      "En vagn på hjul tar det du behöver dit du behöver det och rullar undan efteråt. Här samlar vi serveringsvagnar för kök och vardagsrum, barvagnar för glas och flaskor och smala rullvagnar som ger förvaring i glipan mellan kylen och skåpet, bredvid tvättmaskinen eller i badrummet.",
      "Serveringsvagnarna har tre plan, och på den ena går mittplanet att flytta i höjdled. De flesta barvagnarna har flaskställ eller flaskplatser, och den runda barvagnen i konstrotting har en bricka som lyfts av och bärs in. Barvagnen i gran är gjord för uteplatsen, med en arbetsyta på 88 × 61 cm som bär 50 kg per hylla, och barvagnen i bambu fälls ihop när festen är över.",
      "Rullvagnarna är 13 till 26,5 cm djupa och har korgar i metallnät, utdragslådor eller hyllplan med kant, och de bär 9 till 15 kg totalt. De flesta vagnarna har fyra hjul, där två har broms som håller vagnen på plats.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan en serveringsvagn och en rullvagn?",
        a: "En serveringsvagn har hela plan att ställa brickor, tallrikar och glas på och används för att servera. En rullvagn är oftast smal, med korgar eller lådor, och används som förvaring i trånga utrymmen i kök, badrum och tvättstuga.",
      },
      {
        q: "Får en rullvagn plats mellan kylen och väggen?",
        a: "Ofta, ja. Rullvagnen med fem plan är bara 13 cm på den smala sidan, och flera andra är 20 till 24 cm djupa. Mät glipan och jämför med måtten i beskrivningen.",
      },
      {
        q: "Har vagnarna broms?",
        a: "De flesta har fyra hjul, varav två med broms. Barvagnen i gran för uteplatsen har två hjul i ena änden och ett handtag i den andra, så den rullas som en skottkärra och står still när den ställs ner.",
      },
    ],
  },

  "sideboards-vitrinskap": {
    intro: [
      "Här hittar du sideboards, skänkar och vitrinskåp: sideboards i vitt, högglans, metall och flätad rotting, en skänk med guldfärgade ben, ett köksskåp i lantstil med glasvitrin och vitrinskåp för väggen och golvet.",
      "Sideboardsen finns från 80 cm i bredd, och de flesta har både lådor och skåp. Två har dörrar med soft close, och ett har eluttag, USB-portar och en LED-list som lyser i sju färger. Flera levereras med tippskydd eller tippband.",
      "Vitrinskåpen för väggen är 9,5 cm djupa, har glasdörrar och hyllplan som kan flyttas och passar samlarfigurer och modeller. Det fristående vitrinskåpet är 139 cm högt med fyra fack och luckor i akryl som fälls upp och glider in ovanför facket.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden på ett sideboard och en skänk?",
        a: "Orden betyder i stort sett samma sak: en låg förvaringsmöbel med lådor och skåp. Skänk är det svenska ordet och sideboard det engelska. Sideboardsen här är 75 till 81 cm höga.",
      },
      {
        q: "Hur mycket tål skivan?",
        a: "Det står i beskrivningen. Skänken med guldben tål 94 kg ovanpå, och sideboardet på 120 cm med soft close tål 30 kg på skivan och 65 kg totalt. Hyllplanen i vitrinskåpen för väggen tål 2 kg vardera.",
      },
      {
        q: "Hur sätter jag upp ett vitrinskåp på väggen?",
        a: "Med skruv och plugg som passar väggen. Det fristående vitrinskåpet har ett väggfäste som ingår, så att det står säkert även när facken är fulla.",
      },
    ],
  },

  sidobord: {
    intro: [
      "Ett sidobord håller lampan, koppen och mobilen nära där du sitter. Här hittar du runda sidobord i metall, rotting, stenlook och marmorlook, sidobord i industristil med hylla eller skåp och C-formade bord som ställs tätt intill soffan.",
      "Av de C-formade borden står två på hjul och ett skjuts in under soffan. Det ena på hjul går att höja mellan 68 och 78 cm och fungerar också som sängbord eller litet rullbord.",
      "Två sidobord har eluttag och USB, så att mobilen laddas där den ligger, och flera runda bord av metall och rotting klarar både inne och ute. De runda borden är 32 till 50 cm i diameter.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur högt ska ett sidobord vara?",
        a: "Ungefär i höjd med soffans armstöd, så att du når koppen utan att luta dig fram. Sidoborden här är 35 till 80 cm höga, och höjden står i beskrivningen.",
      },
      {
        q: "Är sidobord och avlastningsbord samma sak?",
        a: "Ja, det är två ord för samma möbel: ett litet bord bredvid soffan, fåtöljen eller sängen.",
      },
      {
        q: "Går borden att ha ute?",
        a: "Några av de runda borden i metall och rotting passar både inne och ute. Det står i beskrivningen vilka.",
      },
    ],
  },

  "sittpuffar-fotpallar": {
    intro: [
      "Här hittar du sittpuffar, fotpallar och puffar med förvaring. De är klädda i sammet, manchester, chenille, teddyfleece eller sherpa, och en sittpuff är flätad i vattenhyacint.",
      "De flesta har ett förvaringsfack under locket, från 19 liter i den minsta förvaringspallen till 97 liter i den största förvaringspuffen. På flera är locket vändbart, med en mjuk sida att sitta på och en hård sida som fungerar som bricka eller avlastningsbord.",
      "Fotpallarna är 45 till 70 cm breda, och tre av de fem bär 120 kg, så de går också att sitta på. En fotpall och en sittpuff har plats för katten inuti, och till setet med två sittpallar hör förvaring i den stora.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden på en sittpuff och en fotpall?",
        a: "En fotpall är oftast avlång och gjord för att vila benen på, medan en sittpuff oftast är rund eller oval. Tre av fotpallarna här bär ändå 120 kg, så de går lika bra att sitta på.",
      },
      {
        q: "Hur mycket får plats i en förvaringspuff?",
        a: "Från 19 liter i den minsta förvaringspallen till 97 liter i förvaringspuffen på 60 cm i diameter. Det räcker till filtar, leksaker eller ett par kuddar.",
      },
      {
        q: "Går det att sitta på puffen?",
        a: "Tolv av puffarna och pallarna bär 120 kg. Fotpallen med kattbädd är gjord för benen och bär 30 kg ovanpå, och sittpuffen i vattenhyacint bär 80 kg.",
      },
    ],
  },

  "skarmtak-entretak": {
    intro: [
      "Här hittar du skärmtak och entrétak som monteras på väggen ovanför ytterdörren eller ett fönster och skyddar mot regn. Takskivan är av polykarbonat, en slagtålig plast, och på de flesta är den genomskinlig så att entrén inte blir mörk.",
      "De minsta är 100 till 122 cm breda och passar över en enkeldörr eller ett fönster. Entrétaket på 195 cm räcker över en dubbeldörr, och de två längsta är 295 och 303 cm.",
      "Entrétaken på 122 och 195 cm har en takskiva av hålkammarplast på 5 mm och levereras med expanderbultar och täckproppar. Skärmtaket på 110 × 60 cm hänger på två väggkonsoler utan stolpe, anges för en snölast på 5 cm och ska sitta minst 30 cm ovanför öppningen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur brett skärmtak ska jag välja?",
        a: "Välj ett tak som är bredare än dörren, så att det skyddar även när du står och letar efter nycklarna. För en enkeldörr finns tak på 100 till 122 cm, och för en dubbeldörr entrétaket på 195 cm.",
      },
      {
        q: "Hur monteras ett skärmtak?",
        a: "Det skruvas fast i väggen med konsoler. Till entrétaken följer expanderbultar med, och monteringen kräver att du borrar i fasaden. Skärmtaket på 110 × 60 cm ska sitta minst 30 cm ovanför dörr- eller fönsteröppningen.",
      },
      {
        q: "Vad är polykarbonat?",
        a: "En slagtålig plast som väger mycket mindre än glas, så att taket kan hänga på väggkonsoler. Skärmtaket för dörr och fönster på 100 × 75 cm har ett UV-skikt som skyddar skivan mot solen.",
      },
    ],
  },

  "skoskap-skobankar": {
    intro: [
      "Skor vid ytterdörren blir snabbt en hög. Här samlar vi skoskåp med tippfack eller luckor, skobänkar att sitta på medan du knyter skorna, öppna skohyllor och skoställ, och hallmöbler där skohylla, sittplats och krokar sitter ihop.",
      "Skoskåpen rymmer från 8 till 30 par, och de smalaste är bara 15 till 26 cm djupa, så att de får plats i en trång hall. I ett skåp med tippfack står skorna lutade bakom en lucka som fälls ut, och flera skåp har spegeldörrar, så att hallen får en stor spegel på köpet.",
      "Skobänkarna har sittyta, flera med dyna eller stoppad sits, och bär mellan 120 och 220 kg. De höga skoskåpen levereras med tippskydd som ska fästas i väggen, och de flesta möbler monteras efter anvisningen i paketet. Den hopfällbara skohyllan i bambu behöver ingen montering alls.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur många par skor rymmer ett skoskåp?",
        a: "Det står per modell, från 8 par i de smalaste skåpen till 30 par i det största. Stövlar och stora storlekar tar mer plats än antalet par räknar med.",
      },
      {
        q: "Vad är ett tippfack?",
        a: "Ett fack där skorna står snett bakom en lucka som fälls ut nedtill. Det gör att skåpet kan vara grunt, och skorna tar liten plats i djupled.",
      },
      {
        q: "Passar ett skoskåp i en smal hall?",
        a: "Ja, välj efter djupet. Det smalaste skoskåpet är 15 cm djupt och flera andra är 24 till 26 cm. Mät väggen och räkna med plats att fälla ut luckan.",
      },
    ],
  },

  snurrfatoljer: {
    intro: [
      "Här hittar du snurrfåtöljer som vrids 360 grader, på ben eller på en fot i mitten. Sju av dem har en fotpall, och två är reclinerfåtöljer vars rygg fälls bakåt.",
      "Tre snurrfåtöljer i linnelook har gaslyft, så att sitsen ställs mellan 45 och 57 cm, och de står på en rund kromad fot utan hjul. Fåtöljerna med lös fotpall på rund stålfot bär 150 kg, och på dem snurrar sitsen ovanpå foten. Fyra snurrfåtöljer med knappad rygg är 60 cm breda och passar där det är ont om plats.",
      "Den armlösa snurrfåtöljen i chenille har en 35 cm tjock sittdyna, och på fåtöljen med höjdjusterbar fotpall snurrar både stolen och pallen. Fåtöljen i konstläder har en rygg som låses i önskad vinkel med ett vred.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket plats behöver en snurrfåtölj?",
        a: "Eftersom stolen vrids behövs utrymme runt om, inte bara framför. Fåtöljerna med lös fotpall tar 71 × 69 cm i golvyta men blir 93 cm djupa när ryggen fälls, och reclinerfåtöljen med snurrfot behöver 80 cm fritt bakom sig.",
      },
      {
        q: "Hur mycket bär en snurrfåtölj?",
        a: "Nio av dem bär 120 kg. Snurrfåtöljerna med gaslyft bär 136 kg, och fåtöljerna med lös fotpall och reclinerfåtöljen med snurrfot bär 150 kg.",
      },
      {
        q: "Kan fåtöljen fällas bakåt?",
        a: "Flera kan det. Reclinerfåtöljen med snurrfot fälls till 130 grader, fåtöljen i konstläder låses med ett vred i den vinkel du vill ha, och fåtöljerna med lös fotpall har ett bakåtlutat läge.",
      },
    ],
  },

  "solskydd-paviljonger": {
    intro: [
      "Tak och skugga över uteplatsen gör den användbar i både sol och regn. Här samlar vi paviljonger, pop up-tält och partytält, reservtak till paviljonger och pergolor, parasoll med fot och vikter, markiser och skärmtak i polykarbonat.",
      "Är duken på paviljongen sliten behöver du inte byta hela paviljongen. Reservtaken finns i 3 × 3 och 3 × 4 m och sätts på den stomme du redan har, flera har en ventilerad topp så att varmluften slipper ut, och några är i Oxfordväv. Kontrollera stommens mått innan du beställer.",
      "Ett pop up-tält fälls ut på några minuter, och flera har väggar eller myggnät. Vid kraftig vind eller storm ska tältet tas ner, och markisen vevas in när det blåser.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar paviljongtaket min paviljong?",
        a: "Reservtaken finns i 3 × 3 och 3 × 4 m och sätts på den stomme du redan har. Kontrollera stommens mått och form innan du beställer.",
      },
      {
        q: "Tål paviljongen blåst?",
        a: "Förankra tältet ordentligt, och ta ner det vid kraftig vind eller storm. En markis ska vevas in när det blåser, oavsett väder.",
      },
      {
        q: "Vilken parasollfot behöver jag?",
        a: "Det finns parasollfötter i cement på 12 kg, en fot för markmontering och vikter till hängparasoll. Kontrollera att foten passar parasollets stång.",
      },
    ],
  },

  soptunnor: {
    intro: [
      "Här hittar du soptunnor för köket: sensortunnor som öppnar locket när du håller handen över dem, pedaltunnor med mjukstängande lock, sopsorteringskärl med två eller tre fack och utdragbara sopsorterare som sitter i köksskåpet.",
      "Sensortunnorna rymmer från 20 till 68 liter och finns i rostfritt stål eller i svart. De flesta går på fyra AA-batterier och några på fyra D-batterier, och batterierna ingår inte. På flera går locket också att öppna med en knapp. Sopsorteringstunnan med sensor har ett stort fack på 47 liter och två mindre under.",
      "Sopsorteringskärlen har två fack på 15 till 30 liter eller tre fack på 15 eller 20 liter, och på flera har varje fack en egen pedal. Flera har ett fack för doftblock eller luktfilter i locket. Behöver du en smal tunna finns en som är 40 cm bred och en som är 30 cm djup. De utdragbara sopsorterarna har två eller tre fack och dras ut ur köksskåpet.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur fungerar en soptunna med sensor?",
        a: "En sensor i locket känner av handen och öppnar locket, och efter några sekunder stänger det sig självt. Räckvidden är 15 till 20 centimeter på de tunnor där den anges. Tunnan går på batterier som inte ingår, så köp dem samtidigt.",
      },
      {
        q: "Hur många fack behöver jag för sopsortering?",
        a: "Två fack räcker för matavfall och restavfall, och med tre fack får förpackningarna ett eget. Facken är ofta lika stora medan soporna inte är det, så det fack som fylls först bestämmer hur ofta du tömmer. Den utdragbara sopsorteraren med tre fack har ett stort fack på 15 liter och två på 8 liter.",
      },
      {
        q: "Ryms en utdragbar sopsorterare i mitt köksskåp?",
        a: "Mät skåpets insida och jämför med ramens mått i beskrivningen. Ramen är 47 × 33 × 32 cm på den med tre fack och 52 × 26 × 40,8 cm på dem med 20 plus 10 liter. Tre av dem levereras förmonterade, och den med tre fack skruvas fast i skåpbotten med skruvarna som följer med.",
      },
    ],
  },

  "sparkcyklar-for-barn": {
    intro: [
      "En sparkcykel med stora hjul tar sig lätt över trottoarkanter och grus och passar både skolvägen och cykelbanan. Här samlar vi alla våra sparkcyklar för barn: modeller med hjul på 12–16 tum för barn från fem år, sparkcyklar med korg och stänkskärmar och trehjuliga sparkcyklar för de minsta, från 18 månader.",
      "Välj hjul efter var barnet åker. Luftdäck dämpar skarvar, grus och kullersten men behöver pumpas då och då, medan massiva EVA-hjul aldrig punkterar och aldrig behöver pumpas. Nästan alla har broms – handbroms, bakbroms eller broms på båda hjulen – och styret går att justera på nästan alla, så sparkcykeln växer med barnet.",
      "Maxvikten är 50 kg på modellerna för 5–12 år och 100 kg på de större, och flera har stödben så att sparkcykeln står själv.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en sparkcykel?",
        a: "För de minsta, från 18 månader, finns en trehjulig sparkcykel med sits och föräldrahandtag. De flesta modellerna med stora hjul är gjorda för barn från fem år, och flera upp till tolv år.",
      },
      {
        q: "Luftdäck eller massiva hjul?",
        a: "Luftdäck dämpar skarvar och grus bättre men tappar tryck när sparkcykeln står still, så de behöver pumpas. Massiva EVA-hjul punkterar aldrig och behöver aldrig pumpas, men ger en hårdare åktur på ojämn mark.",
      },
      {
        q: "Hur vet jag vilken storlek som passar?",
        a: "Utgå från barnets ålder och vikt: modellerna för 5–12 år bär 50 kg och de större 100 kg. Styrets höjd står i beskrivningen, till exempel 80–88 cm, och går att justera på nästan alla.",
      },
    ],
  },

  speglar: {
    intro: [
      "Här hittar du speglar till hela hemmet: helkroppsspeglar och golvspeglar, väggspeglar med ram i svart metall, guld eller furufaner, fönsterspeglar med spröjs och badrumsspeglar med LED-belysning.",
      "Helkroppsspeglarna och golvspeglarna är 148 till 180 cm höga. Tre av dem har ett stöd som fälls ut, så att spegeln står på golvet, och en har dimbar LED-belysning.",
      "Väggspeglarna finns i flera storlekar och former, och flera hängs stående eller liggande. Till badrummet finns speglar med LED-belysning och antiimma, samlade på sidan Badrumsspeglar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor spegel behöver jag för att se hela mig?",
        a: "En plan spegel behöver vara ungefär hälften så hög som du för att du ska se hela kroppen, om den sitter på rätt höjd. Helkropps- och golvspeglarna här är 148 till 180 cm höga.",
      },
      {
        q: "Hur hänger jag upp en tung spegel?",
        a: "Med skruv och plugg som passar väggen, och skruvarna ska sitta i väggmaterialet, inte bara i gipsskivan. Flera väggspeglar väger runt 10 kg, och vikten står i beskrivningen.",
      },
      {
        q: "Kan spegeln hänga liggande?",
        a: "Flera väggspeglar kan hängas både stående och liggande. Speglarna med nio fält har fyra krokar på baksidan för just det.",
      },
    ],
  },

  terrarier: {
    intro: [
      "Här finns terrarier i glas från 24 till 140 liter: små kuber på 30 × 30 × 30 cm, ett lågt terrarium på 50 × 30 × 25 cm och ett högt på 45 × 45 × 60 cm. Terrariet på 140 liter står på egna träben i stället för på ett bord.",
      "Välj efter hur djuret lever. Det höga terrariet har 60 cm från botten till gallerlocket, och det låga har samma golvyta som 48-litersmodellen men lägre höjd. Mellanstorleken på 50 × 30 × 35 cm är lång nog för en marklevande art och hög nog för en klättrare.",
      "Flera öppnas framifrån, med skjutdörrar eller en frontlucka med knapplås som ett djur inte kan trycka upp, och de har lock av galler eller nät. Två modeller har en strukturerad bakvägg som djuret kan klättra på.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilka djur passar terrarierna för?",
        a: "Beskrivningarna nämner ödlor och ormar, och terrariet på 86 liter anges passa små ödlor, grodor, ormar och spindlar, till exempel leopardgecko och dvärggecko. Välj höjd efter om djuret klättrar eller lever på marken och golvyta efter hur stort det är.",
      },
      {
        q: "Går terrarierna att låsa?",
        a: "Flera gör det. Terrariet på 86 liter har två lås, ett på dörren och ett på ovansidan, och flera av de mindre har en frontlucka med knapplås.",
      },
    ],
  },

  "terrassvarmare-infravarmare": {
    intro: [
      "En terrassvärmare gör altanen och balkongen användbar även en sval kväll. Här samlar vi fem elektriska värmare: en terrassvärmare på stativ på 2500 W, en terrassvärmare med oscillering, en takvärmare för terrassen och två infravärmare för vägg.",
      "Karbonfiberröret på stativvärmaren värmer 10–15 m², och infravärmaren för vägg eller stativ 15–20 m². Effekten ställs i steg, upp till nio, med vred, touchpanel, fjärrkontroll eller app, och takvärmaren har timer på upp till 24 timmar.",
      "Två av värmarna är IP65-klassade, och till en av dem följer ett skyddshölje för vintern. Infravärmaren med app bygger bara 8 cm ut från väggen och passar därför också på en smal balkong.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor yta värmer en terrassvärmare?",
        a: "Det beror på effekt och placering. Stativvärmaren med karbonfiberrör värmer 10–15 m² och infravärmaren för vägg eller stativ 15–20 m².",
      },
      {
        q: "Tål värmarna väder?",
        a: "Två av dem är IP65-klassade, och till infravärmaren för vägg eller stativ följer ett skyddshölje för vintern.",
      },
      {
        q: "Hur styr jag värmen?",
        a: "Med vred, touchpanel, fjärrkontroll eller app beroende på modell. Infravärmaren för vägg ställs i nio steg från telefonen, och takvärmaren har timer på upp till 24 timmar.",
      },
    ],
  },

  "tradgardsdekor-belysning": {
    intro: [
      "Belysning och dekor gör trädgården trivsam även när det blir mörkt. Här samlar vi solcellslampor och solcellslyktor, en pollarlampa och en vägglampa, trädgårdsfontäner, fågelmatare, spaljéer och blomställ, en trädgårdsbro och en vedförvaringshylla – och uppblåsbara figurer och konstväxter, som också har egna sidor.",
      "Solcellslamporna laddas av en solpanel och behöver ingen elkabel. De flesta är stänkskyddade, och hur länge de lyser beror på modellen: en laddar på sex timmar och lyser i åtta, en annan laddar på åtta och lyser i sex.",
      "Trädgårdsfontänerna har en pump som cirkulerar vattnet, och en av dem har LED. Fågelmataren med kamera visar fåglarna i trädgården på nära håll, direkt i mobilen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur länge lyser en solcellslampa?",
        a: "Det beror på modellen och på hur mycket sol panelen får. Ett exempel: en lampa laddar på sex timmar och lyser i åtta, en annan laddar på åtta och lyser i sex.",
      },
      {
        q: "Tål solcellslamporna regn?",
        a: "De flesta är stänkskyddade, flera enligt IP44, och pollarlampan är IP65-klassad.",
      },
      {
        q: "Var hittar jag halloween- och julfigurerna?",
        a: "De uppblåsbara figurerna ligger både här och på egna sidor, Halloweendekoration och Juldekoration. Konstväxterna finns samlade under Konstväxter.",
      },
    ],
  },

  "tradgardsskotsel-bevattning": {
    intro: [
      "Här samlar vi det som håller trädgården i ordning: slangvagnar, en väggmonterad slangvinda och droppslang för bevattningen, en elektrisk kompostkvarn och en kompostbehållare på 240 liter, gödselspridare och gräsmattsluftare, batteridriven lövblås, häcksax och gräsklippare, en transportvagn, en hopfällbar vattentank och trädgårdsskåp för redskapen.",
      "De batteridrivna maskinerna slipper sladd. Lövblåsen levereras med två batterier, medan gräsklipparen är gjord för ett 36 V-batteri, så kontrollera vad som ingår innan du beställer.",
      "Trädgårdsskåpen finns också under Redskapsbodar & förråd, där bodarna och förrådstälten ligger.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår slang i slangvagnen?",
        a: "En av slangvagnarna levereras med 45 m slang och munstycke, och den väggmonterade slangvindan rymmer 10 m. Kontrollera i produktbeskrivningen om slang ingår i den modell du väljer.",
      },
      {
        q: "Vad gör en kompostkvarn?",
        a: "Den maler ner grenar och trädgårdsavfall till mindre bitar. Vår elektriska kompostkvarn har en motor på 2500 W.",
      },
      {
        q: "Vad är en droppslang?",
        a: "En slang som släpper ut vatten längs hela sin längd och vattnar jorden runt häcken eller rabatten.",
      },
    ],
  },

  "traning-gym": {
    intro: [
      "Här samlar vi allt för hemmagymmet: chinsstänger för vägg eller fristående, stepbrädor, pilatesbrädor, gymstationer med viktblock, vibrationsplattor och studsmattor för träning. Här ligger också hantlar, träningsbänkar, motionscyklar och boxningssäckar, som har egna sidor.",
      "Den fristående chinsstången ställs i 12 höjdlägen mellan 176 och 227 cm, och en av de väggmonterade har dipsställning. Flera stepbrädor ställs i tre höjder, och pilatesbrädan Reformer i trä har motståndsband.",
      "Två gymstationer och hemmagymmet med benpress har viktblock på 45 eller 65 kg, och den kompakta gymstationen på 162 × 162 cm har latsdrag. Vibrationsplattorna har upp till 120 hastigheter, och en av dem har Bluetooth.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken chinsstång passar mig?",
        a: "Den fristående kräver inga hål i väggen och ställs i 12 höjdlägen mellan 176 och 227 cm. De väggmonterade tar mindre plats, och en av dem har dipsställning.",
      },
      {
        q: "Vad passar om jag har lite plats?",
        a: "Väggmonterade chinsstänger och stepbrädor tar lite plats, och den kompakta gymstationen samlar flera övningar på 162 × 162 cm.",
      },
      {
        q: "Var hittar jag hantlarna?",
        a: "Hantlar, träningsbänkar, motionscyklar och boxningssäckar har egna sidor under Sport & Fritid, och de finns också här.",
      },
    ],
  },

  traningsbankar: {
    intro: [
      "Här hittar du träningsbänkar för hemmagymmet: hopfällbara bänkar med justerbart ryggstöd, bänkar med benrullar och bensträckare, bänkar med skivstångsställ och specialbänkar som scottbänk, sit-up-bänk och sissy squat-bänk.",
      "Ryggstödet ställs i tre till sju lägen på de flesta. En bänk har i stället en plan, fast dyna och ett fristående ställ, och många fälls ihop mellan passen så att de går att ställa undan.",
      "Bänken med skivstångsställ har ställ i sex höjder mellan 107,5 och 130 cm och ett armstöd för bicepscurl. På scottbänken vilar armarna mot en lutande dyna, och du curlar uppåt för biceps eller pressar nedåt för triceps. Maxvikten för användaren är oftast 120 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket klarar bänken?",
        a: "Maxvikten för användaren är oftast 120 kg och som mest 150 kg. Bänken med benrullar och gummiband tål 350 kg total belastning, alltså du och vikterna tillsammans.",
      },
      {
        q: "Går bänken att fälla ihop?",
        a: "Många gör det, och det står i namnet eller beskrivningen. Bänken med fristående ställ fälls ihop i två delar, var för sig.",
      },
      {
        q: "Vad är en scottbänk?",
        a: "En bänk för armträning där överarmen vilar mot en lutande dyna. Scottbänken här är 2-i-1: du curlar uppåt för biceps och pressar nedåt för triceps.",
      },
    ],
  },

  "tv-bankar": {
    intro: [
      "En tv-bänk ska bära tv:n, gömma sladdarna och ge plats för spelkonsol, router och fjärrkontroller. Här samlar vi tv-bänkar från 80 till 200 cm, en väggmonterad bänk som svävar över golvet, små bänkar på hjul och bänkar med lådor, luckor och öppna fack.",
      "Titta på tv:ns storlek och vikt. Flera bänkar anger vilken tv som får plats, upp till 75 tum, och bärigheten står per modell, upp till 100 kg för hela bänken. Bänkarna på hjul har kabelhål i bakstycket, och under bänkar med ben kan sladdarna dras i stället för bakom.",
      "Stommarna är av spånskiva eller MDF, i vitt, svart, högglans eller ektoner, och några har ben i metall. Tre bänkar har luckor som stängs mjukt, och en har RGB-LED och glashylla. De flesta levereras omonterade med anvisning.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor tv passar på bänken?",
        a: "Det står i produktbeskrivningen. De största bänkarna är gjorda för en tv på upp till 75 tum, och bärigheten för skivan anges för sig.",
      },
      {
        q: "Finns det tv-bänk att hänga på väggen?",
        a: "Ja, en tv-bänk på 180 cm är gjord för väggmontering och har tre nedfällbara luckor med mjukstängande gångjärn.",
      },
      {
        q: "Hur mycket bär en tv-bänk?",
        a: "Det står per modell, och skivan och hyllorna anges var för sig. Den som bär mest klarar 100 kg totalt, varav 50 kg på skivan.",
      },
    ],
  },

  tvattkorgar: {
    intro: [
      "Här hittar du tvättkorgar med lock i bambu och vide, tvättsorterare med två, tre eller fyra fack och två tvättskåp där korgarna tippas ut.",
      "I en tvättsorterare hamnar vitt, kulört och mörkt i olika fack redan när tvätten läggs i. De flesta har en påse som lyfts ur och bärs till maskinen, och på flera kan påsen tvättas.",
      "Volymen går från 64 till 144 liter. En tvättsorterare på 108 liter står på fyra hjul, två med broms, och tvättskåpen i vit MDF har tippbara korgar, det höga skåpet också lådor och hyllor.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är en tvättsorterare?",
        a: "En tvättkorg med två eller flera fack, så att vitt, kulört och mörkt sorteras redan i korgen. Här finns sorterare med två, tre och fyra fack.",
      },
      {
        q: "Kan påsen tvättas?",
        a: "På flera av korgarna ja, påsen tas ur och kan tvättas. Det står i beskrivningen vilka.",
      },
      {
        q: "Hur sköter jag en tvättkorg i bambu?",
        a: "Torka av den med en fuktad trasa och torka torrt, och låt inte blöta handdukar bli liggande i korgen.",
      },
    ],
  },

  "utelek-spel": {
    intro: [
      "Utelek får barnen ut i trädgården. Här samlar vi studsmattor för barn, basketkorgar för väggen och ett flyttbart basketställ, en gungställning, en fågelbogunga och en babygunga, sandlådor, en hoppborg med pool och rutschkana, bollnät för fotboll, badminton och volleyboll, och trädgårdsgolf för hela familjen.",
      "Studsmattorna är gjorda för barn och finns i tre storlekar: sexkantiga på 122 cm, 140 cm utan fjädrar och Ø163 cm med skyddsnät. På 140-modellerna hänger hoppytan i elastiska band i stället för fjädrar.",
      "Flera av basketkorgarna för väggmontering har en stötsäker ryggplatta och passar både barn och vuxna, och på det flyttbara basketstället ställs korghöjden mellan 156 och 210 cm. Gungställningen på 280 cm har två gungor.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken storlek på studsmatta passar?",
        a: "Den minsta är sexkantig på 122 cm, 140 cm-modellerna har elastiska band i stället för fjädrar, och Ø163 cm har den största hoppytan och skyddsnät. Kontrollera ålder och maxvikt i produktbeskrivningen.",
      },
      {
        q: "Går det att justera höjden på basketkorgen?",
        a: "På det flyttbara basketstället ställs korghöjden mellan 156 och 210 cm. Korgarna för väggmontering sitter på den höjd du monterar dem.",
      },
      {
        q: "Finns det sandlådor?",
        a: "Ja, sandlådorna har en egen sida under Sandlådor, med modeller med soltak, lekkök och lekstuga.",
      },
    ],
  },

  utemobler: {
    intro: [
      "Utemöbler gör altanen, balkongen och trädgården till ett rum till. Här samlar vi loungeset och matgrupper, trädgårdsbord och trädgårdsstolar, trädgårdsbänkar i trä, metall och gjutjärn, hängstolar och gungbänkar, solsängar och solstolar, hammockar och dynboxar för dynorna.",
      "De flesta möblerna tål att stå ute, men de får längre livslängd om du skyddar dem vid hårt väder och förvarar dem skyddat vintertid. Det finns skyddsöverdrag både för utemöbler och för hammock.",
      "Hängstolarna har eget stativ, och flera rymmer två personer. Kontrollera maxvikten i produktbeskrivningen, och läs också vad som följer med: till en del loungeset och solsängar ingår dynor, medan andra möbler är gjorda för att användas utan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan utemöblerna stå ute hela året?",
        a: "De tål att stå ute, men de håller längre om du skyddar dem vid hårt väder och förvarar dem skyddat vintertid. Det finns skyddsöverdrag för utemöbler och för hammock.",
      },
      {
        q: "Ingår dynor?",
        a: "Det varierar. Till en del loungeset och solsängar följer dynor med, medan andra möbler har flätad sits och används som de är. Vad som ingår står i produktbeskrivningen.",
      },
      {
        q: "Var förvarar jag dynorna?",
        a: "I en dynbox. Vi har dynboxar i stål på 295 och 350 liter, och förvaringsboxar på 93 och 253 liter.",
      },
    ],
  },

  "valphagar-hundhagar": {
    intro: [
      "En valphage ger valpen en egen plats att leka och vila på, utan att den kommer åt sladdar, skor och trappor. Här samlar vi valphagar och hundhagar i metall och en hopfällbar hage i tyg, för både inomhus och utomhus. Några passar också för katt, kanin och marsvin.",
      "Metallhagarna är 60 till 91 cm höga och har en dörr eller en grind. Panelerna går att vinkla efter rummet, till exempel till en åttkant mitt på golvet, en rektangel längs väggen eller en rak avspärrning, och de flesta fälls ihop när hagen inte används. Hagarna på 366 och 488 cm har en grind som svänger 180 grader och stänger sig själv.",
      "Välj höjd efter hunden, eftersom en hund som når överkanten med framtassarna tar sig över förr eller senare. Valphagen på 91 cm är gjord för hundar med en mankhöjd upp till 46 cm. Hagen med tak har ett tak av Oxfordväv och nät som öppnas med dragkedja, och hagen i tyg har soltak och myggnät runt om.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur hög valphage behöver jag?",
        a: "Hagen ska vara så hög att hunden inte når överkanten med framtassarna. Hagarna i metall är 60 till 91 cm höga, och i de flesta beskrivningar står vilken mankhöjd hagen är gjord för, till exempel upp till 46 cm för valphagen på 91 cm.",
      },
      {
        q: "Kan hagen stå utomhus?",
        a: "Ja, flera är gjorda för både inne och ute. Till dem ingår markpinnar eller markkrokar som förankrar hagen i gräsmattan, så att den varken glider eller lyfter när hunden trycker mot sidan.",
      },
      {
        q: "Passar hagen för andra djur än hund?",
        a: "Några gör det. Hagen med tak passar också katt, kanin och marsvin, flera metallhagar fungerar för kanin och marsvin, och hagen i tyg är gjord för både hund, valp och katt.",
      },
    ],
  },

  varmeflaktar: {
    intro: [
      "En värmefläkt ger snabb värme där elementen inte räcker: i hallen, i ett kallt sovrum eller i hemmakontoret. Här samlar vi värmefläktar som sitter på väggen och tornmodeller som står på golvet, alla med termostat, timer och överhettningsskydd.",
      "Effekten är 2000 W, och tornfläkten på 73 cm ger 2200 W. Du väljer mellan flera effektlägen, till exempel 1000 eller 2000 W, och fläkten sveper fram och tillbaka så att värmen sprids i rummet. De flesta har ett värmeelement av keramik och styrs med fjärrkontroll.",
      "Flera väggmodeller har veckotimer, så att värmen går på när du behöver den, och fönstervakt som stänger av när du vädrar. En av tornmodellerna har vältskydd som bryter strömmen om den välter. Kapslingsklassen står i varje produktbeskrivning, och den avgör var värmefläkten får sitta.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Får värmefläkten sitta i badrummet?",
        a: "Det beror på modell och placering. Kapslingsklassen står i varje produktbeskrivning, och i badrummet finns regler för hur nära dusch och badkar en elapparat får sitta. Fråga en elektriker om du är osäker.",
      },
      {
        q: "Vad gör fönstervakten?",
        a: "Den stänger av värmen automatiskt när du vädrar, så att du inte värmer upp luften som går ut genom fönstret.",
      },
      {
        q: "Hur stort rum värmer en värmefläkt?",
        a: "Det står per modell. Väggmodellen på 50 cm anges för 20 till 25 kvadratmeter.",
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

  "vattenkokare-brodrostar": {
    intro: [
      "Här hittar du vattenkokare, brödrostar och frukostset där vattenkokaren och brödrosten har samma färg och form. Seten finns i bland annat svart, grått, gräddvitt, rosa och rostfritt, och två har bikakemönster.",
      "Alla vattenkokare rymmer 1,7 liter. Flera har temperaturval, till exempel mellan 40 och 100 °C, och flera håller vattnet varmt i upp till tre timmar. Det passar till te, som ofta ska ha lägre temperatur än kokande vatten.",
      "Brödrostarna tar två eller fyra skivor, de flesta har sju rostlägen, och ett set har också en äggkokare.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket rymmer vattenkokarna?",
        a: "Alla rymmer 1,7 liter, och på flera ska det vara minst 500 ml i kannan när den slås på.",
      },
      {
        q: "Varför välja temperaturval?",
        a: "Grönt och vitt te blir bäst under kokpunkten, medan svart te vill ha kokande vatten. Med temperaturval stannar kokaren vid den temperatur du valt.",
      },
      {
        q: "Vad ingår i ett frukostset?",
        a: "En vattenkokare och en brödrost i samma utförande. Ett set har dessutom en äggkokare.",
      },
    ],
  },

  "vaxthus-odling": {
    intro: [
      "Ett växthus ger plantorna ett skyddat ställe tidigt på våren och sent på hösten, och en odlingslåda gör det enkelt att odla även utan trädgårdsland. Här samlar vi tunnelväxthus och foliehus, väggväxthus mot husväggen, växthus i aluminium med polykarbonat, miniväxthus och drivbänkar, odlingslådor i metall, trä och plast, och blomställ, spaljéer och reservöverdrag.",
      "Tunnelväxthusen och foliehusen har en duk av PE-plast, och de flesta har rullbar dörr och nätfönster. Vid kraftig vind ska växthuset förankras, och till flera av dem ingår jordankare, spännlinor och markpinnar. Växthusen i aluminium har väggar av polykarbonat och takfönster.",
      "Odlingslådorna finns i galvaniserad metall, trä, träkomposit, plast och konstrotting, upp till 241 × 90 cm, och några har spaljé, foliekåpa eller fågelnät. Ett odlingsbord eller en upphöjd låda ger en arbetshöjd där du slipper böja dig ner till marken.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Måste tunnelväxthuset förankras?",
        a: "Ja, vid kraftig vind ska det förankras eller ställas mot en vägg. Till flera av växthusen ingår jordankare, spännlinor och markpinnar – vad som ingår står i produktbeskrivningen.",
      },
      {
        q: "Finns det reservöverdrag till växthusen?",
        a: "Ja, det finns reservöverdrag till tunnelväxthus på 6 × 3 × 2 m och 3 × 2 × 2 m, ett reservhölje och en växthusduk på 300 × 200 cm.",
      },
      {
        q: "Vad är en drivbänk?",
        a: "En låg låda med genomskinligt lock, där du drar upp plantor tidigt på våren innan de planteras ut. De flesta av våra drivbänkar är i trä med lock av polykarbonat som fälls upp.",
      },
    ],
  },

  "vedstall-vedbodar": {
    intro: [
      "Här hittar du vedställ för brasveden vid kaminen, större vedställ med vattentätt överdrag och vedbodar för trädgården. I ett vedställ ligger veden på en ram i stället för direkt på golvet eller marken, vilket skyddar den mot fukt underifrån, och flera är gjorda för både inne och ute.",
      "De flesta vedställ i svart stål bär 100 kg. De stora ställen med överdrag rymmer 0,33 eller 0,6 m³ ved och håller den torr, och det mindre av dem har en bärväska i canvas. Flera vedställ levereras med eldstadsverktyg, till exempel skyffel, eldgaffel, tång och borste på krokar längs sidan.",
      "Vedbodarna är av stålplåt med lutande tak, och bodarna på 150 och 213 cm har upphöjd botten för luftcirkulation och 0,77 respektive 1,12 m² golvyta. Vedboden på 235 cm har ett öppet vedfack och ett stängt fack för redskap.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan vedstället stå ute?",
        a: "Flera kan det. Vedstället på 60 × 100 cm och det smala på 40 × 100 cm är gjorda för både inne och ute, och de stora ställen har ett vattentätt överdrag. Vedbodarna har lutande tak.",
      },
      {
        q: "Hur mycket ved rymmer ett vedställ?",
        a: "De stora ställen med överdrag rymmer 0,33 och 0,6 m³ ved. För de andra anges måtten och hur mycket de bär, oftast 100 kg.",
      },
      {
        q: "Ingår eldstadsverktyg?",
        a: "Till några vedställ, ja: skyffel, eldgaffel, tång och borste som hänger på krokar. Vad som ingår står i produktnamnet eller beskrivningen.",
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
  // ── Möbler (2026-09-23) ──────────────────────────────────────────────────
  "verktygsvagnar-verktygslador": {
    intro: [
      "En verktygsvagn samlar verktygen på ett ställe och rullar dit du jobbar, i garaget, verkstaden eller förrådet. Här samlar vi verktygsvagnar med lådor, verkstadsvagnar med öppna plan, verktygsskåp på hjul och för väggen, verktygslådor att ställa på vagnen eller bänken och en låsbar låda för lastbilsflak.",
      "Vagnarna är av pulverlackerat stål och har upp till 16 lådor. I många modeller löper lådorna på kullagerskenor, och flera har inlägg i lådorna som skyddar verktygen. De flesta vagnar och skåp går att låsa, och på de flesta vagnar går två av hjulen att låsa, så att vagnen står still när du arbetar.",
      "Bärigheten står per modell och går upp till 150 kg på vagnarna. Några har en arbetsyta på toppen, en av dem utdragbar från 70 till 130 cm, och verktygsskåpen med hålplatta ger plats för det som ska hänga synligt.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Går lådorna att låsa?",
        a: "På de flesta modeller, ja. Vagnarna har nyckellås eller cylinderlås, och verktygslådorna har nyckellås eller öglor för hänglås. Vilket lås det är står i produktbeskrivningen.",
      },
      {
        q: "Hur mycket bär en verktygsvagn?",
        a: "Upp till 150 kg, beroende på modell. Maxlasten per låda och per plan är lägre och står i produktbeskrivningen.",
      },
      {
        q: "Behöver vagnen monteras?",
        a: "Ja, de flesta levereras omonterade. Skruva ihop stommen på ett plant golv och montera hjulen sist.",
      },
    ],
  },

  "vinstall-vinkylar": {
    intro: [
      "Här hittar du vinställ, vinhyllor och vinkylar: stapelbara vinställ i metall och bambu, vinställ för väggen i svart stålrör, en vinhylla med glashållare och köksmöbler med inbyggt vinställ, som ett köksskåp, en köksvagn, en köksö och ett barbord.",
      "Vinställen tar från sex flaskor på väggen till 72 flaskor i stället i bambu, som staplas i moduler och monteras på ungefär fem minuter utan verktyg. Vinhyllan på 148 cm har plats för 12 flaskor och 9 glas.",
      "Vinkylarna rymmer 12, 16, 18 eller 20 flaskor på 75 cl. Tre av dem ställs mellan 5 och 18 °C och den för 12 flaskor mellan 8 och 18 °C. Vinkylen för 12 flaskor är 26,5 cm bred, och den för 16 flaskor är 56,5 cm hög och får plats under en bänk.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken temperatur ska vin förvaras i?",
        a: "För lagring brukar en jämn temperatur runt 10 till 14 °C rekommenderas, och det viktigaste är att den inte svänger. Vinkylarna här ställs mellan 5 eller 8 och 18 °C, så samma kyl kan både lagra vin och hålla vitt vin kallt.",
      },
      {
        q: "Hur mycket el drar en vinkyl?",
        a: "Det står i beskrivningen. Vinkylarna här drar 75 till 133 kWh om året. Den för 12 flaskor har energiklass E, och de tre andra har energiklass G.",
      },
      {
        q: "Hur mycket bär ett vinställ?",
        a: "Vinstället i bambu för 16 flaskor bär 75 kg och det i metall för 16 flaskor 32 kg. I köksvagnen tar varje vinfack 3 kg, vilket räcker för en vanlig flaska.",
      },
    ],
  },

  kontorsstolar: {
    intro: [
      "En bra kontorsstol märks inte – det är en dålig som ger ont i ryggen efter en arbetsdag. Här hittar du kontorsstolar med nackstöd, justerbara armstöd och fällbar rygg, modeller med utdragbart fotstöd eller inbyggd massage, en rymlig big and tall-stol som bär 150 kg och stolar i bouclé och chenille som passar i ett hemmakontor. För den som vill variera sittställningen finns knästolar, sadelpallar och ritstolar med fotring för höga bänkar och ståbord.",
      "Titta på tre mått innan du väljer: sitthöjdens spann ska passa din skrivbordshöjd, sitsens bredd ska passa dig, och maxvikten ska ha marginal. Alla tre står i produktbeskrivningen.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken sitthöjd behöver jag?",
        a: "Sitt med fötterna i golvet och knäna i ungefär rät vinkel, med armbågarna i nivå med skrivbordsskivan. Vid ett vanligt skrivbord på cirka 72 cm passar de flesta en sitthöjd runt 45–55 cm. Vid ett ståbord eller en hög bänk behövs en ritstol med fotring.",
      },
      {
        q: "Vad är skillnaden mellan en knästol och en vanlig kontorsstol?",
        a: "En knästol har framåtlutande sits och vilar delvis på smalbenen, vilket ger en mer upprätt hållning. Många använder den omväxlande med en vanlig stol snarare än hela dagen.",
      },
      {
        q: "Behöver kontorsstolen monteras?",
        a: "Ja, kontorsstolar levereras omonterade: fot, gaskolv, sits och rygg skruvas ihop enligt anvisningen. Maxlasten står i produktbeskrivningen.",
      },
    ],
  },

  fatoljer: {
    intro: [
      "En fåtölj är rummets bästa plats – den du går till med kaffet, boken eller fjärrkontrollen. Här finns reclinerfåtöljer och TV-fåtöljer med fotpall och 360° vridfot, gungstolar i manchester, teddy och bouclé, vilstolar i böjd björk och golvfåtöljer med flera ryggvinklar. För den som vill ha mer finns massagefåtöljer med värme och uppresningsfåtöljer med motor som hjälper dig upp ur stolen.",
      "Jämför ryggvinkel, sittdjup och maxvikt – de står i varje beskrivning. En fåtölj som fälls bakåt behöver fritt utrymme bakom sig, så mät innan du ställer den mot en vägg.",
      "Leverans inom 3–7 arbetsdagar från EU-lager. Du betalar med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket plats tar en reclinerfåtölj?",
        a: "Utfällt blir en recliner betydligt längre än hopfälld. Både det utfällda måttet och ryggvinkeln anges i produktbeskrivningen – räkna med fritt utrymme bakom ryggen.",
      },
      {
        q: "Vad är en uppresningsfåtölj?",
        a: "En fåtölj med elektrisk motor som lyfter och tippar sitsen framåt, så att det blir lättare att resa sig. Den fälls också bakåt till viloläge med samma kontroll.",
      },
      {
        q: "Behöver fåtöljen monteras?",
        a: "Oftast bara lätt: rygg, armstöd eller fot skruvas fast med medföljande beslag. Vad som behöver monteras framgår av beskrivningen.",
      },
    ],
  },

  "soffor-baddsoffor": {
    intro: [
      "Soffan är vardagsrummets stora beslut. Här hittar du bäddsoffor med förvaring under sitsen, hörnsoffor med vändbar schäslong, modulsoffor och en rymlig U-soffa med två schäslonger, i manchester, linnelook, chenille och konstläder. En bäddsoffa gör vardagsrummet till gästrum när det behövs.",
      "Mät väggen, men mät också dörren och trapphuset. Sittdjup och sitthöjd avgör hur soffan känns, och för en bäddsoffa står även bäddmåttet i beskrivningen, så att du vet om det räcker för en eller för två. Titta på klädseln: manchester och chenille är mjuka och varma, konstläder är lättare att torka av.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar. Fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor blir bädden i en bäddsoffa?",
        a: "Bäddmåttet anges i produktbeskrivningen för varje modell. Jämför det med en vanlig säng – 140 cm bredd räcker för två, smalare bäddar är tänkta för en person.",
      },
      {
        q: "Går schäslongen att flytta till andra sidan?",
        a: "På hörnsoffor med vändbar schäslong kan den monteras till vänster eller höger. Det står i beskrivningen om modellen har den funktionen.",
      },
      {
        q: "Vad gäller om soffan inte passar?",
        a: "Du har 30 dagars öppet köp. Kontakta kundtjänst innan du skickar tillbaka den, så hjälper vi dig med returen.",
      },
    ],
  },

  "matbord-stolar": {
    intro: [
      "Runt matbordet händer det mesta – frukost, läxor, middagar som drar ut på tiden. Här finns matbord och klaffbord som fälls ut när gästerna kommer, kompletta matgrupper, matstolar i flerpack i manchester, sammet och trä, barstolar och barbord för köksön och stapelbara pallar som tar lite plats när de inte används.",
      "Räkna med ungefär 60 cm bordskant per person och minst 70 cm fritt bakom stolarna så att man kommer ut. Sitthöjd och bordshöjd ska passa ihop: ett vanligt matbord kräver en sitthöjd runt 45–48 cm, en bardisk betydligt högre. Mått och maxvikt står i varje beskrivning.",
      "Leverans inom 3–7 arbetsdagar från EU-lager, Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur många får plats vid bordet?",
        a: "Räkna med cirka 60 cm bordskant per person. Ett klaffbord ger fler platser när det fälls ut – både hopfällt och utfällt mått anges i produktbeskrivningen.",
      },
      {
        q: "Vilken sitthöjd ska barstolarna ha?",
        a: "Sitthöjden ska vara ungefär 25–30 cm lägre än bänkskivan. Sitthöjden står i beskrivningen för varje barstol.",
      },
      {
        q: "Säljs matstolarna styckvis?",
        a: "Många matstolar säljs i 2- eller 4-pack. Antalet står i produktnamnet, och priset gäller hela förpackningen.",
      },
    ],
  },

  skrivbord: {
    intro: [
      "Ett skrivbord ska passa både kroppen och rummet. Här finns elektriska höj- och sänkbara skrivbord med minnesfunktion, så att du kan växla mellan att sitta och stå, fällbara väggskrivbord och skrivbord på hjul för det lilla hemmakontoret, ståbord med lutbar skiva och klassiska skrivbord med lådor i trä och stål.",
      "Kolla skivans bredd och djup mot skärmen och tangentbordet du använder, och för ett höj- och sänkbart bord även höjdspannet – det ska räcka både till din sittande och stående arbetshöjd. Alla mått står i produktbeskrivningen.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska ett skrivbord ha?",
        a: "Sittande passar de flesta en höjd runt 70–75 cm, men det beror på din längd. Ett höj- och sänkbart bord löser det genom att du ställer in exakt rätt höjd, sittande som stående. Höjdspannet anges i beskrivningen.",
      },
      {
        q: "Vad betyder minnesfunktion?",
        a: "Att bordet kan spara ett par förinställda höjder, till exempel din sitt- och ståhöjd, så att du byter läge med en knapptryckning.",
      },
      {
        q: "Får ett skrivbord plats i ett litet rum?",
        a: "Fällbara väggskrivbord och modeller på hjul är byggda för trånga ytor. Både utfällt och hopfällt mått står i beskrivningen.",
      },
    ],
  },

  "soffbord-smabord": {
    intro: [
      "Små bord gör stor skillnad för hur ett rum fungerar. Här hittar du soffbord med förvaring och lyftbar skiva som blir ett arbetsbord i soffan, satsbord i glas och stål som skjuts in i varandra, sängbord med låda och smala konsolbord för hallen eller bakom soffan.",
      "Ett soffbord brukar sitta bäst när det är ungefär i höjd med soffans sits, och ett sängbord när det når ungefär madrassens överkant. Mät djupet i hallen innan du väljer konsolbord – de smalaste är byggda för just trånga passager. Alla mått står i produktbeskrivningen.",
      "Leverans inom 3–7 arbetsdagar från EU-lager. Du handlar med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur fungerar ett lyftbart soffbord?",
        a: "Skivan lyfts upp och fram på ett beslag, så att den hamnar i bekväm höjd för dator eller middag i soffan. Under skivan finns ofta ett förvaringsfack.",
      },
      {
        q: "Vad är ett satsbord?",
        a: "Två eller flera bord i olika storlek som skjuts in under varandra när de inte används – praktiskt när du behöver extra avställningsyta ibland.",
      },
      {
        q: "Behöver borden monteras?",
        a: "De flesta levereras omonterade med beslag och anvisning. Vad som ingår står i produktbeskrivningen.",
      },
    ],
  },

  "sangar-sovrum": {
    intro: [
      "Sovrummet är rummet där kvaliteten märks varje natt. Här finns sängramar i furu och metall i bredderna 90, 135, 140 och 160 cm, stoppade sängramar med justerbar gavel i bouclé och teddy, modeller med lådor eller högt fritt utrymme för förvaring under sängen, sängbänkar med förvaring och en madrass i gelmemoryskum.",
      "Kontrollera att sängramens mått matchar madrassen du har eller planerar att köpa – en ram för 140 × 200 cm kräver en madrass i exakt det måttet. Maxvikt och fritt utrymme under sängen står i beskrivningen, liksom om ribbotten ingår.",
      "Vi skickar från EU-lager med 3–7 arbetsdagars leverans. Fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår madrass i sängramen?",
        a: "Nej, sängramarna säljs utan madrass om inget annat står i beskrivningen. Välj en madrass i samma mått som ramen.",
      },
      {
        q: "Hur mycket förvaring får jag under sängen?",
        a: "Det fria utrymmet under ramen anges i centimeter i beskrivningen. Vissa modeller har dessutom lådor på hjul.",
      },
      {
        q: "Vad gäller för retur av en säng?",
        a: "Du har 30 dagars öppet köp. Kontakta kundtjänst innan du skickar tillbaka något, så hjälper vi dig med returen.",
      },
    ],
  },

  rumsavdelare: {
    intro: [
      "En rumsavdelare skapar ett rum i rummet utan att du behöver bygga något: en arbetshörna i vardagsrummet, en avskild sovplats i en etta eller en skärm framför det som inte ska synas. Här finns fristående skärmväggar med tre till åtta paneler i flätad bambu, polypropenväv på tallram, tyg och pappersrep, från 120 till 320 cm breda.",
      "Välj bredd efter ytan du vill dölja och höjd efter hur mycket insyn du vill stänga ute. Panelerna fälls i sicksack och står stadigt av sig själva, och viks ihop när de inte används. Mått och material står i varje beskrivning.",
      "Leverans inom 3–7 arbetsdagar från EU-lager, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Står en rumsavdelare stadigt utan att fästas?",
        a: "Ja, panelerna ställs i sicksack och bär upp varandra. Ju fler paneler och ju större vinkel, desto stadigare står den.",
      },
      {
        q: "Släpper rumsavdelaren igenom ljus?",
        a: "Det beror på materialet. Flätade paneler och tunn väv släpper igenom en del ljus men skymmer insyn, medan tät tygfyllning avskärmar mer. Materialet anges i beskrivningen.",
      },
    ],
  },

};

/** Redaktionellt innehåll för en kategori-slug, annars undefined. */
export function categoryContent(slug: string): CategoryContent | undefined {
  return CATEGORY_CONTENT[slug];
}
